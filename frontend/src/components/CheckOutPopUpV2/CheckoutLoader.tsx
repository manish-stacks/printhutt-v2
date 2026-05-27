"use client";
import { useEffect, useState } from "react";
import { FiCheck, FiPackage, FiCreditCard, FiCheckCircle } from "react-icons/fi";

const steps = [
    { label: "Preparing your order", icon: FiPackage },
    { label: "Initializing payment", icon: FiCreditCard },
    { label: "Finalizing order", icon: FiCheckCircle },
];

const CheckoutLoader = ({ open }: { open: boolean }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!open) return;
        setCurrentStep(0);
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);
        return () => clearInterval(interval);
    }, [open]);

    if (!open) return null;

    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-md flex items-center justify-center px-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
                {/* spinning ring */}
                <div className="flex justify-center mb-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FiPackage className="text-blue-600" size={22} />
                        </div>
                    </div>
                </div>

                <h2 className="text-base font-semibold text-gray-900 text-center mb-1">
                    Processing your order
                </h2>
                <p className="text-xs text-gray-500 text-center mb-5">
                    Please don&apos;t close this window
                </p>

                {/* progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* step list */}
                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const done = index < currentStep;
                        const active = index === currentStep;
                        return (
                            <div key={index} className="flex items-center gap-3">
                                <div
                                    className={`w-7 h-7 flex items-center justify-center rounded-full transition-all
                                        ${done
                                            ? "bg-green-500 text-white"
                                            : active
                                                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                                : "bg-gray-100 text-gray-400"}`}
                                >
                                    {done ? <FiCheck size={14} /> : <Icon size={13} />}
                                </div>
                                <span
                                    className={`text-sm transition-colors ${active
                                        ? "text-gray-900 font-semibold"
                                        : done
                                            ? "text-gray-600"
                                            : "text-gray-400"
                                        }`}
                                >
                                    {step.label}
                                </span>
                                {active && (
                                    <span className="ml-auto flex gap-0.5">
                                        <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-5">
                    This may take a few seconds...
                </p>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default CheckoutLoader;