import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StaffWithUserData } from "../../../appointments/components/types";
import axiosInstance from "@/utils/axiosInstance";

interface Role {
  role_id: number;
  role_name: string;
}

interface Props {
  staff: StaffWithUserData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const EditStaffModal = ({ staff, onChange, onSubmit, onClose }: Props) => {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data } = await axiosInstance.get<Role[]>("/roles", {
          headers: { "x-user-permissions": JSON.stringify(["role_read_all"]) },
        });
        setRoles(data);
      } catch (err) {
        console.error("Failed to load roles:", err);
      }
    };
    fetchRoles();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg p-8 bg-white/95 rounded-3xl shadow-xl border border-[#e6dede] text-[#3e2e3d]"
      >
        {/* Title */}
        <h2 className="text-3xl font-[Soligant] mb-6 border-b pb-2 border-[#c1a38f]">
          Edit Staff Member
        </h2>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="space-y-4 text-sm font-[CaviarDreams] text-[#5f4b5a]"
        >
          <input type="text" name="first_name" value={staff.first_name} onChange={onChange} placeholder="First Name" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />
          <input type="text" name="last_name" value={staff.last_name} onChange={onChange} placeholder="Last Name" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />
          <input type="email" name="email" value={staff.email} onChange={onChange} placeholder="Email" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />
          <input type="tel" name="phone_number" value={staff.phone_number} onChange={onChange} placeholder="Phone Number" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />
          <input type="text" name="address" value={staff.address} onChange={onChange} placeholder="Address" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />
          <input type="text" name="city" value={staff.city} onChange={onChange} placeholder="City" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />
          <input type="text" name="province" value={staff.province} onChange={onChange} placeholder="Province" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />
          <input type="text" name="postal_code" value={staff.postal_code} onChange={onChange} placeholder="Postal Code" required className="w-full p-3 rounded-lg border border-[#e8dcd4]" />

          {/* ✅ Role Dropdown */}
          <select
            name="role_id"
            value={staff.role_id || ""}
            onChange={onChange}
            className="w-full p-3 rounded-lg border border-[#e8dcd4] bg-white"
            required
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition"
            >
              Update
            </button>
          </div>
        </form>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9c8b92] hover:text-[#5f4b5a] transition"
        >
          ✕
        </button>
      </motion.div>
    </div>
  );
};

export default EditStaffModal;
