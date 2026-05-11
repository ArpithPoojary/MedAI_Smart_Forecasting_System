import { useEffect, useState, useRef } from "react";
import { getWeather, getDashboard } from "../api/data";
import {
  Search,
  Bell,
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [weather, setWeather] = useState(null);
  const [alertsCount, setAlertsCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef();
  const { user, logout } = useAuth();

  const username = user?.username || "User";

  // 🌦 FETCH WEATHER
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await getWeather();

        // ✅ handle axios/fetch response
        const data = res?.data || res;

        setWeather(data);
      } catch (err) {
        console.error("Weather error:", err);

        setWeather({
          location: "Unknown",
          temperature: "--",
          condition: "Sunny",
        });
      }
    };

    fetchWeather();

    // 🔄 auto refresh every 10 min
    const interval = setInterval(fetchWeather, 600000);

    return () => clearInterval(interval);
  }, []);

  // 🔔 FETCH ALERT COUNT
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await getDashboard();

        const data = res?.data || res;

        const alerts = data?.low_stock_alerts || [];

        setAlertsCount(alerts.length);
      } catch (err) {
        console.error("Alert fetch error:", err);
        setAlertsCount(0);
      }
    };

    fetchAlerts();
  }, []);

  // 🔽 CLOSE DROPDOWN
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // 🌤 WEATHER ICON
  const getWeatherIcon = () => {
    if (!weather?.condition)
      return (
        <Sun
          size={14}
          className="text-orange-400"
        />
      );

    const condition = weather.condition.toLowerCase();

    if (condition.includes("rain")) {
      return (
        <CloudRain
          size={14}
          className="text-blue-500"
        />
      );
    }

    if (condition.includes("cloud")) {
      return (
        <Cloud
          size={14}
          className="text-gray-500"
        />
      );
    }

    return (
      <Sun
        size={14}
        className="text-orange-400"
      />
    );
  };

  return (
    <div className="glass px-5 py-3 flex justify-between items-center border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-40">

      {/* 🔍 SEARCH */}
      <div className="relative w-72 group">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500"
          size={16}
        />

        <input
          type="text"
          placeholder="Search medicines..."
          className="
            w-full
            bg-white/70
            rounded-xl
            py-2
            pl-10
            pr-4
            text-sm
            border
            border-slate-200
            focus:ring-2
            focus:ring-blue-100
            focus:border-blue-300
            outline-none
            transition-all
          "
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* 🌦 WEATHER */}
        <div className="flex items-center gap-3 bg-white/70 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">

          <MapPin
            size={14}
            className="text-blue-500"
          />

          {/* ✅ REAL LOCATION */}
          <span className="text-xs font-semibold text-slate-700">
            {weather?.location || "Loading..."}
          </span>

          <div className="h-4 w-[1px] bg-slate-300" />

          {getWeatherIcon()}

          {/* ✅ REAL TEMP */}
          <span className="text-xs text-slate-600">
            {weather?.temperature !== undefined
              ? `${weather.temperature}°C`
              : "--°C"}
          </span>
        </div>

        {/* 🔔 NOTIFICATIONS */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="
            relative
            p-2
            rounded-xl
            text-slate-500
            hover:bg-white/60
            cursor-pointer
            transition-all
          "
        >
          <Bell size={18} />

          {alertsCount > 0 && (
            <span
              className="
                absolute
                -top-1
                -right-1
                bg-red-500
                text-white
                text-[10px]
                px-1.5
                py-[1px]
                rounded-full
                font-medium
              "
            >
              {alertsCount}
            </span>
          )}
        </motion.div>

        {/* 👤 PROFILE */}
        <div
          ref={dropdownRef}
          className="relative flex items-center gap-3 cursor-pointer"
          onClick={() =>
            setDropdownOpen(!dropdownOpen)
          }
        >

          {/* USER INFO */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-800">
              {username}
            </p>

            <p className="text-xs text-slate-400">
              User
            </p>
          </div>

          {/* AVATAR */}
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-gradient-to-br
              from-blue-500
              to-indigo-600
              flex
              items-center
              justify-center
              text-white
              shadow-md
            "
          >
            <User size={17} />
          </div>

          {/* 🔽 DROPDOWN */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                }}
                transition={{ duration: 0.2 }}
                className="
                  absolute
                  right-0
                  top-14
                  w-44
                  bg-white
                  border
                  border-slate-200
                  rounded-xl
                  shadow-lg
                  p-2
                  z-50
                "
              >
                <button
                  onClick={logout}
                  className="
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    w-full
                    text-sm
                    text-red-500
                    hover:bg-red-50
                    rounded-lg
                    transition-all
                  "
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}