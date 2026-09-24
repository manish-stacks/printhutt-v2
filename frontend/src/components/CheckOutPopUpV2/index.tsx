import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BiX } from 'react-icons/bi';
import { syncCartOnLogin, useUserStore } from '@/store/useUserStore';
import { useCartStore } from '@/store/useCartStore';
import { CheckoutForm } from './CheckoutForm';
import { setPendingPurchase, trackCheckoutStart } from '@/lib/pixel';
import { unitPrice } from '@/lib/pricing';
import { ModalProps, TotalPrice, CouponItem } from './interfaces';
import { PhoneVerification } from './PhoneVerification';
import { axiosInstance, setAccessToken } from '@/utils/axios';
import { toast } from 'react-toastify';
import { commonApi } from '@/_services/common/common';
import confetti from 'canvas-confetti';
import { checkCouponByCode } from '@/_services/admin/coupon';
import { create_a_new_order, initiate_Payment, confirm_free_order } from '@/_services/common/order';

const OTP_WAIT = 30;

const CheckOutPopUpV2: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    /* ── store (live) ── */
    const items = useCartStore((s) => s.items);
    const isLoggedIn = useUserStore((s) => s.isLoggedIn);
    const fetchUserDetails = useUserStore((s) => s.fetchUserDetails);

    /* ── OTP state ── */
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [timer, setTimer] = useState(OTP_WAIT);
    const [loading, setLoading] = useState(false);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const otpInputRef = useRef<HTMLInputElement>(null);
    const isResendEnabled = timer <= 0;
    const emailOrMobile = phoneNumber;

    /* ── checkout state ── */
    const [error, setError] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [coupon_mark, setCoupon_mark] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
    // COD pe coupon suspend (state rehta hai), Online pe wapas active — koi re-fetch nahi
    const activeCoupon = paymentMethod === 'online' ? selectedCoupon : null;
    const activeDiscount = paymentMethod === 'online' ? couponDiscount : 0;
    const userRemovedRef = useRef(false); // user ne khud coupon Remove kiya
    const [paymentPartner, setPaymentPartner] = useState<'phonepe' | 'razorpay'>('phonepe');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectAddress, setSelectAddress] = useState({
        address: '', city: '', state: '', postCode: '', addressType: 'home', name: '', email: '', number: '',
    });

    /* ✅ Totals items se DERIVE — add/remove pe turant update (no effect lag) */
    const base = useMemo(() => {
        const totalPrice = items.reduce((t, i) => t + i.price * i.quantity, 0);
        const discountPrice = items.reduce((t, i) => t + unitPrice(i.price, i.discountType, i.discountPrice) * i.quantity, 0);
        const shippingTotal = 0; // server policy: free shipping
        return { totalPrice, discountPrice, shippingTotal };
    }, [items]);
    const originalPrice = base.discountPrice;

    const totalPrice: TotalPrice = useMemo(() => ({
        ...base,
        discountPrice: Math.max(0, base.discountPrice - activeDiscount),
        coupon_discount: activeDiscount,
    }), [base, activeDiscount]);

    /* ── coupon (server validated) ── */
    const applyCouponDiscount = useCallback(async (coupon: CouponItem, silent = false) => {
        try {
            const res: any = await checkCouponByCode(coupon.code, cartSubtotal());
            if (!res?.valid || !res?.coupon) {
                if (!silent) setError(res?.message || 'Invalid coupon code');
                return false;
            }
            if (!silent) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
            setCouponDiscount(Number(res.discount || 0));
            setSelectedCoupon(res.coupon as CouponItem);
            setError('');
            return true;
        } catch (e: any) {
            // server ne throw kiya (bad/expired code) — raw axios error ke bajaye clean message
            if (!silent) setError(e?.response?.data?.message || 'Invalid coupon code');
            return false;
        }
    }, []);

    const handleRemoveCoupon = useCallback(() => {
        userRemovedRef.current = true;
        setCouponDiscount(0);
        setSelectedCoupon(null);
        setCoupon_mark('');
        setError('');
    }, []);

    // DEFAULT COUPON (FLAT100) — jab bhi Online selected ho aur koi coupon na ho → auto-apply.
    // COD → Online switch pe bhi chalega. User ne khud Remove kiya ho to tab tak nahi jab tak woh
    // dobara Online select na kare. Har eligible baar fresh fetch — koi ref-cache nahi, taaki
    // cache stale rehne se auto-apply miss na ho.
    useEffect(() => {
        if (!isOpen || !isLoggedIn || originalPrice <= 0) return;
        if (paymentMethod !== 'online' || selectedCoupon || userRemovedRef.current) return;
        let cancelled = false;
        (async () => {
            try {
                const data: any = await commonApi.getCouponsCode();
                const def = data?.coupons?.find((c: any) => c.isDefault === true) || null;
                if (def && !cancelled) await applyCouponDiscount(def, true);
            } catch (e) {
                console.error('Failed to fetch coupons:', e);
            }
        })();
        return () => { cancelled = true; };
    }, [isOpen, isLoggedIn, originalPrice, paymentMethod, selectedCoupon, applyCouponDiscount]);

    // cart change → applied coupon re-validate (debounced), warna remove
    const lastValidated = useRef(0);
    useEffect(() => {
        if (!selectedCoupon) { lastValidated.current = originalPrice; return; }
        if (lastValidated.current === originalPrice) return;
        const t = setTimeout(async () => {
            lastValidated.current = originalPrice;
            const ok = await applyCouponDiscount(selectedCoupon, true);
            if (!ok) { handleRemoveCoupon(); toast.info('Coupon removed — cart changed'); }
        }, 400);
        return () => clearTimeout(t);
    }, [originalPrice, selectedCoupon, applyCouponDiscount, handleRemoveCoupon]);

    const handleMarkChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCoupon_mark(e.target.value);
    }, []);

    const handle_apply_code = async () => {
        if (paymentMethod === 'offline') { setError('COD Not Applied for Coupons'); return; }
        if (!coupon_mark.trim()) { setError('Please enter a coupon code'); return; }
        if (selectedCoupon?.code === coupon_mark.trim()) { setError('This coupon has already been applied'); return; }
        await applyCouponDiscount({ code: coupon_mark.trim() } as CouponItem);
    };

    const setPaymentFunction = useCallback((value: string) => {
        const next = value as 'online' | 'offline';
        setPaymentMethod(next);
        if (next === 'online') {
            userRemovedRef.current = false; // Online chuna → default coupon auto-apply allowed
            setError('');
        } else {
            // COD — coupons applicable nahi. Clear karo, warna selectedCoupon truthy rehne se
            // default-coupon auto-apply effect Online pe wapas aane par bhi skip ho jaata tha.
            if (selectedCoupon) setError('COD Not Applied for Coupons');
            setSelectedCoupon(null);
            setCouponDiscount(0);
            setCoupon_mark('');
        }
    }, [selectedCoupon]);

    /* ── OTP ── */
    const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
        setError('');
    }, []);

    const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
        setError('');
    }, []);

    const sendOtp = useCallback(async () => {
        if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        try {
            setLoading(true);
            setOtp('');
            setError('');
            const data = await axiosInstance.post('/auth/login', { emailOrMobile: phoneNumber });
            if (!data) { setError('Failed to send OTP'); return; }
            toast.success(`OTP sent to ${phoneNumber}`);
            setIsOtpSent(true);
            setTimer(OTP_WAIT);
            setTimeout(() => otpInputRef.current?.focus(), 50);
        } catch {
            setError('Failed to send OTP. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [phoneNumber]);

    const verifyingRef = useRef(false);
    const handleVerifyOtp = useCallback(async () => {
        if (otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
        if (verifyingRef.current) return; // double submit (Enter + click) guard
        verifyingRef.current = true;
        try {
            setLoading(true);
            const data: any = await axiosInstance.post('/auth/verify-otp', { otp, emailOrMobile });
            if (data?.accessToken) setAccessToken(data.accessToken);
            toast.success(data?.message || 'OTP verified successfully');
            // ✅ modal band NAHI hota — isLoggedIn true hote hi yahi pe address step aa jaata hai
            await fetchUserDetails(true);
            syncCartOnLogin(); // background — UI block nahi
            setIsOtpSent(false);
            setOtp('');
        } catch {
            setError('Invalid OTP or OTP expired');
        } finally {
            setLoading(false);
            verifyingRef.current = false;
        }
    }, [otp, emailOrMobile, fetchUserDetails]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (isOtpSent) handleVerifyOtp(); else sendOtp();
    }, [isOtpSent, handleVerifyOtp, sendOtp]);

    // OTP 6 digit hote hi auto-verify
    useEffect(() => {
        if (isOpen && isOtpSent && otp.length === 6) handleVerifyOtp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    // ✅ Timer sirf tab chale jab OTP bheja gaya ho (pehle har second pura modal re-render hota tha)
    useEffect(() => {
        if (!isOpen || !isOtpSent || timer <= 0) return;
        const t = setTimeout(() => setTimer((p) => p - 1), 1000);
        return () => clearTimeout(t);
    }, [isOpen, isOtpSent, timer]);

    /* ── address ── */
    const setAddressHandler = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const v = name === 'postCode' || name === 'number' ? value.replace(/\D/g, '') : value;
        setSelectAddress((prev) => ({ ...prev, [name]: v }));
    }, []);

    const fillAddressFromSaved = useCallback((addr: {
        fullName?: string; mobileNumber?: string; email?: string; addressLine?: string;
        city?: string; state?: string; postCode?: string;
    }) => {
        setSelectAddress({
            name: addr.fullName || '',
            number: (addr.mobileNumber || '').replace(/\D/g, ''),
            email: addr.email || '',
            address: addr.addressLine || '',
            city: addr.city || '',
            state: addr.state || '',
            postCode: (addr.postCode || '').replace(/\D/g, ''),
            addressType: 'home',
        });
    }, []);

    const checkoutTracked = useRef(false);
    useEffect(() => {
        if (!isOpen) { checkoutTracked.current = false; return; }
        if (checkoutTracked.current || items.length === 0) return;
        checkoutTracked.current = true;
        trackCheckoutStart(base.discountPrice + base.shippingTotal, items.length);
    }, [isOpen, items.length, base]);

    /* ── reset on close ── */
    useEffect(() => {
        if (isOpen) return;
        setPhoneNumber(''); setOtp(''); setIsOtpSent(false); setTimer(OTP_WAIT); setError('');
        userRemovedRef.current = false;
    }, [isOpen]);

    const placeOrder = async () => {
        const phone = selectAddress?.number || "";
        if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
            setError("Invalid phone number: Must be exactly 10 digits starting with 6-9.");
            return;
        }

        // base64 images abhi S3 pe upload nahi huin to flush karo (order URL-safe)
        try {
            await useCartStore.getState().flushPendingUploads();
        } catch (e) {
            console.error('flushPendingUploads failed', e);
        }
        const items = useCartStore.getState().items;

        const getPrice = useCartStore.getState().getTotalPrice();

        const order = {
            items: items.map(item => ({
                productId: item._id,
                name: item.title,
                slug: item.slug,
                quantity: item.quantity,
                sku: item.sku,
                product_image: item.thumbnail?.url,
                custom_data: (item as any).custom_data || null,
                price: item.price,
                discountType: item.discountType,
                discountPrice: item.discountPrice,
            })),
            getTotalItems: useCartStore.getState().getTotalItems(),
            totalPrice: {
                discountPrice: Math.round(totalPrice.discountPrice),
                shippingTotal: Math.round(totalPrice.shippingTotal),
                totalPrice: Math.round(getPrice.totalPrice),
                coupon_discount: Math.round(Number(totalPrice?.coupon_discount) || 0),
            },
            coupon: {
                id: activeCoupon?._id || null,
                code: activeCoupon?.code || '',
                discountAmount: Math.round(Number(activeCoupon?.discountValue) || 0),
                discountType: activeCoupon?.discountType || "",
                isApplied: activeCoupon?.isActive || false,
            },
            paymentMethod,
            address: selectAddress,
            // ⚠️ payAmt display ke "Total Payable" se EXACT match hona chahiye.
            //  - formatCurrency Math.round use karta hai → yahan bhi round (pehle floor tha
            //    isliye ₹699 dikhta tha par ₹698 charge hota tha).
            //  - Online: Total Payable = discountPrice + shippingTotal, isliye shipping bhi add.
            //    (pehle sirf discountPrice tha → shipping charge hone par undercharge hota.)
            //  - COD: base wahi (discountPrice); backend iska 20% advance leta hai.
            payAmt: (
                paymentMethod === 'online'
                    ? Math.round(totalPrice.discountPrice + (Number(totalPrice.shippingTotal) || 0))
                    : Math.round(totalPrice.discountPrice)
            ).toFixed(2),
            paymentPartner,
        };

        /* ─── 🔒 Pre-flight payload size check ─── */
        const MAX_PAYLOAD_MB = 12; // safe under 15MB backend limit
        let payloadSize = 0;
        try {
            payloadSize = new Blob([JSON.stringify(order)]).size;
        } catch {
            payloadSize = 0;
        }
        const sizeMB = payloadSize / (1024 * 1024);

        if (payloadSize > MAX_PAYLOAD_MB * 1024 * 1024) {
            // Find heaviest items to mention by name
            const heavyItems = order.items
                .map((it) => ({
                    name: it.name,
                    size: new Blob([JSON.stringify(it)]).size,
                }))
                .sort((a, b) => b.size - a.size)
                .filter((it) => it.size > 500 * 1024) // > 500KB
                .slice(0, 3);

            const heavyNames = heavyItems
                .map((h) => h.name.replace(/<[^>]+>/g, '').slice(0, 40))
                .join(', ');

            const msg = `Your cart has very large images (${sizeMB.toFixed(1)}MB total). Please upload smaller photos${heavyNames ? ` for: ${heavyNames}` : ''}.`;

            setError(msg);
            toast.error(msg, { autoClose: 8000 });
            console.warn('[checkout] Payload too large', { sizeMB, heavyItems });
            return;
        }

        try {
            setIsSubmitting(true);
            const response: any = await create_a_new_order(order);
            if (response.success) {
                // 📊 Meta Pixel: order value stash karo (confirmation page pe Purchase fire hoga)
                setPendingPurchase(response.order);

                // ✅ Bug #6: 100% coupon → payable 0. Gateway (Razorpay/PhonePe ₹0 reject) skip karke
                //    free order confirm karo, fir confirmation page.
                const payableNow = Number(response.order?.payAmt ?? 0);
                if (paymentMethod === 'online' && payableNow <= 0.5) {
                    try {
                        await confirm_free_order(response.order._id);
                        window.location.href = '/orders/confirmation?success=true';
                        return;
                    } catch (freeErr: any) {
                        setError(freeErr?.message || 'Could not confirm free order. Please try again.');
                        return;
                    }
                }

                await paymentintInitiation(response.order);
            } else {
                setError(response.message || 'Something went wrong');
            }
        } catch (error: any) {
            /* ─── 🔥 Handle 413 with friendly message ─── */
            const status = error?.response?.status;
            const errMsg = error?.message || error?.response?.data?.message || '';

            if (status === 413 || /payload too large|request entity too large|too large/i.test(errMsg)) {
                const msg = "Order failed: Your photos are too large. Please re-upload smaller images and try again.";
                setError(msg);
                toast.error(msg, { autoClose: 8000 });
                return;
            }

            // ⚠️ Bug #2/#3: pehle yahan localStorage clear + window.location.reload() tha,
            //    jisse OTP/order ke beech page reload aur logout ho jata tha. Ab sirf
            //    saaf error dikhate hain — session ko forcefully nuke nahi karte.
            if (/unauthor/i.test(errMsg)) {
                setError('Session expired. Please verify your number again and retry.');
                return;
            }
            setError(errMsg || 'Something Went Wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const paymentintInitiation = async (order: any) => {
        try {
            if (paymentPartner === 'phonepe') {
                const res = await initiate_Payment(order);
                const redirectUrl = res?.instrumentResponse?.redirectInfo?.url;
                if (redirectUrl) window.location.href = redirectUrl;
                else toast.error("PhonePe initiation failed");
            } else if (paymentPartner === 'razorpay') {
                const data = await axiosInstance.post("/payment/razorpay/create-order", {
                    _id: order._id,
                    orderId: order.orderId,
                    amount: order.payAmt,
                });
                openRazorpayCheckout(data);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Payment failed");
        }
    };

    const loadRazorpay = () => new Promise(resolve => {
        if ((window as any).Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    const openRazorpayCheckout = async (data: any) => {
        const res = await loadRazorpay();
        if (!res) { toast.error("Razorpay SDK failed to load"); return; }
        const options = {
            key: data.key,
            amount: data.amount,
            currency: "INR",
            name: "Print Hutt",
            description: "Order Payment",
            order_id: data.razorpayOrderId,
            prefill: { name: data.customerName, email: data.customerEmail, contact: data.customerPhone },
            handler: async function (response: any) {
                await axiosInstance.post("/payment/razorpay/verify", response);
                window.location.href = '/orders/confirmation?success=true';
            },
            theme: { color: "#2563eb" },
        };
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
    };

    if (!isOpen) return null;

    return (
        <div
            data-checkout-modal
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] p-2 sm:p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[95vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* close btn */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                    <BiX className="w-6 h-6 text-gray-600" />
                </button>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                    {!isLoggedIn ? (
                        <PhoneVerification
                            isOtpSent={isOtpSent}
                            phoneNumber={phoneNumber}
                            otp={otp}
                            error={error}
                            handlePhoneChange={handlePhoneChange}
                            handleOtpChange={handleOtpChange}
                            handleKeyDown={handleKeyDown}
                            handleSendOtp={sendOtp}
                            handleVerifyOtp={handleVerifyOtp}
                            handleResendOtp={sendOtp}
                            phoneInputRef={phoneInputRef}
                            otpInputRef={otpInputRef}
                            loading={loading}
                            isResendEnabled={isResendEnabled}
                            timer={timer}
                        />
                    ) : (
                        <CheckoutForm
                            error={error}
                            showSummary={showSummary}
                            setShowSummary={setShowSummary}
                            items={items.length}
                            totalPrice={totalPrice}
                            selectedCoupon={activeCoupon}
                            coupon_mark={coupon_mark}
                            handle_apply_code={handle_apply_code}
                            handleMarkChange={handleMarkChange}
                            handleRemoveCoupon={handleRemoveCoupon}
                            paymentMethod={paymentMethod}
                            setPaymentFunction={setPaymentFunction}
                            placeOrder={placeOrder}
                            isCheckout={isSubmitting}
                            selectAddress={selectAddress}
                            setAddressHandler={setAddressHandler}
                            fillAddressFromSaved={fillAddressFromSaved}
                            paymentPartner={paymentPartner}
                            setPaymentPartner={setPaymentPartner}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


/* coupon validate ke liye hamesha latest cart value (stale closure se bachne ko) */
function cartSubtotal(): number {
    return useCartStore.getState().getTotalPrice().discountPrice;
}

export default React.memo(CheckOutPopUpV2);