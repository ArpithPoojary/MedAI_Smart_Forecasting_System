import { useEffect, useState } from "react";
import { getAdminUsers, deleteUser } from "../../api/api";
import { MoreVertical, Trash2 } from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= LOAD USERS =================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAdminUsers();
      const data = res.data?.data || [];
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= SEARCH =================
  useEffect(() => {
    const result = users.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, users]);

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Users</h2>
        <p className="text-sm text-slate-500">
          Manage all registered users in the system.
        </p>
      </div>

      {/* ================= SEARCH ================= */}
      <div>
        <input
          type="text"
          placeholder="Search users..."
          className="w-72 px-4 py-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

        {loading ? (
          <div className="p-6 text-center text-slate-500">
            Loading users...
          </div>
        ) : (
          <table className="w-full text-sm">

            {/* HEADER */}
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="p-4 text-left">User</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Joined On</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-t hover:bg-slate-50 transition"
                >
                  {/* USER */}
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-700">{user.username}</span>
                  </td>

                  {/* EMAIL */}
                  <td className="p-4 text-slate-600">{user.email}</td>

                  {/* ROLE */}
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* JOINED */}
                  <td className="p-4 text-slate-500">
                    15 May 2025
                  </td>

                  {/* STATUS */}
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-600">
                      Active
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 flex items-center gap-3">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 transition"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button className="text-slate-500 hover:text-slate-700">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>

      {/* ================= FOOTER ================= */}
      <div className="flex justify-between items-center text-sm text-slate-500">

        <span>
          Showing {filtered.length} of {users.length} users
        </span>

        {/* PAGINATION MOCK */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border rounded-md text-slate-400">
            {"<"}
          </button>
          <button className="px-3 py-1 bg-blue-500 text-white rounded-md">
            1
          </button>
          <button className="px-3 py-1 border rounded-md text-slate-400">
            {">"}
          </button>
        </div>

      </div>

    </div>
  );
}