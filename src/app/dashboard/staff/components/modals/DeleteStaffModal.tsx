import { motion } from "framer-motion";

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteStaffModal = ({ onCancel, onConfirm }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="relative w-full max-w-md p-8 bg-white/95 rounded-3xl shadow-xl border border-[#e6dede] text-center text-[#3e2e3d]"
    >
      {/* Title */}
      <h2 className="text-2xl font-[Soligant] mb-4 border-b pb-2 border-[#c1a38f]">
        Are you sure?
      </h2>

      {/* Body */}
      <p className="text-sm font-[CaviarDreams] text-[#5f4b5a] mb-6">
        This action cannot be undone. This will permanently delete the staff member.
      </p>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <button onClick={onCancel} className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-6 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition">
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);

export default DeleteStaffModal;
