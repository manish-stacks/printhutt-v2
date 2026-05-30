"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import { type AddressFormData, addressSchema } from "@/lib/types/address";
import { deleteAddress, editAddress, getAddress, saveAddress } from "@/_services/common/address";
import { toast } from "react-toastify";
import { ZodError } from "zod";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  RiMapPin2Line, RiAddLine, RiEdit2Line, RiDeleteBin6Line,
  RiHome2Line, RiBriefcase2Line, RiCheckLine, RiPhoneLine,
} from "react-icons/ri";
import Swal from "sweetalert2";

const Address = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [addresslist, setAddresslist] = useState<AddressFormData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<AddressFormData>>({ addressType: 'home' });

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getAddress();
        setAddresslist(res.addresses || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [view]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const resetForm = () => {
    setFormData({ addressType: 'home' });
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const validated = addressSchema.parse(formData);
      if (editingId) {
        await editAddress(editingId, validated);
        toast.success('Address updated successfully');
      } else {
        await saveAddress(validated);
        toast.success('Address saved successfully');
      }
      resetForm();
      setView('list');
    } catch (err) {
      if (err instanceof ZodError) {
        const formErr: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0] && typeof e.path[0] === 'string') formErr[e.path[0]] = e.message;
        });
        setErrors(formErr);
      } else if (err instanceof Error) toast.error(err.message);
    } finally { setIsSubmitting(false); }
  };

  const onEdit = (a: AddressFormData) => {
    setEditingId(a._id);
    setFormData(a);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: 'Delete this address?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete',
    });
    if (!res.isConfirmed) return;
    try {
      await deleteAddress(id);
      toast.success('Address deleted');
      setAddresslist((p) => p.filter((a) => a._id !== id));
    } catch (e) { if (e instanceof Error) toast.error(e.message); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Breadcrumb title="Address" />
      <section className="py-6 sm:py-8 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6">

          <div className="lg:w-[280px] flex-shrink-0">
            <UserSidebar activemenu="address" />
          </div>

          <div className="flex-1 space-y-5 min-w-0">

            {/* Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white rounded-2xl p-6 sm:p-8 shadow-md">
              <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-purple-100 text-sm">My Addresses</p>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                    {addresslist.length} Saved {addresslist.length === 1 ? 'Address' : 'Addresses'}
                  </h2>
                </div>
                {view === 'list' && (
                  <button
                    onClick={() => { resetForm(); setView('form'); }}
                    className="flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    <RiAddLine className="w-5 h-5" /> Add New
                  </button>
                )}
              </div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -right-20 -bottom-10 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl" />
            </div>

            {/* Segmented control */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 inline-flex">
              <button
                onClick={() => { resetForm(); setView('list'); }}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                  view === 'list' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                My Addresses
              </button>
              <button
                onClick={() => { resetForm(); setView('form'); }}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                  view === 'form' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                {editingId ? 'Edit' : 'Add New'}
              </button>
            </div>

            {/* LIST VIEW */}
            {view === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresslist.length === 0 ? (
                  <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                    <RiMapPin2Line className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No addresses saved yet</p>
                    <button
                      onClick={() => { resetForm(); setView('form'); }}
                      className="mt-4 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-medium"
                    >
                      <RiAddLine /> Add First Address
                    </button>
                  </div>
                ) : (
                  addresslist.map((address) => (
                    <div
                      key={address._id}
                      className={`bg-white rounded-2xl shadow-sm border-2 p-5 flex flex-col gap-3 transition ${
                        address.isDefault ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {address.addressType === 'home' ? (
                            <RiHome2Line className="w-5 h-5 text-purple-600" />
                          ) : (
                            <RiBriefcase2Line className="w-5 h-5 text-purple-600" />
                          )}
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                            {address.addressType}
                          </span>
                        </div>
                        {address.isDefault && (
                          <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                            <RiCheckLine className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                          <RiPhoneLine className="w-3.5 h-3.5" /> {address.mobileNumber}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {address.addressLine}, {address.city}, {address.state} - {address.postCode}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => onEdit(address)}
                          className="flex-1 flex items-center justify-center gap-1 text-sm text-purple-600 hover:bg-purple-50 py-2 rounded-lg font-medium transition"
                        >
                          <RiEdit2Line /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(address._id)}
                          className="flex-1 flex items-center justify-center gap-1 text-sm text-red-500 hover:bg-red-50 py-2 rounded-lg font-medium transition"
                        >
                          <RiDeleteBin6Line /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FORM VIEW */}
            {view === 'form' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit Address' : 'Add New Address'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name *" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} />
                    <Field label="Mobile *" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} error={errors.mobileNumber} />
                    <Field className="md:col-span-2" label="Address Line *" name="addressLine" value={formData.addressLine} onChange={handleChange} error={errors.addressLine} />
                    <Field label="City *" name="city" value={formData.city} onChange={handleChange} error={errors.city} />
                    <Field label="Post Code *" name="postCode" value={formData.postCode} onChange={handleChange} error={errors.postCode} />
                    <Field label="State *" name="state" value={formData.state} onChange={handleChange} error={errors.state} />
                    <Field label="Alternate Phone" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} />
                  </div>

                  {/* Address type pills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
                    <div className="flex gap-2">
                      {(['home', 'work'] as const).map((type) => {
                        const active = formData.addressType === type;
                        const Icon = type === 'home' ? RiHome2Line : RiBriefcase2Line;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, addressType: type }))}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
                              active
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-purple-50'
                            }`}
                          >
                            <Icon className="w-4 h-4" /> {type === 'home' ? 'Home' : 'Work'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none sm:px-8 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      {isSubmitting ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { resetForm(); setView('list'); }}
                      className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
};

const Field = ({ label, name, value, onChange, error, className = '' }: any) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <input
      type="text"
      name={name}
      value={value || ''}
      onChange={onChange}
      className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-purple-500 transition ${
        error ? 'border-red-400' : 'border-gray-200'
      }`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default Address;