import React, { useState, useEffect } from 'react';
import { BiGift, BiHeart, BiStar, BiX } from 'react-icons/bi';
import { FaHandSparkles } from 'react-icons/fa';
// import { Gift, Heart, Sparkles, Star, X } from 'lucide-react';

const RakshaBandhanCelebration = () => {
    const [showCelebration, setShowCelebration] = useState(false);
    const [showMainCard, setShowMainCard] = useState(false);
    const [showOffer, setShowOffer] = useState(false);
    const [particles, setParticles] = useState([]);
    const [floatingElements, setFloatingElements] = useState([]);

    useEffect(() => {
        // Animation sequence
        const timer1 = setTimeout(() => setShowCelebration(true), 300);
        const timer2 = setTimeout(() => setShowMainCard(true), 800);
        const timer3 = setTimeout(() => setShowOffer(true), 2500);

        // Generate particles
        const newParticles = Array.from({ length: 80 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: -10,
            rotation: Math.random() * 360,
            color: ['#ff6b9d', '#ffd93d', '#6bcf7f', '#4d9fff', '#ff4757', '#ffa726', '#9c88ff'][Math.floor(Math.random() * 7)],
            size: Math.random() * 6 + 3,
            speed: Math.random() * 4 + 2,
            delay: Math.random() * 2,
            opacity: 0.7 + Math.random() * 0.3
        }));
        setParticles(newParticles);

        // Generate floating elements
        const newFloatingElements = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: -5,
            emoji: ['🎀', '🎁', '💝', '🌸', '✨', '🪔', '🌺'][Math.floor(Math.random() * 7)],
            size: Math.random() * 20 + 25,
            speed: Math.random() * 3 + 3,
            delay: Math.random() * 3,
            rotation: Math.random() * 360
        }));
        setFloatingElements(newFloatingElements);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    const closeAll = () => {
        setShowOffer(false);
        setShowMainCard(false);
        setShowCelebration(false);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            {/* Background Gradient */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-orange-50 to-red-50 opacity-90"></div> */}

            {/* Particle System */}
            {showCelebration && particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute rounded-full shadow-lg"
                    style={{
                        left: `${particle.x}%`,
                        backgroundColor: particle.color,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        opacity: particle.opacity,
                        animation: `particleFall ${particle.speed}s linear ${particle.delay}s infinite`,
                        transform: `rotate(${particle.rotation}deg)`,
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}40`
                    }}
                />
            ))}

            {/* Floating Emojis */}
            {showCelebration && floatingElements.map(element => (
                <div
                    key={element.id}
                    className="absolute"
                    style={{
                        left: `${element.x}%`,
                        fontSize: `${element.size}px`,
                        animation: `floatDown ${element.speed}s ease-in-out ${element.delay}s infinite`,
                        transform: `rotate(${element.rotation}deg)`,
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))'
                    }}
                >
                    {element.emoji}
                </div>
            ))}

            {/* Main Celebration Card */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className={`transform transition-all duration-1000 ease-out ${
                    showMainCard ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'
                }`}>
                    <div className="relative">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-orange-400 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                        
                        {/* Main Card */}
                        <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-pink-200 p-8 max-w-sm mx-auto">
                            {/* Decorative Border */}
                            <div className="absolute inset-0 rounded-3xl border-4 border-gradient-to-r from-pink-400 via-orange-400 to-red-400 opacity-50"></div>
                            
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="relative inline-block mb-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                        <BiGift className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                                        <FaHandSparkles className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                                    राखी मुबारक
                                </h1>
                                <p className="text-lg text-gray-600 font-medium">
                                    Raksha Bandhan 2025
                                </p>
                            </div>

                            {/* Animated Rakhi */}
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 rounded-full shadow-xl animate-spin-slow flex items-center justify-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                                            <BiHeart className="w-8 h-8 text-white animate-pulse" />
                                        </div>
                                    </div>
                                    {/* Decorative Stars */}
                                    {[...Array(6)].map((_, i) => (
                                        <BiStar
                                            key={i}
                                            className="absolute text-yellow-400 animate-ping"
                                            // style={{
                                            //     top: `${-10 + Math.sin(i * 60 * Math.PI / 180) * 40}px`,
                                            //     left: `${35 + Math.cos(i * 60 * Math.PI / 180) * 40}px`,
                                            //     animationDelay: `${i * 0.2}s`
                                            // }}
                                            size={12}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div className="text-center">
                                <p className="text-gray-700 text-lg font-medium mb-4">
                                    A bond of love, protection & joy
                                </p>
                                <div className="flex justify-center space-x-2">
                                    {['🎁', '💝', '🌸'].map((emoji, i) => (
                                        <span
                                            key={i}
                                            className="text-2xl animate-bounce"
                                            style={{ animationDelay: `${i * 0.3}s` }}
                                        >
                                            {emoji}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Special Offer Modal */}
            {showOffer && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md mx-auto transform animate-slideIn">
                        {/* Close Button */}
                        <button
                            onClick={closeAll}
                            className="absolute top-4 right-4 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
                        >
                            <BiX size={20} />
                        </button>

                        {/* Offer Content */}
                        <div className="p-8 text-center">
                            {/* Offer Badge */}
                            <div className="inline-block bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full mb-6 shadow-lg">
                                <span className="text-3xl font-black">30% OFF</span>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                🎊 राखी स्पेशल ऑफर 🎊
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Raksha Bandhan Special Discount
                            </p>

                            {/* Features */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center justify-center space-x-2 text-gray-700">
                                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                    <span>Free shipping on all Rakhi gifts</span>
                                </div>
                                {/* <div className="flex items-center justify-center space-x-2 text-gray-700">
                                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                    <span>Special gift wrapping included</span>
                                </div> */}
                                <div className="flex items-center justify-center space-x-2 text-gray-700">
                                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                    <span>Express delivery available</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={closeAll}
                                className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-4 px-8 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                🛍️ Shop Rakhi Gifts Now
                            </button>

                            {/* Urgency Timer */}
                            <div className="mt-6 flex justify-center space-x-2">
                                {['Limited', 'Time', 'Only'].map((word, i) => (
                                    <span
                                        key={i}
                                        className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse"
                                        style={{ animationDelay: `${i * 0.3}s` }}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Styles */}
            <style jsx>{`
                @keyframes particleFall {
                    0% {
                        transform: translateY(-10vh) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(110vh) rotate(720deg);
                        opacity: 0;
                    }
                }

                @keyframes floatDown {
                    0% {
                        transform: translateY(-10vh) rotate(0deg);
                        opacity: 0.8;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(110vh) rotate(180deg);
                        opacity: 0;
                    }
                }

                @keyframes slideIn {
                    0% {
                        transform: scale(0.8) translateY(-20px);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05) translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }

                .animate-spin-slow {
                    animation: spin 4s linear infinite;
                }

                .animate-slideIn {
                    animation: slideIn 0.6s ease-out;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default RakshaBandhanCelebration;