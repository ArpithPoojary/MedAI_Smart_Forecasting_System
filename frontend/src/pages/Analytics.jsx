import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Boxes,
  Eye,
  X,
} from "lucide-react";

/* =====================================================
   AXIOS
===================================================== */

axios.defaults.baseURL = "http://127.0.0.1:8000";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =====================================================
   COLORS
===================================================== */

const COLORS = [
  "#6366f1",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#eab308",
  "#f97316",
  "#06b6d4",
];

/* =====================================================
   HELPERS
===================================================== */

const formatCurrency = (num) =>
  `₹${Number(num || 0).toLocaleString("en-IN")}`;

/* =====================================================
   SUMMARY CARD
   FIX: growth arrow and color now reflect real sign
===================================================== */

const Card = ({ title, value, change, icon, color }) => {
  const changeNum = Number(change || 0);
  const isPositive = changeNum >= 0;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium">{title}</p>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">{value}</h2>

          {/* FIX: direction arrow + color based on actual sign */}
          <p
            className={`text-xs mt-1 font-medium flex items-center gap-1 ${
              isPositive ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {isPositive ? "+" : ""}
            {changeNum}% vs last period
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   TABLE CARD
===================================================== */

const TableCard = ({ title, data, onViewAll }) => {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button
          onClick={onViewAll}
          className="text-indigo-600 text-xs font-semibold hover:underline flex items-center gap-1"
        >
          <Eye size={14} />
          View All
        </button>
      </div>

      {safeData.length > 0 ? (
        <div className="space-y-3">
          {safeData.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition"
            >
              <div>
                <p className="font-semibold text-sm text-slate-800">
                  {item.medicineName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Revenue:
                  <span className="font-medium ml-1">
                    {formatCurrency(item.revenue)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-indigo-600">
                  {Number(item.unitsSold).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-slate-400">units</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
          No data available
        </div>
      )}
    </div>
  );
};

/* =====================================================
   MODAL
===================================================== */

const Modal = ({ open, onClose, title, data }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {(data || []).map((item, index) => (
            <div
              key={index}
              className="border border-slate-100 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-slate-800">{item.medicineName}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Revenue:
                  <span className="font-semibold ml-1">
                    {formatCurrency(item.revenue)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-indigo-600">
                  {Number(item.unitsSold).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-400">Units Sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   MAIN
===================================================== */

const Analytics = () => {

  /* =====================================================
     DATE DEFAULTS
  ===================================================== */

  const today = new Date();
  const currentDay = today.toISOString().split("T")[0];
  const currentMonth = today.toISOString().slice(0, 7);
  const currentYear = String(today.getFullYear());

  /* =====================================================
     STATE
  ===================================================== */

  const [viewType, setViewType] = useState("month");
  const [value, setValue] = useState(currentMonth);

  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [leastSelling, setLeastSelling] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState({
    open: false,
    title: "",
    data: [],
  });

  /* =====================================================
     FILTER CHANGE
  ===================================================== */

  const handleFilterChange = (type) => {
    setViewType(type);
    if (type === "day") setValue(currentDay);
    else if (type === "month") setValue(currentMonth);
    else setValue(currentYear);
  };

  /* =====================================================
     FETCH
  ===================================================== */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { type: viewType, value };

      const [summaryRes, trendRes, topRes, leastRes, catRes] =
        await Promise.all([
          axios.get("/api/analytics/summary", { params }),
          axios.get("/api/analytics/trend", { params }),
          axios.get("/api/analytics/top-selling", { params }),
          axios.get("/api/analytics/least-selling", { params }),
          axios.get("/api/analytics/category-distribution", { params }),
        ]);

      setSummary(summaryRes.data || {});
      setTrend(Array.isArray(trendRes.data) ? trendRes.data : []);
      setTopSelling(Array.isArray(topRes.data) ? topRes.data : []);
      setLeastSelling(Array.isArray(leastRes.data) ? leastRes.data : []);
      setCategoryData(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewType, value]);

  /* =====================================================
     CHART DATA
     FIX: day view uses BarChart (medicine breakdown),
          month/year use LineChart (time series)
  ===================================================== */

  const chartData = (trend || []).map((item) => ({
    date: item.date || "",
    revenue: Number(item.revenue || 0),
    stockSold: Number(item.stockSold || 0),
  }));

  const isDayView = viewType === "day";

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-5">

      {/* MODAL */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, title: "", data: [] })}
        title={modal.title}
        data={modal.data}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track pharmacy performance
          </p>
        </div>

        <button
          onClick={fetchData}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:bg-slate-100 flex items-center gap-2 text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-5 flex flex-wrap gap-3 items-center">
        {["day", "month", "year"].map((type) => (
          <button
            key={type}
            onClick={() => handleFilterChange(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
              viewType === type
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {type}
          </button>
        ))}

        {viewType === "day" && (
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}

        {viewType === "month" && (
          <input
            type="month"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}

        {viewType === "year" && (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {["2024", "2025", "2026", "2027"].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={fetchData}
          className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
        >
          Apply
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-5 text-sm">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <Card
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          change={summary.totalRevenueChange}
          color="bg-indigo-100"
          icon={<IndianRupee className="text-indigo-600" size={20} />}
        />
        <Card
          title="Total Stock Sold"
          value={`${Number(summary.totalStockSold || 0).toLocaleString("en-IN")} Units`}
          change={summary.totalStockSoldChange}
          color="bg-blue-100"
          icon={<Boxes className="text-blue-600" size={20} />}
        />
      </div>

      {/* TREND CHART
          FIX: day view uses BarChart (per-medicine), month/year use LineChart (time series) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="text-indigo-600" size={18} />
          <h2 className="text-xl font-bold text-slate-800">
            {isDayView
              ? "Medicine Breakdown (Selected Day)"
              : "Revenue & Stock Sold Trend"}
          </h2>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>

            {/* DAY: BarChart per medicine — avoids broken single-point line */}
            {isDayView ? (
              <BarChart
                data={chartData}
                margin={{ bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(val, name) => {
                    if (name === "revenue")
                      return [formatCurrency(val), "Revenue"];
                    return [`${val} Units`, "Stock Sold"];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="revenue"
                />
                <Bar
                  yAxisId="right"
                  dataKey="stockSold"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="stockSold"
                />
              </BarChart>
            ) : (

              /* MONTH / YEAR: LineChart time series */
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(val, name) => {
                    if (name === "revenue")
                      return [formatCurrency(val), "Revenue"];
                    return [`${val} Units`, "Stock Sold"];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stockSold"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
            No trend data available
          </div>
        )}
      </div>

      {/* LOWER GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <TableCard
          title="Top Selling Medicines"
          data={topSelling}
          onViewAll={() =>
            setModal({
              open: true,
              title: "Top Selling Medicines",
              data: topSelling,
            })
          }
        />

        <TableCard
          title="Least Selling Medicines"
          data={leastSelling}
          onViewAll={() =>
            setModal({
              open: true,
              title: "Least Selling Medicines",
              data: leastSelling,
            })
          }
        />

        {/* CATEGORY PIE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Sales Distribution
          </h3>

          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="units"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [
                    `${Number(val).toLocaleString("en-IN")} units`,
                    "Units Sold",
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
              No category data
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Analytics;