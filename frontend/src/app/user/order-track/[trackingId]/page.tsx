"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { axiosInstance } from '@/utils/axios';
import {
  FaTruck,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaBoxOpen,
  FaClock,
  FaShippingFast,
} from "react-icons/fa";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function OrderTrack() {
  const { trackingId } = useParams();

  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH TRACKING ================= */
  useEffect(() => {
    if (!trackingId) return;

    const fetchTracking = async () => {
      try {
        setLoading(true);
        const data = await axiosInstance.post("/shipping/track", {
          trackingId,
        });

        if (data.success) {
          setSummary(data.summary);
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error("Tracking fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [trackingId]);

  if (loading || !summary) return <LoadingSpinner />;

  /* ================= PROGRESS STEPS ================= */
  const steps = [
    { label: "Booked", icon: FaBoxOpen },
    { label: "Picked Up", icon: FaCheckCircle },
    { label: "In Transit", icon: FaTruck },
    { label: "Out For Delivery", icon: FaShippingFast },
    { label: "Delivered", icon: FaCheckCircle },
  ];

  const getStepIndex = (status: string) => {
    const s = status?.toLowerCase();
    if (s?.includes("delivered")) return 4;
    if (s?.includes("out")) return 3;
    if (s?.includes("transit")) return 2;
    if (s?.includes("pickup") || s?.includes("picked")) return 1;
    return 0;
  };

  const currentStepIndex = getStepIndex(summary.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">


        {/* ================= STATUS CARD ================= */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 shadow-xl text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <FaTruck className="text-4xl" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Current Status</p>
                <h2 className="text-3xl font-bold">{summary.status}</h2>
              </div>
            </div>

            {summary.expectedDeliveryDate && (
              <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                <FaClock className="text-3xl" />
                <div>
                  <p className="text-blue-100 text-sm">
                    Estimated Delivery
                  </p>
                  <h3 className="text-xl font-semibold">
                    {new Date(
                      summary.expectedDeliveryDate
                    ).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= PROGRESS BAR ================= */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h3 className="text-xl font-semibold text-center mb-8">
            Shipment Progress
          </h3>

          <div className="relative hidden md:block">
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{
                  width: `${(currentStepIndex / (steps.length - 1)) * 100
                    }%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = index <= currentStepIndex;

              return (
                <div key={step.label} className="flex-1 text-center z-10">
                  <div
                    className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full ${active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-400"
                      }`}
                  >
                    <Icon />
                  </div>
                  <p
                    className={`mt-2 text-sm ${active ? "font-semibold" : "text-gray-400"
                      }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= DETAILS + TIMELINE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ORDER DETAILS */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaBoxOpen className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Order Details</h3>
            </div>

            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                <p className="font-semibold text-gray-800">{summary.orderid}</p>
              </div>

              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500 mb-1">Courier Partner</p>
                <p className="font-semibold text-gray-800">{summary.fulfilledby}</p>
              </div>

              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                <p className="font-semibold text-gray-800 break-all">{summary.waybill}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Ordered On</p>
                <p className="font-semibold text-gray-800">
                  {new Date(summary.orderedon).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <FaTruck /> Shipment Activity
            </h3>

            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="relative border-l-2 border-gray-200 ml-4">
                {history.map((item, index) => (
                  <div key={index} className="mb-6 ml-6 relative">
                    <span className="absolute -left-9 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                      <FaCheckCircle size={12} />
                    </span>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold">{item.status}</p>
                      <p className="text-sm text-gray-600">
                        {item.remark}
                      </p>

                      <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-4">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt />
                          {item.location || "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock />
                          {new Date(
                            item.dateandTime
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
