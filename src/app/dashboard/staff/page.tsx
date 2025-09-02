"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import CreateStaffModal from "@/components/CreateStaffModal";
import { Staff, Role } from "@/types";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [newStaff, setNewStaff] = useState<Staff>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    phoneNumber: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    roleId: "",
  });

  // Fetch staff & roles
  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, []);

  const fetchStaff = async () => {
    const res = await axiosInstance.get("/staff");
    setStaffList(res.data);
  };

  const fetchRoles = async () => {
    const res = await axiosInstance.get("/roles");
    setRoles(res.data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      first_name: newStaff.firstName,
      last_name: newStaff.lastName,
      email: newStaff.email,
      username: newStaff.username,
      password: newStaff.password,
      phone_number: newStaff.phoneNumber,
      address: newStaff.address,
      city: newStaff.city,
      province: newStaff.province,
      postal_code: newStaff.postalCode,
      role_id: newStaff.roleId,
    };

    try {
      await axiosInstance.post("/staff", payload);
      fetchStaff();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#3e2e3d]">Staff Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#c1a38f] text-white rounded-md hover:bg-[#a78974]"
        >
          + Add Staff
        </button>
      </div>

      {/* Staff List */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-[#e8dcd4]">
        <h2 className="text-lg font-semibold mb-4 text-[#5f4b5a]">Staff Members</h2>
        <ul className="space-y-2">
          {staffList.map((staff) => (
            <li key={staff.staff_id} className="p-3 rounded-lg border bg-gray-50 flex justify-between">
              <span>
                {staff.firstName} {staff.lastName} – {staff.email}
              </span>
              <span className="text-sm text-gray-500">Role ID: {staff.roleId}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal */}
      {showModal && (
        <CreateStaffModal
          newStaff={newStaff}
          roles={roles}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
