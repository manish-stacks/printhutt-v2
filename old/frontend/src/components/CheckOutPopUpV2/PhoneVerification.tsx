import { memo } from 'react';
import { FiSmartphone, FiShield } from 'react-icons/fi';
import { PhoneInputComponent } from './PhoneInputComponent';
import { OtpInputComponent } from './OtpInputComponent';
import { PhoneVerificationProps } from './interfaces';

export const PhoneVerification = memo(({
    isOtpSent,
    phoneNumber,
    otp,
    error,
    handlePhoneChange,
    handleOtpChange,
    handleKeyDown,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    phoneInputRef,
    otpInputRef,
    loading,
    isResendEnabled,
    timer,
}: PhoneVerificationProps) => (
    <div className="space-y-5">
        {/* hero icon */}
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-3">
                {isOtpSent ? (
                    <FiShield className="text-white" size={28} />
                ) : (
                    <FiSmartphone className="text-white" size={28} />
                )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
                {!isOtpSent ? 'Verify your phone' : 'Enter verification code'}
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
                {!isOtpSent
                    ? 'We will send a 6-digit OTP to confirm your number'
                    : (
                        <>
                            Code sent to <span className="font-medium text-gray-700">+91 {phoneNumber}</span>
                        </>
                    )}
            </p>
        </div>

        {/* input */}
        {!isOtpSent ? (
            <PhoneInputComponent
                phoneNumber={phoneNumber}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                onSendOtp={handleSendOtp}
                inputRef={phoneInputRef}
                loading={loading}
                isResendEnabled={isResendEnabled}
                timer={timer}
            />
        ) : (
            <OtpInputComponent
                otp={otp}
                onChange={handleOtpChange}
                onKeyDown={handleKeyDown}
                onResend={handleResendOtp}
                onVerify={handleVerifyOtp}
                inputRef={otpInputRef}
                loading={loading}
                isResendEnabled={isResendEnabled}
                timer={timer}
            />
        )}

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-md text-center">
                {error}
            </div>
        )}

        {/* trust footer */}
        <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
            <FiShield size={11} /> Secure & encrypted login
        </p>
    </div>
));

PhoneVerification.displayName = 'PhoneVerification';