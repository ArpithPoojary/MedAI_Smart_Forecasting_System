import { useContext, useState } from "react";
import { User, ShieldCheck } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { changePassword } from "../api/api";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, logout } = useContext(AuthContext);

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const { current_password, new_password, confirm_password } = form;

    if (!current_password || !new_password || !confirm_password) {
      return toast.error("All fields are required");
    }

    if (new_password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (new_password !== confirm_password) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      await changePassword({
        current_password,
        new_password,
      });

      toast.success("Password updated successfully 🎉");

      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

    } catch (err) {
      toast.error(err?.detail || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Loading state
  if (user === undefined) {
    return (
      <div className="flex justify-center items-center h-full text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* 🔷 HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your profile and security settings
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* 👤 PROFILE */}
        <div className="bg-white p-6 rounded-3xl shadow border text-center">
          <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <User size={40} />
          </div>

          <h3 className="font-bold text-slate-800">
            {user?.username || "User"}
          </h3>

          <p className="text-xs text-slate-400 uppercase mt-1">
            {user?.role || "User"}
          </p>

          <button
            onClick={logout}
            className="mt-4 text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* 🔐 PASSWORD */}
        <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow border">

          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="text-blue-600" size={20} />
            <h3 className="font-bold text-slate-800">
              Security & Password
            </h3>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">

            <div>
              <label className="text-xs font-semibold text-slate-400 ml-1">
                Current Password
              </label>
              <input
                type="password"
                name="current_password"
                value={form.current_password}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="password"
                name="new_password"
                placeholder="New Password"
                value={form.new_password}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm Password"
                value={form.confirm_password}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-4 px-6 py-2.5 text-sm font-bold rounded-xl transition ${
                loading
                  ? "bg-slate-300 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}