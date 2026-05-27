import { memo } from 'react';
import { OtpInputProps } from './interfaces';

export const OtpInputComponent = memo(({
    otp,
    onChange,
    onKeyDown,
    onResend,
    onVerify,
    inputRef,
    loading,
    isResendEnabled,
    timer,
}: OtpInputProps) => {
    const isComplete = otp.length === 6;

    return (
        <div className="space-y-3">
            {/* OTP visual: single input + 6 box overlay */}
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    placeholder=""
                    className="w-full text-center tracking-[1em] pl-[1em] py-3 border-2 border-gray-200 rounded-xl text-xl font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    autoFocus
                    ref={inputRef}
                />
                {otp.length === 0 && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-300 text-sm font-normal tracking-normal">
                        Enter 6-digit OTP
                    </span>
                )}
            </div>

            {/* resend timer row */}
            <div className="flex items-center justify-between text-xs px-1">
                <span className="text-gray-500">Didn&apos;t receive?</span>
                {isResendEnabled ? (
                    <button
                        onClick={onResend}
                        disabled={loading}
                        className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                    >
                        {loading ? 'Resending...' : 'Resend OTP'}
                    </button>
                ) : (
                    <span className="text-gray-400 font-medium">
                        Resend in 00:{timer < 10 ? `0${timer}` : timer}
                    </span>
                )}
            </div>

            <button
                onClick={onVerify}
                disabled={loading || !isComplete}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verifying...
                    </>
                ) : (
                    'Verify & Continue'
                )}
            </button>
        </div>
    );
});

OtpInputComponent.displayName = 'OtpInputComponent';