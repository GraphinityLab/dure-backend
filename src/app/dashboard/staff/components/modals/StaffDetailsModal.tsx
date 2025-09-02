import { motion } from "framer-motion";
import { StaffWithUserData } from "../../../appointments/components/types";

interface Props {
  staff: StaffWithUserData;
  onEdit: (staff: StaffWithUserData) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

const StaffDetailsModal = ({ staff, onEdit, onDelete, onClose }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="relative w-full max-w-lg p-8 bg-white/90 rounded-3xl shadow-xl border border-[#e6dede] text-[#3e2e3d]"
    >
      {/* Title */}
      <h2 className="text-3xl font-[Soligant] mb-6 border-b pb-2 border-[#c1a38f]">
        {staff.first_name} {staff.last_name}
      </h2>

      {/* Info rows */}
      <div className="space-y-4 text-sm font-[CaviarDreams]">
        <div className="flex justify-between items-center">
          <span className="text-[#5f4b5a]">Email:</span>
          <span className="text-[#3e2e3d] font-semibold">{staff.email}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#5f4b5a]">Phone:</span>
          <span className="text-[#3e2e3d] font-semibold">{staff.phone_number}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#5f4b5a]">Address:</span>
          <span className="text-[#3e2e3d] font-semibold text-right">
            {staff.address}, {staff.city}, {staff.province}, {staff.postal_code}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#5f4b5a]">Position:</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold uppercase">
            {staff.role_name}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 mt-8">
        <button
          onClick={() => onEdit(staff)}
          className="px-6 py-2 rounded-full bg-[#c1a38f] text-white hover:bg-[#a78974] transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(staff.staff_id)}
          className="px-6 py-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition"
        >
          Delete
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-[#9c8b92] hover:text-[#5f4b5a] transition"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  </div>
);

export default StaffDetailsModal;
