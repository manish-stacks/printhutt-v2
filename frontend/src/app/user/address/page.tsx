"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import { type AddressFormData, addressSchema } from "@/lib/types/address";
import { deleteAddress, editAddress, getAddress, saveAddress } from "@/_services/common/address";
import { toast } from "react-toastify";
import { ZodError } from "zod";
import LoadingSpinner from "@/components/LoadingSpinner";


const Address = () => {
  const [selectedAddress, setSelectedAddress] = useState<boolean>(true);
  const [addresslist, setAddresslist] = useState<AddressFormData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response: AddressFormData[] = await getAddress();
        setAddresslist(response.addresses);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [selectedAddress])

  const handleAddressChange = () => {
    setSelectedAddress((prev) => !prev);
  }


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<AddressFormData>>({
    addressType: 'home',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const validatedData = addressSchema.parse(formData);

      if (editingId) {
        await editAddress(editingId, validatedData);
        toast.success('Address updated successfully');
      } else {
        await saveAddress(validatedData);
        toast.success('Address saved successfully');
      }

      setSelectedAddress(true);
    } catch (error) {
      if (error instanceof ZodError) {
        const formErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0] && typeof err.path[0] === "string") {
            formErrors[err.path[0]] = err.message;
          }
        });
        setErrors(formErrors);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const changeAddress = (id: string) => {
    setAddresslist((prev) =>
      prev.map((address) =>
        address._id === id
          ? { ...address, isDefault: true }
          : { ...address, isDefault: false }
      )
    );
  }

  const onEdit = (address: AddressFormData) => {
    setSelectedAddress(false);
    setEditingId(address._id);
    setFormData(address);
  }


  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
      toast.success('Address deleted successfully');
      setAddresslist((prev) =>
        prev.filter((address) => address._id !== id)
      );

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }

    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <>
      <Breadcrumb title={"Address"} />
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="w-full lg:w-1/4">
            <UserSidebar activemenu={'address'} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">

            {/* Header */}
            <div className="bg-purple-600 text-white rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold">Address</h2>
            </div>

            {/* Main Card */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">

              {/* Toggle */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    checked={selectedAddress === true}
                    onChange={() => setSelectedAddress(true)}
                  />
                  Existing Address
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    checked={selectedAddress === false}
                    onChange={() => setSelectedAddress(false)}
                  />
                  Add New Address
                </label>
              </div>

              {/* ========================= */}
              {/* ADDRESS LIST */}
              {/* ========================= */}

              {selectedAddress ? (
                <div className="space-y-4">

                  {addresslist.length > 0 ? (
                    addresslist.map((address) => (
                      <div
                        key={address._id}
                        className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between gap-4 ${address.isDefault ? 'border-l-4 border-green-500' : ''
                          }`}
                      >

                        {/* Info */}
                        <div
                          className="text-sm text-gray-700 cursor-pointer flex-1"
                          onClick={() => changeAddress(address._id)}
                        >
                          {address.isDefault && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              Selected
                            </span>
                          )}

                          <p className="font-medium mt-1">
                            {address.fullName} ({address.addressType})
                          </p>

                          <p className="text-gray-500 text-sm">
                            {address.mobileNumber}
                          </p>

                          <p className="mt-1 text-gray-600">
                            {address.addressLine}, {address.city}, {address.state} - {address.postCode}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 sm:flex-col sm:items-end">
                          <button
                            onClick={() => onEdit(address)}
                            className="text-blue-500 text-sm font-semibold"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(address._id)}
                            className="text-red-500 text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">No addresses found.</p>
                  )}

                </div>
              ) : (

                /* ========================= */
                /* FORM */
                /* ========================= */

                <form onSubmit={handleSubmit} className="mt-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                      <label className="text-sm">Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        className="w-full border p-2 rounded-md"
                        value={formData.fullName || ''}
                        onChange={handleChange}
                      />
                      {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="text-sm">Mobile *</label>
                      <input
                        type="text"
                        name="mobileNumber"
                        className="w-full border p-2 rounded-md"
                        value={formData.mobileNumber || ''}
                        onChange={handleChange}
                      />
                      {errors.mobileNumber && <p className="text-red-500 text-sm">{errors.mobileNumber}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm">Address *</label>
                      <input
                        type="text"
                        name="addressLine"
                        className="w-full border p-2 rounded-md"
                        value={formData.addressLine || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm">City *</label>
                      <input
                        type="text"
                        name="city"
                        className="w-full border p-2 rounded-md"
                        value={formData.city || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Post Code *</label>
                      <input
                        type="text"
                        name="postCode"
                        className="w-full border p-2 rounded-md"
                        value={formData.postCode || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm">State *</label>
                      <input
                        type="text"
                        name="state"
                        className="w-full border p-2 rounded-md"
                        value={formData.state || ''}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Alternate Phone</label>
                      <input
                        type="text"
                        name="alternatePhone"
                        className="w-full border p-2 rounded-md"
                        value={formData.alternatePhone || ''}
                        onChange={handleChange}
                      />
                    </div>

                  </div>

                  {/* Address Type */}
                  <div className="flex gap-4 mt-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="home"
                        checked={formData.addressType === 'home'}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, addressType: e.target.value as "home" | "work" }))
                        }
                      />
                      Home
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="work"
                        checked={formData.addressType === 'work'}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, addressType: e.target.value as "home" | "work" }))
                        }
                      />
                      Work
                    </label>
                  </div>

                  {/* Button */}
                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-purple-600 text-white px-6 py-2 rounded-md"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Address;
