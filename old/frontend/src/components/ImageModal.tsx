import React, { useState, useEffect } from 'react';
import { BiX } from 'react-icons/bi';
import { toast } from 'react-toastify';


const ImageModal = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Show modal when component mounts (home page loads)
        const timer = setTimeout(() => {
            setIsModalOpen(true);
        }, 1000); // Delay of 1 second for better UX

        return () => clearTimeout(timer);
    }, []);

    const closeModal = () => {
        setIsModalOpen(false);
    };


    const handleCopyCode = () => {
        navigator.clipboard.writeText("DIWALI100");
        toast.success("Promo code copied to clipboard!");
    }
    // Close modal when clicking outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    // Close modal on Escape key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    if (!isModalOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-4xl max-h-[90vh] mx-4 animate-slideIn">
                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute -top-4 -right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Close modal"
                >
                    <BiX className="w-6 h-6 text-gray-600" />
                </button>

                {/* Modal Content */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                   
                    <div className="relative">
                        <img
                            src="/img/banner/diwali-offer-banner.png"
                            alt="Special Offer"
                            className="w-full h-auto max-h-[60vh] object-cover"
                        />

                        {/* Overlay Text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                            <div className="p-6 text-white">
                              
                              
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopyCode}
                                        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                                    >
                                        Copy Code
                                    </button>
                                   
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    {/* <div className="bg-gray-50 p-4 text-center">
                        <p className="text-sm text-gray-600">
                            *Offer valid for new customers only. Limited time offer.
                        </p>
                    </div> */}
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
        </div>
    );
};


export default ImageModal;