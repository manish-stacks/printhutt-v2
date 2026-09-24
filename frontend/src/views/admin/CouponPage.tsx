'use client'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { CouponTable } from '@/components/admin/coupon/CouponTable';
import { Pagination } from '@/components/admin/Pagination';
import { CouponForm } from '@/components/admin/coupon/CouponForm';

import Swal from 'sweetalert2';
import { addNewCoupon, deleteCoupon, getAllCouponsPagination, updateCoupon } from '@/_services/admin/coupon';
import { toast } from 'react-toastify';
import { CouponAttributes } from '@/lib/types/coupon';


import { useListFilters } from '@/components/admin/ui';
export default function CouponPage() {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [coupons, setCoupons] = useState<CouponAttributes[]>([]);

    const lf = useListFilters(coupons as any[], { statusKey: 'isActive', nameKey: 'code', dateKey: 'createdAt', extra: [{ key: 'type', label: 'Type', options: [{ value: 'all', label: 'All types' }, { value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed ₹' }, { value: 'free_shipping', label: 'Free shipping' }], test: (r: any, v: string) => r.discountType === v }, { key: 'expiry', label: 'Expiry', options: [{ value: 'all', label: 'Any expiry' }, { value: 'live', label: 'Not expired' }, { value: 'expired', label: 'Expired' }], test: (r: any, v: string) => { const e = r.validUntil || r.validTo; if (!e) return v === 'live'; const x = new Date(e).getTime() < Date.now(); return v === 'expired' ? x : !x; } }] });
    const [pagination, setPagination] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: '',
        discountValue: '',
        minimumPurchaseAmount: '',
        maxDiscountAmount: '',
        validFrom: '',
        validUntil: '',
        usageLimit: '',
        isActive: true,
        isShow: true,
        isDefault: false,
    });

    const searchParams = useSearchParams();
    const router = useRouter();
    const page = searchParams?.get('page') || '1';
    const search = searchParams?.get('search') || '';



    async function fetchCoupons() {
        try {
            setIsLoading(true);
            const response = await getAllCouponsPagination(page, search);

            const data = response?.coupons as unknown as { coupons: CouponAttributes[], pagination: number };
            setCoupons(data as any);
            setPagination(response?.pagination);
        } catch (error) {
            console.error('Failed to fetch return methods:', error);
            toast.error('Failed to fetch return methods');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchCoupons();
    }, [page]);


    const handleSearch = (value: string) => {
        const params = new URLSearchParams(searchParams!);
        if (value) {
            params.set('search', value);
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams!);
        params.set('page', newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // ✅ Boolean selects ko sahi boolean store karo (warna string 'false' bhi truthy ho jata
        //    aur toggle persist nahi hota — isActive/isShow/isDefault sab par lagu).
        const boolFields = ['isActive', 'isShow', 'isDefault'];
        setFormData((prevData) => ({
            ...prevData,
            [name]: boolFields.includes(name) ? value === 'true' : value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formData) {
                throw new Error("Form data is empty or invalid.");
            }

            // console.log("Submitting Form Data:", formData);

            const success = editingId
                ? await updateCoupon(editingId, formData as any)
                : await addNewCoupon(formData as any);

            if (success) {
                // console.log("Coupon added/updated successfully.");
                try {
                    await fetchCoupons();
                } catch (fetchError) {
                    console.error("Failed to fetch coupons:", fetchError);
                }
                handleCloseModal?.();
            } else {
                throw new Error("Coupon operation failed.");
            }
        } catch (error) {
            console.error("Failed to add/edit coupon:", error);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleEdit = (id: string) => {
        const couponToEdit = coupons.find(coupon => (coupon as any)._id === id);

        // datetime-local input local time expect karta hai. toISOString() UTC deta tha
        // jisse edit par time shift ho jata tha — yahan local offset adjust karke format karo.
        const toLocalInput = (d?: string | Date) => {
            if (!d) return '';
            const date = new Date(d);
            if (isNaN(date.getTime())) return '';
            const tz = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - tz).toISOString().slice(0, 16);
        };

        if (couponToEdit) {
            setFormData({
                code: couponToEdit.code,
                description: couponToEdit.description,
                discountType: couponToEdit.discountType,
                discountValue: couponToEdit.discountValue.toString(),
                minimumPurchaseAmount: couponToEdit.minimumPurchaseAmount.toString(),
                maxDiscountAmount: couponToEdit.maxDiscountAmount?.toString() || '',
                validFrom: toLocalInput(couponToEdit.validFrom),
                validUntil: toLocalInput(couponToEdit.validUntil),
                usageLimit: couponToEdit.usageLimit?.toString() || '',
                isActive: couponToEdit.isActive,
                isShow: couponToEdit.isShow,
                isDefault: (couponToEdit as any).isDefault ?? false,
            });
            setEditingId(id);
            setIsOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            try {
                await deleteCoupon(id);
                setCoupons(prev => prev.filter(coupon => (coupon as any)?._id !== id));
                Swal.fire({
                    title: "Deleted!",
                    text: "Coupon has been deleted.",
                    icon: "success"
                });
            } catch (error) {
                if (error instanceof Error) {
                    console.error('Error deleting coupon:', error.message);
                    Swal.fire({
                        title: "Error!",
                        text: "There was an issue deleting the coupon.",
                        icon: "error"
                    });
                } else {
                    console.error('Unexpected error:', error);
                    Swal.fire({
                        title: "Error!",
                        text: "There was an issue deleting the coupon.",
                        icon: "error"
                    });
                }
            }
        }
    };

    const handleCloseModal = () => {
        setIsOpen(false);
        setEditingId(null);
        setFormData({ ...({} as any),
            code: '',
            description: '',
            discountType: '',
            discountValue: '',
            minimumPurchaseAmount: '',
            maxDiscountAmount: '',
            validFrom: '',
            validUntil: '',
            usageLimit: '',
            isActive: true,
            isShow: false,
        });
    };

    return (
        <>
            <div className="ph-page">
                <div className="w-full md:w-12/12 lg:w-12/12 mb-5">
                    <div className="bg-white text-black flex justify-between align-middle p-6 rounded-lg shadow-md">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Coupon Management</h2>
                            <p className="text-gray-600">Create and manage discount coupons</p>
                        </div>
                        <div>
                            <button
                                className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                onClick={() => setIsOpen(true)}
                            >
                                Add Coupon
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ph-card">
                    <div className="mb-6 flex justify-between items-center">
                        <div className="relative hidden sm:block mt-4">
                            <FaSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search coupons..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-80 rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                        {lf.toolbar}
                        <CouponTable
                            coupons={lf.rows as any}
                            isLoading={isLoading}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>

                    {pagination && (
                        <Pagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>

                {isOpen && (
                    <CouponForm
                        formData={formData as any}
                        isSubmitting={isSubmitting}
                        onSubmit={handleSubmit}
                        onChange={handleChange}
                        onClose={handleCloseModal}
                        mode={editingId ? 'edit' : 'add'}
                    />
                )}
            </div>
        </>
    );
}