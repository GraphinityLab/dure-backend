"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { motion } from "framer-motion";

interface StaffMember {
  user_id: number;
  staff_id: number;
  username: string;
  email: string;
  role_id: number;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

export default function StaffProfilePage() {
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<Partial<StaffMember>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch staff/user data
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(`/staff/${userId}`);
        setStaff(res.data);
        setForm(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load staff info");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      await axiosInstance.put(`/staff/${userId}`, form);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;

  return (
    <section className="max-w-2xl mx-auto mt-10 p-6 bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be] rounded-2xl shadow-lg border border-[#3e2e3d]/20">
      <h1 className="text-3xl font-[Soligant] mb-6 text-[#3e2e3d]">My Profile</h1>

      <div className="flex flex-col gap-4">
        {/* First Name */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">First Name</span>
          <input
            name="first_name"
            value={form.first_name || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
          />
        </label>

        {/* Last Name */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Last Name</span>
          <input
            name="last_name"
            value={form.last_name || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
          />
        </label>

        {/* Username (disabled) */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Username</span>
          <input
            name="username"
            value={form.username || ""}
            disabled
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 bg-gray-100 cursor-not-allowed"
          />
        </label>

        {/* Email */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Email</span>
          <input
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
          />
        </label>

        {/* Address */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Address</span>
          <input
            name="address"
            value={form.address || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
          />
        </label>

        {/* City */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">City</span>
          <input
            name="city"
            value={form.city || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
          />
        </label>

        {/* Province */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Province</span>
          <input
            name="province"
            value={form.province || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
          />
        </label>

        {/* Postal Code */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Postal Code</span>
          <input
            name="postal_code"
            value={form.postal_code || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
          />
        </label>

        {/* Save Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={saving}
          onClick={handleSave}
          className="mt-4 px-5 py-2 rounded-xl bg-[#3e2e3d] text-white font-[CaviarDreams] hover:bg-[#5f4b5a] transition shadow"
        >
          {saving ? "Saving..." : "Save Changes"}
        </motion.button>
      </div>
    </section>
  );
}
