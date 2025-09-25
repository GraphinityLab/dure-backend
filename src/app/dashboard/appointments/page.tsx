'use client';
import React, { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { AxiosError } from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import AppointmentList from './components/AppointmentList';
import MoreInfoModal from './components/MoreInfoModal';
import EditAppointmentModal from './components/EditAppointmentModal';
import MessageBanner from './components/MessageBanner';
import { Appointment, Staff } from './components/types';
import { setTimedMessage } from './components/utils';
import { RefreshCcw } from "lucide-react";

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isMoreInfoModalOpen, setIsMoreInfoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [appointmentsRes, staffRes] = await Promise.all([
        axiosInstance.get<Appointment[]>("/appointments"),
        axiosInstance.get<Staff[]>("/staff"),
      ]);
      setAppointments(appointmentsRes.data);
      setStaff(staffRes.data);
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAppointments = appointments.filter((appt) => {
    const q = searchQuery.toLowerCase();
    return (
      appt.clientFirstName.toLowerCase().includes(q) ||
      appt.serviceName.toLowerCase().includes(q) ||
      (appt.serviceCategory?.toLowerCase().includes(q) ?? false)
    );
  });

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">Error: {error}</div>;

  return (
    <section className="relative overflow-hidden py-20 px-6 text-[#3e2e3d] min-h-screen bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be]">
      {actionLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="relative max-w-5xl mx-auto z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-[Soligant] tracking-tight"
          >
            Appointments
          </motion.h1>

          {/* Search + Refresh */}
          <div className="flex gap-2 w-full md:w-auto md:min-w-[500px]">
            <input
              type="text"
              placeholder="Search by client, service, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-[#e8dcd4] focus:outline-none focus:ring-2 focus:ring-[#c1a38f] text-sm md:text-base"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition shadow"
            >
              <RefreshCcw className="w-5 h-5" />
              Refresh
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {message && <MessageBanner message={message} />}
        </AnimatePresence>

        <AppointmentList
          appointments={filteredAppointments}
          onEdit={(appt) => {
            setSelectedAppointment(appt);
            setIsEditModalOpen(true);
          }}
          onInfo={(appt) => {
            setSelectedAppointment(appt);
            setIsMoreInfoModalOpen(true);
          }}
          onDelete={async (id) => {
            if (window.confirm("Delete this appointment?")) {
              try {
                setActionLoading(true);
                const staffName = `${localStorage.getItem("first_name")} ${localStorage.getItem("last_name")}`;

                await axiosInstance.delete(`/appointments/${id}`, {
                  data: { changed_by: staffName }, // ✅ send staff name
                });

                await fetchData();
                setTimedMessage(setMessage, "Appointment deleted!", "success");
              } catch {
                setTimedMessage(setMessage, "Failed to delete.", "error");
              } finally {
                setActionLoading(false);
              }
            }
          }}
        />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isMoreInfoModalOpen && selectedAppointment && (
          <MoreInfoModal
            appointment={selectedAppointment}
            onClose={() => setIsMoreInfoModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && selectedAppointment && (
          <EditAppointmentModal
            appointment={selectedAppointment}
            staff={staff}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={async () => {
              setActionLoading(true);
              await fetchData();
              setIsEditModalOpen(false);
              setActionLoading(false);
            }}
            setMessage={setMessage}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default function App() {
  return <AppointmentsPage />;
}
