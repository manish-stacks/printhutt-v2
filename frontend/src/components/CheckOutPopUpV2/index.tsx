import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BiX } from 'react-icons/bi';
import { useUserStore } from '@/store/useUserStore';
import { useCartStore } from '@/store/useCartStore';
import { CheckoutForm } from './CheckoutForm';
import { ModalProps, TotalPrice, CouponItem } from './interfaces';
import { PhoneVerification } from './PhoneVerification';
import { axiosInstance } from '@/utils/axios';
import { toast } from 'react-toastify';
import { commonApi } from '@/_services/common/common';
import confetti from 'canvas-confetti';
import { formatCurrency } from '@/helpers/helpers';
import { getAllCouponsPagination } from '@/_services/admin/coupon';
import { create_a_new_order, initiate_Payment } from '@/_services/common/order';

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

                if (data.coupons?.length > 0 && paymentMethod === 'online') {
                    const validCoupons = data.coupons.filter(coupon =>
                        totalPrice.totalPrice >= coupon.minimumPurchaseAmount
                    );

                    if (validCoupons.length > 0) {
                        const bestCoupon = validCoupons.reduce((best, current) => {
                            const currentDiscount = current.discountType === "percentage"
                                ? Math.min((current.discountValue / 100) * totalPrice.totalPrice, current.maxDiscountAmount)
                                : current.discountValue;
                            const bestDiscount = best.discountType === "percentage"
                                ? Math.min((best.discountValue / 100) * totalPrice.totalPrice, best.maxDiscountAmount)
                                : best.discountValue;
                            return currentDiscount > bestDiscount ? current : best;
                        });
                        applyCouponDiscount(bestCoupon);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch coupons:", error);
            }
        };
        if (selectedCoupon) return;
        fetchCoupons();
    }, [totalPrice.totalPrice, paymentMethod]);

    const handleMarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCoupon_mark(e.target.value);
    };

    const handle_apply_code = async () => {
        if (paymentMethod === 'offline') { setError('COD Not Applied for Coupons'); return; }
        if (!coupon_mark.trim()) { setError('Please enter a coupon code'); return; }
        if (selectedCoupon?.code === coupon_mark) { setError('This coupon has already been applied'); return; }
        try {
            const data = await getAllCouponsPagination(1, "");
            const coupon = data.coupons.find((c) => c.code === coupon_mark);
            if (!coupon || coupon.isActive === false) { setError('Invalid coupon code. Please try again.'); return; }
            handle_select(coupon);
            toast.success('Coupon applied successfully');
        } catch (error) {
            console.error(error);
            setError('Failed to apply coupon. Please try again.');
        }
    };

    const handle_select = (coupon: CouponItem) => {
        if (selectedCoupon?.code === coupon.code) { setError('This coupon has already been applied'); return; }
        if (originalPrice < coupon.minimumPurchaseAmount) {
            setError(`Minimum purchase amount of ${formatCurrency(coupon.minimumPurchaseAmount)} required`);
            return;
        }
        applyCouponDiscount(coupon);
    };

    const applyCouponDiscount = (coupon: CouponItem) => {
        let discount = 0;
        if (originalPrice >= coupon.minimumPurchaseAmount) {
            if (coupon.discountType === "percentage") {
                discount = (coupon.discountValue as number / 100) * originalPrice;
                if (discount > coupon.maxDiscountAmount) discount = coupon.maxDiscountAmount;
            } else if (coupon.discountType === "fixed") {
                discount = coupon.discountValue as number;
            }
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
            setTotalPrice(prev => ({ ...prev, discountPrice: originalPrice - discount, coupon_discount: discount }));
            setSelectedCoupon(coupon);
        } else {
            setError(`Minimum purchase amount of ${formatCurrency(coupon.minimumPurchaseAmount)} required`);
        }
    };

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
            const data = await axiosInstance.post('/auth/verify-otp', { otp, emailOrMobile });
            toast.success(data.message || 'OTP verified successfully');
            fetchUserDetails();
        } catch { setError('Invalid OTP or OTP expired'); }
        finally { setLoading(false); }
    }, [otp]);

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
                discountPrice: Math.floor(totalPrice.discountPrice),
                shippingTotal: Math.floor(totalPrice.shippingTotal),
                totalPrice: Math.floor(getPrice.totalPrice),
                coupon_discount: Math.floor(Number(totalPrice?.coupon_discount) || 0),
            },
            coupon: {
                id: selectedCoupon?._id || null,
                code: selectedCoupon?.code || '',
                discountAmount: Math.floor(Number(selectedCoupon?.discountValue) || 0),
                discountType: selectedCoupon?.discountType || "",
                isApplied: selectedCoupon?.isActive || false,
            },
            paymentMethod,
            address: selectAddress,
            payAmt: Math.floor(totalPrice.discountPrice).toFixed(2),
            paymentPartner,
        };

        try {
            setIsSubmitting(true);
            const response: any = await create_a_new_order(order);
            if (response.success) {
                await paymentintInitiation(response.order);
            } else {
                setError(response.message || 'Something went wrong');
            }
        } catch (error: any) {
            if (error.message === "Unauthorized") {
                window.localStorage.removeItem('user-store');
                window.location.reload();
            }
            setError(error.message || 'Something Went Wrong');
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