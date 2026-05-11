import { useEffect, useState } from "react";
import API from "../../api/api";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

import {
  Users,
  UploadCloud,
  CheckCircle2,
  TrendingUp,
  FileText,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [trend, setTrend] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [statsRes, trendRes, uploadsRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get(`/admin/upload-trend?range=${range}`),
        API.get("/admin/uploads"),
      ]);

      setStats(statsRes.data?.data || {});
      setTrend(trendRes.data?.data || []);
      setUploads(uploadsRes.data?.data?.slice(0, 5) || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    {
      name: "Successful",
      value: stats.success_uploads || 0,
    },
    {
      name: "Failed",
      value: stats.failed_uploads || 0,
    },
    {
      name: "Processing",
      value: stats.processing_uploads || 0,
    },
  ];

  const COLORS = ["#22c55e", "#ef4444", "#facc15"];

  const totalUploads = stats.total_uploads || 1;

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-800">
          Dashboard 👑
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Monitor uploads, users and system analytics.
        </p>
      </div>

      {/* FILTER */}
      <div className="flex gap-2">
        {["7d", "30d", "90d"].map((item) => (
          <button
            key={item}
            onClick={() => setRange(item)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${
                range === item
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border text-slate-700 hover:bg-slate-50"
              }
            `}
          >
            {item === "7d"
              ? "7 Days"
              : item === "30d"
              ? "30 Days"
              : "90 Days"}
          </button>
        ))}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Total Users"
          value={stats.total_users || 0}
          sub="Registered users"
          icon={<Users size={20} />}
          color="blue"
        />

        <StatCard
          title="Total Uploads"
          value={stats.total_uploads || 0}
          sub="Dataset uploads"
          icon={<UploadCloud size={20} />}
          color="green"
        />

        <StatCard
          title="Successful Uploads"
          value={stats.success_uploads || 0}
          sub="Processed successfully"
          icon={<CheckCircle2 size={20} />}
          color="emerald"
        />

        <StatCard
          title="Success Rate"
          value={`${stats.success_rate || 0}%`}
          sub="Overall upload success"
          icon={<TrendingUp size={20} />}
          color="orange"
        />

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* TREND */}
        <Card className="xl:col-span-2">

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">
              Upload Trend
            </h2>
          </div>

          {loading ? (
            <Skeleton height="260px" />
          ) : trend.length === 0 ? (
            <Empty text="No trend data available" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient
                    id="colorSuccess"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#2563eb"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="#2563eb"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.08}
                />

                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="success"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* SYSTEM OVERVIEW */}
        <Card>

          <h2 className="text-lg font-semibold text-slate-800 mb-5">
            System Overview
          </h2>

          {loading ? (
            <Skeleton height="260px" />
          ) : (
            <div className="flex flex-col items-center">

              <div className="relative w-[180px] h-[180px]">

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {stats.total_uploads || 0}
                  </h2>

                  <p className="text-sm text-slate-400">
                    Total
                  </p>
                </div>

              </div>

              <div className="w-full mt-5 space-y-3">

                {pieData.map((item, i) => {
                  const percent = (
                    (item.value / totalUploads) *
                    100
                  ).toFixed(0);

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[i],
                          }}
                        />

                        <span className="text-sm text-slate-700">
                          {item.name}
                        </span>

                      </div>

                      <span className="text-sm font-semibold text-slate-800">
                        {percent}%
                      </span>

                    </div>
                  );
                })}

              </div>
            </div>
          )}
        </Card>

      </div>

      {/* RECENT UPLOADS */}
      <Card>

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-semibold text-slate-800">
            Recent Uploads
          </h2>

          <button className="text-blue-600 text-sm font-medium hover:underline">
            View All Uploads
          </button>

        </div>

        {loading ? (
          <Skeleton height="250px" />
        ) : uploads.length === 0 ? (
          <Empty text="No uploads found" />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="border-b text-slate-500 text-sm">

                  <th className="text-left py-3 font-medium">
                    File Name
                  </th>

                  <th className="text-left py-3 font-medium">
                    Uploaded By
                  </th>

                  <th className="text-left py-3 font-medium">
                    Status
                  </th>

                  <th className="text-left py-3 font-medium">
                    Uploaded At
                  </th>

                </tr>
              </thead>

              <tbody>

                {uploads.map((item, index) => (

                  <tr
                    key={index}
                    className="border-b last:border-none"
                  >

                    <td className="py-4">
                      <div className="flex items-center gap-2">

                        <FileText
                          size={16}
                          className="text-slate-400"
                        />

                        <span className="text-sm text-slate-700">
                          {item.filename}
                        </span>

                      </div>
                    </td>

                    <td className="py-4 text-sm text-slate-600">
                      User {item.user_id}
                    </td>

                    <td className="py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
                        ${
                          item.status === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.status}
                      </span>

                    </td>

                    <td className="py-4 text-sm text-slate-500">
                      {item.created_at || "-"}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </Card>

    </div>
  );
}


/* ================= COMPONENTS ================= */

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
}) {

  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            {value}
          </h2>

          <p className="text-xs text-slate-400 mt-2">
            {sub}
          </p>

        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

function Skeleton({ height }) {
  return (
    <div
      className="animate-pulse bg-slate-100 rounded-xl"
      style={{ height }}
    />
  );
}

function Empty({ text }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
      {text}
    </div>
  );
}