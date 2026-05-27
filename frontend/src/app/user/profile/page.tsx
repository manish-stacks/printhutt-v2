"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import { toast } from "react-toastify";
import { useUserStore } from "@/store/useUserStore";
import { userService } from "@/_services/common/userService";
import { axiosInstance } from '@/utils/axios';
import LoadingSpinner from "@/components/LoadingSpinner";

const Address = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchUserDetails = useUserStore((state) => state.fetchUserDetails);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    displayName: '',
    number: '',
    email: '',
    userId: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await axiosInstance.post('/auth/me');
        setFormData({
          displayName: data.user.displayName,
          email: data.user.email,
          number: data.user.number,
          userId: data.user._id,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userService.updateProfile(formData);
      // console.log(response);
      fetchUserDetails();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log(error.message);
      toast.error("Failed to update address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
            <UserSidebar activemenu={'profile'} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">

            {/* Header */}
            <div className="bg-purple-600 text-white rounded-lg p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">Profile</h2>
            </div>

            {/* Alert */}
            {!formData?.email && (
              <p className="text-red-500 bg-red-100 py-2 px-4 rounded-md text-sm">
                Please Update Your Profile
              </p>
            )}

            {/* Form */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <form onSubmit={handleSubmit}>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Name */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Enter your Name"
                      className="w-full p-2 border rounded-md text-sm"
                      value={formData.displayName}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Number */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Number *
                    </label>
                    <input
                      type="text"
                      name="number"
                      placeholder="Enter your Number"
                      className="w-full p-2 border rounded-md text-sm"
                      value={formData.number}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your Email"
                      className="w-full p-2 border rounded-md text-sm"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                </div>

                {/* Button */}
                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-purple-600 text-white px-6 py-2 rounded-md text-sm hover:bg-purple-700 transition"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Address'}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Address;
