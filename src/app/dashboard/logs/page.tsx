"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatDateTime,
  formatDateOnly,
  formatTimeOnly,
} from "@/utils/formatDate";

interface Log {
  log_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  changed_by: string;
  changes: any;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStaff, setSelectedStaff] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");
  const [selectedDate, setSelectedDate] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal state
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await axiosInstance.get("/logs");
        const parsed = data.map((log: Log) => ({
          ...log,
          changes:
            typeof log.changes === "string"
              ? JSON.parse(log.changes)
              : log.changes,
        }));
        setLogs(parsed);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const tabs = ["All", "Appointment", "Client", "Staff", "Service", "Role"];

  // Dropdown options
  const staffOptions = ["All", ...Array.from(new Set(logs.map((l) => l.changed_by)))];
  const actionOptions = ["All", ...Array.from(new Set(logs.map((l) => l.action)))];
  const dateOptions = [
    "All",
    ...Array.from(new Set(logs.map((l) => formatDateOnly(l.created_at)))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    ),
  ];

  // Filters
  const filteredLogs = logs.filter((log) => {
    const tabMatch =
      activeTab === "All" ||
      log.entity_type.toLowerCase() === activeTab.toLowerCase();
    const staffMatch = selectedStaff === "All" || log.changed_by === selectedStaff;
    const actionMatch = selectedAction === "All" || log.action === selectedAction;

    // Date dropdown filter
    const dateMatch =
      selectedDate === "All" ||
      formatDateOnly(log.created_at) === selectedDate;

    // Date range filter overrides dropdown if set
    const rangeActive = fromDate || toDate;
    const rangeMatch =
      (!fromDate || new Date(log.created_at) >= new Date(fromDate)) &&
      (!toDate || new Date(log.created_at) <= new Date(toDate));

    return tabMatch && staffMatch && actionMatch && (rangeActive ? rangeMatch : dateMatch);
  });

  // Smart formatter
  const formatLogValue = (key: string, value: any) => {
    if (!value) return String(value);
    if (key === "appointment_date") return formatDateOnly(value as string);
    if (key === "start_time" || key === "end_time") return formatTimeOnly(value as string);
    if (key.toLowerCase().includes("date") || key.toLowerCase().includes("time")) {
      try {
        return formatDateTime(value as string);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <section className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-[Soligant] mb-4 text-[#3e2e3d]">
          System Logs
        </h1>
        <p className="text-[#5f4b5a] text-sm md:text-base">
          Track all changes made to appointments, clients, staff, services, and roles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-[CaviarDreams] transition ${activeTab === tab
              ? "bg-[#3e2e3d] text-white shadow"
              : "bg-[#e8d4be] hover:bg-[#d6bfa6]"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-6 justify-center">
        {/* Staff Filter */}
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-[CaviarDreams] text-[#3e2e3d]">
            Changed By
          </label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="px-5 py-2 rounded-full bg-[#e8d4be] text-sm font-[CaviarDreams] text-[#3e2e3d] shadow cursor-pointer"
          >
            {staffOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-[CaviarDreams] text-[#3e2e3d]">
            Action
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-5 py-2 rounded-full bg-[#e8d4be] text-sm font-[CaviarDreams] text-[#3e2e3d] shadow cursor-pointer"
          >
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-[CaviarDreams] text-[#3e2e3d]">
            Date
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-5 py-2 rounded-full bg-[#e8d4be] text-sm font-[CaviarDreams] text-[#3e2e3d] shadow cursor-pointer"
            disabled={!!(fromDate || toDate)} // disable if range is set
          >
            {dateOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-[CaviarDreams] text-[#3e2e3d]">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-5 py-2 rounded-full bg-[#e8d4be] text-sm font-[CaviarDreams] text-[#3e2e3d] shadow cursor-pointer"
          />
        </div>
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-[CaviarDreams] text-[#3e2e3d]">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-5 py-2 rounded-full bg-[#e8d4be] text-sm font-[CaviarDreams] text-[#3e2e3d] shadow cursor-pointer"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-center text-gray-500">No logs available for {activeTab}.</p>
      ) : (
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto rounded-xl shadow-lg custom-scroll">
          <table className="w-full border border-[#e6dede] bg-white/70 backdrop-blur-md shadow-xl rounded-xl">
            <thead className="bg-[#f6e9da] text-[#3e2e3d] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-sm">Entity</th>
                <th className="px-4 py-3 text-sm">Action</th>
                <th className="px-4 py-3 text-sm">Entity ID</th>
                <th className="px-4 py-3 text-sm">Changed By</th>
                <th className="px-4 py-3 text-sm">Date</th>
                <th className="px-4 py-3 text-sm">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.log_id}
                  className="border-t border-[#e6dede] hover:bg-[#fdf6f2]/70"
                >
                  <td className="px-4 py-3 text-sm">{log.entity_type}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#5f4b5a]">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-sm">{log.entity_id}</td>
                  <td className="px-4 py-3 text-sm">{log.changed_by}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
                    >
                      <FaInfoCircle /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 relative border border-[#e6dede] custom-scroll"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedLog(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-[#3e2e3d] transition"
              >
                <FaTimes size={20} />
              </button>

              {/* Title */}
              <h2 className="text-3xl font-[Soligant] text-[#3e2e3d] mb-2">
                Change Details
              </h2>
              <p className="text-sm text-[#5f4b5a] mb-6">
                A record of updates made within the system.
              </p>

              {/* Metadata */}
              <div className="bg-[#f6e9da] rounded-xl p-5 mb-8 shadow-inner flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#3e2e3d] text-white flex items-center justify-center font-semibold text-lg shadow-md">
                  {(selectedLog.changed_by?.[0] ?? "U").toUpperCase()}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-[#3e2e3d] w-full">
                  <p>
                    <span className="font-semibold">Entity:</span>{" "}
                    {selectedLog.entity_type} (ID: {selectedLog.entity_id})
                  </p>
                  <p>
                    <span className="font-semibold">Action:</span>{" "}
                    <span className="px-2 py-0.5 rounded-md bg-[#e8d4be] font-medium">
                      {selectedLog.action}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Changed By:</span>{" "}
                    {selectedLog.changed_by || "Unknown"}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {formatDateTime(selectedLog.created_at)}
                  </p>
                </div>
              </div>

              {/* Old vs New */}
              <div className="space-y-8">
                {selectedLog.changes?.old && (
                  <div className="bg-[#fdf6f2] border border-[#e6dede] rounded-2xl p-6 shadow-md transition hover:shadow-lg">
                    <h3 className="font-bold text-[#a94442] mb-5 text-lg flex items-center gap-2">
                      ❌ Previous Values
                    </h3>
                    <ul className="space-y-3">
                      {Object.entries(selectedLog.changes.old).map(([key, value]) => (
                        <li
                          key={key}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#e6dede] pb-2 last:border-0 px-2"
                        >
                          <span className="text-xs font-semibold tracking-wide uppercase bg-[#e8d4be] text-[#3e2e3d] px-2 py-0.5 rounded-md">
                            {key}
                          </span>
                          <span className="font-mono text-[#5f4b5a] mt-1 sm:mt-0">
                            {formatLogValue(key, value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedLog.changes?.new && (
                  <div className="bg-[#f6e9da] border border-[#e6dede] rounded-2xl p-6 shadow-md transition hover:shadow-lg">
                    <h3 className="font-bold text-[#3e2e3d] mb-5 text-lg flex items-center gap-2">
                      ✅ New Values
                    </h3>
                    <ul className="space-y-3">
                      {Object.entries(selectedLog.changes.new).map(([key, value]) => (
                        <li
                          key={key}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#e6dede] pb-2 last:border-0 px-2"
                        >
                          <span className="text-xs font-semibold tracking-wide uppercase bg-[#e8d4be] text-[#3e2e3d] px-2 py-0.5 rounded-md">
                            {key}
                          </span>
                          <span className="font-mono text-[#5f4b5a] mt-1 sm:mt-0">
                            {formatLogValue(key, value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
