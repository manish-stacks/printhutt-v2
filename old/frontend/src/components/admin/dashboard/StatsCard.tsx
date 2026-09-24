import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export function StatsCard({
  title,
  value,
  icon,
  color,
}: StatsCardProps) {
  return (
    <div className="group rounded-[18px] border border-[#eef0f4] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-start justify-between">

        {/* TEXT */}
        <div>
          <p className="text-[13px] font-medium text-[#64748b]">
            {title}
          </p>

          <p className="mt-2 text-[28px] font-bold text-[#1e293b]">
            {value}
          </p>
        </div>

        {/* ICON */}
       <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-white shadow-md ${color}`}>
          <i className={`${icon} text-[22px]`} />
        </div>

      </div>
    </div>
  );
}