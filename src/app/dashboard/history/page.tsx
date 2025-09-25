"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Tag,
  FileText,
  StickyNote,
  UserCog,
  CheckCircle,
  XCircle,
  UserPen,
  Hash,
  Info,
} from "lucide-react";

interface History {
  history_id: number;
  appointment_id: number;
  client_name: string;
  service_name: string;
  service_price: number;
  service_category: string;
  service_description: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: string;
  staff_id: number | null;
  changed_by: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<History | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axiosInstance.get("/history");
        setHistory(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <section className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-[Soligant] mb-4 text-[#3e2e3d]">
          Appointment History
        </h1>
        <p className="text-[#5f4b5a] text-sm md:text-base">
          View all past versions of appointments. Click the info icon for
          details.
        </p>
      </div>

      {/* History Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500">
          No appointment history found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-[#e6dede] bg-white/80 shadow backdrop-blur-md rounded-xl">
            <thead className="bg-[#f6e9da] text-[#3e2e3d] text-left">
              <tr>
                <th className="px-4 py-3 text-sm">Client</th>
                <th className="px-4 py-3 text-sm">Service</th>
                <th className="px-4 py-3 text-sm">Date</th>
                <th className="px-4 py-3 text-sm">Time</th>
                <th className="px-4 py-3 text-sm">Status</th>
                <th className="px-4 py-3 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr
                  key={h.history_id}
                  className="border-t border-[#e6dede] hover:bg-[#fdf6f2]/70"
                >
                  {/* Client */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-[#5f4b5a]" />
                      {h.client_name}
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Scissors size={16} className="text-[#5f4b5a]" />
                      {h.service_name}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#5f4b5a]" />
                      {new Date(h.appointment_date).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#5f4b5a]" />
                      {h.start_time} - {h.end_time}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-sm font-semibold text-[#5f4b5a]">
                    <div className="flex items-center gap-2">
                      {h.status === "confirmed" ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : h.status === "declined" ? (
                        <XCircle size={16} className="text-red-600" />
                      ) : (
                        <Clock size={16} className="text-gray-500" />
                      )}
                      {h.status}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-sm text-center">
                    <button
                      onClick={() => setSelected(h)}
                      className="p-2 rounded-full bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition"
                      title="View Details"
                    >
                      <Info size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be] rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <h2 className="text-2xl font-[Soligant] text-[#3e2e3d] mb-4">
              Appointment Details
            </h2>

            <div className="space-y-3 text-sm text-[#3e2e3d]">
              <p className="flex items-center gap-2">
                <Hash size={16} /> <b>ID:</b> {selected.appointment_id}
              </p>
              <p className="flex items-center gap-2">
                <User size={16} /> <b>Client:</b> {selected.client_name}
              </p>
              <p className="flex items-center gap-2">
                <Scissors size={16} /> <b>Service:</b> {selected.service_name} ($
                {selected.service_price})
              </p>
              <p className="flex items-center gap-2">
                <Tag size={16} /> <b>Category:</b> {selected.service_category}
              </p>
              <p className="flex items-center gap-2">
                <FileText size={16} /> <b>Description:</b>{" "}
                {selected.service_description}
              </p>
              <p className="flex items-center gap-2">
                <Calendar size={16} /> <b>Date:</b>{" "}
                {new Date(selected.appointment_date).toLocaleDateString()}
              </p>
              <p className="flex items-center gap-2">
                <Clock size={16} /> <b>Time:</b> {selected.start_time} -{" "}
                {selected.end_time}
              </p>
              <p className="flex items-center gap-2">
                {selected.status === "confirmed" ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <XCircle size={16} className="text-red-600" />
                )}
                <b>Status:</b> {selected.status}
              </p>
              <p className="flex items-center gap-2">
                <StickyNote size={16} /> <b>Notes:</b>{" "}
                {selected.notes ?? "—"}
              </p>
              <p className="flex items-center gap-2">
                <UserCog size={16} /> <b>Staff ID:</b>{" "}
                {selected.staff_id ?? "—"}
              </p>
              <p className="flex items-center gap-2">
                <UserPen size={16} /> <b>Changed By:</b>{" "}
                {selected.changed_by ?? "System"}
              </p>
              <p className="flex items-center gap-2">
                <Clock size={16} /> <b>Snapshot Date:</b>{" "}
                {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-[#3e2e3d] text-white text-sm hover:bg-[#5f4b5a]"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
