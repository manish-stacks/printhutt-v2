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
import { toast } from 'react-toastify';

import { axiosInstance } from '@/utils/axios';
import { syncCartOnLogin, useUserStore } from '@/store/useUserStore';

const Login = () => {
  const router = useRouter();
  const fetchUserDetails = useUserStore((state) => state.fetchUserDetails);

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
      setErrorMessage('Please enter your email or mobile number');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    const value = emailOrMobile.trim();

    if (!emailRegex.test(value) && !mobileRegex.test(value)) {
      setErrorMessage('Enter a valid email or 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post('/auth/login', { emailOrMobile: value });
      toast.success(`OTP sent to ${value}`);
      setStep('otp');
      setTimer(30);
      setIsResendEnabled(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // OTP CHANGE
  // =============================
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  // =============================
  // OTP KEYDOWN
  // =============================
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // =============================
  // PASTE OTP
  // =============================
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const otpArray = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    otpArray.forEach((digit, index) => { newOtp[index] = digit; });
    setOtp(newOtp);

    const focusIndex = otpArray.length >= 6 ? 5 : otpArray.length;
    inputRefs.current[focusIndex]?.focus();
  };

  // =============================
  // VERIFY OTP
  // =============================
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    try {
      setLoadingOtp(true);
      const response = await axiosInstance.post('/auth/verify-otp', {
        otp: otpValue,
        emailOrMobile,
      });
      toast.success(response?.message || 'Login successful');
      await fetchUserDetails();
      await syncCartOnLogin();

      if (response?.role === 'user') {
        router.push('/user/dashboard');
      } else {
        router.push('/login');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Invalid or expired OTP');
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
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
      await axiosInstance.post('/auth/login', { emailOrMobile });
      toast.success('OTP resent successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to resend OTP');
    }
  };

  // =============================
  // TIMER
  // =============================
  useEffect(() => {
    if (step !== 'otp') return;
    if (timer <= 0) { setIsResendEnabled(true); return; }

    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, step]);

  const isEmail = emailOrMobile.includes('@');

  // =============================
  // UI
  // =============================
  return (
    <section className=" bg-gray-50 flex items-center justify-center px-4 py-28">
      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex">

        {/* ── LEFT PANEL ── */}
        <div className="hidden md:flex flex-col justify-between bg-[#0f172a] p-10 w-[300px] flex-shrink-0">
          <div>
            {/* Logo / brand */}
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center mb-10">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            {/* Copy */}
            <h2 className="text-white text-2xl font-semibold leading-snug mb-3">
              {step === 'login' ? 'Welcome back' : 'Check your inbox'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {step === 'login'
                ? 'Sign in to track orders, manage your wishlist, and get personalised deals.'
                : `We've sent a 6-digit code to ${emailOrMobile}. It expires in 10 minutes.`}
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3 mt-10">
            {[
              { icon: '📦', label: 'Order tracking' },
              { icon: '❤️', label: 'Wishlist sync' },
              { icon: '🔒', label: 'Secure OTP login' },
            ].map((f) => (
              <li key={f.label} className="flex items-center gap-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-slate-400 text-sm">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {/* Step 1 */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
              ${step === 'login'
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-500 text-white'}`}>
              {step === 'otp' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : '1'}
            </div>
            <div className={`flex-1 h-px transition-all ${step === 'otp' ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
              ${step === 'otp'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
              2
            </div>
          </div>

          {/* ── LOGIN FORM ── */}
          {step === 'login' && (
            <form onSubmit={handleSubmitSendOtp} noValidate>
              <h1 className="text-gray-900 text-2xl font-semibold mb-1">Sign in</h1>
              <p className="text-gray-500 text-sm mb-7">
                We'll send a one-time password to verify you.
              </p>

              <div className="mb-5">
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email or mobile number
                </label>
                <input
                  id="contact"
                  type="text"
                  autoComplete="username"
                  value={emailOrMobile}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEmailOrMobile(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="you@example.com or 9876543210"
                  className={`w-full h-11 px-4 rounded-xl border text-sm text-gray-800 placeholder-gray-400
                    focus:outline-none focus:ring-2 transition-all
                    ${errorMessage
                      ? 'border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400'
                    }`}
                />
                {errorMessage && (
                  <p className="flex items-center gap-1.5 text-red-500 text-xs mt-2">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errorMessage}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[.99]
                  text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    Send OTP
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-400 mt-5 leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
              </p>
            </form>
          )}

          {/* ── OTP FORM ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} noValidate>
              {/* Back */}
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setOtp(new Array(6).fill(''));
                }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h1 className="text-gray-900 text-2xl font-semibold mb-1">Verify OTP</h1>
              <p className="text-gray-500 text-sm mb-6">
                Enter the 6-digit code sent to your {isEmail ? 'email' : 'mobile'}
              </p>

              {/* Destination chip */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-7">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  {isEmail ? (
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800 flex-1">{emailOrMobile}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setOtp(new Array(6).fill(''));
                  }}
                  className="text-indigo-600 text-xs hover:underline flex-shrink-0"
                >
                  Change
                </button>
              </div>

              {/* OTP inputs */}
              <div className="flex gap-2.5 justify-center mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl border-2 text-center text-xl font-semibold
                      focus:outline-none transition-all caret-transparent
                      ${digit
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    style={{ height: '52px' }}
                  />
                ))}
              </div>

              {/* Timer / Resend */}
              <div className="text-center text-sm mb-6">
                {!isResendEnabled ? (
                  <p className="text-gray-400">
                    Resend OTP in{' '}
                    <span className="font-semibold text-gray-700 tabular-nums">
                      00:{timer < 10 ? `0${timer}` : timer}
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Verify button */}
              <button
                type="submit"
                disabled={loadingOtp || otp.join('').length !== 6}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[.99]
                  text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {loadingOtp ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verify & Sign in
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Login;