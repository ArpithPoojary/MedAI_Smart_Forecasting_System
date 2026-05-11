import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UploadCloud,
  FileText,
  X,
  Trash2,
  History,
} from "lucide-react";

import {
  uploadFile,
  getUploadHistory,
  deleteUploadHistory,
} from "../api/api";

import toast from "react-hot-toast";

export default function UploadData() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [dragActive, setDragActive] =
    useState(false);

  const [history, setHistory] =
    useState([]);

  const [loadingHistory, setLoadingHistory] =
    useState(true);

  // DELETE MODAL

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [selectedDelete, setSelectedDelete] =
    useState(null);

  // ================================================
  // FETCH HISTORY
  // ================================================

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);

      const res =
        await getUploadHistory();

      setHistory(res.data.data || []);
    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to load upload history"
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  // ================================================
  // FILE CHANGE
  // ================================================

  const handleFileChange = (e) => {
    const selectedFile =
      e.target.files[0];

    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(
        ".csv"
      )
    ) {
      toast.error(
        "Only CSV files are allowed"
      );
      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      toast.error(
        "File must be less than 10MB"
      );
      return;
    }

    setFile(selectedFile);
  };

  // ================================================
  // UPLOAD
  // ================================================

  const handleUpload = async () => {
    if (!file || uploading) return;

    try {
      setUploading(true);

      const res = await uploadFile(file);

      toast.success(
        "Upload successful 🚀"
      );

      setFile(null);

      fetchHistory();

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (err) {
      console.error(err);

      const errorMsg =
        err?.response?.data?.detail ||
        err?.message ||
        "Upload failed";

      toast.error(errorMsg);

    } finally {
      setUploading(false);
    }
  };

  // ================================================
  // DELETE HISTORY
  // ================================================

  const handleDelete = async () => {
    try {
      await deleteUploadHistory(
        selectedDelete
      );

      toast.success(
        "Upload history deleted"
      );

      fetchHistory();

      setShowDeleteModal(false);

    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to delete history"
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 relative">

      {/* ========================================== */}
      {/* DELETE MODAL */}
      {/* ========================================== */}

      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">

              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Delete Upload
              </h2>

              <p className="text-slate-500 mb-8">
                Are you sure you want to
                delete this upload history?
              </p>

              <div className="flex gap-4">

                <button
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                  className="flex-1 py-3 rounded-2xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="text-center space-y-2">

        <h1 className="text-4xl font-bold text-slate-800">
          Upload Sales Data
        </h1>

        <p className="text-slate-500 max-w-md mx-auto">
          Upload your pharmacy CSV file
          to train the AI forecasting
          model.
        </p>
      </div>

      {/* ========================================== */}
      {/* UPLOAD BOX */}
      {/* ========================================== */}

      <div
        className={`relative bg-white border-2 border-dashed rounded-3xl p-12 transition-all
        ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 hover:border-blue-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() =>
          setDragActive(false)
        }
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);

          handleFileChange({
            target: {
              files:
                e.dataTransfer.files,
            },
          });
        }}
      >

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center space-y-4">

          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">

            <UploadCloud size={48} />
          </div>

          <div className="text-center">

            <p className="text-lg font-semibold text-slate-700">

              {file
                ? file.name
                : "Drag & drop your CSV file"}
            </p>

            <p className="text-sm text-slate-400">
              CSV only • Max 10MB
            </p>
          </div>

          {file && !uploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-xs text-red-500 hover:underline flex items-center gap-1"
            >
              <X size={12} />
              Remove file
            </button>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* ACTION */}
      {/* ========================================== */}

      <div className="flex justify-center">

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-10 py-3 rounded-2xl font-bold transition
          ${
            !file || uploading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >

          {uploading
            ? "Processing..."
            : "Process Data"}
        </button>
      </div>

      {/* ========================================== */}
      {/* CSV INFO */}
      {/* ========================================== */}

      <div className="p-6 bg-slate-50 rounded-2xl border flex gap-4">

        <FileText
          className="text-slate-400"
          size={24}
        />

        <div>

          <h4 className="text-sm font-bold text-slate-800">
            Required CSV Format
          </h4>

          <p className="text-xs text-slate-500 mt-1">
            Date, Product_Name,
            Category, Quantity_Sold,
            Unit_Price, Current_Stock,
            Reorder_Level,
            Expiry_Date
          </p>
        </div>
      </div>

      {/* ========================================== */}
      {/* HISTORY */}
      {/* ========================================== */}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

        <div className="flex items-center gap-3 mb-6">

          <History className="text-blue-600" />

          <h2 className="text-2xl font-bold text-slate-800">
            Upload History
          </h2>
        </div>

        {loadingHistory ? (
          <p className="text-slate-500">
            Loading history...
          </p>
        ) : history.length === 0 ? (
          <p className="text-slate-500">
            No uploads found
          </p>
        ) : (
          <div className="space-y-4">

            {history.map(
              (item, index) => (
                <div
                  key={index}
                  className="border border-slate-100 rounded-2xl p-5 flex items-center justify-between"
                >

                  <div>

                    <h3 className="font-bold text-slate-800">
                      {item.filename}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {item.records} records
                      • {item.uploaded_at}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        item.status ===
                        "success"
                          ? "bg-emerald-100 text-emerald-600"
                          : item.status ===
                            "failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {item.status}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedDelete(
                          item.id
                        );

                        setShowDeleteModal(
                          true
                        );
                      }}
                      className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}