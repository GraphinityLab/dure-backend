import React from 'react';
import { FaUser, FaCalendarAlt, FaClock, FaTag, FaFileAlt, FaTrash } from 'react-icons/fa';
import { Appointment } from './types';
import { formatDate } from './utils';

interface Props {
  appointment: Appointment;
  onEdit: (appt: Appointment) => void;
  onInfo: (appt: Appointment) => void;
  onDelete: (id: number) => void;
}

const AppointmentCard: React.FC<Props> = ({ appointment, onEdit, onInfo, onDelete }) => (
  <li className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-white/70 transition text-sm font-[CaviarDreams] text-[#5f4b5a]">
    <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
      <span className="flex items-center"><FaUser className="mr-2" /> {appointment.clientFirstName} {appointment.clientLastName}</span>
      <span className="flex items-center"><FaTag className="mr-2" /> {appointment.serviceName}</span>
      <span className="flex items-center"><FaCalendarAlt className="mr-2" /> {formatDate(appointment.appointment_date)}</span>
      <span className="flex items-center"><FaClock className="mr-2" /> {appointment.start_time} - {appointment.end_time}</span>
    </div>

    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
      <span className={`text-xs font-[CaviarDreams] px-2 py-0.5 rounded-full uppercase ${
        appointment.status === 'confirmed' ? 'bg-green-200 text-green-800' :
        appointment.status === 'declined' ? 'bg-red-200 text-red-800' :
        'bg-yellow-200 text-yellow-800'
      }`}>
        {appointment.status}
      </span>
      <button onClick={() => onInfo(appointment)} className="p-2 rounded-full text-xs bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition"><FaFileAlt /></button>
      <button onClick={() => onEdit(appointment)} className="p-2 rounded-full text-xs bg-[#c1a38f] text-white hover:bg-[#a78974] transition"><FaCalendarAlt /></button>
      <button onClick={() => onDelete(appointment.appointment_id)} className="p-2 rounded-full text-xs bg-red-100 text-red-700 hover:bg-red-200 transition"><FaTrash /></button>
    </div>
  </li>
);

export default AppointmentCard;
