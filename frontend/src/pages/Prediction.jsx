import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  IndianRupee,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

/* ======================================================
   COLORS
====================================================== */

const COLORS = [
  "#4f46e5",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

/* ======================================================
   CARD
====================================================== */

const Card = ({ title, children, onViewAll }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-[20px] font-bold text-slate-800">{title}</h2>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-indigo-600 text-sm font-semibold hover:underline"
        >
          View All
        </button>
      )}
    </div>
    {children}
  </div>
);

/* ======================================================
   TABLE
====================================================== */

const Table = ({ columns, data, emptyText = "No data available" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400">{emptyText}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            {columns.map((col, idx) => (
              <th key={idx} className="pb-3 font-semibold whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-slate-100 hover:bg-slate-50 transition"
            >
              {columns.map((col, i) => (
                <td key={i} className="py-4 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ======================================================
   MODAL
====================================================== */

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[85vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 text-xl"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
};

/* ======================================================
   MAIN
====================================================== */

const Prediction = () => {
  const [data, setData] = useState({
    summary: {},
    forecast: [],
    restock: [],
    expiry: [],
    overstock: [],
    fastMoving: [],
    categoryDemand: [],
    aiInsights: [],
    forecastDays: 30,
  });

  const [loading, setLoading] = useState(false);

  // FIX: error state to surface API failures to the user
  const [error, setError] = useState(null);

  const [modal, setModal] = useState({ open: false, type: "" });

  // FIX: demand derived once, used for sign logic and color
  const demand = Number(data.summary?.predictedDemand || 0);

  /* ======================================================
     FETCH
  ====================================================== */

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://127.0.0.1:8000/predict/insights",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // FIX: clear error on successful fetch
      setError(null);

      setData({
        summary: res.data?.summary || {},
        forecast: res.data?.forecast || [],
        restock: res.data?.restock || [],
        expiry: res.data?.expiry || [],
        overstock: res.data?.overstock || [],
        fastMoving: res.data?.fastMoving || [],
        categoryDemand: res.data?.categoryDemand || [],
        aiInsights: res.data?.aiInsights || [],
        forecastDays: res.data?.forecastDays || 30,
      });
    } catch (err) {
      console.error("Prediction API Error:", err);
      // FIX: set error message so user knows fetch failed
      setError("Failed to load prediction data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ======================================================
     TABLES
  ====================================================== */

  const restockCols = [
    {
      header: "Medicine",
      render: (r) => (
        <span className="font-semibold text-slate-700">{r.medicineName}</span>
      ),
    },
    {
      header: "Stock",
      accessor: "stock",
    },
    {
      header: `Demand (${data.forecastDays}d)`,
      accessor: "demand",
    },
    {
      header: "Reorder",
      render: (r) => (
        <span className="text-red-500 font-semibold">{r.required}</span>
      ),
    },
    {
      header: "Days Left",
      render: (r) => (
        <span className="font-semibold text-slate-700">{r.daysLeft}</span>
      ),
    },
    {
      header: "Risk",
      render: (r) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            r.risk === "HIGH"
              ? "bg-red-100 text-red-600"
              : r.risk === "MEDIUM"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {r.risk}
        </span>
      ),
    },
  ];

  const expiryCols = [
    {
      header: "Medicine",
      render: (r) => (
        <span className="font-semibold text-slate-700">{r.medicineName}</span>
      ),
    },
    {
      header: "Batch",
      accessor: "batch",
    },
    {
      header: "Expiry",
      // FIX: timezone-safe date parsing — avoids UTC midnight shifting date
      render: (r) => {
        const [y, m, d] = r.expiryDate.split("-");
        return new Date(y, m - 1, d).toLocaleDateString();
      },
    },
    {
      header: "Days Left",
      render: (r) => (
        <span className="text-red-500 font-semibold">{r.daysLeft}</span>
      ),
    },
  ];

  const overstockCols = [
    {
      header: "Medicine",
      render: (r) => (
        <div className="font-semibold text-slate-700">
          {r.medicineName || "-"}
        </div>
      ),
    },
    {
      header: "Current Stock",
      render: (r) => (
        <div className="font-semibold text-slate-700">{r.stock ?? 0}</div>
      ),
    },
    {
      header: "30D Demand",
      render: (r) => (
        <div className="font-semibold text-blue-600">
          {r.expectedDemand ?? 0}
        </div>
      ),
    },
    {
      header: "Excess Stock",
      render: (r) => (
        <div className="font-semibold text-orange-500">{r.excess ?? 0}</div>
      ),
    },
    {
      header: "Coverage",
      render: (r) => (
        <div className="font-semibold text-slate-700">
          {r.coverageDays || 0} days
        </div>
      ),
    },
    {
      header: "Utilization",
      render: (r) => {
        const utilization = Number(r.utilization || 0);
        return (
          <div className="flex items-center gap-3 min-w-[150px]">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  utilization < 40
                    ? "bg-red-500"
                    : utilization < 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <span
              className={`text-xs font-bold ${
                utilization < 40
                  ? "text-red-500"
                  : utilization < 70
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {utilization.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      header: "Severity",
      render: (r) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            r.severity === "HIGH"
              ? "bg-red-100 text-red-600"
              : r.severity === "MEDIUM"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {r.severity}
        </span>
      ),
    },
  ];

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Prediction & Insights
          </h1>
          <p className="text-slate-500 mt-2 text-base">
            AI-powered inventory forecasting
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-5 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 hover:bg-slate-100 transition"
        >
          <RefreshCw
            size={18}
            className={loading ? "animate-spin" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* FIX: error banner — shown when API call fails */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* FIX: demand card — correct sign and color for negative values */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Predicted Demand</p>
            <h2
              className={`text-3xl font-bold ${
                demand >= 0 ? "text-slate-800" : "text-red-500"
              }`}
            >
              {demand >= 0 ? "+" : ""}
              {demand.toFixed(1)}%
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
            <IndianRupee size={22} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Potential Revenue</p>
            <h2 className="text-3xl font-bold text-slate-800">
              {data.summary?.revenue || "₹0"}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">High Risk</p>
            <h2 className="text-3xl font-bold text-slate-800">
              {data.summary?.highRisk || 0}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <CalendarDays size={22} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Updated At</p>
            <h2 className="text-2xl font-bold text-slate-800">
              {data.summary?.updatedAt || "--"}
            </h2>
          </div>
        </div>

      </div>

      {/* FORECAST CHART */}
      <Card title={`Demand Forecast (${data.forecastDays} Days)`}>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.forecast}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#4f46e5"
                fill="url(#forecastFill)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* RESTOCK + EXPIRY TABLES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title="Restock Recommendations"
          onViewAll={() => setModal({ open: true, type: "restock" })}
        >
          <Table
            columns={restockCols}
            data={data.restock.slice(0, 5)}
          />
        </Card>

        <Card
          title="Expiry Alerts"
          onViewAll={() => setModal({ open: true, type: "expiry" })}
        >
          <Table
            columns={expiryCols}
            data={data.expiry.slice(0, 5)}
          />
        </Card>
      </div>

      {/* FAST MOVING + OVERSTOCK + CATEGORY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* FAST MOVING */}
        <Card title="Fast Moving Medicines">
          <div className="space-y-5">
            {data.fastMoving?.length > 0 ? (
              data.fastMoving.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-700">
                      {item.medicineName}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Demand increasing
                    </p>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-green-600">
                    <ArrowUpRight size={18} />
                    +{item.growth}%
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No fast moving medicines</p>
            )}
          </div>
        </Card>

        {/* OVERSTOCK CARDS */}
        <Card
          title="Overstock Warnings"
          onViewAll={() => setModal({ open: true, type: "overstock" })}
        >
          {data.overstock?.length > 0 ? (
            <div className="space-y-5">
              {data.overstock.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-100 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {item.medicineName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {item.coverageDays} days stock coverage
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.severity === "HIGH"
                          ? "bg-red-100 text-red-600"
                          : item.severity === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-xs text-slate-400">Stock</p>
                      <p className="font-bold text-slate-700">{item.stock}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-xs text-slate-400">Demand</p>
                      <p className="font-bold text-blue-600">
                        {item.expectedDemand}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-xs text-slate-400">Excess</p>
                      <p className="font-bold text-orange-500">{item.excess}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-500">Utilization</span>
                      <span className="font-bold text-slate-700">
                        {item.utilization}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.utilization < 40
                            ? "bg-red-500"
                            : item.utilization < 70
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(item.utilization, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-lg">
              No overstock risk detected
            </div>
          )}
        </Card>

        {/* CATEGORY PIE */}
        <Card title="Category Demand">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDemand}
                  dataKey="growth"
                  nameKey="category"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {data.categoryDemand.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* OVERSTOCK BAR CHART */}
      {data.overstock?.length > 0 && (
        <Card title="Overstock Analysis">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.overstock.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="medicineName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Bar
                  dataKey="expectedDemand"
                  fill="#4f46e5"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* AI INSIGHTS */}
      <Card title="AI Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.aiInsights?.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 flex gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-purple-600 shadow-sm">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {item.title}
                </h3>
                <p className="text-slate-600 mt-1">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* MODAL */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, type: "" })}
        title={`View All ${modal.type}`}
      >
        {modal.type === "restock" && (
          <Table columns={restockCols} data={data.restock} />
        )}
        {modal.type === "expiry" && (
          <Table columns={expiryCols} data={data.expiry} />
        )}
        {modal.type === "overstock" && (
          <Table
            columns={overstockCols}
            data={data.overstock}
            emptyText="No overstock risk detected"
          />
        )}
      </Modal>

    </div>
  );
};

export default Prediction;
