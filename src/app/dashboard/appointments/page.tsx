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

const AppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);         
    const [actionLoading, setActionLoading] = useState(false); 
    const [error, setError] = useState<string | null>(null);

    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isMoreInfoModalOpen, setIsMoreInfoModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const fetchData = async () => {
        try {
            const [appointmentsRes, staffRes] = await Promise.all([
                axiosInstance.get<Appointment[]>('/appointments'),
                axiosInstance.get<Staff[]>('/staff'),
            ]);
            setAppointments(appointmentsRes.data);
            setStaff(staffRes.data);
        } catch (err) {
            const axiosError = err as AxiosError;
            setError(axiosError.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return <div className="text-center mt-10">Loading...</div>;
    if (error) return <div className="text-center mt-10 text-red-600">Error: {error}</div>;

    return (
        <section className="relative overflow-hidden py-20 px-6 text-[#3e2e3d] min-h-screen bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be]">
            {/* 🔄 Fullscreen overlay when doing actions */}
            {actionLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                    <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            <div className="relative max-w-5xl mx-auto z-10">

                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl font-[Soligant] tracking-tight"
                    >
                        Appointments
                    </motion.h1>
                </div>

                <AnimatePresence>
                    {message && <MessageBanner message={message} />}
                </AnimatePresence>

                <AppointmentList
                    appointments={appointments}
                    onEdit={(appt) => { setSelectedAppointment(appt); setIsEditModalOpen(true); }}
                    onInfo={(appt) => { setSelectedAppointment(appt); setIsMoreInfoModalOpen(true); }}
                    onDelete={async (id) => {
                        if (window.confirm("Delete this appointment?")) {
                            try {
                                setActionLoading(true);
                                await axiosInstance.delete(`/appointments/${id}`);
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
