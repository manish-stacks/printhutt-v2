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
import { deleteImage, uploadImageOrder, moveToPermanent, isTempUrl, ORDER_FOLDER } from '@/utils/storage';
import { validateStockForItems, restoreStockForOrder } from '@/utils/stock';
import { logger } from '@/config/logger';
import { authRepo } from '@/modules/auth/auth.repository';
import { validateCoupon } from '@/modules/coupons/coupons.service';
import { ordersRepo } from './orders.repository';
import type {
  BulkDeleteOrdersDTO,
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

  /* ── 🔒 STOCK CHECK: stock na ho to order yahin reject ───────────────── */
  await validateStockForItems(
    (body.items as Array<{ productId: string; name?: string; quantity: number }>).map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
    }))
  );

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
      /**
       * Har custom_data image value ko resolve karo:
       *  - base64 dataURI  → S3 pe upload (legacy / safety-net)
       *  - temp-uploads/ url → orders/ me permanent move
       *  - permanent url / kuch aur → as-is
       * Strings + string-arrays dono handle. Non-image values untouched.
       */
      const resolveImageValue = async (val: unknown): Promise<unknown> => {
        if (typeof val === 'string') {
          if (val.startsWith('data:image')) {
            const up = await uploadImageOrder(val, ORDER_FOLDER);
            return up?.url || val;
          }
          if (isTempUrl(val)) return moveToPermanent(val);
          return val;
        }
        if (Array.isArray(val)) {
          return Promise.all(val.map(resolveImageValue));
        }
        return val;
      };

      /* Sirf image-jaisi keys process karo (baaki text/config untouched). */
      const IMAGE_KEYS = new Set([
        'previewCanvas',
        'previewImage',
        'previewImageTwo',
        'previewImageThree',
        'previewImageFour',
        'previewImages',
        'customImages',
        'photo',
        'image',
      ]);

      const updatedProductData: Record<string, unknown> = { ...c };
      for (const key of Object.keys(c)) {
        const val = (c as Record<string, unknown>)[key];
        const looksLikeImage =
          IMAGE_KEYS.has(key) ||
          (typeof val === 'string' &&
            (val.startsWith('data:image') || isTempUrl(val)));
        if (looksLikeImage) {
          updatedProductData[key] = await resolveImageValue(val);
        }
      }

      let uploadedProductImage: unknown = item.product_image;
      if (typeof item.product_image === 'string') {
        if (item.product_image.startsWith('data:image')) {
          const up = await uploadImageOrder(item.product_image, ORDER_FOLDER);
          uploadedProductImage = up?.url || item.product_image;
        } else if (isTempUrl(item.product_image)) {
          uploadedProductImage = await moveToPermanent(item.product_image);
        }
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

  /* ─── 🔐 SERVER-SIDE RECOMPUTE (client par bharosa nahi) ─────────────────
   * - Subtotal items ki discountPrice * qty se khud jodte hain (client total nahi lete).
   * - Coupon ko server-side RE-VALIDATE karte hain (active/expire/usage/min-purchase/
   *   per-user). Sirf 'online' par coupon allowed (COD me nahi).
   * - Discount + final payAmt yahin compute hota hai. Isse fake/expired coupon se
   *   ₹0 ya kam amount nahi banaya ja sakta.
   */
  // ⚠️ IMPORTANT: item.discountPrice product ka FINAL price nahi hai — yeh discount
  //    ki VALUE hai (discountType='percentage' → % off, discountType='fixed' → ₹ off).
  //    Final unit price isi se derive karna padta hai (jaisa useCartStore.getTotalPrice()
  //    frontend mein karta hai). Pehle isko seedha unit-price maan liya jaata tha, jisse
  //    subtotal bahut kam (sirf discount-value ka sum) ban jaata tha.
  //
  //    Do alag totals rakhte hain (frontend getTotalPrice() jaisa hi):
  //    - mrpTotal        → product ki original price * qty (Subtotal / MRP row ke liye)
  //    - discountedTotal → product-level discount lagne ke baad (coupon lagne se PEHLE)
  //    Coupon discount aur payAmt isी discountedTotal par calculate hota hai.
  let mrpTotal = 0;
  let discountedTotal = 0;
  for (const it of itemData as Array<{
    discountPrice?: number;
    discountType?: string;
    price?: number;
    quantity?: number;
  }>) {
    const price = Number(it.price ?? 0);
    const discountVal = Number(it.discountPrice ?? 0);
    const qty = Math.max(1, Number(it.quantity ?? 1));

    let unit = price;
    if (it.discountType === 'percentage' && discountVal > 0) {
      unit = price - (price * discountVal) / 100;
    } else if (it.discountType === 'fixed' && discountVal > 0) {
      unit = price - discountVal;
    }
    unit = Math.max(0, unit);

    mrpTotal += price * qty;
    discountedTotal += unit * qty;
  }
  const subtotal = discountedTotal; // coupon/payAmt calculation isi par hoti hai

  // ✅ Site policy: shipping hamesha free hai. Client se aayi shippingTotal
  //    trust nahi karte (per-product shippingFee se kabhi accidentally non-zero
  //    ban jaati thi → coupon ke baad bhi payment gateway pe alag se charge ho jaata tha).
  const shippingTotal = 0;

  let serverDiscount = 0;
  let appliedCoupon = { code: '', discountAmount: 0, discountType: '', isApplied: false };

  const couponCode = body.coupon?.code?.trim();
  if (couponCode && body.paymentMethod === 'online') {
    const result = await validateCoupon(couponCode, subtotal, userId);
    if (result.valid) {
      serverDiscount = Math.max(0, Math.min(Number(result.discount || 0), subtotal));
      const c = result.coupon as { code?: string; discountType?: string } | undefined;
      appliedCoupon = {
        code: c?.code || couponCode.toUpperCase(),
        discountAmount: serverDiscount,
        discountType: c?.discountType || '',
        isApplied: true,
      };
    }
    // valid:false → coupon silently drop, full price charge hoga (secure default).
  }

  // Final payable — online: (subtotal - discount + shipping). COD: subtotal ka 20% advance.
  const onlinePayable = Math.max(0, Math.round(subtotal - serverDiscount + shippingTotal));
  const payAmt =
    body.paymentMethod === 'online'
      ? onlinePayable.toFixed(2)
      : Math.round(subtotal * 0.2).toFixed(2);

  const orderData: Record<string, unknown> = {
    orderId: `ORD-${timestamp}`,
    items: itemData,
    totalAmount: {
      totalPrice: Math.round(mrpTotal),
      discountPrice: Math.max(0, Math.round(subtotal - serverDiscount)),
      shippingTotal,
      coupon_discount: serverDiscount,
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
    coupon: appliedCoupon,
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

  // 🔺 Cancel/refund par stock wapas (sirf agar pehle reduce hua tha)
  if (body.status === 'cancelled' || body.status === 'refunded' || body.status === 'returned') {
    await restoreStockForOrder(order);
  }

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


/**
 * GET /orders/bulk-delete/preview?startDate=...&endDate=...
 */
export async function previewBulkDelete(
  startDate: string,
  endDate: string
): Promise<unknown> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // include full end day

  if (start > end) throw new BadRequestError('startDate must be before endDate');

  const count = await ordersRepo.countPendingInRange(start, end);
  return {
    success: true,
    count,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    message: `${count} pending order(s) will be deleted`,
  };
}

/**
 * Bulk delete pending orders in date range.
 */
export async function bulkDeletePendingOrders(
  body: BulkDeleteOrdersDTO
): Promise<unknown> {
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  end.setHours(23, 59, 59, 999); // include full end day

  // 1. Find matching orders (need items for S3 cleanup)
  const orders = (await ordersRepo.findPendingInRange(start, end)) as Array<{
    _id: unknown;
    orderId: string;
    items?: Array<{ custom_data?: Record<string, unknown> }>;
  }>;

  if (orders.length === 0) {
    return {
      success: true,
      deleted: 0,
      message: 'No pending orders found in selected date range',
    };
  }

  // Safety check — admin must confirm count
  if (
    body.confirmCount !== undefined &&
    body.confirmCount !== orders.length
  ) {
    throw new BadRequestError(
      `Count mismatch — expected ${body.confirmCount}, found ${orders.length}. Please refresh and try again.`
    );
  }

  // 2. Collect all S3 public_ids from items.custom_data
  const publicIds: string[] = [];
  for (const order of orders) {
    if (!Array.isArray(order.items)) continue;
    for (const item of order.items) {
      const data = item.custom_data;
      if (!data) continue;
      for (const k of Object.keys(data)) {
        const v = data[k] as { public_id?: string } | undefined;
        if (v?.public_id) publicIds.push(v.public_id);
      }
    }
  }

  // 3. Delete S3 images in parallel (don't fail on individual errors)
  if (publicIds.length > 0) {
    logger.info(`Bulk delete: cleaning up ${publicIds.length} S3 assets`);
    await Promise.allSettled(publicIds.map((id) => deleteImage(id)));
  }

  // 4. Delete orders from DB
  const result = await ordersRepo.deletePendingInRange(start, end);

  logger.info(
    `Bulk delete: removed ${result.deletedCount} pending orders between ${start.toISOString()} - ${end.toISOString()}`
  );

  return {
    success: true,
    deleted: result.deletedCount,
    assetsCleared: publicIds.length,
    message: `${result.deletedCount} pending order(s) deleted successfully`,
  };
}