import { memo } from 'react';
import { PhoneInputProps } from './interfaces';

export const PhoneInputComponent = memo(({
    phoneNumber,
    onChange,
    onKeyDown,
    onSendOtp,
    inputRef,
    loading,
}: PhoneInputProps) => {
    const isValid = phoneNumber.length === 10;

    return (
        <div className="space-y-3">
            {/* phone input with country code */}
            <div className="relative flex items-stretch border-2 border-gray-200 rounded-xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all overflow-hidden bg-white">
                <div className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-sm font-semibold text-gray-700">
                    🇮🇳 <span className="ml-1.5">+91</span>
                </div>
                <input
                    type="tel"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    placeholder="Enter 10-digit number"
                    className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
                    maxLength={10}
                    inputMode="numeric"
                    autoFocus
                    ref={inputRef}
                />
            </div>

            <button
                onClick={onSendOtp}
                disabled={loading || !isValid}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Sending OTP...
                    </>
                ) : (
                    'Send OTP'
                )}
            </button>
        </div>
    );
});

PhoneInputComponent.displayName = 'PhoneInputComponent';