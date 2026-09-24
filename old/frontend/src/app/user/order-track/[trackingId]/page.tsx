"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { axiosInstance } from '@/utils/axios';
import {
  RiTruckLine, RiMapPin2Line, RiCheckLine, RiInboxLine,
  RiTimeLine, RiFlightTakeoffLine, RiShipLine,
} from "react-icons/ri";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function OrderTrack() {
  const { trackingId } = useParams();
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingId) return;
    (async () => {
      try {
        setLoading(true);
        const data: any = await axiosInstance.post("/shipping/track", { trackingId });
        if (data.success) {
          setSummary(data.summary);
          setHistory(data.history || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [trackingId]);

  if (loading || !summary) return <LoadingSpinner />;

  const steps = [
    { label: "Booked", icon: RiInboxLine },
    { label: "Picked Up", icon: RiCheckLine },
    { label: "In Transit", icon: RiTruckLine },
    { label: "Out For Delivery", icon: RiShipLine },
    { label: "Delivered", icon: RiFlightTakeoffLine },
  ];

  const getStepIndex = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('delivered')) return 4;
    if (s.includes('out')) return 3;
    if (s.includes('transit')) return 2;
    if (s.includes('pickup') || s.includes('picked')) return 1;
    return 0;
  };

  const currentStep = getStepIndex(summary.status);

  return (
    <section className="py-6 sm:py-8 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl space-y-5">

        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#3C2A6D] via-[#3C2A6D] to-pink-600 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <RiTruckLine className="w-7 h-7" />
              </div>
              <div>
                <p className="text-purple-100 text-sm">Current Status</p>
                <h2 className="text-2xl sm:text-3xl font-bold mt-0.5">{summary.status}</h2>
              </div>
            </div>

            {summary.expectedDeliveryDate && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <RiTimeLine className="w-6 h-6" />
                <div>
                  <p className="text-purple-100 text-xs">Estimated Delivery</p>
                  <p className="font-semibold">
                    {new Date(summary.expectedDeliveryDate).toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 text-center">
            Shipment Progress
          </h3>

          {/* Desktop progress line */}
          <div className="relative hidden md:block">
            <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-5 md:gap-3 relative z-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const active = i <= currentStep;
              const current = i === currentStep;
              return (
                <div key={step.label} className="flex md:flex-col items-center md:text-center gap-3 md:gap-2 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    active
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200'
                      : 'bg-gray-100 text-gray-400'
                  } ${current ? 'ring-4 ring-purple-100' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-xs sm:text-sm ${active ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Order Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <RiInboxLine className="w-5 h-5 text-[#3C2A6D]" />
              </div>
              <h3 className="font-semibold text-gray-900">Order Details</h3>
            </div>
            <div className="space-y-3 text-sm">
              <Detail label="Order ID" value={summary.orderid} />
              <Detail label="Courier Partner" value={summary.fulfilledby} />
              <Detail label="Tracking Number" value={summary.waybill} breakAll />
              <Detail label="Ordered On" value={new Date(summary.orderedon).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })} />
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <RiTruckLine className="w-5 h-5 text-[#3C2A6D]" />
              </div>
              <h3 className="font-semibold text-gray-900">Shipment Activity</h3>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
              ) : (
                <div className="relative border-l-2 border-purple-100 ml-3">
                  {history.map((item, i) => (
                    <div key={i} className="mb-5 ml-5 relative last:mb-0">
                      <span className="absolute -left-[27px] w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-md shadow-purple-200">
                        <RiCheckLine className="w-3 h-3" />
                      </span>
                      <div className="bg-gray-50 hover:bg-purple-50/40 transition rounded-xl p-3.5">
                        <p className="font-semibold text-sm text-gray-900">{item.status}</p>
                        {item.remark && (
                          <p className="text-xs text-gray-600 mt-1">{item.remark}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                          <span className="flex items-center gap-1">
                            <RiMapPin2Line className="w-3.5 h-3.5" /> {item.location || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <RiTimeLine className="w-3.5 h-3.5" />
                            {new Date(item.dateandTime).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Detail = ({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) => (
  <div className="border-b border-gray-100 pb-3 last:border-0">
    <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
    <p className={`font-medium text-gray-900 mt-0.5 ${breakAll ? 'break-all' : ''}`}>{value || '—'}</p>
  </div>
);