import { useEffect, useState } from "react";
import API from "../api/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  IndianRupee,
  Boxes,
  AlertTriangle,
  CalendarClock,
  Activity,
  TrendingUp,
  Eye,
  Bell,
  Package,
  X,
} from "lucide-react";

const COLORS = [
  "#4F46E5",
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
];

export default function Dashboard() {

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // MODAL
  // =====================================================

  const [showModal, setShowModal] =
    useState(false);

  const [modalType, setModalType] =
    useState("");

  const [modalTitle, setModalTitle] =
    useState("");

  // =====================================================
  // FETCH DASHBOARD
  // =====================================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await API.get(
        "/dashboard/"
      );

      setDashboard(response.data);

    } catch (err) {

      console.error(
        "Dashboard Error:",
        err
      );

      setError(
        err?.message ||
        "Failed to load dashboard"
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================================================
  // DATA
  // =====================================================

  const summary =
    dashboard?.summary || {};

  const revenueTrend =
    dashboard?.revenue_trend || [];

  const categoryData =
    dashboard?.category_percentages || [];

  const topSelling =
    dashboard?.top_selling || [];

  const lowStock =
    dashboard?.low_stock_medicines || [];

  const expiringSoon =
    dashboard?.expiring_soon || [];

  const alerts =
    dashboard?.alerts || [];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">

        <div className="bg-white rounded-3xl px-8 py-6 shadow-sm">

          <p className="text-lg font-medium text-slate-600">
            Loading Dashboard...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb] p-6">

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-red-100 max-w-md w-full text-center">

          <AlertTriangle
            className="mx-auto text-red-500 mb-4"
            size={40}
          />

          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Dashboard Error
          </h2>

          <p className="text-slate-500 mb-6">
            {error}
          </p>

          <button
            onClick={fetchDashboard}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-all"
          >
            Retry
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // SUMMARY CARD
  // =====================================================

  const SummaryCard = ({
    title,
    value,
    subtitle,
    icon,
    color,
  }) => (

    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-slate-500 text-sm font-medium">
            {title}
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-2">
            {value}
          </h2>

          <p className="text-sm text-emerald-500 mt-2 font-medium">
            {subtitle}
          </p>

        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );

  // =====================================================
  // MAIN
  // =====================================================

  return (

    <div className="min-h-screen bg-[#f5f7fb] p-4 md:p-6 xl:p-8 relative">

      {/* ================================================= */}
      {/* BLUR BACKGROUND */}
      {/* ================================================= */}

      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"></div>
      )}

      {/* ================================================= */}
      {/* MODAL */}
      {/* ================================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl p-8 max-h-[85vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-8">

              <h2 className="text-3xl font-bold text-slate-800">
                {modalTitle}
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>

            </div>

            {/* ================================================= */}
            {/* TOP SOLD MODAL */}
            {/* ================================================= */}

            {modalType === "top" && (

              <div className="space-y-4">

                {topSelling.map(
                  (medicine, index) => (

                    <div
                      key={index}
                      className="border border-slate-100 rounded-2xl p-5 flex items-center justify-between"
                    >

                      <div>

                        <h3 className="font-bold text-lg text-slate-800">
                          {medicine.medicine_name}
                        </h3>

                        <p className="text-slate-500 mt-1">
                          {medicine.units_sold} Units Sold
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-sm text-slate-500">
                          Revenue
                        </p>

                        <p className="text-lg font-bold text-emerald-600">
                          ₹{medicine.revenue}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

            {/* ================================================= */}
            {/* LOW STOCK MODAL */}
            {/* ================================================= */}

            {modalType === "stock" && (

              <div className="space-y-4">

                {lowStock.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="border border-slate-100 rounded-2xl p-5 flex items-center justify-between"
                    >

                      <div>

                        <h3 className="font-bold text-lg text-slate-800">
                          {item.medicine_name}
                        </h3>

                        <div className="flex gap-6 mt-2 text-sm text-slate-500">

                          <p>
                            Stock:
                            <span className="font-semibold text-slate-700 ml-1">
                              {item.current_stock}
                            </span>
                          </p>

                          <p>
                            Reorder Level:
                            <span className="font-semibold text-slate-700 ml-1">
                              {item.reorder_level}
                            </span>
                          </p>

                        </div>

                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold
                        ${
                          item.status === "Critical"
                            ? "bg-red-100 text-red-600"
                            : item.status === "Low"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {item.status}
                      </span>

                    </div>
                  )
                )}

              </div>
            )}

            {/* ================================================= */}
            {/* EXPIRY MODAL */}
            {/* ================================================= */}

            {modalType === "expiry" && (

              <div className="space-y-4">

                {expiringSoon.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="border border-slate-100 rounded-2xl p-5 flex items-center justify-between"
                    >

                      <div>

                        <h3 className="font-bold text-lg text-slate-800">
                          {item.medicine_name}
                        </h3>

                        <p className="text-slate-500 mt-2">
                          Expiry Date:
                          <span className="font-semibold text-slate-700 ml-2">
                            {item.expiry_date}
                          </span>
                        </p>

                      </div>

                      <span className="px-4 py-2 rounded-full bg-rose-100 text-rose-600 text-sm font-semibold">
                        Expiring Soon
                      </span>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-slate-900">
          Dashboard Overview
        </h1>

        <p className="text-slate-500 mt-2 text-lg">
          Overview of your medical store performance
        </p>

      </div>

      {/* ================================================= */}
      {/* ALERTS */}
      {/* ================================================= */}

      {alerts.length > 0 && (

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-8">

          <div className="flex items-center gap-3 mb-4">

            <Bell className="text-amber-500" />

            <h3 className="font-bold text-xl text-slate-800">
              Smart Alerts
            </h3>

          </div>

          <div className="space-y-3">

            {alerts.map(
              (alert, index) => (

                <div
                  key={index}
                  className="text-slate-600 text-sm"
                >
                  • {alert?.message}
                </div>
              )
            )}

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* KPI */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">

        <SummaryCard
          title="Total Revenue"
          value={`₹${summary?.total_revenue || 0}`}
          subtitle={`${summary?.monthly_growth || 0}% vs last month`}
          color="bg-indigo-100"
          icon={
            <IndianRupee
              className="text-indigo-600"
              size={22}
            />
          }
        />

        <SummaryCard
          title="Units Sold"
          value={summary?.total_sales || 0}
          subtitle="Monthly sales"
          color="bg-emerald-100"
          icon={
            <TrendingUp
              className="text-emerald-600"
              size={22}
            />
          }
        />

        <SummaryCard
          title="Inventory Value"
          value={`₹${summary?.inventory_value || 0}`}
          subtitle="Current inventory"
          color="bg-sky-100"
          icon={
            <Boxes
              className="text-sky-600"
              size={22}
            />
          }
        />

        <SummaryCard
          title="Low Stock Alerts"
          value={summary?.low_stock_count || 0}
          subtitle="Need attention"
          color="bg-amber-100"
          icon={
            <AlertTriangle
              className="text-amber-600"
              size={22}
            />
          }
        />

        <SummaryCard
          title="Expiring Soon"
          value={summary?.expiring_count || 0}
          subtitle="Within 60 days"
          color="bg-rose-100"
          icon={
            <CalendarClock
              className="text-rose-600"
              size={22}
            />
          }
        />

        <SummaryCard
          title="Inventory Health"
          value={`${summary?.inventory_health || 0}%`}
          subtitle="Healthy inventory"
          color="bg-violet-100"
          icon={
            <Activity
              className="text-violet-600"
              size={22}
            />
          }
        />

      </div>

      {/* ================================================= */}
      {/* CHARTS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">

        {/* REVENUE */}

        <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[450px]">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Revenue Trend
          </h2>

          <div className="w-full h-[350px]">

            {revenueTrend.length > 0 && (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart data={revenueTrend}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={4}
                  />

                </LineChart>

              </ResponsiveContainer>
            )}

          </div>

        </div>

        {/* CATEGORY */}

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[450px]">

          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Sales by Category
          </h2>

          <div className="w-full h-[350px]">

            {categoryData.length > 0 && (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={categoryData}
                    dataKey="percentage"
                    nameKey="category"
                    innerRadius={70}
                    outerRadius={110}
                  >

                    {categoryData.map(
                      (entry, index) => (

                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                              COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>
            )}

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* LOWER SECTION */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* TOP SOLD */}

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold text-slate-800">
              Top Sold Medicines
            </h2>

            <button
              onClick={() => {

                setModalType("top");

                setModalTitle(
                  "Top Sold Medicines"
                );

                setShowModal(true);

              }}
              className="text-indigo-600 font-semibold flex items-center gap-2"
            >
              <Eye size={18} />
              View All
            </button>

          </div>

          <div className="space-y-4">

            {topSelling
              .slice(0, 4)
              .map((medicine, index) => (

                <div
                  key={index}
                  className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between"
                >

                  <div>

                    <div className="flex items-center gap-2">

                      <Package
                        className="text-indigo-500"
                        size={18}
                      />

                      <h3 className="font-bold text-slate-800">
                        {medicine.medicine_name}
                      </h3>

                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      {medicine.units_sold} Sold
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="font-bold text-emerald-600">
                      ₹{medicine.revenue}
                    </p>

                  </div>

                </div>
              ))}

          </div>

        </div>

        {/* LOW STOCK */}

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold text-slate-800">
              Low Stock Medicines
            </h2>

            <button
              onClick={() => {

                setModalType("stock");

                setModalTitle(
                  "Low Stock Medicines"
                );

                setShowModal(true);

              }}
              className="text-indigo-600 font-semibold flex items-center gap-2"
            >
              <Eye size={18} />
              View All
            </button>

          </div>

          <div className="space-y-4">

            {lowStock
              .slice(0, 4)
              .map((item, index) => (

                <div
                  key={index}
                  className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between"
                >

                  <div>

                    <h3 className="font-bold text-slate-800">
                      {item.medicine_name}
                    </h3>

                    <div className="flex gap-4 mt-2 text-sm text-slate-500">

                      <p>
                        Stock:
                        <span className="font-semibold text-slate-700 ml-1">
                          {item.current_stock}
                        </span>
                      </p>

                      <p>
                        Reorder:
                        <span className="font-semibold text-slate-700 ml-1">
                          {item.reorder_level}
                        </span>
                      </p>

                    </div>

                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      item.status === "Critical"
                        ? "bg-red-100 text-red-600"
                        : item.status === "Low"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {item.status}
                  </span>

                </div>
              ))}

          </div>

        </div>

        {/* EXPIRY */}

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold text-slate-800">
              Expiry Alerts
            </h2>

            <button
              onClick={() => {

                setModalType("expiry");

                setModalTitle(
                  "Expiry Alerts"
                );

                setShowModal(true);

              }}
              className="text-indigo-600 font-semibold flex items-center gap-2"
            >
              <Eye size={18} />
              View All
            </button>

          </div>

          <div className="space-y-4">

            {expiringSoon
              .slice(0, 4)
              .map((item, index) => (

                <div
                  key={index}
                  className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between"
                >

                  <div>

                    <h3 className="font-bold text-slate-800">
                      {item.medicine_name}
                    </h3>

                    <p className="text-sm text-slate-500 mt-2">
                      Expiry:
                      <span className="font-semibold text-slate-700 ml-2">
                        {item.expiry_date}
                      </span>
                    </p>

                  </div>

                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-semibold">
                    Expiring
                  </span>

                </div>
              ))}

          </div>

        </div>

      </div>

    </div>
  );
}