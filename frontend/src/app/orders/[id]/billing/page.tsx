"use client";
import { notFound, useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/helpers/helpers';
import { useEffect, useState } from 'react';
import { IOrder } from '@/lib/types/order';
import { get_order_details } from '@/_services/common/order';
import { usePDF } from 'react-to-pdf';
import { RiDownload2Line, RiPrinterLine } from 'react-icons/ri';

/* ─── Number to words (Indian system) ─── */
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    return '';
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const remainder = rupees % 1000;

  if (crore) result += inWords(crore) + ' Crore ';
  if (lakh) result += inWords(lakh) + ' Lakh ';
  if (thousand) result += inWords(thousand) + ' Thousand ';
  if (remainder) result += inWords(remainder);

  result = result.trim() || 'Zero';
  let final = `Rupees ${result}`;
  if (paise > 0) final += ` and ${inWords(paise)} Paise`;
  final += ' Only';
  return final;
}

/* ─── Seller config (replace with actual values) ─── */
const SELLER = {
  name: 'PrintHutt',
  address: '25 Krishna Market, Delhi - 110034',
  gstin: '07BPZPA3092P1Z3',           
  pan: 'AABCXXXXX',                   
  state: 'Delhi',
  stateCode: '07',
  email: 'printhutt05@gmail.com',
  phone: '+91 880 011 2625',
};

export default function InvoicePage() {
  const params = useParams();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { toPDF, targetRef } = usePDF({
    filename: `invoice_${order?.orderId || 'order'}.pdf`,
    page: { format: 'A4', margin: 10 },
  });

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      try {
        const data: any = await get_order_details(params.id);
        setOrder(data.data);
      } catch (e) {
        console.error(e);
        notFound();
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  /* Auto-download then close */
  useEffect(() => {
    if (!loading && order) {
      const t = setTimeout(async () => {
        await toPDF();
        window.close();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [loading, order, toPDF]);

  /* GST split — same state = CGST+SGST, different state = IGST */
  const isSameState = (state?: string) =>
    state?.toLowerCase().trim() === SELLER.state.toLowerCase().trim();

  /* Compute per-item with GST (tax-inclusive base) */
  const getItemBreakdown = (item: any, sameState: boolean, gstRate = 18) => {
    // Use post-product-discount price if available
    let unitPrice = item.price;
    if (item.discountPrice && item.discountType) {
      unitPrice = item.discountType === 'percentage'
        ? item.price - (item.price * item.discountPrice) / 100
        : item.price - item.discountPrice;
    }
    const grossAmount = unitPrice * item.quantity;
    const baseAmount = grossAmount / (1 + gstRate / 100);
    const taxAmount = grossAmount - baseAmount;
    const halfTax = taxAmount / 2;
    return {
      grossAmount,
      baseAmount,
      taxAmount,
      cgst: sameState ? halfTax : 0,
      sgst: sameState ? halfTax : 0,
      igst: sameState ? 0 : taxAmount,
      gstRate,
      totalWithTax: grossAmount,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) return notFound();

  const sameState = isSameState(order.shipping.state);
  const itemBreakdowns = order.items.map((item: any) => getItemBreakdown(item, sameState));

  const totalBase = itemBreakdowns.reduce((s, b) => s + b.baseAmount, 0);
  const totalCGST = itemBreakdowns.reduce((s, b) => s + b.cgst, 0);
  const totalSGST = itemBreakdowns.reduce((s, b) => s + b.sgst, 0);
  const totalIGST = itemBreakdowns.reduce((s, b) => s + b.igst, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;
  const shipping = order.totalAmount.shippingTotal || 0;
  const couponDiscount = order.totalAmount.coupon_discount || 0;
  const grandTotal = order.totalAmount.discountPrice + shipping;

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">

        {/* ─── Action buttons (hidden on print) ─── */}
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition"
          >
            <RiPrinterLine className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => toPDF()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-md text-sm font-medium transition"
          >
            <RiDownload2Line className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* ─── INVOICE BODY ─── */}
        <div
          ref={targetRef}
          className="bg-white shadow-md print:shadow-none border border-gray-300 text-[13px] text-gray-900"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >

          {/* Title bar */}
          <div className="text-center border-b border-gray-300 py-3">
            <h1 className="text-base font-bold uppercase tracking-wide">
              Tax Invoice / Bill of Supply / Cash Memo
            </h1>
            <p className="text-[11px] text-gray-600 mt-0.5">(Original for Recipient)</p>
          </div>

          {/* Seller + Order info */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-300">
            {/* Sold by */}
            <div className="p-4 border-r border-gray-300">
              <p className="text-[11px] uppercase text-gray-500 mb-1">Sold By</p>
              <p className="font-bold text-sm">{SELLER.name}</p>
              <p className="text-xs leading-relaxed mt-1">{SELLER.address}</p>
              <div className="text-xs mt-2 space-y-0.5">
                <p><span className="text-gray-500">GSTIN:</span> <strong>{SELLER.gstin}</strong></p>
                <p><span className="text-gray-500">PAN No:</span> <strong>{SELLER.pan}</strong></p>
              </div>
            </div>

            {/* Order details */}
            <div className="p-4">
              <p className="text-[11px] uppercase text-gray-500 mb-1">Invoice Details</p>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-0.5 text-gray-500">Order ID</td>
                    <td className="py-0.5 font-semibold text-right">#{order.orderId}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-500">Order Date</td>
                    <td className="py-0.5 text-right">{formatDate(order.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-500">Invoice Date</td>
                    <td className="py-0.5 text-right">{formatDate(new Date())}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-500">Place of Supply</td>
                    <td className="py-0.5 text-right">{order.shipping.state || '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-500">Payment Type</td>
                    <td className="py-0.5 text-right font-semibold">
                      {order.paymentType === 'offline' ? 'Cash on Delivery' : 'Prepaid'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill To + Ship To */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-300">
            <div className="p-4 border-r border-gray-300">
              <p className="text-[11px] uppercase text-gray-500 mb-1">Bill To</p>
              <p className="font-semibold">{order.shipping.userName || 'Guest'}</p>
              <p className="text-xs leading-relaxed mt-1">
                {order.shipping.addressLine}<br />
                {order.shipping.city}, {order.shipping.state} – {order.shipping.postCode}<br />
                Phone: {order.shipping.mobileNumber}
              </p>
            </div>
            <div className="p-4">
              <p className="text-[11px] uppercase text-gray-500 mb-1">Ship To</p>
              <p className="font-semibold">{order.shipping.userName || 'Guest'}</p>
              <p className="text-xs leading-relaxed mt-1">
                {order.shipping.addressLine}<br />
                {order.shipping.city}, {order.shipping.state} – {order.shipping.postCode}<br />
                Phone: {order.shipping.mobileNumber}
              </p>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr className="text-left">
                  <th className="px-2 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Description</th>
                  <th className="px-2 py-2 font-semibold text-center">Qty</th>
                  <th className="px-2 py-2 font-semibold text-right">Gross</th>
                  <th className="px-2 py-2 font-semibold text-right">Taxable Value</th>
                  {sameState ? (
                    <>
                      <th className="px-2 py-2 font-semibold text-right">CGST<br /><span className="text-[10px] font-normal text-gray-500">9%</span></th>
                      <th className="px-2 py-2 font-semibold text-right">SGST<br /><span className="text-[10px] font-normal text-gray-500">9%</span></th>
                    </>
                  ) : (
                    <th className="px-2 py-2 font-semibold text-right">IGST<br /><span className="text-[10px] font-normal text-gray-500">18%</span></th>
                  )}
                  <th className="px-2 py-2 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item: any, i: number) => {
                  const b = itemBreakdowns[i];
                  return (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-2 py-2.5 text-gray-600 align-top">{i + 1}</td>
                      <td className="px-2 py-2.5 align-top">
                        <p className="font-medium leading-snug">{item.name}</p>
                        {item.sku && (
                          <p className="text-[10px] text-gray-500 mt-0.5">SKU: {item.sku}</p>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center align-top">{item.quantity}</td>
                      <td className="px-2 py-2.5 text-right align-top">{formatCurrency(b.grossAmount)}</td>
                      <td className="px-2 py-2.5 text-right align-top">{formatCurrency(b.baseAmount)}</td>
                      {sameState ? (
                        <>
                          <td className="px-2 py-2.5 text-right align-top">{formatCurrency(b.cgst)}</td>
                          <td className="px-2 py-2.5 text-right align-top">{formatCurrency(b.sgst)}</td>
                        </>
                      ) : (
                        <td className="px-2 py-2.5 text-right align-top">{formatCurrency(b.igst)}</td>
                      )}
                      <td className="px-2 py-2.5 text-right align-top font-semibold">
                        {formatCurrency(b.totalWithTax)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals row */}
              <tfoot className="bg-gray-50 border-t border-gray-300 font-semibold">
                <tr>
                  <td colSpan={4} className="px-2 py-2 text-right">Total</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(totalBase)}</td>
                  {sameState ? (
                    <>
                      <td className="px-2 py-2 text-right">{formatCurrency(totalCGST)}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(totalSGST)}</td>
                    </>
                  ) : (
                    <td className="px-2 py-2 text-right">{formatCurrency(totalIGST)}</td>
                  )}
                  <td className="px-2 py-2 text-right">
                    {/* Sum of items with tax — math should add up: 969 + 87 + 87 = 1143 */}
                    {formatCurrency(itemBreakdowns.reduce((s, b) => s + b.totalWithTax, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Charges + Grand Total */}
          <div className="border-t border-gray-300 px-4 py-3">
            <div className="flex justify-end">
              <table className="text-xs w-full sm:w-1/2">
                <tbody>
                  <tr>
                    <td className="py-1.5 text-gray-600">Subtotal (incl. GST)</td>
                    <td className="py-1.5 text-right">
                      {formatCurrency(itemBreakdowns.reduce((s, b) => s + b.totalWithTax, 0))}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-1.5 text-gray-600">Shipping Charges</td>
                    <td className="py-1.5 text-right">
                      {shipping > 0 ? formatCurrency(shipping) : 'FREE'}
                    </td>
                  </tr>

                  {couponDiscount > 0 && (
                    <tr>
                      <td className="py-1.5 text-gray-600">
                        Coupon Discount{order.coupon?.code ? ` (${order.coupon.code})` : ''}
                      </td>
                      <td className="py-1.5 text-right text-red-600">
                        - {formatCurrency(couponDiscount)}
                      </td>
                    </tr>
                  )}

                  <tr className="border-t-2 border-gray-400 text-sm">
                    <td className="py-2.5 font-bold">Grand Total</td>
                    <td className="py-2.5 text-right font-bold">
                      {formatCurrency(grandTotal)}
                    </td>
                  </tr>

                  {/* COD breakdown */}
                  {order.paymentType === 'offline' && (
                    <>
                      <tr>
                        <td className="py-2 text-gray-700 border-t border-gray-200">
                          Amount Paid (Advance)
                        </td>
                        <td className="py-2 text-right text-green-700 font-medium border-t border-gray-200">
                          - {formatCurrency(order.payAmt)}
                        </td>
                      </tr>
                      <tr className="bg-amber-50">
                        <td className="py-2.5 px-2 font-semibold text-amber-900">
                          Due on Delivery
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-amber-900">
                          {formatCurrency(Math.max(0, grandTotal - order.payAmt))}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="border-t border-gray-300 px-4 py-2.5 bg-gray-50">
            <p className="text-xs">
              <span className="text-gray-500">Amount in Words: </span>
              <span className="font-semibold">{numberToWords(grandTotal)}</span>
            </p>
          </div>

          {/* Declaration */}
          <div className="border-t border-gray-300 px-4 py-3 text-[11px] text-gray-700 space-y-1.5">
            <p><strong>Declaration:</strong> Certified that the particulars given above are true and correct, and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.</p>
            <p className="text-gray-500">
              <strong>Note:</strong> The reverse charge mechanism is not applicable on this invoice.
              Whether tax is payable under reverse charge: <strong>No</strong>
            </p>
          </div>

          {/* Signature */}
          <div className="border-t border-gray-300 px-4 py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Customer Care: {SELLER.email}</p>
              <p className="text-xs text-gray-500">Helpline: {SELLER.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-8">For {SELLER.name}</p>
              <p className="text-xs font-semibold border-t border-gray-400 pt-1 inline-block px-3">
                Authorised Signatory
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="bg-gray-100 border-t border-gray-300 text-center py-2">
            <p className="text-[10px] text-gray-600">
              This is a computer-generated invoice and does not require a physical signature.
            </p>
          </div>
        </div>

        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:bg-white { background-color: white !important; }
            .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          }
        `}</style>
      </div>
    </div>
  );
}