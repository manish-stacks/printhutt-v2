/**
 * Orders service. Direct port of:
 *   src/app/api/order/route.ts                  GET (with reviews + revenue) + POST (create)
 *   src/app/api/order/[id]/route.ts             GET + DELETE
 *   src/app/api/order/[id]/pending/route.ts     GET (pending nav) + DELETE
 *   src/app/api/order/[id]/status/route.ts      PATCH (status with side-effects)
 *   src/app/api/order/[id]/shipping/route.ts    PATCH (shipping)
 *
 * Behaviour preserved exactly — including the IST day range filter,
 * the duplicate-address de-dup in POST, the per-item review attachment
 * by `${orderId}_${productId}`, the prev/next navigation lookups by
 * status group, the conditional Shiprocket cancel call, and the email
 * notifications on delivered / refunded transitions.
 */
import axios from 'axios';
import mongoose, { FilterQuery } from 'mongoose';
import {
  fshipToken,
  getISTDayRange,
  norm,
  normDigits,
} from '@/utils/helpers';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors';
import { deleteImage, uploadImageOrder } from '@/utils/storage';
import { logger } from '@/config/logger';
import { authRepo } from '@/modules/auth/auth.repository';
import { ordersRepo } from './orders.repository';
import type {
  CreateOrderDTO,
  ListOrdersQueryDTO,
  UpdateOrderShippingDTO,
  UpdateOrderStatusDTO,
} from './orders.validation';

const REVENUE_STATUSES = ['confirmed', 'shipped', 'delivered'];

/* ──────────────── 1. List orders (admin sees all non-pending unless filtered) ──────────────── */
export async function list(
  user: { id: string; role: string },
  q: ListOrdersQueryDTO
): Promise<unknown> {
  const query: FilterQuery<unknown> = {};

  if (user.role !== 'admin') {
    (query as Record<string, unknown>).userId = new mongoose.Types.ObjectId(user.id);
  } else if (q.status && q.status !== 'all') {
    (query as Record<string, unknown>).status = q.status;
  } else {
    (query as Record<string, unknown>).status = { $ne: 'pending' };
  }

  if (q.search) {
    (query as Record<string, unknown>).orderId = { $regex: q.search, $options: 'i' };
  }

  if (q.startDate || q.endDate) {
    const createdAt: Record<string, Date> = {};
    if (q.startDate) createdAt.$gte = getISTDayRange(q.startDate).start;
    if (q.endDate) createdAt.$lte = getISTDayRange(q.endDate).end;
    (query as Record<string, unknown>).createdAt = createdAt;
  }

  const { orders, total } = await ordersRepo.list(query, q.page, q.limit);

  // Collect product ids across all order items
  const productIds = orders
    .flatMap(
      (o) =>
        ((o.items as Array<{ productId?: unknown }>) ?? []).map((i) => i.productId)
    )
    .filter(Boolean);

  // Reviews lookup (admin sees all reviews, users only see their own)
  const reviews = await ordersRepo.findReviewsFor(
    productIds,
    user.role === 'admin' ? null : user.id
  );

  // Map of `${orderId}_${productId}` → review
  const reviewMap = new Map(
    reviews.map((r) => [`${String(r.orderId)}_${String(r.productId)}`, r])
  );

  const updatedOrders = orders.map((order) => {
    const items = ((order.items as Array<Record<string, unknown>>) ?? []).map((item) => {
      const key = `${String(order._id)}_${String(item.productId)}`;
      const review = reviewMap.get(key);
      return {
        ...item,
        review: review
          ? {
              reviewId: review._id,
              rating: review.rating,
              review: review.review,
              userId: review.userId,
            }
          : null,
      };
    });
    return { ...order, items };
  });

  const revenue = await ordersRepo.revenue(query);

  return {
    success: true,
    orders: updatedOrders,
    revenue,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}

/* ──────────────── 2. Get one order — populated + prev/next nav ──────────────── */
export async function byId(id: string, pending = false): Promise<unknown> {
  if (!ordersRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Order ID');
  const order = await ordersRepo.findByIdPopulated(id);
  if (!order) throw new NotFoundError('Order not found');

  const { prev, next } = await ordersRepo.navAdjacent(
    order.createdAt as Date,
    pending
  );
  return {
    success: true,
    data: {
      ...order,
      prevOrderId: prev?._id ?? null,
      nextOrderId: next?._id ?? null,
    },
  };
}

/* ──────────────── 3. Delete order (with custom-image cleanup) ──────────────── */
export async function deleteOrder(id: string): Promise<unknown> {
  if (!ordersRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Order ID');
  const order = await ordersRepo.findById(id);
  if (!order) throw new NotFoundError('Order not found');

  // Cleanup any uploaded custom-image assets from S3
  if (Array.isArray(order.items)) {
    for (const item of order.items as Array<{ custom_data?: Record<string, unknown> }>) {
      const data = item.custom_data;
      if (!data) continue;
      for (const k of Object.keys(data)) {
        const v = data[k] as { public_id?: string } | undefined;
        if (v?.public_id) {
          await deleteImage(v.public_id).catch(() => undefined);
        }
      }
    }
  }
  await ordersRepo.deleteById(id);
  return { success: true, message: 'Order deleted successfully' };
}

/* ──────────────── 4. Create order ──────────────── */
export async function createOrder(
  userId: string,
  body: CreateOrderDTO
): Promise<unknown> {
  if (!mongoose.isValidObjectId(userId)) throw new UnauthorizedError();

  const user = await authRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  // Backfill username/email if missing (matches original behaviour)
  const invalidUsernames = ['', 'user', 'guest'];
  if (invalidUsernames.includes(user.username ?? '')) {
    user.username = body.address.name || 'Guest';
  }
  if (!user.email && body.address.email) user.email = body.address.email;
  await user.save();

  if (!body.items || body.items.length === 0) {
    throw new BadRequestError('No items in the order.');
  }

  /* ── Address: skip duplicates ───────────────────────── */
  const incoming = {
    fullName: body.address.name,
    mobileNumber: normDigits(body.address.number),
    email: body.address.email,
    addressLine: body.address.address,
    city: body.address.city,
    state: body.address.state,
    postCode: normDigits(body.address.postCode),
    addressType: body.address.addressType ?? 'home',
  };

  const existingAddresses = await ordersRepo.addressesByUser(userId);
  const duplicate = existingAddresses.find(
    (a) =>
      norm(a.addressLine) === norm(incoming.addressLine) &&
      normDigits(a.postCode) === incoming.postCode &&
      normDigits(a.mobileNumber) === incoming.mobileNumber &&
      norm(a.city) === norm(incoming.city)
  );

  let addressData: Record<string, unknown>;
  if (duplicate) {
    addressData = duplicate;
  } else {
    const newAddr = await ordersRepo.createAddress({
      userId,
      fullName: incoming.fullName,
      mobileNumber: incoming.mobileNumber,
      email: incoming.email,
      addressLine: incoming.addressLine,
      city: incoming.city,
      state: incoming.state,
      postCode: incoming.postCode,
      addressType: incoming.addressType,
    });
    addressData = newAddr.toObject?.() ?? (newAddr as unknown as Record<string, unknown>);
  }

  /* ── Item processing (uploads custom preview images as needed) ── */
  type ItemIn = {
    productId: string;
    name: string;
    slug?: string;
    quantity: number;
    sku?: string;
    product_image?: unknown;
    price: number;
    discountType?: string;
    discountPrice?: number;
    custom_data?: Record<string, unknown> | null;
  };
  const itemData = await Promise.all(
    (body.items as ItemIn[]).map(async (item) => {
      if (!item.custom_data) {
        return {
          productId: item.productId,
          name: item.name,
          slug: item.slug,
          quantity: item.quantity,
          sku: item.sku,
          product_image: item.product_image,
          price: item.price,
          discountType: item.discountType,
          discountPrice: item.discountPrice,
        };
      }
      const c = item.custom_data;
      const updatedProductData = {
        ...c,
        previewCanvas:
          (c.previewCanvas as string | undefined) &&
          (await uploadImageOrder(c.previewCanvas as string, 'customized preview canvas')),
        previewImage:
          (c.previewImage as string | undefined) &&
          (await uploadImageOrder(c.previewImage as string, 'customized image')),
        previewImageTwo:
          (c.previewImageTwo as string | undefined) &&
          (await uploadImageOrder(c.previewImageTwo as string, 'customized image')),
        previewImageThree:
          (c.previewImageThree as string | undefined) &&
          (await uploadImageOrder(c.previewImageThree as string, 'customized image')),
        previewImageFour:
          (c.previewImageFour as string | undefined) &&
          (await uploadImageOrder(c.previewImageFour as string, 'customized image')),
      };

      let uploadedProductImage: unknown = item.product_image;
      if (
        typeof item.product_image === 'string' &&
        item.product_image.startsWith('data:image')
      ) {
        const up = await uploadImageOrder(item.product_image, 'customized image');
        uploadedProductImage = up?.url || item.product_image;
      }

      return {
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        quantity: item.quantity,
        sku: item.sku,
        product_image: uploadedProductImage,
        isCustomized: true,
        custom_data: updatedProductData,
        price: item.price,
        discountType: item.discountType,
        discountPrice: item.discountPrice,
      };
    })
  );

  const timestamp = Date.now();
  const payAmtNum = Number(body.payAmt);
  const payAmt =
    body.paymentMethod === 'online'
      ? payAmtNum.toFixed(2)
      : (payAmtNum * 0.2).toFixed(2);

  const orderData: Record<string, unknown> = {
    orderId: `ORD-${timestamp}`,
    items: itemData,
    totalAmount: {
      totalPrice: body.totalPrice.totalPrice,
      discountPrice: body.totalPrice.discountPrice,
      shippingTotal: body.totalPrice.shippingTotal,
      coupon_discount: body.totalPrice.coupon_discount,
    },
    payAmt,
    paymentType: body.paymentMethod,
    payment: {
      method: body.paymentMethod,
      transactionId: '',
      isPaid: false,
      paidAt: null,
      paymentPartner: body.paymentPartner || 'phonepe',
    },
    offerId: null,
    shipping: {
      userName: addressData.fullName,
      addressLine: addressData.addressLine,
      city: addressData.city,
      state: addressData.state,
      postCode: addressData.postCode,
      mobileNumber: addressData.mobileNumber,
      email: user.email,
    },
    coupon: {
      code: body.coupon?.code || '',
      discountAmount: body.coupon?.discountAmount || 0,
      discountType: body.coupon?.discountType || '',
      isApplied: body.coupon?.isApplied || false,
    },
    totalQuantity: body.getTotalItems || 0,
    status: 'pending',
    userId,
  };
  const order = await ordersRepo.create(orderData);

  return {
    success: true,
    message: 'Order saved successfully',
    order: {
      ...((order as unknown as { _doc?: Record<string, unknown> })._doc ??
        (order as unknown as Record<string, unknown>)),
      user,
    },
  };
}

/* ──────────────── 5. Patch shipping ──────────────── */
export async function updateOrderShipping(
  id: string,
  body: UpdateOrderShippingDTO
): Promise<unknown> {
  if (!ordersRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Order ID');

  const updateData: Record<string, unknown> = {};
  if (body.shipping) {
    updateData.shipping = {
      userName: body.shipping.userName,
      mobileNumber: body.shipping.mobileNumber,
      email: body.shipping.email,
      addressLine: body.shipping.addressLine,
      city: body.shipping.city,
      state: body.shipping.state,
      postCode: body.shipping.postCode,
    };
  }
  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError('No update data provided');
  }

  const updated = await ordersRepo.updateById(id, { $set: updateData });
  if (!updated) throw new NotFoundError('Order not found');
  return { success: true, message: 'Order updated successfully', data: updated };
}

/* ──────────────── 6. Patch status (with side-effects) ──────────────── */
export async function updateOrderStatus(
  id: string,
  body: UpdateOrderStatusDTO
): Promise<unknown> {
  if (!body.status) throw new BadRequestError('Status is required');

  const existing = await ordersRepo.findById(id);
  if (!existing) throw new NotFoundError('Order not found');

  const order = await ordersRepo.updateById(id, { status: body.status });
  if (!order) throw new NotFoundError('Order not found');

  // Side-effects: cancel via fship API + email notifications
  if (body.status === 'cancelled' && (order as unknown as { shipment?: { order_id?: string; trackingId?: string } }).shipment?.order_id) {
    try {
      const token = fshipToken();
      await axios.post(
        'https://capi.fship.in/api/CancelOrder',
        JSON.stringify({
          reason: 'Cancellation requested by user',
          waybill: (order as unknown as { shipment: { trackingId: string } }).shipment.trackingId,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      logger.error('Error cancelling Shiprocket/fship order', err);
    }
  }

  // Email notifications — lazy-load mailer to keep boot time tight
  try {
    const mailer = (await import('@/utils/mail/mailer')) as unknown as {
      sendDeliveredWithRatingMessage?: (o: unknown) => Promise<unknown>;
      sendOrderStatus?: (o: unknown) => Promise<unknown>;
      sendRtoMessage?: (o: unknown, reason: string) => Promise<unknown>;
    };
    if (body.status === 'delivered') {
      await mailer.sendDeliveredWithRatingMessage?.(order);
    } else if (body.status !== 'shipped') {
      await mailer.sendOrderStatus?.(order);
    }
    if (body.status === 'refunded' && body.refundReason) {
      await mailer.sendRtoMessage?.(order, body.refundReason);
    }
  } catch (err) {
    logger.error('Order status notification failed', err);
  }

  return { success: true, message: 'Order updated successfully', data: order };
}

export { REVENUE_STATUSES };
