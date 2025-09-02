import React from 'react';
import AppointmentCard from './AppointmentCard';
import { Appointment } from './types';

interface Props {
  appointments: Appointment[];
  onEdit: (appt: Appointment) => void;
  onInfo: (appt: Appointment) => void;
  onDelete: (id: number) => void;
}

const AppointmentList: React.FC<Props> = ({ appointments, onEdit, onInfo, onDelete }) => (
  <div className="divide-y divide-[#e8dcd4] border border-[#e8dcd4] rounded-xl bg-white/50 backdrop-blur-md shadow-sm">
    <ul>
      {appointments.length > 0 ? (
        appointments.map(appt => (
          <AppointmentCard
            key={appt.appointment_id}
            appointment={appt}
            onEdit={onEdit}
            onInfo={onInfo}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="p-6 text-center text-[#5f4b5a] font-[CaviarDreams]">
          No upcoming appointments.
        </div>
      )}
    </ul>
  </div>
);

export default AppointmentList;
