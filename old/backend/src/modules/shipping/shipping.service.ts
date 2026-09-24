/**
 * Shipping service. Unified provider integration:
 *   - FShip      (create / track / cancel / webhook)
 *   - Shiprocket (create / track / cancel / webhook)
 *   - Velocity   (create / track / cancel / webhook)  ← Velocity Shipping (ex-Shipfast)
 */
import axios, { AxiosError } from 'axios';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { fshipToken, shiprocketAuth, velocityAuth, velocityBaseUrl } from '@/utils/helpers';
import { logger } from '@/config/logger';
import Order from '@/db/models/orderModel';
import { shippingRepo } from './shipping.repository';
import type {
  CreateShipmentDTO,
  ListQueryDTO,
  UpsertDTO,
} from './shipping.validation';

/* ============================================================
 * Admin CRUD (unchanged)
 * ============================================================ */
export async function adminList(q: ListQueryDTO): Promise<unknown> {
  const { shipping, total } = await shippingRepo.adminList(q.page, q.limit, q.search);
  return {
    shipping,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}
export async function byId(id: string): Promise<unknown> {
  if (!shippingRepo.isValidObjectId(id)) throw new BadRequestError('Invalid id');
  const s = await shippingRepo.findById(id);
  if (!s) throw new NotFoundError('Shipping not found');
  return s;
}
export async function create(body: UpsertDTO): Promise<unknown> {
  return shippingRepo.create({ ...body });
}
export async function update(id: string, patch: Partial<UpsertDTO>): Promise<unknown> {
  if (!shippingRepo.isValidObjectId(id)) throw new BadRequestError('Invalid id');
  const updated = await shippingRepo.updateById(id, patch);
  if (!updated) throw new NotFoundError('Shipping not found');
  return updated;
}
export async function remove(id: string): Promise<void> {
  if (!shippingRepo.isValidObjectId(id)) throw new BadRequestError('Invalid id');
  const d = await shippingRepo.deleteById(id);
  if (!d) throw new NotFoundError('Shipping not found');
}
export async function options(): Promise<unknown[]> {
  return shippingRepo.options();
}

/* ============================================================
 * Helpers
 * ============================================================ */
interface ShipmentDetails {
  length: string | number;
  width: string | number;
  height: string | number;
  weight: string | number;
}

interface OrderDoc {
  _id: unknown;
  orderId: string;
  paymentType: 'online' | 'offline';
  payAmt: number;
  shipping: {
    userName?: string;
    mobileNumber?: string;
    email?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postCode?: string;
  };
  totalAmount: { discountPrice: number };
  items: Array<{
    productId: string;
    name: string;
    sku?: string;
    price: number;
    quantity: number;
    discountPrice?: number;
    discountType?: 'percentage' | 'flat';
  }>;
  status?: string;
  shipment?: Record<string, unknown>;
  save: () => Promise<unknown>;
}

/** Best-effort error message extraction from axios / api errors */
const extractApiError = (err: unknown): { message: string; details: unknown } => {
  const ax = err as AxiosError<{ error?: string; message?: string; errors?: unknown }>;
  const data = ax.response?.data;
  return {
    message:
      data?.message ||
      data?.error ||
      ax.message ||
      'Provider API error',
    details: data ?? null,
  };
};

/* ============================================================
 * FSHIP integration
 * ============================================================ */
async function fshipCreate(order: OrderDoc, shipmentDetails: ShipmentDetails): Promise<unknown> {
  const token = fshipToken();

  /* ─── Amount calculations (tax-inclusive pricing) ─── */
  const finalTotal = order.totalAmount.discountPrice;             // 800 (customer pays this)
  const baseAmount = +(finalTotal / 1.18).toFixed(2);             // 677.97 (without GST)
  const taxAmount = +(finalTotal - baseAmount).toFixed(2);        // 122.03 (18% GST)

  const codAmount = order.paymentType === 'online'
    ? 0
    : Math.max(0, finalTotal - (order.payAmt || 0));              // 800 - 160 = 640

  const payload = {
    /* ─── Customer details ─── */
    customer_Name: order.shipping.userName,
    customer_Mobile: order.shipping.mobileNumber,
    customer_EmailId: order.shipping.email || '',
    customer_Address: order.shipping.addressLine,
    landMark: '',
    customer_Address_Type: 'Home',
    customer_PinCode: order.shipping.postCode,
    customer_City: order.shipping.city,

    /* ─── Order identifiers ─── */
    orderId: order.orderId,
    invoice_Number: `INV-${order.orderId}`,

    /* ─── Payment & express type ─── */
    payment_Mode: order.paymentType === 'online' ? 2 : 1,         // 1=COD, 2=Prepaid
    express_Type: 'surface',
    is_Ndd: 0,

    /* ─── Amounts (must satisfy: total = order + tax + extra) ─── */
    order_Amount: baseAmount,                                      // 677.97 (base, without GST)
    tax_Amount: taxAmount,                                          // 122.03 (18% GST)
    extra_Charges: 0,
    total_Amount: finalTotal,                                       // 800 ✓
    cod_Amount: codAmount,                                          // 640 (offline) | 0 (online)

    /* ─── Shipment dimensions ─── */
    shipment_Weight: shipmentDetails.weight,
    shipment_Length: shipmentDetails.length,
    shipment_Width: shipmentDetails.width,
    shipment_Height: shipmentDetails.height,
    volumetric_Weight: 0,

    /* ─── Geo & warehouse ─── */
    latitude: 0,
    longitude: 0,
    pick_Address_ID: Number(process.env.FSHIP_PICKUP_ADDRESS_ID ?? 207907),
    return_Address_ID: 0,

    /* ─── Product line items ─── */
    products: order.items.map((item) => {
      // 1. Compute discount in currency
      let discount = 0;
      if (item.discountPrice) {
        discount =
          item.discountType === 'percentage'
            ? Math.round((item.price * item.discountPrice) / 100)
            : Math.round(item.discountPrice);
      }

      // 2. Final price after discount (tax-inclusive)
      const priceAfterDiscount = item.price - discount;

      // 3. Reverse-calc base price (without GST)
      const productBase = +(priceAfterDiscount / 1.18).toFixed(2);

      return {
        productId: item.productId,
        productName: item.name,
        unitPrice: productBase,        // 677.97 (base, no tax)
        quantity: item.quantity,
        productCategory: 'PrintHutt',
        hsnCode: '441122',
        sku: item.sku || `SKU${item.productId}`,
        taxRate: 18,                    // 18% GST shown on invoice
        productDiscount: 0,             // discount already baked into productBase
      };
    }),

    courierId: 0,
  };

  try {
    const { data } = await axios.post(
      'https://capi.fship.in/api/createforwardorder',
      payload,
      {
        headers: { 'Content-Type': 'application/json', signature: token },
        maxBodyLength: Infinity,
      }
    );

    if (!data?.status) {
      // FShip returned 200 OK but business-level failure
      throw new BadRequestError(data?.message || 'FShip rejected the shipment');
    }

    order.status = 'shipped';
    order.shipment = {
      provider: 'fship',
      trackingId: data.waybill || '',
      order_id: data.apiorderid || '',
      ...shipmentDetails,
    };
    await order.save();

    // Fire-and-forget mail
    try {
      const mailer = (await import('@/utils/mail/mailer')) as unknown as {
        sendOrderStatus?: (o: unknown) => Promise<unknown>;
      };
      await mailer.sendOrderStatus?.(order);
    } catch (mailErr) {
      logger.error('FShip shipment mail failed', mailErr);
    }

    return { success: true, provider: 'fship', data };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    const { message, details } = extractApiError(err);
    logger.error('FShip create failed', { message, details });
    throw new BadRequestError(`FShip: ${message}`, details);
  }
}

async function fshipCancel(order: OrderDoc): Promise<unknown> {
  const token = fshipToken();
  const waybill = (order.shipment as { trackingId?: string } | undefined)?.trackingId;
  if (!waybill) throw new BadRequestError('No waybill found on this order');

  try {
    const { data } = await axios.post(
      'https://capi.fship.in/api/cancelorder',
      { waybill },
      { headers: { 'Content-Type': 'application/json', signature: token } }
    );

    if (!data?.status) {
      throw new BadRequestError(data?.message || 'FShip cancel failed');
    }

    order.status = 'cancelled';
    await order.save();
    return { success: true, data };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    const { message, details } = extractApiError(err);
    throw new BadRequestError(`FShip cancel: ${message}`, details);
  }
}

export async function fshipTrack(waybill: string): Promise<unknown> {
  if (!waybill) throw new BadRequestError('waybill is required');
  const token = fshipToken();
  try {
    const { data } = await axios.post(
      'https://capi.fship.in/api/Tracking',
      JSON.stringify({ waybill }),
      { headers: { 'Content-Type': 'application/json', signature: token } }
    );
    return data;
  } catch (err) {
    const { message, details } = extractApiError(err);
    throw new BadRequestError(`FShip track: ${message}`, details);
  }
}

/* ============================================================
 * SHIPROCKET integration
 * ============================================================ */
async function shiprocketCreate(order: OrderDoc, shipmentDetails: ShipmentDetails): Promise<unknown> {
  const token = await shiprocketAuth();

  // Final tax-inclusive amount customer pays
  const finalTotal = order.totalAmount.discountPrice;        // e.g. 800
  // Advance already paid (for partial-COD offline orders)
  const advancePaid = order.paymentType === 'offline' ? (order.payAmt || 0) : 0; // e.g. 160

  const payload = {
    order_id: order.orderId,
    order_date: new Date().toISOString(),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION ?? 'Primary',

    /* ─── Billing details ─── */
    billing_customer_name: order.shipping.userName,
    billing_last_name: '',
    billing_address: order.shipping.addressLine,
    billing_address_2: '',
    billing_city: order.shipping.city,
    billing_pincode: order.shipping.postCode,
    billing_state: order.shipping.state,
    billing_country: 'India',
    billing_email: order.shipping.email || '',
    billing_phone: order.shipping.mobileNumber,
    shipping_is_billing: true,

    /* ─── Order items ─── */
    order_items: order.items.map((item) => {
      // 1. Compute discount (in currency, not %)
      let discount = 0;
      if (item.discountPrice) {
        discount =
          item.discountType === 'percentage'
            ? Math.round((item.price * item.discountPrice) / 100)
            : Math.round(item.discountPrice);
      }

      // 2. Price after discount — this is the final customer-facing price (tax-inclusive)
      const priceAfterDiscount = item.price - discount;

      // 3. Reverse-calc: split into base + 18% GST
      const basePrice = +(priceAfterDiscount / 1.18).toFixed(2);

      return {
        name: item.name,
        sku: item.sku || `SKU${item.productId}`,
        units: item.quantity,
        selling_price: basePrice,   // base price (without tax)
        discount: 0,                // discount already baked into basePrice
        tax: 18,                    // GST % shown on invoice
        hsn: 441122,
      };
    }),

    /* ─── Payment + totals ─── */
    payment_method: order.paymentType === 'online' ? 'Prepaid' : 'COD',
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: advancePaid,   // deduct advance from COD (160 → COD becomes 640)
    sub_total: finalTotal,         // 800 (tax-inclusive final amount)

    /* ─── Package dimensions ─── */
    length: shipmentDetails.length,
    breadth: shipmentDetails.width,
    height: shipmentDetails.height,
    weight: shipmentDetails.weight,
  };

  try {
    const { data } = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      payload,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );

    if (data?.status_code !== 1) {
      throw new BadRequestError(data?.message || 'Shiprocket rejected the shipment');
    }

    order.status = 'shipped';
    order.shipment = {
      provider: 'shiprocket',
      trackingId: data.shipment_id,
      order_id: data.order_id,
      ...shipmentDetails,
    };
    await order.save();

    try {
      const mailer = (await import('@/utils/mail/mailer')) as unknown as {
        sendOrderStatus?: (o: unknown) => Promise<unknown>;
      };
      await mailer.sendOrderStatus?.(order);
    } catch (mailErr) {
      logger.error('Shiprocket shipment mail failed', mailErr);
    }

    return { success: true, provider: 'shiprocket', data };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    const { message, details } = extractApiError(err);
    logger.error('Shiprocket create failed', { message, details });
    throw new BadRequestError(`Shiprocket: ${message}`, details);
  }
}
async function shiprocketCancel(order: OrderDoc): Promise<unknown> {
  const token = await shiprocketAuth();
  const shipmentOrderId = (order.shipment as { order_id?: string } | undefined)?.order_id;
  if (!shipmentOrderId) throw new BadRequestError('No shipment order_id found');

  try {
    const { data } = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/cancel',
      { ids: [shipmentOrderId] },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    order.status = 'cancelled';
    await order.save();
    return { success: true, data };
  } catch (err) {
    const { message, details } = extractApiError(err);
    throw new BadRequestError(`Shiprocket cancel: ${message}`, details);
  }
}

export async function shiprocketTrack(awb: string): Promise<unknown> {
  if (!awb) throw new BadRequestError('awb is required');
  const token = await shiprocketAuth();
  try {
    const { data } = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err) {
    const { message, details } = extractApiError(err);
    throw new BadRequestError(`Shiprocket track: ${message}`, details);
  }
}

/* ============================================================
 * VELOCITY SHIPPING integration  (ex-Shipfast)
 *   Base: https://shazam.velocity.in
 *   Auth: POST /custom/api/v1/auth-token  → token (24h)
 *   Header: Authorization: {{token}}  (raw token, NO Bearer)
 * ============================================================ */

/** 'YYYY-MM-DD HH:mm' format chahiye Velocity ko */
function velocityOrderDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function velocityCreate(
  order: OrderDoc,
  shipmentDetails: ShipmentDetails,
  carrierId?: string
): Promise<unknown> {
  const token = await velocityAuth();
  const base = velocityBaseUrl();

  const warehouseId = process.env.VELOCITY_WAREHOUSE_ID;
  if (!warehouseId) {
    throw new BadRequestError('VELOCITY_WAREHOUSE_ID env not configured');
  }
  const pickupLocation = process.env.VELOCITY_PICKUP_LOCATION || 'Primary';

  // Final tax-inclusive amount customer pays
  const finalTotal = order.totalAmount.discountPrice;                 // e.g. 800
  // COD orders me advance already liya gaya (20%) — usse COD collectible kam karo
  const advancePaid = order.paymentType === 'offline' ? (order.payAmt || 0) : 0;
  const isPrepaid = order.paymentType === 'online';
  const codCollectible = isPrepaid ? 0 : Math.max(0, finalTotal - advancePaid);

  const payload: Record<string, unknown> = {
    order_id: order.orderId,
    order_date: velocityOrderDate(),
    // blank carrier_id = Velocity automatic courier assignment (shipping rules)
    carrier_id: carrierId || '',

    /* ─── Billing (shipping = billing) ─── */
    billing_customer_name: order.shipping.userName || 'Customer',
    billing_last_name: '',
    billing_address: order.shipping.addressLine || '',
    billing_city: order.shipping.city || '',
    billing_pincode: order.shipping.postCode || '',
    billing_state: order.shipping.state || '',
    billing_country: 'India',
    billing_email: order.shipping.email || '',
    billing_phone: order.shipping.mobileNumber || '',
    shipping_is_billing: true,
    print_label: true,

    /* ─── Items ─── */
    order_items: order.items.map((item) => {
      let discount = 0;
      if (item.discountPrice) {
        discount =
          item.discountType === 'percentage'
            ? Math.round((item.price * item.discountPrice) / 100)
            : Math.round(item.discountPrice);
      }
      const priceAfterDiscount = item.price - discount;
      const basePrice = +(priceAfterDiscount / 1.18).toFixed(2); // base (without 18% GST)

      return {
        name: item.name,
        sku: item.sku || `SKU${item.productId}`,
        units: item.quantity,
        selling_price: basePrice,
        discount: 0,
        tax: 18,
      };
    }),

    /* ─── Payment + totals ─── */
    payment_method: isPrepaid ? 'PREPAID' : 'COD',
    sub_total: finalTotal,
    cod_collectible: codCollectible,

    /* ─── Dimensions ─── */
    length: shipmentDetails.length,
    breadth: shipmentDetails.width, // Velocity me "breadth" = width
    height: shipmentDetails.height,
    weight: shipmentDetails.weight,

    /* ─── Warehouse ─── */
    pickup_location: pickupLocation,
    warehouse_id: warehouseId,
  };

  try {
    const { data } = await axios.post(
      `${base}/custom/api/v1/forward-order-orchestration`,
      payload,
      { headers: { 'Content-Type': 'application/json', Authorization: token } }
    );

    // Velocity success: status === 1
    if (data?.status !== 1) {
      throw new BadRequestError(data?.message || 'Velocity rejected the shipment');
    }

    const p = (data.payload ?? {}) as Record<string, any>;

    order.status = 'shipped';
    order.shipment = {
      provider: 'velocity',
      trackingId: p.awb_code || '',
      order_id: p.order_id || '',
      shipment_id: p.shipment_id || '',
      labelUrl: p.label_url || '',
      courierName: p.courier_name || '',
      ...shipmentDetails,
    };
    await order.save();

    // Fire-and-forget confirmation/status mail
    try {
      const mailer = (await import('@/utils/mail/mailer')) as unknown as {
        sendOrderStatus?: (o: unknown) => Promise<unknown>;
      };
      await mailer.sendOrderStatus?.(order);
    } catch (mailErr) {
      logger.error('Velocity shipment mail failed', mailErr);
    }

    return { success: true, provider: 'velocity', data };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    const { message, details } = extractApiError(err);
    logger.error('Velocity create failed', { message, details });
    throw new BadRequestError(`Velocity: ${message}`, details);
  }
}

async function velocityCancel(order: OrderDoc): Promise<unknown> {
  const token = await velocityAuth();
  const base = velocityBaseUrl();
  const awb = (order.shipment as { trackingId?: string } | undefined)?.trackingId;
  if (!awb) throw new BadRequestError('No AWB found on this order');

  try {
    const { data } = await axios.post(
      `${base}/custom/api/v1/cancel-order`,
      { awbs: [awb] },
      { headers: { 'Content-Type': 'application/json', Authorization: token } }
    );

    order.status = 'cancelled';
    await order.save();
    return { success: true, data };
  } catch (err) {
    const { message, details } = extractApiError(err);
    throw new BadRequestError(`Velocity cancel: ${message}`, details);
  }
}

export async function velocityTrack(awb: string): Promise<unknown> {
  if (!awb) throw new BadRequestError('awb is required');
  const token = await velocityAuth();
  const base = velocityBaseUrl();
  try {
    const { data } = await axios.post(
      `${base}/custom/api/v1/order-tracking`,
      { awbs: [awb] },
      { headers: { 'Content-Type': 'application/json', Authorization: token } }
    );
    return data;
  } catch (err) {
    const { message, details } = extractApiError(err);
    throw new BadRequestError(`Velocity track: ${message}`, details);
  }
}

/* ============================================================
 * UNIFIED PUBLIC API (used by controller)
 * ============================================================ */
export async function createShipment(body: CreateShipmentDTO): Promise<unknown> {
  const order = (await Order.findById(body.orderId)) as unknown as OrderDoc | null;
  if (!order) throw new NotFoundError('Order not found');

  if (order.status === 'shipped') {
    throw new BadRequestError('Order is already shipped');
  }

  if (body.provider === 'fship') {
    return fshipCreate(order, body.shipmentDetails);
  }
  if (body.provider === 'velocity') {
    return velocityCreate(order, body.shipmentDetails, body.carrierId);
  }
  return shiprocketCreate(order, body.shipmentDetails);
}

export async function cancelShipment(orderId: string): Promise<unknown> {
  const order = (await Order.findById(orderId)) as unknown as OrderDoc | null;
  if (!order) throw new NotFoundError('Order not found');

  const provider = (order.shipment as { provider?: string } | undefined)?.provider;
  if (!provider) throw new BadRequestError('No shipment exists for this order');

  if (provider === 'fship') return fshipCancel(order);
  if (provider === 'shiprocket') return shiprocketCancel(order);
  if (provider === 'velocity') return velocityCancel(order);
  throw new BadRequestError(`Unknown shipment provider: ${provider}`);
}

export async function track(
  provider: 'fship' | 'shiprocket' | 'velocity',
  waybill: string
): Promise<unknown> {
  if (provider === 'fship') return fshipTrack(waybill);
  if (provider === 'velocity') return velocityTrack(waybill);
  return shiprocketTrack(waybill);
}

/* ============================================================
 * Webhooks — unified handler
 * Both providers POST status updates; we update order.status accordingly.
 * ============================================================ */
const FSHIP_STATUS_MAP: Record<string, string> = {
  'IN-TRANSIT': 'shipped',
  'OUT-FOR-DELIVERY': 'shipped',
  DELIVERED: 'delivered',
  RTO: 'refunded',
  'RTO-DELIVERED': 'refunded',
  CANCELLED: 'cancelled',
};

const SHIPROCKET_STATUS_MAP: Record<string, string> = {
  PICKED_UP: 'shipped',
  IN_TRANSIT: 'shipped',
  OUT_FOR_DELIVERY: 'shipped',
  DELIVERED: 'delivered',
  RTO_INITIATED: 'refunded',
  RTO_DELIVERED: 'refunded',
  CANCELED: 'cancelled',
};

const VELOCITY_STATUS_MAP: Record<string, string> = {
  'PICKED UP': 'shipped',
  PICKED_UP: 'shipped',
  'IN-TRANSIT': 'shipped',
  IN_TRANSIT: 'shipped',
  'OUT FOR DELIVERY': 'shipped',
  OUT_FOR_DELIVERY: 'shipped',
  DELIVERED: 'delivered',
  RTO: 'refunded',
  'RTO DELIVERED': 'refunded',
  RTO_DELIVERED: 'refunded',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
};

export async function handleWebhook(
  provider: 'fship' | 'shiprocket' | 'velocity',
  body: Record<string, unknown>
): Promise<unknown> {
  logger.info(`Webhook received [${provider}]`, body);

  try {
    if (provider === 'fship') {
      const waybill = (body.waybill ?? body.AWB) as string | undefined;
      const status = String(body.status ?? body.current_status ?? '').toUpperCase();
      if (!waybill) return { ok: true, ignored: true };

      const mapped = FSHIP_STATUS_MAP[status];
      if (!mapped) return { ok: true, ignored: true };

      await Order.updateOne({ 'shipment.trackingId': waybill }, { status: mapped });
      return { ok: true, status: mapped };
    }

    if (provider === 'velocity') {
      const awb = (body.awb ?? body.awb_code ?? body.waybill) as string | undefined;
      const status = String(
        body.current_status ?? body.shipment_status ?? body.status ?? ''
      ).toUpperCase();
      if (!awb) return { ok: true, ignored: true };

      const mapped = VELOCITY_STATUS_MAP[status];
      if (!mapped) return { ok: true, ignored: true };

      await Order.updateOne({ 'shipment.trackingId': awb }, { status: mapped });
      return { ok: true, status: mapped };
    }

    // Shiprocket
    const awb = (body.awb ?? body.shipment_awb) as string | undefined;
    const status = String(body.current_status ?? body.status ?? '').toUpperCase();
    if (!awb) return { ok: true, ignored: true };

    const mapped = SHIPROCKET_STATUS_MAP[status];
    if (!mapped) return { ok: true, ignored: true };

    await Order.updateOne({ 'shipment.trackingId': awb }, { status: mapped });
    return { ok: true, status: mapped };
  } catch (err) {
    logger.error(`Webhook ${provider} processing failed`, err);
    // Acknowledge 200 anyway so provider doesn't retry forever
    return { ok: false, error: (err as Error).message };
  }
}