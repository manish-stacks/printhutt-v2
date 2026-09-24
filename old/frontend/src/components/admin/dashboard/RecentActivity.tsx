import Image from "next/image";
import React from "react";

export function RecentActivity({ data }: any) {
  return (
    <div className="rounded-[18px] border border-[#eef0f4] bg-white p-6 shadow-sm transition hover:shadow-lg">

      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#1e293b]">
          Recent Activity
        </h2>

        <span className="text-[12px] text-[#94a3b8]">
          Latest updates
        </span>
      </div>

      {/* LIST */}
      <div className="space-y-4 max-h-[320px] overflow-auto pr-2">

        {data?.map((activity: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-[14px] p-3 transition hover:bg-[#f8faff]"
          >

            {/* IMAGE */}
            <div className="h-[42px] w-[42px] overflow-hidden rounded-full border border-[#eef0f4] bg-white">
              <Image
                src={
                  activity?.productId?.thumbnail?.url ||
                  "/placeholder.png"
                }
                width={42}
                height={42}
                alt="Product"
                className="h-full w-full object-cover"
              />
            </div>

            {/* TEXT */}
            <div className="flex-1">
              <p className="text-[14px] text-[#1e293b]">
                <span className="font-semibold">
                  {activity?.productId?.title || "N/A"}
                </span>
              </p>

              <p className="text-[12px] text-[#94a3b8] mt-1">
                {activity?.createdAt
                  ? new Date(activity.createdAt).toLocaleString()
                  : "Unknown time"}
              </p>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}