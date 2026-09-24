'use client';

import React, { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { RiArrowLeftLine, RiArrowRightLine, RiMailLine, RiSmartphoneLine, RiShieldCheckLine, RiTruckLine, RiHeart3Line, RiLoader4Line } from 'react-icons/ri';

import { axiosInstance, setAccessToken } from '@/utils/axios';
import { syncCartOnLogin, useUserStore } from '@/store/useUserStore';

const CMYK = ['#00AEEF', '#EC008C', '#FFF200', '#1a1a1a'];
const PERKS = [
  { icon: RiTruckLine, label: 'Track every order live' },
  { icon: RiHeart3Line, label: 'Wishlist synced on all devices' },
  { icon: RiShieldCheckLine, label: 'Password-free OTP login' },
];

/* Printer registration mark — brand motif */
const RegMark = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
    <circle cx="20" cy="20" r="9" /><circle cx="20" cy="20" r="4" />
    <path d="M20 2v36M2 20h36" />
  </svg>
);

const safeRedirect = () => {
  if (typeof window === 'undefined') return null;
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') && !r.startsWith('//') ? r : null;
};

const Login = () => {
  const router = useRouter();
  const fetchUserDetails = useUserStore((s) => s.fetchUserDetails);

  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  const raw = emailOrMobile.trim();
  const value = /^[\d\s+-]+$/.test(raw) ? raw.replace(/\D/g, '').slice(-10) : raw;
  const isEmail = value.includes('@');

  const sendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!value) return setErrorMessage('Please enter your email or mobile number');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/^[0-9]{10}$/.test(value))
      return setErrorMessage('Enter a valid email or 10-digit mobile number');
    try {
      setLoading(true);
      await axiosInstance.post('/auth/login', { emailOrMobile: value });
      toast.success(`OTP sent to ${value}`);
      setStep('otp');
      setOtp(Array(6).fill(''));
      setTimer(30);
      setIsResendEnabled(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 60);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code: string) => {
    if (code.length !== 6 || loadingOtp) return;
    try {
      setLoadingOtp(true);
      const res: any = await axiosInstance.post('/auth/verify-otp', { otp: code, emailOrMobile: value });
      if (res?.accessToken) setAccessToken(res.accessToken);
      await fetchUserDetails(true);
      await syncCartOnLogin();
      toast.success(res?.message || 'Welcome back!');
      router.replace(res?.role === 'admin' ? '/admin/dashboard' : safeRedirect() || '/user/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Invalid or expired OTP');
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoadingOtp(false);
    }
  };

  const setDigits = (next: string[]) => {
    setOtp(next);
    if (next.every(Boolean)) verify(next.join('')); // auto-submit
  };

  const onOtpChange = (v: string, i: number) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    setDigits(next);
  };

  const onOtpKey = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!d.length) return;
    const next = Array(6).fill('').map((_, i) => d[i] || '');
    inputRefs.current[Math.min(d.length, 5)]?.focus();
    setDigits(next);
  };

  const resend = async () => {
    try {
      setTimer(30);
      setIsResendEnabled(false);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
      await axiosInstance.post('/auth/login', { emailOrMobile: value });
      toast.success('OTP resent');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend OTP');
      setIsResendEnabled(true);
    }
  };

  useEffect(() => {
    if (step !== 'otp') return;
    if (timer <= 0) return setIsResendEnabled(true);
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, step]);

  const back = () => { setStep('login'); setOtp(Array(6).fill('')); };

  return (
    <section className="relative min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 sm:py-16 bg-[#f6f4fb] overflow-hidden">
      {/* soft CMYK blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#00AEEF]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#EC008C]/10 blur-3xl" />

      <div className="relative w-full max-w-[960px] grid md:grid-cols-[1.05fr_1fr] rounded-[28px] overflow-hidden bg-white shadow-[0_30px_80px_-30px_rgba(36,27,79,.45)] border border-white">
        {/* ── Brand panel ── */}
        <aside className="relative hidden md:flex flex-col justify-between p-10 lg:p-12 bg-[#241B4F] text-white overflow-hidden">
          <div className="absolute inset-x-0 top-0 flex h-1.5">{CMYK.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
          <RegMark className="absolute top-8 right-8 w-9 h-9 text-white/25" />
          <RegMark className="absolute bottom-8 left-8 w-7 h-7 text-white/15" />
          <div className="absolute -right-20 top-1/3 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-1/3 mt-10 w-44 h-44 rounded-full border border-amber-400/20" />

          <div className="relative">
            <p className="text-[11px] tracking-[0.35em] uppercase text-amber-400 font-semibold mb-6">PrintHutt · Account</p>
            <h2 className="text-[40px] lg:text-[46px] leading-[1.02] font-bold tracking-tight">
              Your memories,<br />
              <span className="bg-gradient-to-r from-[#00AEEF] via-[#EC008C] to-amber-400 bg-clip-text text-transparent">printed</span> with love.
            </h2>
            <p className="mt-5 text-white/60 text-[15px] leading-relaxed max-w-[320px]">
              Sign in to reorder personalised gifts, track shipments and save designs for later.
            </p>
          </div>

          <ul className="relative space-y-3.5 mt-10">
            {PERKS.map((p) => (
              <li key={p.label} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-amber-400"><p.icon size={18} /></span>
                <span className="text-sm text-white/80">{p.label}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Form panel ── */}
        <div className="relative px-6 py-9 sm:px-10 sm:py-12 flex flex-col justify-center">
          {/* mobile brand strip */}
          <div className="md:hidden absolute inset-x-0 top-0 flex h-1">{CMYK.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>

          <div className="flex items-center gap-2 mb-8 text-[11px] font-semibold tracking-[0.2em] uppercase">
            <span className={step === 'login' ? 'text-[#241B4F]' : 'text-emerald-600'}>01 Contact</span>
            <span className={`flex-1 h-px ${step === 'otp' ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            <span className={step === 'otp' ? 'text-[#241B4F]' : 'text-gray-300'}>02 Verify</span>
          </div>

          {step === 'login' ? (
            <form onSubmit={sendOtp} noValidate>
              <h1 className="text-[28px] sm:text-[32px] font-bold text-[#1b1535] tracking-tight leading-tight">Welcome back</h1>
              <p className="text-gray-500 text-sm mt-1.5 mb-8">Login or create an account — we&apos;ll send a one-time code.</p>

              <label htmlFor="contact" className="block text-[13px] font-semibold text-gray-700 mb-2">Email or mobile number</label>
              <div className={`flex items-center gap-2 h-[54px] px-4 rounded-2xl border-2 bg-gray-50/60 transition-all focus-within:bg-white
                ${errorMessage ? 'border-rose-400' : 'border-gray-200 focus-within:border-[#241B4F] focus-within:shadow-[0_0_0_4px_rgba(36,27,79,.08)]'}`}>
                {isEmail ? <RiMailLine className="text-gray-400 shrink-0" size={20} /> : <RiSmartphoneLine className="text-gray-400 shrink-0" size={20} />}
                {!isEmail && /^\d/.test(value) && <span className="text-sm text-gray-500 font-medium">+91</span>}
                <input
                  id="contact"
                  type="text"
                  inputMode={/^\d/.test(value) ? 'numeric' : 'email'}
                  autoComplete="username"
                  autoFocus
                  value={emailOrMobile}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setEmailOrMobile(e.target.value); setErrorMessage(''); }}
                  placeholder="you@example.com or 98765 43210"
                  className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {errorMessage && <p className="text-rose-500 text-xs mt-2">{errorMessage}</p>}

              <button type="submit" disabled={loading}
                className="mt-6 w-full h-[54px] rounded-2xl bg-[#241B4F] hover:bg-[#1a1340] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[.99] disabled:opacity-60 shadow-[0_12px_30px_-12px_rgba(36,27,79,.8)]">
                {loading ? <><RiLoader4Line className="animate-spin" size={18} /> Sending code…</> : <>Continue <RiArrowRightLine size={18} /></>}
              </button>

              <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
                By continuing you agree to our{' '}
                <Link href="/terms-and-conditions" className="text-[#241B4F] font-medium hover:underline">Terms</Link> &{' '}
                <Link href="/privacy-policy" className="text-[#241B4F] font-medium hover:underline">Privacy Policy</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verify(otp.join('')); }} noValidate>
              <button type="button" onClick={back} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
                <RiArrowLeftLine /> Back
              </button>
              <h1 className="text-[28px] sm:text-[32px] font-bold text-[#1b1535] tracking-tight leading-tight">Enter code</h1>
              <p className="text-gray-500 text-sm mt-1.5 mb-6">
                Sent to <span className="font-semibold text-gray-800 break-all">{value}</span>{' '}
                <button type="button" onClick={back} className="text-[#241B4F] font-semibold hover:underline">Change</button>
              </p>

              <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-6">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={d}
                    disabled={loadingOtp}
                    onChange={(e) => onOtpChange(e.target.value.slice(-1), i)}
                    onKeyDown={(e) => onOtpKey(e, i)}
                    onPaste={onPaste}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Digit ${i + 1}`}
                    className={`w-full aspect-[4/5] max-h-[64px] rounded-2xl border-2 text-center text-2xl font-bold outline-none transition-all caret-transparent
                      ${d ? 'border-[#241B4F] bg-[#241B4F]/5 text-[#241B4F]' : 'border-gray-200 bg-gray-50/60 text-gray-900 focus:border-[#241B4F] focus:bg-white'}`}
                  />
                ))}
              </div>

              <button type="submit" disabled={loadingOtp || otp.join('').length !== 6}
                className="w-full h-[54px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#241B4F] font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[.99] disabled:opacity-50">
                {loadingOtp ? <><RiLoader4Line className="animate-spin" size={18} /> Verifying…</> : <><RiShieldCheckLine size={18} /> Verify & continue</>}
              </button>

              <div className="text-center text-sm mt-5">
                {isResendEnabled ? (
                  <button type="button" onClick={resend} className="text-[#241B4F] font-semibold hover:underline">Resend code</button>
                ) : (
                  <span className="text-gray-400">Resend in <span className="tabular-nums font-semibold text-gray-700">0:{String(timer).padStart(2, '0')}</span></span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Login;
