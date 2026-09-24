"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAllSessionCarts, bulkDeleteSessionCarts } from "@/_services/admin/se-cart";
import Image from "next/image";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Pagination } from "@/components/admin/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { PaginationData } from "@/lib/types";
export const dynamic = 'force-dynamic';

interface CartItem {
  _id: string;
  productId?: {
    _id: string;
    title?: string;
    thumbnail?: { url?: string };
  };
  createdAt: string;
}

const SeCartContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [carts, setCarts] = useState<CartItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const page = searchParams?.get("page") || "1";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response: any = await getAllSessionCarts(page, 10);
      setCarts(response?.data || []);
      setPagination(response?.pagination || null);
      setSelected([]); // page change pe selection reset
    } catch (err: any) {
      setCarts([]);
      setError(err?.message || "Failed to fetch carts");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams!);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  /* ─── Selection helpers ─── */
  const toggleOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allOnPageSelected =
    carts.length > 0 && carts.every((c) => selected.includes(c._id));

  const toggleAll = () => {
    if (allOnPageSelected) {
      // deselect current page items
      setSelected((prev) => prev.filter((id) => !carts.some((c) => c._id === id)));
    } else {
      // add all current page items
      setSelected((prev) => [
        ...prev,
        ...carts.filter((c) => !prev.includes(c._id)).map((c) => c._id),
      ]);
    }
  };

  /* ─── Bulk delete ─── */
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete ${selected.length} selected item(s)? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e3342f",
      cancelButtonColor: "#6c7fd8",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setDeleting(true);
      const res: any = await bulkDeleteSessionCarts(selected);
      toast.success(res?.message || "Deleted successfully");
      setSelected([]);
      // agar current page khaali ho jaye to pichle page pe jao
      if (carts.length === selected.length && Number(page) > 1) {
        handlePageChange(Number(page) - 1);
      } else {
        fetchData();
      }
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalCount = pagination?.total ?? carts.length;
  const firstIndex = ((Number(page) - 1) * 10);

  return (
    <div className="mt-10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-semibold">Cart ({totalCount})</h2>

        {selected.length > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            <RiDeleteBin6Line className="h-5 w-5" />
            {deleting ? "Deleting..." : `Delete Selected (${selected.length})`}
          </button>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {!error && carts.length === 0 && (
        <div className="text-center py-10 bg-white rounded-md shadow-md">
          <p className="text-gray-500">No items in the cart.</p>
        </div>
      )}

      {!error && carts.length > 0 && (
        <div className="border rounded-md p-4 shadow-md bg-white overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-12">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="border p-2">#</th>
                <th className="border p-2">Product Image</th>
                <th className="border p-2">Product Name</th>
                <th className="border p-2">Date Of Added</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((cart, index) => {
                const isSel = selected.includes(cart._id);
                return (
                  <tr
                    key={cart._id || index}
                    className={`text-center transition-colors ${isSel ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                  >
                    <td className="border p-2">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleOne(cart._id)}
                        className="h-4 w-4 cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className="border p-2">{firstIndex + index + 1}</td>
                    <td className="border p-2">
                      <div className="flex justify-center">
                        {cart?.productId?.thumbnail?.url ? (
                          <Image
                            src={cart.productId.thumbnail.url}
                            width={50}
                            height={50}
                            alt="Product"
                            className="rounded"
                          />
                        ) : (
                          <div className="w-[50px] h-[50px] bg-gray-200 rounded" />
                        )}
                      </div>
                    </td>
                    <td className="border p-2">{cart?.productId?.title || "N/A"}</td>
                    <td className="border p-2">
                      {new Date(cart.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pagination && pagination.pages > 1 && (
            <div className="mt-6">
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeCartContent;