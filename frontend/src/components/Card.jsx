import React from "react";

export default function Card({
  title,
  value,
  status,
  icon: Icon,
  children,
  trend = "up",
}) {
  return (
    <div className="glass p-6 rounded-2xl border border-white/30 shadow-sm hover:shadow-lg transition-all duration-300">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">

        {/* LEFT */}
        <div className="flex items-center gap-3">

          {Icon && (
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Icon size={18} />
            </div>
          )}

          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {title || "N/A"}
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {value ?? 0}
            </h3>
          </div>

        </div>

        {/* RIGHT: STATUS */}
        {status && (
          <span
            className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
              trend === "up"
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {trend === "up" ? "↑" : "↓"} {status}
          </span>
        )}

      </div>

      {/* CHILD CONTENT */}
      {children && (
        <div className="mt-2 h-16 w-full">
          {children}
        </div>
      )}

    </div>
  );
}