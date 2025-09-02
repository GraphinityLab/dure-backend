"use client";
import { motion } from "framer-motion";
import { Role, Staff } from "../../../appointments/components/types";

interface Props {
  newStaff: Staff;
  roles: Role[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const CreateStaffModal = ({ newStaff, roles, onChange, onSubmit, onClose }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="relative w-full max-w-lg p-8 bg-white rounded-xl shadow-xl border border-[#e8dcd4] text-[#3e2e3d]"
    >
      {/* Title */}
      <h2 className="text-2xl font-bold mb-6 border-b pb-2 border-[#c1a38f]">
        Create Staff Member
      </h2>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-3 text-sm text-[#5f4b5a]">
        <input type="text" name="firstName" value={newStaff.firstName} onChange={onChange} placeholder="First Name" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="text" name="lastName" value={newStaff.lastName} onChange={onChange} placeholder="Last Name" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="email" name="email" value={newStaff.email} onChange={onChange} placeholder="Email" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="text" name="username" value={newStaff.username} onChange={onChange} placeholder="Username" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="password" name="password" value={newStaff.password} onChange={onChange} placeholder="Password" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="tel" name="phoneNumber" value={newStaff.phoneNumber} onChange={onChange} placeholder="Phone Number" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="text" name="address" value={newStaff.address} onChange={onChange} placeholder="Address" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="text" name="city" value={newStaff.city} onChange={onChange} placeholder="City" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="text" name="province" value={newStaff.province} onChange={onChange} placeholder="Province" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        <input type="text" name="postalCode" value={newStaff.postalCode} onChange={onChange} placeholder="Postal Code" required className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#c1a38f]" />
        
        {/* Role Dropdown */}
        <select
          name="roleId"
          value={newStaff.roleId}
          onChange={onChange}
          required
          className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#c1a38f]"
        >
          <option value="">Select Role</option>
          {roles.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name}
            </option>
          ))}
        </select>

        <div className="flex justify-end pt-4 space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#c1a38f] text-white rounded-md hover:bg-[#a78974]"
          >
            Create
          </button>
        </div>
      </form>

      {/* Close (X button) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
      >
        ✕
      </button>
    </motion.div>
  </div>
);

export default CreateStaffModal;
