'use client';

import React, {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';

import Breadcrumb from '@/components/Breadcrumb';
import { axiosInstance } from '@/utils/axios';
import { syncCartOnLogin, useUserStore } from '@/store/useUserStore';

const Login = () => {
  const router = useRouter();
  const fetchUserDetails = useUserStore(
    (state) => state.fetchUserDetails
  );

  const [step, setStep] = useState<'login' | 'otp'>('login');

  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  // =============================
  // SEND OTP
  // =============================
  const handleSubmitSendOtp = async (e: FormEvent) => {
    e.preventDefault();

    if (!emailOrMobile.trim()) {
      setErrorMessage('Please enter Email or Mobile Number');
      toast.error('Please enter Email or Mobile Number');
      return;
    }

    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Mobile regex (exactly 10 digits)
    const mobileRegex = /^[0-9]{10}$/;

    const value = emailOrMobile.trim();

    // Validate email or mobile
    const isValid =
      emailRegex.test(value) || mobileRegex.test(value);

    if (!isValid) {
      toast.error(
        'Please enter a valid Email or 10-digit Mobile Number'
      );
      return;
    }

    try {
      setLoading(true);

      await axiosInstance.post('/auth/login', {
        emailOrMobile: value,
      });

      toast.success(`OTP sent to ${value}`);

      setStep('otp');
      setTimer(30);
      setIsResendEnabled(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to send OTP'
      );
    } finally {
      setLoading(false);
    }
  };
  // =============================
  // OTP CHANGE
  // =============================
  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    // Move next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // =============================
  // OTP KEYDOWN
  // =============================
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // =============================
  // PASTE OTP
  // =============================
  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData('text')
      .trim();

    if (!/^\d+$/.test(pastedData)) return;

    const otpArray = pastedData
      .slice(0, 6)
      .split('');

    const newOtp = [...otp];

    otpArray.forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    const focusIndex =
      otpArray.length >= 6 ? 5 : otpArray.length;

    inputRefs.current[focusIndex]?.focus();
  };

  // =============================
  // VERIFY OTP
  // =============================
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();

    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      toast.error('Please enter 6 digit OTP');
      return;
    }

    try {
      setLoadingOtp(true);

      const { data } = await axiosInstance.post(
        '/auth/verify-otp',
        {
          otp: otpValue,
          emailOrMobile,
        }
      );
      console.log('✅ verify-otp response:', data);
      toast.success(data?.message || 'Login Successful');
      await fetchUserDetails();
      console.log('✅ isLoggedIn after fetch:', useUserStore.getState().isLoggedIn);
      await syncCartOnLogin();

      if (data?.role === 'user') {
        router.push('/user/dashboard');
        return;
      } else {
        router.push('/login');
      }
    } catch (error: any) {
      console.error('❌ verify-otp error:', error);
      toast.error(error?.message || 'Invalid or Expired OTP');
    } finally {
      setLoadingOtp(false);
    }
  };

  // =============================
  // RESEND OTP
  // =============================
  const resendOtp = async () => {
    try {
      setTimer(30);
      setIsResendEnabled(false);

      await axiosInstance.post('/auth/login', {
        emailOrMobile,
      });

      toast.success('OTP resent successfully');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        'Failed to resend OTP'
      );
    }
  };

  // =============================
  // TIMER
  // =============================
  useEffect(() => {
    if (step !== 'otp') return;

    if (timer <= 0) {
      setIsResendEnabled(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, step]);

  // =============================
  // UI
  // =============================
  return (
    <>
      {/* <Breadcrumb title="Login" /> */}

      <section className="bg-gradient-to-br from-blue-50 via-white to-rose-50 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 grid md:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white relative">

            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            <div className="relative z-10 text-center">
              <h1 className="text-4xl font-bold mb-4">
                Welcome Back 👋
              </h1>

              <p className="text-blue-100 text-lg leading-7 mb-8">
                Login to access your orders,
                wishlist and personalized recommendations.
              </p>

              <div className="bg-white rounded-full p-5 inline-flex shadow-xl">
                <Image
                  src={
                    step === 'login'
                      ? 'https://cdn-icons-png.flaticon.com/512/295/295128.png'
                      : 'https://cdn-icons-png.flaticon.com/512/3064/3064155.png'
                  }
                  alt="login"
                  width={180}
                  height={180}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="p-6 md:p-10 flex items-center">
            <div className="w-full">

              {/* HEADER */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">
                  {step === 'login'
                    ? 'Login Account'
                    : 'Verify OTP'}
                </h2>

                <p className="text-gray-500 mt-2">
                  {step === 'login'
                    ? 'Enter your email or mobile number'
                    : 'Enter the 6-digit verification code'}
                </p>
              </div>

              {/* LOGIN FORM */}
              {step === 'login' ? (
                <form
                  onSubmit={handleSubmitSendOtp}
                  className="space-y-6"
                >
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Email / Mobile Number
                    </label>

                    <input
                      type="text"
                      value={emailOrMobile}
                      onChange={(
                        e: ChangeEvent<HTMLInputElement>
                      ) => {
                        setEmailOrMobile(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Enter email or mobile"
                      className={`w-full h-14 px-4 rounded-xl border text-gray-700 focus:outline-none focus:ring-2 transition-all ${errorMessage
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                        }`}
                    />

                    {errorMessage && (
                      <p className="text-red-500 text-sm mt-2">
                        {errorMessage}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold text-lg hover:scale-[1.01] transition-all disabled:opacity-60"
                  >
                    {loading
                      ? 'Sending OTP...'
                      : 'Request OTP'}
                  </button>

                  <p className="text-sm text-center text-gray-500 leading-6">
                    By continuing, you agree to our{' '}
                    <span className="text-blue-600 cursor-pointer">
                      Terms
                    </span>{' '}
                    &{' '}
                    <span className="text-blue-600 cursor-pointer">
                      Privacy Policy
                    </span>
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={handleVerifyOtp}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <p className="text-gray-600">
                      OTP sent to
                    </p>

                    <div className="font-bold text-lg text-gray-800 mt-1">
                      {emailOrMobile}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('login');
                        setOtp(new Array(6).fill(''));
                      }}
                      className="text-blue-600 text-sm mt-2 hover:underline"
                    >
                      Change {emailOrMobile.includes('@') ? 'Email' : 'Number'}
                    </button>
                  </div>

                  {/* OTP INPUTS */}
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleOtpChange(
                            e.target.value,
                            index
                          )
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, index)
                        }
                        onPaste={handlePaste}
                        className="w-12 h-14 rounded-xl border-2 border-gray-300 text-center text-2xl font-bold focus:border-blue-500 focus:outline-none"
                      />
                    ))}
                  </div>

                  {/* TIMER */}
                  <div className="text-center">
                    {!isResendEnabled ? (
                      <p className="text-gray-500">
                        Resend OTP in{' '}
                        <span className="font-semibold text-black">
                          00:
                          {timer < 10
                            ? `0${timer}`
                            : timer}
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={resendOtp}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  {/* VERIFY BUTTON */}
                  <button
                    type="submit"
                    disabled={loadingOtp}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg hover:scale-[1.01] transition-all disabled:opacity-60"
                  >
                    {loadingOtp
                      ? 'Verifying...'
                      : 'Verify & Login'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Login;