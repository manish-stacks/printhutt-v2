"use client";

import React, { useEffect, useState } from "react";
import {
    BiCamera,
    BiHelpCircle,
    BiMessageSquare,
    BiStar,
    BiX,
} from "react-icons/bi";
import { BsShieldCheck } from "react-icons/bs";
import { RiShieldCheckLine } from "react-icons/ri";
import { notFound, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";

import LoadingSpinner from "@/components/LoadingSpinner";
import { get_product_by_slug } from "@/_services/admin/product";
import { commonApi } from "@/_services/common/common";
import { useUserStore } from "@/store/useUserStore";

export default function RatingsReviews() {
    const params = useParams();
    const router = useRouter();
    const isLoggedIn = useUserStore((state) => state.isLoggedIn);

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<any>(null);
    const [orderId, setOrderId] = useState<string>(null);

    const [hasPurchased, setHasPurchased] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);

    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [uploadImages, setUploadImages] = useState<File[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [showModal, setShowModal] = useState(false);

    /* ================= AUTH & PARAM CHECK ================= */
    useEffect(() => {
        if (!params?.slug) notFound();
        if (!isLoggedIn) router.push("/login");
    }, [params, isLoggedIn]);

    /* ================= FETCH PRODUCT & ORDER ================= */
    const fetchData = async () => {
        try {
            setLoading(true);

            const productRes = await get_product_by_slug(params.slug);
            const orderCheck = await commonApi.checkProductOrder(params.slug);

            if (!productRes) return notFound();
            setOrderId(orderCheck.orderId);
            setProduct(productRes);

            if (orderCheck.reviewExists) {
                setAlreadyReviewed(true);
                setHasPurchased(false);
            } else {
                setAlreadyReviewed(false);
                setHasPurchased(true);
            }
        } catch (err) {
            console.error(err);
            notFound();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params?.slug) fetchData();
    }, [params]);

    /* ================= IMAGE UPLOAD ================= */
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const files = Array.from(e.target.files);

        const previews = files.map((file) => URL.createObjectURL(file));
        setSelectedImages((prev) => [...prev, ...previews]);
        setUploadImages((prev) => [...prev, ...files]);
    };

    /* ================= SUBMIT REVIEW ================= */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setSubmitError("Please select a rating");
            return;
        }

        if (reviewText.trim().length < 10) {
            setSubmitError("Review must be at least 10 characters");
            return;
        }

        if (uploadImages.length > 4) {
            setSubmitError("Maximum 4 images allowed");
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError("");

            const formData = new FormData();
            formData.append("orderId", orderId);
            formData.append("rating", rating.toString());
            formData.append("review", reviewText);
            formData.append("productId", product._id);
            uploadImages.forEach((img) => formData.append("images", img));

            const res = await commonApi.postReviews(formData);

            if (res.success) {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                });
                setShowModal(true);
            }
        } catch (err) {
            setSubmitError("Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setShowModal(false);
        router.push(`/product-details/${product?.slug}`);
    };

    if (loading) return <LoadingSpinner />;

    /* ================= UI ================= */
    return (
        <div className="min-h-screen bg-gray-50 pt-4">
            {/* HEADER */}
            <section className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">Ratings & Reviews</h1>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/product-details/${product.slug}`}
                            className="font-medium"
                        >
                            {product.title?.slice(0, 30)}...
                        </Link>
                        <Image
                            src={product.thumbnail?.url}
                            alt="Product"
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* CONTENT */}
            <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* LEFT INFO */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-semibold mb-4">What makes a good review?</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex gap-2">
                                <BiStar className="text-yellow-400 mt-1" />
                                Honest experience
                            </div>
                            <div className="flex gap-2">
                                <BiMessageSquare className="text-blue-500 mt-1" />
                                Useful details
                            </div>
                            <div className="flex gap-2">
                                <BsShieldCheck className="text-green-500 mt-1" />
                                Respectful language
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="md:col-span-2">
                    {hasPurchased ? (
                        /* ================= WRITE REVIEW ================= */
                        <div className="bg-white p-8 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-6">
                                Write Your Review
                            </h2>

                            {submitError && (
                                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                                    {submitError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Rating */}
                                <div>
                                    <label className="font-medium block mb-2">
                                        Overall Rating
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setRating(s)}
                                            >
                                                <BiStar
                                                    className={`h-8 w-8 ${s <= rating
                                                            ? "text-yellow-400"
                                                            : "text-gray-300"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Review */}
                                <textarea
                                    rows={4}
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    className="w-full border rounded-md p-3"
                                    placeholder="Share your experience..."
                                />

                                {/* Images */}
                                <div className="grid grid-cols-6 gap-4">
                                    {selectedImages.map((img, i) => (
                                        <Image
                                            key={i}
                                            src={img}
                                            width={96}
                                            height={96}
                                            className="rounded-lg object-cover"
                                            alt=""
                                        />
                                    ))}
                                    {selectedImages.length < 4 && (
                                        <label className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer">
                                            <input
                                                type="file"
                                                multiple
                                                hidden
                                                onChange={handleImageUpload}
                                            />
                                            <BiCamera className="text-2xl text-gray-400" />
                                        </label>
                                    )}
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 text-white py-2 rounded-md"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Review"}
                                </button>
                            </form>
                        </div>
                    ) : alreadyReviewed ? (
                        /* ================= ALREADY REVIEWED ================= */
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <BiStar className="text-green-500 text-5xl mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">
                                Review Already Submitted
                            </h2>
                            <p className="text-gray-600 mb-6">
                                You have already reviewed this product. Thank you!
                            </p>
                            <Link
                                href={`/product-details/${product.slug}`}
                                className="bg-green-500 text-white px-6 py-2 rounded-md"
                            >
                                Go to Product
                            </Link>
                        </div>
                    ) : (
                        /* ================= NOT PURCHASED ================= */
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <BiHelpCircle className="text-5xl text-gray-400 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">
                                Not Eligible for Review
                            </h2>
                            <p className="text-gray-600">
                                You need to purchase this product to write a review.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* SUCCESS MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg text-center relative">
                        <button
                            onClick={resetForm}
                            className="absolute top-3 right-3"
                        >
                            <BiX size={24} />
                        </button>
                        <RiShieldCheckLine className="text-green-500 text-5xl mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                            Review Submitted!
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Thank you for your feedback.
                        </p>
                        <button
                            onClick={resetForm}
                            className="bg-green-500 text-white px-6 py-2 rounded-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
