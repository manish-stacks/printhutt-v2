"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch, FaStar, FaStarHalfAlt, FaEye } from "react-icons/fa";
import { RiDeleteBin2Line, RiLoader2Line, RiCloseLine } from "react-icons/ri";
import Image from "next/image";
import { Pagination } from "@/components/admin/Pagination";
import { deleteReview, getReview } from "@/_services/admin/review";
import Swal from "sweetalert2";

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // NEW — selected review for modal
    const [selectedReview, setSelectedReview] = useState<any | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    const page = searchParams.get("page") || "1";
    const search = searchParams.get("search") || "";

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getReview(page, search);
            setReviews(res.reviews);
            setPagination(res.pagination);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Close modal on ESC key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedReview(null);
        };
        if (selectedReview) {
            window.addEventListener("keydown", onKey);
            document.body.style.overflow = "hidden"; // lock scroll
        }
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [selectedReview]);

    const handleSearch = (value: string) => {
        const params = new URLSearchParams(searchParams);
        value ? params.set("search", value) : params.delete("search");
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (p: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", p.toString());
        router.push(`?${params.toString()}`);
    };

    const renderStars = (rating: number) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) =>
                rating >= star ? (
                    <FaStar key={star} className="text-yellow-400" />
                ) : rating >= star - 0.5 ? (
                    <FaStarHalfAlt key={star} className="text-yellow-400" />
                ) : (
                    <FaStar key={star} className="text-gray-300" />
                )
            )}
        </div>
    );

    const handleDelete = async (id: string) => {
        Swal.fire({
            title: "Delete Review?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteReview(id);
                    setReviews((prev) => prev.filter((r) => r._id !== id));
                    setSelectedReview(null); // close modal agar delete kiya from modal
                    Swal.fire("Deleted!", "Review has been deleted.", "success");
                } catch {
                    Swal.fire("Error!", "Failed to delete review.", "error");
                }
            }
        });
    };

    return (
        <div className="max-w-10xl mx-auto lg:px-10 py-20">
            {/* HEADER */}
            <div className="bg-white p-6 rounded-lg shadow-md flex justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Product Reviews</h2>
                    <p className="text-gray-600">Manage customer reviews</p>
                </div>
            </div>

            {/* SEARCH */}
            <div className="bg-white px-5 py-6 mt-6 rounded-lg shadow">
                <div className="relative w-80">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search reviews..."
                        className="w-full border rounded-lg py-2 pl-10 pr-4"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white mt-6 rounded-lg shadow overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <RiLoader2Line className="animate-spin text-3xl text-blue-500" />
                    </div>
                ) : (
                    <table className="min-w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Rating</th>
                                <th className="px-4 py-3">Review</th>
                                <th className="px-4 py-3">Order</th>
                                <th className="px-4 py-3">Images</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-6">
                                        No reviews found
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review._id} className="border-b hover:bg-gray-50">
                                        {/* Product */}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 items-center">
                                                {review.productId?.thumbnail?.url && (
                                                    <Image
                                                        src={review.productId.thumbnail.url}
                                                        alt=""
                                                        width={40}
                                                        height={40}
                                                        className="rounded"
                                                    />
                                                )}
                                                <a
                                                    href={`/product-details/${review.productId?.slug}`}
                                                    target="_blank"
                                                    className="hover:underline"
                                                >
                                                    {review.productId?.title}
                                                </a>
                                            </div>
                                        </td>

                                        {/* User */}
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{review.userId?.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {review.userId?.email}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Rating */}
                                        <td className="px-4 py-3">{renderStars(review.rating)}</td>

                                        {/* Review */}
                                        <td className="px-4 py-3 max-w-xs truncate">
                                            {review.review}
                                        </td>

                                        {/* Order */}
                                        <td className="px-4 py-3">{review.orderId?.orderId}</td>

                                        {/* Images */}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {review.images?.slice(0, 3).map((img: any, i: number) => (
                                                    <Image
                                                        key={i}
                                                        src={img.url}
                                                        alt=""
                                                        width={40}
                                                        height={40}
                                                        className="rounded object-cover"
                                                    />
                                                ))}
                                                {review.images?.length > 3 && (
                                                    <span className="text-xs text-gray-500 self-center">
                                                        +{review.images.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedReview(review)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                                                    title="View Review"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(review._id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                                                    title="Delete Review"
                                                >
                                                    <RiDeleteBin2Line />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINATION */}
            {pagination && (
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
            )}

            {/* ─── MODAL ─── */}
            {selectedReview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedReview(null)}
                >
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedReview(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
                            aria-label="Close"
                        >
                            <RiCloseLine size={20} />
                        </button>

                        {/* Header */}
                        <div className="border-b px-6 py-4">
                            <h3 className="text-xl font-bold text-gray-900">Review Details</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                ID: {selectedReview._id}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-5">
                            {/* Product */}
                            <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                                {selectedReview.productId?.thumbnail?.url && (
                                    <Image
                                        src={selectedReview.productId.thumbnail.url}
                                        alt=""
                                        width={70}
                                        height={70}
                                        className="rounded-lg object-cover"
                                    />
                                )}
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Product</p>
                                    <a
                                        href={`/product-details/${selectedReview.productId?.slug}`}
                                        target="_blank"
                                        className="font-semibold text-gray-800 hover:text-blue-600 hover:underline"
                                    >
                                        {selectedReview.productId?.title || "—"}
                                    </a>
                                </div>
                            </div>

                            {/* Grid info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">User</p>
                                    <p className="font-medium">{selectedReview.userId?.name || "—"}</p>
                                    <p className="text-xs text-gray-500">
                                        {selectedReview.userId?.email || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Order ID</p>
                                    <p className="font-medium">
                                        {selectedReview.orderId?.orderId || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Rating</p>
                                    <div className="flex items-center gap-2">
                                        {renderStars(selectedReview.rating)}
                                        <span className="text-sm text-gray-600">
                                            ({selectedReview.rating}/5)
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Date</p>
                                    <p className="font-medium">
                                        {new Date(selectedReview.createdAt).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            {/* Review text */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase mb-2">Review</p>
                                <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg leading-relaxed">
                                    {selectedReview.review || "—"}
                                </p>
                            </div>

                            {/* Images */}
                            {selectedReview.images?.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase mb-2">
                                        Images ({selectedReview.images.length})
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {selectedReview.images.map((img: any, i: number) => (
                                            <a
                                                key={i}
                                                href={img.url}
                                                target="_blank"
                                                rel="noopener"
                                                className="block aspect-square overflow-hidden rounded-lg border hover:opacity-90 transition"
                                            >
                                                <Image
                                                    src={img.url}
                                                    alt=""
                                                    width={200}
                                                    height={200}
                                                    className="w-full h-full object-cover"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t px-6 py-4 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-gray-100"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleDelete(selectedReview._id)}
                                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                            >
                                <RiDeleteBin2Line /> Delete Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}