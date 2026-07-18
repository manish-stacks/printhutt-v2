/**
 * Orders → Excel export.
 *
 * Admin-only. Same filter semantics as GET /api/orders (status / search /
 * IST date range) plus two extra filters: paymentType (online|offline) and
 * paymentStatus (paid|unpaid).
 *
 * Output columns (as requested):
 *   Order ID, Order Status, Payment Status (Paid / COD-Pending), Payment Mode,
 *   Customer Name, Email, Phone (+91 normalised), Purchase Date, Order Value,
 *   City, State — plus useful extras (pincode, coupon, items, tracking).
 */
import ExcelJS from 'exceljs';
import { FilterQuery } from 'mongoose';
import { env } from '@/config/env';
import { getISTDayRange } from '@/utils/helpers';
import { ordersRepo } from './orders.repository';
import type { ExportOrdersQueryDTO } from './orders.validation';

/* ─────────────── helpers ─────────────── */

/** Any raw number → +91XXXXXXXXXX. Non-Indian / short numbers gracefully pass through. */
export function toIndianPhone(value: unknown): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  // strip leading 0 / 91 country code and keep last 10
  const last10 = digits.slice(-10);
  if (last10.length === 10 && /^[6-9]/.test(last10)) return `+91${last10}`;
  return `+${digits}`;
}

/** IST formatted date-time — Excel-friendly, sortable-ish. */
function istDateTime(d: unknown): string {
  if (!d) return '';
  const date = new Date(d as string);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function istDateOnly(d: unknown): string {
  if (!d) return '';
  const date = new Date(d as string);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return isNaN(n) ? 0 : n;
};

const titleCase = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

/**
 * Invoice link — frontend ka billing page.
 * Woh page khudse fetch → PDF download → tab close karta hai,
 * to Excel se click = seedha invoice download.
 * Base URL `APP_URL` env se (prod: https://printhutt.com).
 */
const SITE_URL = String(env.APP_URL || '').replace(/\/+$/, '');

export function invoiceUrl(orderMongoId: unknown): string {
  const id = String(orderMongoId ?? '');
  if (!id) return '';
  return `${SITE_URL}/orders/${id}/billing`;
}

/* ─────────────── query builder ─────────────── */

export function buildExportQuery(q: ExportOrdersQueryDTO): FilterQuery<unknown> {
  const query: Record<string, unknown> = {};

  /* status — supports single ('delivered') or CSV ('cancelled,refunded') */
  if (q.status && q.status !== 'all') {
    const list = q.status
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    query.status = list.length > 1 ? { $in: list } : list[0];
  } else {
    // 'all' / empty → list route jaisa behaviour: pending hide
    query.status = { $ne: 'pending' };
  }

  if (q.search) {
    query.orderId = { $regex: q.search, $options: 'i' };
  }

  if (q.startDate || q.endDate) {
    const createdAt: Record<string, Date> = {};
    if (q.startDate) createdAt.$gte = getISTDayRange(q.startDate).start;
    if (q.endDate) createdAt.$lte = getISTDayRange(q.endDate).end;
    query.createdAt = createdAt;
  }

  if (q.paymentType !== 'all') {
    query.paymentType = q.paymentType; // 'online' | 'offline'
  }

  if (q.paymentStatus === 'paid') {
    query['payment.isPaid'] = true;
  } else if (q.paymentStatus === 'unpaid') {
    query['payment.isPaid'] = { $ne: true };
  }

  return query as FilterQuery<unknown>;
}

/* ─────────────── row mapper ─────────────── */

type PopulatedUser = {
  displayName?: string;
  username?: string;
  email?: string;
  number?: number | string;
};

function mapRow(o: Record<string, unknown>): Record<string, unknown> {
  const shipping = (o.shipping ?? {}) as Record<string, unknown>;
  const payment = (o.payment ?? {}) as Record<string, unknown>;
  const totals = (o.totalAmount ?? {}) as Record<string, unknown>;
  const coupon = (o.coupon ?? {}) as Record<string, unknown>;
  const shipment = (o.shipment ?? {}) as Record<string, unknown>;
  const user = (o.userId && typeof o.userId === 'object' ? o.userId : {}) as PopulatedUser;
  const items = (o.items ?? []) as Array<Record<string, unknown>>;

  const status = String(o.status ?? '');
  const isPaid = payment.isPaid === true;
  const isOnline = o.paymentType === 'online';
  const invUrl = invoiceUrl(o._id);

  /* Order value = jo revenue aggregate use karta hai: discountPrice + shippingTotal */
  const orderValue = num(totals.discountPrice) + num(totals.shippingTotal);
  const paidAmount = num(o.payAmt);
  const codDue = isOnline ? 0 : Math.max(orderValue - paidAmount, 0);

  /* Paid / COD / Unpaid bucket */
  let paymentStatus: string;
  if (isPaid) paymentStatus = 'Paid';
  else if (isOnline) paymentStatus = 'Unpaid (Online)';
  else paymentStatus = 'COD (Pending)';

  const name =
    (shipping.userName as string) || user.displayName || user.username || 'N/A';
  const email = (shipping.email as string) || user.email || '';
  const phone = toIndianPhone(shipping.mobileNumber ?? user.number);

  return {
    orderId: o.orderId ?? String(o._id ?? ''),
    purchaseDate: istDateOnly(o.createdAt),
    purchaseDateTime: istDateTime(o.createdAt),
    status: titleCase(status),
    isCancelledOrRefunded:
      ['cancelled', 'refunded', 'returned'].includes(status) ? 'Yes' : 'No',
    isDelivered: status === 'delivered' ? 'Yes' : 'No',
    paymentStatus,
    paymentMode: isOnline ? 'Online' : 'COD',
    paymentPartner: (payment.paymentPartner as string) ?? '',
    transactionId: (payment.transactionId as string) ?? '',
    paidAt: istDateTime(payment.paidAt),
    customerName: name,
    email,
    phone,
    city: (shipping.city as string) ?? '',
    state: (shipping.state as string) ?? '',
    postCode: String(shipping.postCode ?? ''),
    addressLine: (shipping.addressLine as string) ?? '',
    orderValue,
    paidAmount,
    codDue,
    mrpTotal: num(totals.totalPrice),
    shippingCharge: num(totals.shippingTotal),
    couponCode: (coupon.code as string) ?? '',
    couponDiscount: num(coupon.discountAmount),
    totalQuantity: num(o.totalQuantity),
    items: items
      .map((i, idx) => `${idx + 1}. ${String(i.name ?? '')} x${num(i.quantity)}`)
      .join(' | '),
    courier: (shipment.courierName as string) ?? (shipment.provider as string) ?? '',
    trackingId: (shipment.trackingId as string) ?? '',
    /* Clickable cell — Excel me "Download Invoice" pe click = PDF download */
    invoice: invUrl
      ? { text: 'Download Invoice', hyperlink: invUrl, tooltip: `Invoice ${o.orderId ?? ''}` }
      : '',
    /* Raw URL bhi — mail-merge / bulk copy ke liye */
    invoiceLink: invUrl,
  };
}

/* ─────────────── main ─────────────── */

const COLUMNS: Array<Partial<ExcelJS.Column>> = [
  { header: 'Order ID', key: 'orderId', width: 20 },
  { header: 'Invoice', key: 'invoice', width: 18 },
  { header: 'Purchase Date', key: 'purchaseDate', width: 14 },
  { header: 'Purchase Date & Time (IST)', key: 'purchaseDateTime', width: 24 },
  { header: 'Order Status', key: 'status', width: 14 },
  { header: 'Delivered?', key: 'isDelivered', width: 11 },
  { header: 'Cancelled/Refunded?', key: 'isCancelledOrRefunded', width: 18 },
  { header: 'Payment Status', key: 'paymentStatus', width: 16 },
  { header: 'Payment Mode', key: 'paymentMode', width: 13 },
  { header: 'Payment Partner', key: 'paymentPartner', width: 15 },
  { header: 'Transaction ID', key: 'transactionId', width: 24 },
  { header: 'Paid At (IST)', key: 'paidAt', width: 22 },
  { header: 'Customer Name', key: 'customerName', width: 24 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Phone', key: 'phone', width: 16 },
  { header: 'City', key: 'city', width: 18 },
  { header: 'State', key: 'state', width: 18 },
  { header: 'Pincode', key: 'postCode', width: 10 },
  { header: 'Address', key: 'addressLine', width: 40 },
  { header: 'Order Value (₹)', key: 'orderValue', width: 14 },
  { header: 'Paid Amount (₹)', key: 'paidAmount', width: 14 },
  { header: 'COD Due (₹)', key: 'codDue', width: 12 },
  { header: 'MRP Total (₹)', key: 'mrpTotal', width: 13 },
  { header: 'Shipping (₹)', key: 'shippingCharge', width: 12 },
  { header: 'Coupon Code', key: 'couponCode', width: 14 },
  { header: 'Coupon Discount (₹)', key: 'couponDiscount', width: 17 },
  { header: 'Total Qty', key: 'totalQuantity', width: 10 },
  { header: 'Items', key: 'items', width: 55 },
  { header: 'Courier', key: 'courier', width: 16 },
  { header: 'Tracking ID', key: 'trackingId', width: 22 },
  { header: 'Invoice Link (raw)', key: 'invoiceLink', width: 55 },
];

const MONEY_KEYS = new Set([
  'orderValue',
  'paidAmount',
  'codDue',
  'mrpTotal',
  'shippingCharge',
  'couponDiscount',
]);

export async function exportOrdersExcel(
  q: ExportOrdersQueryDTO
): Promise<ExcelJS.Buffer> {
  const query = buildExportQuery(q);
  const orders = await ordersRepo.allForExport(query, q.limit);
  const rows = orders.map(mapRow);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PrintHutt Admin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Orders', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = COLUMNS;

  /* Header style */
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C7FD8' } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 22;

  rows.forEach((r) => sheet.addRow(r));

  /* Column formats. NOTE: row.alignment cell-level alignment ko overwrite kar
     deta hai, isliye alignment sirf column level pe set karo — row level pe nahi. */
  sheet.columns.forEach((col) => {
    const key = col.key as string;
    if (MONEY_KEYS.has(key)) {
      col.numFmt = '#,##0.00';
      col.alignment = { horizontal: 'right', vertical: 'top' };
    } else if (key === 'phone' || key === 'postCode' || key === 'transactionId' || key === 'invoiceLink') {
      // text rakho — Excel se number banke +91 / leading zero na ud jaye
      col.numFmt = '@';
      col.alignment = { horizontal: 'left', vertical: 'top' };
    } else {
      col.alignment = { horizontal: 'left', vertical: 'top', wrapText: false };
    }
  });

  const STATUS_FILL: Record<string, string> = {
    Delivered: 'FFD1FAE5',
    Confirmed: 'FFDCFCE7',
    Shipped: 'FFDBEAFE',
    Cancelled: 'FFFEE2E2',
    Refunded: 'FFFEE2E2',
    Returned: 'FFFEF3C7',
    Pending: 'FFFEF9C3',
    Progress: 'FFE0E7FF',
  };

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const statusCell = row.getCell('status');
    const fill = STATUS_FILL[String(statusCell.value ?? '')];
    if (fill) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    }
    const payCell = row.getCell('paymentStatus');
    if (String(payCell.value) === 'Paid') {
      payCell.font = { color: { argb: 'FF047857' }, bold: true };
    } else if (String(payCell.value).startsWith('COD')) {
      payCell.font = { color: { argb: 'FFB45309' } };
    } else {
      payCell.font = { color: { argb: 'FFB91C1C' } };
    }
    /* Invoice hyperlink — blue + underline, warna Excel me plain text lagta hai */
    const invCell = row.getCell('invoice');
    if (invCell.value) {
      invCell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
    }
  });

  /* Autofilter poore range pe */
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(rows.length + 1, 2), column: COLUMNS.length },
  };

  /* ── Summary sheet ── */
  const summary = workbook.addWorksheet('Summary');
  summary.columns = [
    { header: 'Metric', key: 'k', width: 32 },
    { header: 'Value', key: 'v', width: 28 },
  ];
  summary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summary.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6C7FD8' },
  };

  const sum = (k: string): number => rows.reduce((a, r) => a + num(r[k]), 0);
  const countWhere = (fn: (r: Record<string, unknown>) => boolean): number =>
    rows.filter(fn).length;

  const filterLabel = [
    `status=${q.status || 'all'}`,
    `paymentType=${q.paymentType}`,
    `paymentStatus=${q.paymentStatus}`,
    q.startDate ? `from=${q.startDate}` : null,
    q.endDate ? `to=${q.endDate}` : null,
    q.search ? `search=${q.search}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  [
    { k: 'Generated At (IST)', v: istDateTime(new Date()) },
    { k: 'Filters Applied', v: filterLabel },
    { k: 'Total Orders', v: rows.length },
    { k: 'Delivered Orders', v: countWhere((r) => r.isDelivered === 'Yes') },
    { k: 'Cancelled / Refunded / Returned', v: countWhere((r) => r.isCancelledOrRefunded === 'Yes') },
    { k: 'Paid Orders', v: countWhere((r) => r.paymentStatus === 'Paid') },
    { k: 'COD (Pending) Orders', v: countWhere((r) => String(r.paymentStatus).startsWith('COD')) },
    { k: 'Online Mode Orders', v: countWhere((r) => r.paymentMode === 'Online') },
    { k: 'COD Mode Orders', v: countWhere((r) => r.paymentMode === 'COD') },
    { k: 'Total Order Value (₹)', v: sum('orderValue') },
    { k: 'Total Collected (₹)', v: sum('paidAmount') },
    { k: 'Total COD Due (₹)', v: sum('codDue') },
    { k: 'Unique Customers (by phone)', v: new Set(rows.map((r) => r.phone).filter(Boolean)).size },
  ].forEach((r) => summary.addRow(r));

  summary.getColumn('v').alignment = { horizontal: 'left' };

  return workbook.xlsx.writeBuffer();
}