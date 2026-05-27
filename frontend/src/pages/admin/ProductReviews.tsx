"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { RiDeleteBin2Line, RiLoader2Line } from "react-icons/ri";
import Image from "next/image";
import { Pagination } from "@/components/admin/Pagination";
import { deleteReview, getReview } from "@/_services/admin/review";
import Swal from "sweetalert2";

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    const renderStars = (rating: number) => {
        return (
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
    };


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
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-6">
                                        No reviews found
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review._id} className="border-b">
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
                                                    href={`/product-details/${review.productId.slug}`}
                                                    target="_blank"
                                                    className="hover:underline"
                                                >
                                                    {review.productId.title}
                                                </a>
                                            </div>
                                        </td>

                                        {/* User */}
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">
                                                    {review.userId?.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {review.userId?.email}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Rating */}
                                        <td className="px-4 py-3">
                                            {renderStars(review.rating)}
                                        </td>

                                        {/* Review */}
                                        <td className="px-4 py-3 max-w-xs truncate">
                                            {review.review}
                                        </td>

                                        {/* Order */}
                                        <td className="px-4 py-3">
                                            {review.orderId?.orderId}
                                        </td>

                                        {/* Images */}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {review.images?.map((img: any, i: number) => (
                                                    <Image
                                                        key={i}
                                                        src={img.url}
                                                        alt=""
                                                        width={40}
                                                        height={40}
                                                        className="rounded"
                                                    />
                                                ))}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(review._id)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                                                title="Delete Review"
                                            >
                                                <RiDeleteBin2Line />
                                            </button>
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
                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}
