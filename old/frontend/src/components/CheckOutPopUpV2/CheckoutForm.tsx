import { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiArrowLeftSLine,
} from 'react-icons/ri';
import {
  FiCheck,
  FiPlus,
  FiEdit2,
  FiMapPin,
  FiCreditCard,
  FiShoppingBag,
  FiTruck,
} from 'react-icons/fi';
import { formatCurrency } from '@/helpers/helpers';
import { CheckoutFormProps } from './interfaces';
import CheckoutLoader from './CheckoutLoader';
import { getAddress } from '@/_services/common/address';
import { type AddressFormData } from '@/lib/types/address';

/* ───────────────────────────── Stepper ───────────────────────────── */
const STEPS = [
  { id: 1, label: 'Cart', icon: FiShoppingBag },
  { id: 2, label: 'Address', icon: FiMapPin },
  { id: 3, label: 'Payment', icon: FiCreditCard },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-5 px-1">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const done = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                  ${done ? 'bg-blue-600 border-blue-600 text-white'
                    : active ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100'
                      : 'bg-white border-gray-300 text-gray-400'}`}
              >
                {done ? <FiCheck size={16} /> : <Icon size={15} />}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active || done ? 'text-blue-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 -mt-4 ${current > s.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── Main ───────────────────────────── */
function CheckoutFormComponent({
  error,
  showSummary,
  setShowSummary,
  items,
  totalPrice,
  selectedCoupon,
  coupon_mark,
  handle_apply_code,
  handleMarkChange,
  handleRemoveCoupon,
  paymentMethod,
  setPaymentFunction,
  placeOrder,
  isCheckout,
  selectAddress,
  setAddressHandler,
  fillAddressFromSaved,
  paymentPartner,
  setPaymentPartner,
}: CheckoutFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* address state */
  const [savedAddresses, setSavedAddresses] = useState<AddressFormData[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [newAddrErrors, setNewAddrErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        setAddrLoading(true);
        const res: any = await getAddress();
        const list: AddressFormData[] = res?.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedSavedId(def._id);
          fillAddressFromSaved(def);
        } else {
          setShowNewForm(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAddrLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSelectSaved = (addr: AddressFormData) => {
    setSelectedSavedId(addr._id);
    setSavedAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === addr._id })));
    fillAddressFromSaved(addr);
  };

  const handleNewAddrFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (newAddrErrors[e.target.name]) {
      setNewAddrErrors((prev) => {
        const n = { ...prev };
        delete n[e.target.name];
        return n;
      });
    }
    setAddressHandler(e);
  };

  /* step validation */
  const canGoStep2 = items > 0;
  const canGoStep3 = (() => {
    const a = selectAddress;
    if (!a.name?.trim()) return false;
    if (!/^[6-9]\d{9}$/.test(a.number || '')) return false;
    if (!a.address?.trim() || !a.city?.trim() || !a.state?.trim()) return false;
    if (!/^\d{6}$/.test(a.postCode || '')) return false;
    return true;
  })();

  const goNext = () => {
    if (step === 1 && canGoStep2) setStep(2);
    else if (step === 2 && canGoStep3) setStep(3);
    else if (step === 2 && !canGoStep3) {
      const errs: Record<string, string> = {};
      const a = selectAddress;
      if (!a.name?.trim()) errs.name = 'Required';
      if (!/^[6-9]\d{9}$/.test(a.number || '')) errs.mobileNumber = 'Enter valid 10-digit phone';
      if (!a.email?.trim()) errs.email = 'Required';
      if (!a.state?.trim()) errs.state = 'Required';
      if (!a.city?.trim()) errs.city = 'Required';
      if (!/^\d{6}$/.test(a.postCode || '')) errs.postCode = 'Enter valid 6-digit pin';
      if (!a.address?.trim()) errs.address = 'Required';
      setNewAddrErrors(errs);
      if (Object.keys(errs).length && !showNewForm) setShowNewForm(true);
    }
  };
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s));

  const grandTotal = totalPrice.discountPrice + totalPrice.shippingTotal;

  return (
    <>
      {/* header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
        <p className="text-xs text-gray-500">Complete your order in 3 steps</p>
      </div>

      <Stepper current={step} />

      {/* persistent mini-total */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-500 leading-none">Total Payable</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{formatCurrency(grandTotal)}</p>
        </div>
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="text-xs font-medium text-blue-600 flex items-center gap-1"
        >
          {showSummary ? 'Hide' : 'View'} breakdown
          {showSummary ? <RiArrowUpSLine size={16} /> : <RiArrowDownSLine size={16} />}
        </button>
      </div>

      {showSummary && (
        <div className="bg-white border rounded-lg p-3 mb-4 text-sm space-y-1.5">
          <Row label={`Subtotal (${items} ${items === 1 ? 'item' : 'items'})`} value={formatCurrency(totalPrice.totalPrice)} />
          <Row
            label="Delivery"
            value={totalPrice.shippingTotal > 0 ? formatCurrency(totalPrice.shippingTotal) : 'Free'}
            valueClass={totalPrice.shippingTotal > 0 ? '' : 'text-green-600'}
          />
          {selectedCoupon && (
            <Row
              label={`Coupon (${selectedCoupon.code})`}
              value={`-${formatCurrency(totalPrice?.coupon_discount)}`}
              valueClass="text-green-600"
            />
          )}
          <Row
            label="Extra Discount"
            value={`-${formatCurrency(
              (totalPrice?.totalPrice || 0) - (totalPrice?.discountPrice || 0) - (totalPrice?.coupon_discount || 0)
            )}`}
            valueClass="text-green-600"
          />
          <div className="border-t pt-1.5 mt-1.5">
            <Row label="Total" value={formatCurrency(grandTotal)} bold />
          </div>
        </div>
      )}

      {/* ────────────── STEP 1: cart + coupon + payment ────────────── */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <SectionTitle icon={<FiShoppingBag />}>Order Details</SectionTitle>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <FiShoppingBag className="text-orange-600" size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{items} {items === 1 ? 'Item' : 'Items'} in cart</p>
                <p className="text-xs text-gray-500">Worth {formatCurrency(totalPrice.totalPrice)}</p>
              </div>
            </div>

            {/* coupon */}
            <div className="border-t pt-3">
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Have a coupon?</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  name="coupon_mark"
                  value={coupon_mark}
                  onChange={handleMarkChange}
                  className="w-full py-2 px-3 pr-20 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handle_apply_code}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
              {selectedCoupon && (
                <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-2 py-1.5">
                  <span className="text-xs text-green-700">
                    ✓ <b>{selectedCoupon.code}</b> applied — {formatCurrency(totalPrice?.coupon_discount)} off
                  </span>
                  <button className="text-xs text-red-500 hover:underline" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* shipping method */}
          <SectionTitle icon={<FiTruck />}>Shipping Method</SectionTitle>
          <div className="bg-white border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <FiTruck className="text-green-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Standard Delivery</p>
                <p className="text-[11px] text-gray-500">3–7 business days</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-green-600">
              {totalPrice.shippingTotal > 0 ? formatCurrency(totalPrice.shippingTotal) : 'Free'}
            </span>
          </div>

          {/* payment method */}
          <SectionTitle icon={<FiCreditCard />}>Payment Method</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <PayMethodCard
              active={paymentMethod === 'online'}
              onClick={() => setPaymentFunction('online')}
              title="Pay Online"
              subtitle={selectedCoupon ? `${formatCurrency(totalPrice?.coupon_discount)} off` : 'UPI / Card / Wallet'}
              badge={selectedCoupon ? 'Best' : null}
            />
            <PayMethodCard
              active={paymentMethod === 'offline'}
              onClick={() => setPaymentFunction('offline')}
              title="Cash on Delivery"
              subtitle={`${formatCurrency(
                (totalPrice.discountPrice + Number(totalPrice?.coupon_discount || 0)) * 0.2
              )} advance`}
            />
          </div>

          <SectionTitle>Choose Payment Partner</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <PartnerCard
              active={paymentPartner === 'phonepe'}
              onClick={() => setPaymentPartner('phonepe')}
              src="https://cloudify.printhutt.com/images/PhonePe_Logo.webp"
              alt="PhonePe"
            />
            <PartnerCard
              active={paymentPartner === 'razorpay'}
              onClick={() => setPaymentPartner('razorpay')}
              src="https://cloudify.printhutt.com/images/razorpay.png"
              alt="Razorpay"
            />
          </div>
        </div>
      )}

      {/* ────────────── STEP 2: address ────────────── */}
      {step === 2 && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<FiMapPin />}>Delivery Address</SectionTitle>
            {savedAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewForm((p) => !p)}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium"
              >
                {showNewForm ? (
                  <>
                    <FiEdit2 size={11} /> Saved
                  </>
                ) : (
                  <>
                    <FiPlus size={11} /> Add New
                  </>
                )}
              </button>
            )}
          </div>

          {addrLoading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading addresses...</div>
          ) : !showNewForm ? (
            <div className="space-y-2">
              {savedAddresses.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No saved addresses</p>
              ) : (
                savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => handleSelectSaved(addr)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-sm
                      ${addr._id === selectedSavedId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900">{addr.fullName}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {addr.addressType?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs leading-snug">
                          {addr.addressLine}, {addr.city}, {addr.state} — {addr.postCode}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">📱 {addr.mobileNumber}</p>
                      </div>
                      {addr._id === selectedSavedId && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
                          <FiCheck size={10} /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2 bg-white border rounded-lg p-3">
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="text-xs text-blue-600 hover:underline mb-1"
                >
                  ← Back to saved addresses
                </button>
              )}
              <Field label="Full Name" error={newAddrErrors.name}>
                <input
                  type="text"
                  placeholder="John Doe"
                  name="name"
                  value={selectAddress.name}
                  onChange={handleNewAddrFieldChange}
                  className="checkout-input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" error={newAddrErrors.mobileNumber}>
                  <input
                    type="tel"
                    placeholder="10 digit"
                    name="number"
                    value={selectAddress.number}
                    onChange={handleNewAddrFieldChange}
                    maxLength={10}
                    className="checkout-input"
                  />
                </Field>
                <Field label="Email" error={newAddrErrors.email}>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    name="email"
                    value={selectAddress.email}
                    onChange={handleNewAddrFieldChange}
                    className="checkout-input"
                  />
                </Field>
              </div>
              <Field label="Street Address" error={newAddrErrors.address}>
                <textarea
                  placeholder="House no, street, area"
                  rows={2}
                  name="address"
                  value={selectAddress.address}
                  onChange={setAddressHandler as any}
                  className="checkout-input resize-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" error={newAddrErrors.city}>
                  <input
                    type="text"
                    placeholder="City"
                    name="city"
                    value={selectAddress.city}
                    onChange={handleNewAddrFieldChange}
                    className="checkout-input"
                  />
                </Field>
                <Field label="State" error={newAddrErrors.state}>
                  <input
                    type="text"
                    placeholder="State"
                    name="state"
                    value={selectAddress.state}
                    onChange={handleNewAddrFieldChange}
                    className="checkout-input"
                  />
                </Field>
              </div>
              <Field label="Post Code" error={newAddrErrors.postCode}>
                <input
                  type="tel"
                  placeholder="6 digit"
                  name="postCode"
                  value={selectAddress.postCode}
                  onChange={handleNewAddrFieldChange}
                  maxLength={6}
                  className="checkout-input"
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* ────────────── STEP 3: review ────────────── */}
      {step === 3 && (
        <div className="space-y-3 animate-fadeIn">
          <SectionTitle icon={<FiCheck />}>Review & Pay</SectionTitle>

          <ReviewCard title="Deliver to" onEdit={() => setStep(2)}>
            <p className="text-sm font-medium text-gray-800">{selectAddress.name}</p>
            <p className="text-xs text-gray-500 leading-snug">
              {selectAddress.address}, {selectAddress.city}, {selectAddress.state} — {selectAddress.postCode}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">📱 {selectAddress.number}</p>
          </ReviewCard>

          <ReviewCard title="Payment" onEdit={() => setStep(1)}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-800">
                {paymentMethod === 'online' ? 'Pay Online' : 'Cash on Delivery'}
              </span>
              {paymentMethod === 'online' && (
                <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  via {paymentPartner}
                </span>
              )}
            </div>
            {paymentMethod === 'offline' && (
              <p className="text-[11px] text-orange-600 mt-1">
                Advance:{' '}
                {formatCurrency(
                  (totalPrice.discountPrice + Number(totalPrice?.coupon_discount || 0)) * 0.2
                )}
              </p>
            )}
          </ReviewCard>

          <ReviewCard title="Price Details">
            <Row label="Subtotal" value={formatCurrency(totalPrice.totalPrice)} />
            <Row
              label="Delivery"
              value={totalPrice.shippingTotal > 0 ? formatCurrency(totalPrice.shippingTotal) : 'Free'}
              valueClass={totalPrice.shippingTotal > 0 ? '' : 'text-green-600'}
            />
            {selectedCoupon && (
              <Row
                label={`Coupon (${selectedCoupon.code})`}
                value={`-${formatCurrency(totalPrice?.coupon_discount)}`}
                valueClass="text-green-600"
              />
            )}
            <Row
              label="Discount"
              value={`-${formatCurrency(
                (totalPrice?.totalPrice || 0) - (totalPrice?.discountPrice || 0) - (totalPrice?.coupon_discount || 0)
              )}`}
              valueClass="text-green-600"
            />
            <div className="border-t mt-2 pt-2">
              <Row label="Total" value={formatCurrency(grandTotal)} bold />
            </div>
          </ReviewCard>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* ────────────── Footer nav ────────────── */}
      <div className="flex items-center gap-2 mt-5 pt-3 border-t sticky bottom-0 bg-white">
        {step > 1 && (
          <button
            onClick={goBack}
            disabled={isCheckout}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm font-medium disabled:opacity-50"
          >
            <RiArrowLeftSLine size={18} /> Back
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={goNext}
            disabled={step === 1 && !canGoStep2}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-1 text-sm font-semibold transition-colors"
          >
            Continue <RiArrowRightSLine size={18} />
          </button>
        ) : (
          <button
            onClick={placeOrder}
            disabled={isCheckout}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
          >
            {isCheckout ? (
              'Placing Order...'
            ) : (
              <>
                Pay {paymentMethod === 'offline' ? 'Advance '+ formatCurrency(grandTotal * 0.2) : formatCurrency(grandTotal)}
                <Image src="/img/shape/upi_options.svg" alt="upi" width={32} height={32} />
              </>
            )}
          </button>
        )}
      </div>

      <CheckoutLoader open={isCheckout} />

      <style jsx>{`
        :global(.checkout-input) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
        }
        :global(.checkout-input:focus) {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.15);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

/* ───────────────── helpers ───────────────── */

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
      {icon && <span className="text-blue-600">{icon}</span>}
      {children}
    </h3>
  );
}

function Row({
  label,
  value,
  valueClass = '',
  bold = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? 'font-semibold text-gray-900' : 'text-gray-600'}>{label}</span>
      <span className={`${bold ? 'font-semibold text-gray-900' : 'text-gray-700'} ${valueClass}`}>{value}</span>
    </div>
  );
}

function PayMethodCard({
  active,
  onClick,
  title,
  subtitle,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  badge?: string | null;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer border-2 rounded-lg p-3 transition-all text-center
        ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
    >
      {badge && (
        <span className="absolute -top-2 right-0 px-4 py-0.2 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
          {badge}
        </span>
      )}
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function PartnerCard({
  active,
  onClick,
  src,
  alt,
}: {
  active: boolean;
  onClick: () => void;
  src: string;
  alt: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer border-2 rounded-lg px-3 py-2 flex items-center justify-center transition-all
        ${active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
    >
      <input type="radio" checked={active} readOnly className="mr-2" />
      <img src={src} alt={alt} className="h-8" />
    </div>
  );
}

function ReviewCard({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{title}</p>
        {onEdit && (
          <button onClick={onEdit} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
            <FiEdit2 size={10} /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-600 mb-0.5 block">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

CheckoutFormComponent.displayName = 'CheckoutForm';
export const CheckoutForm = memo(CheckoutFormComponent);