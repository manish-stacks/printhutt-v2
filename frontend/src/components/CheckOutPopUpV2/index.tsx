import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BiX } from 'react-icons/bi';
import { syncCartOnLogin, useUserStore } from '@/store/useUserStore';
import { useCartStore } from '@/store/useCartStore';
import { CheckoutForm } from './CheckoutForm';
import { setPendingPurchase } from '@/lib/pixel';
import { ModalProps, TotalPrice, CouponItem } from './interfaces';
import { PhoneVerification } from './PhoneVerification';
import { axiosInstance } from '@/utils/axios';
import { toast } from 'react-toastify';
import { commonApi } from '@/_services/common/common';
import confetti from 'canvas-confetti';
import { formatCurrency } from '@/helpers/helpers';
import { checkCouponByCode } from '@/_services/admin/coupon';
import { create_a_new_order, initiate_Payment, confirm_free_order } from '@/_services/common/order';

const CheckOutPopUpV2: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [totalPrice, setTotalPrice] = useState<TotalPrice>({
        totalPrice: 0,
        discountPrice: 0,
        shippingTotal: 0
    });
    const { items, getTotalItems, getTotalPrice } = useCartStore();
    const isLoggedIn = useUserStore((state) => state.isLoggedIn);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const otpInputRef = useRef<HTMLInputElement>(null);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const [isResendEnabled, setIsResendEnabled] = useState(false);
    const emailOrMobile = phoneNumber;
    const fetchUserDetails = useUserStore((state) => state.fetchUserDetails);
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
    const [originalPrice, setOriginalPrice] = useState(0);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [coupon_mark, setCoupon_mark] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentPartner, setPaymentPartner] = useState<'phonepe' | 'razorpay'>('phonepe');

    const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setPhoneNumber(value);
        setError('');
    }, []);

    const [selectAddress, setSelectAddress] = useState({
        address: '',
        city: '',
        state: '',
        postCode: '',
        addressType: 'home',
        name: '',
        email: '',
        number: ''
    });

    useEffect(() => {
        const price = getTotalPrice();
        setOriginalPrice(price.discountPrice);
        if (!selectedCoupon) {
            setTotalPrice(price);
        }
    }, [items, getTotalPrice]);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const data = await commonApi.getCouponsCode();
                setAvailableCoupons(data?.coupons || []);

                // ✅ Bug #5: sirf admin-flagged isDefault coupon auto-apply hoga (best/last nahi).
                //    Validation + discount server se aata hai (silent — na lage to error toast nahi).
                if (data.coupons?.length > 0 && paymentMethod === 'online') {
                    const defaultCoupon = data.coupons.find((coupon: any) => coupon.isDefault === true);
                    if (defaultCoupon) {
                        applyCouponDiscount(defaultCoupon as CouponItem, true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch coupons:", error);
            }
        };
        if (selectedCoupon) return;
        if (originalPrice <= 0) return; // price ready hone tak ruko
        fetchCoupons();
    }, [originalPrice, paymentMethod]);

    const handleMarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCoupon_mark(e.target.value);
    };

    const handle_apply_code = async () => {
        if (paymentMethod === 'offline') { setError('COD Not Applied for Coupons'); return; }
        if (!coupon_mark.trim()) { setError('Please enter a coupon code'); return; }
        if (selectedCoupon?.code === coupon_mark) { setError('This coupon has already been applied'); return; }
        // ✅ Bug #4 + #7: server-side validate endpoint (admin list nahi). Display = server discount.
        await applyCouponDiscount({ code: coupon_mark.trim() } as CouponItem);
    };

    const handle_select = (coupon: CouponItem) => {
        if (selectedCoupon?.code === coupon.code) { setError('This coupon has already been applied'); return; }
        applyCouponDiscount(coupon);
    };

    // ✅ Sabhi coupon paths (manual / list / auto-default) ISI se jaate hain — discount
    //    server se aata hai, isliye checkout par jo dikhta hai WAHI charge hota hai.
    //    `silent` = auto-apply ke liye (default coupon na lage to error toast na ho).
    const applyCouponDiscount = useCallback(async (coupon: CouponItem, silent = false) => {
        try {
            const res: any = await checkCouponByCode(coupon.code, originalPrice);
            if (!res?.valid || !res?.coupon) {
                if (!silent) setError(res?.message || 'Coupon could not be applied');
                return;
            }
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
            setTotalPrice(prev => ({
                ...prev,
                discountPrice: Math.max(0, originalPrice - Number(res.discount || 0)),
                coupon_discount: Number(res.discount || 0),
            }));
            setSelectedCoupon(res.coupon as CouponItem);
            setError('');
        } catch (e: any) {
            console.error(e);
            if (!silent) setError(e?.message || 'Failed to apply coupon. Please try again.');
        }
    }, [originalPrice]);

    const setPaymentFunction = (value: string) => {
        setPaymentMethod(value as 'online' | 'offline');
        if (value === 'offline') {
            if (selectedCoupon) setError('COD Not Applied for Coupons');
            setSelectedCoupon(null);
            setTotalPrice(prev => ({ ...prev, coupon_discount: 0, discountPrice: originalPrice }));
        }
    };

    const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setOtp(e.target.value.replace(/\D/g, ''));
        setError('');
    }, []);

    const handleRemoveCoupon = useCallback(() => {
        setTotalPrice(prev => ({ ...prev, discountPrice: originalPrice, coupon_discount: 0 }));
        setSelectedCoupon(null);
        setCoupon_mark('');
        setError('');
    }, [originalPrice]);

    const handleSendOtp = useCallback(async () => {
        if (!phoneNumber || phoneNumber.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        try {
            setLoading(true);
            const data = await axiosInstance.post('/auth/login', { emailOrMobile });
            setTimer(30);
            setIsResendEnabled(false);
            if (data) { toast.success(`OTP sent to ${emailOrMobile}`); setIsOtpSent(true); }
            else setError('Failed to send OTP');
        } catch { setError('Failed to send OTP. Please try again later.'); }
        finally { setLoading(false); }
    }, [phoneNumber]);

    const handleVerifyOtp = useCallback(async () => {
        if (!otp || otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
        try {
            setLoading(true);
            const data: any = await axiosInstance.post('/auth/verify-otp', { otp, emailOrMobile });
            // ✅ FIX: Access token in-memory set karo — axios interceptor ke liye
            // Cookie httpOnly set hoti hai backend se automatically
            // But in-memory token bhi set karo taaki immediate requests auth ho sakein
            if (data?.accessToken) {
                const { setAccessToken } = await import('@/utils/axios');
                setAccessToken(data.accessToken);
            }
            toast.success(data?.message || 'OTP verified successfully');
            // ✅ fetchUserDetails + cart sync — NO reload needed
            await fetchUserDetails();
            await syncCartOnLogin();
            onClose();
            
        } catch { setError('Invalid OTP or OTP expired'); }
        finally { setLoading(false); }
    }, [otp, emailOrMobile, fetchUserDetails, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') isOtpSent ? handleVerifyOtp() : handleSendOtp();
    }, [isOtpSent, handleSendOtp, handleVerifyOtp]);

    const handleResendOtp = useCallback(async () => {
        try {
            setOtp(''); setError(''); setLoading(true);
            const data = await axiosInstance.post('/auth/login', { emailOrMobile });
            setTimer(30); setIsResendEnabled(false);
            if (data) { toast.success(`OTP sent to ${emailOrMobile}`); setIsOtpSent(true); }
            else setError('Failed to send OTP');
        } catch { setError('Failed to send OTP. Please try again later.'); }
        finally { setLoading(false); }
    }, [emailOrMobile]);

    useEffect(() => {
        if (timer === 0) { setIsResendEnabled(true); return; }
        const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const setAddressHandler = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === "postCode" || name === "number") newValue = value.replace(/\D/g, "");
        setSelectAddress(prev => ({ ...prev, [name]: newValue }));
    }, []);

    const fillAddressFromSaved = useCallback((addr: {
        fullName?: string;
        mobileNumber?: string;
        email?: string;
        addressLine?: string;
        city?: string;
        state?: string;
        postCode?: string;
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

    const placeOrder = async () => {
        const phone = selectAddress?.number || "";
        if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
            setError("Invalid phone number: Must be exactly 10 digits starting with 6-9.");
            return;
        }

        const getPrice = getTotalPrice();

        const order = {
            items: items.map(item => ({
                productId: item._id,
                name: item.title,
                slug: item.slug,
                quantity: item.quantity,
                sku: item.sku,
                product_image: item.thumbnail.url,
                custom_data: item.custom_data || null,
                price: item.price,
                discountType: item.discountType,
                discountPrice: item.discountPrice,
            })),
            getTotalItems: getTotalItems(),
            totalPrice: {
                discountPrice: Math.round(totalPrice.discountPrice),
                shippingTotal: Math.round(totalPrice.shippingTotal),
                totalPrice: Math.round(getPrice.totalPrice),
                coupon_discount: Math.round(Number(totalPrice?.coupon_discount) || 0),
            },
            coupon: {
                id: selectedCoupon?._id || null,
                code: selectedCoupon?.code || '',
                discountAmount: Math.round(Number(selectedCoupon?.discountValue) || 0),
                discountType: selectedCoupon?.discountType || "",
                isApplied: selectedCoupon?.isActive || false,
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

    useEffect(() => {
        if (!isOpen) {
            setPhoneNumber('');
            setOtp('');
            setIsOtpSent(false);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] p-2 sm:p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
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
                            handleSendOtp={handleSendOtp}
                            handleVerifyOtp={handleVerifyOtp}
                            handleResendOtp={handleResendOtp}
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
                            selectedCoupon={selectedCoupon}
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

export default React.memo(CheckOutPopUpV2);