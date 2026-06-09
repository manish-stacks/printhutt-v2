"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import { toast } from "react-toastify";
import { useUserStore } from "@/store/useUserStore";
import { userService } from "@/_services/common/userService";
import { axiosInstance } from '@/utils/axios';
import LoadingSpinner from "@/components/LoadingSpinner";
import { RiUser2Line, RiMailLine, RiPhoneLine, RiShieldCheckLine, RiSaveLine } from "react-icons/ri";

const Profile = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const fetchUserDetails = useUserStore((state) => state.fetchUserDetails);

  const [formData, setFormData] = useState({
    displayName: '',
    number: '',
    email: '',
    userId: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const data: any = await axiosInstance.post('/auth/me');
        setFormData({
          displayName: data.user.displayName || '',
          email: data.user.email || '',
          number: data.user.number || '',
          userId: data.user._id,
        });
        setIsVerified(!!data.user.isVerified);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userService.updateProfile(formData);
      fetchUserDetails();
      toast.success("Profile updated successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  if (loading) return <LoadingSpinner />;

  const initials = (formData.displayName || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {/* <Breadcrumb title="Profile" /> */}
      <section className="py-6 sm:py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">

          <div className="lg:w-[280px] flex-shrink-0">
            <UserSidebar activemenu="profile" />
          </div>

          <div className="flex-1 space-y-5 min-w-0">

            {/* Banner with avatar */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#3C2A6D] via-[#3C2A6D] to-[#593f9e] text-white rounded-2xl p-6 sm:p-8 shadow-md">
              <div className="relative z-10 flex items-center gap-4 flex-wrap">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-purple-100 text-sm">My Profile</p>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-1 break-words">
                    {formData.displayName || 'Unnamed User'}
                  </h2>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-400/80 text-gray-50 px-2.5 py-1 rounded-full mt-2 backdrop-blur">
                      <RiShieldCheckLine /> Verified Account
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -right-20 -bottom-10 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl" />
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h3>
              <p className="text-sm text-gray-500 mb-5">Update your name, email and phone number</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconField
                    label="Full Name *"
                    name="displayName"
                    icon={RiUser2Line}
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                  />
                  <IconField
                    label="Mobile Number *"
                    name="number"
                    icon={RiPhoneLine}
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                  />
                  <div className="md:col-span-2">
                    <IconField
                      label="Email *"
                      name="email"
                      type="email"
                      icon={RiMailLine}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    <RiSaveLine className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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

const IconField = ({ label, name, icon: Icon, value, onChange, placeholder, type = 'text' }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-purple-500 transition"
      />
    </div>
  </div>
);

export default Profile;