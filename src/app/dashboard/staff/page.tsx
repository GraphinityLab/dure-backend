'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import {
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaTimes,
  FaSearch,
  FaPlus,
  FaPhone,
  FaUserTie
} from 'react-icons/fa';

interface Staff {
  staff_id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  roleId?: string;
  roleName?: string;
}

interface Role {
  role_id: string | number;
  role_name: string;
}

interface StaffForm {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  roleId?: string | number;
  password?: string;
  confirmPassword?: string;
}

const StaffPage = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'info' | 'edit' | 'delete' | 'create' | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffForm>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // ✅ Get logged-in staff (for changed_by fallback)
  const getCurrentStaff = () => ({
    staff_id: localStorage.getItem('staff_id'),
    first_name: localStorage.getItem('first_name') || '',
    last_name: localStorage.getItem('last_name') || '',
    username: localStorage.getItem('username') || '',
  });

  // ✅ Messages
  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // ✅ Password Strength
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { label: 'Medium', color: 'bg-yellow-500' };
      case 3:
      case 4:
        return { label: 'Strong', color: 'bg-green-500' };
      default:
        return { label: '', color: '' };
    }
  };

  // Fetch staff list
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/staff');
      setStaffList(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      showMessage('error', err?.response?.data?.message || 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const res = await axiosInstance.get('/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, []);

  // Open modal
  const openModal = (mode: 'info' | 'edit' | 'delete' | 'create', staff?: Staff) => {
    setSelectedStaff(staff ?? null);
    setModalMode(mode);
    setShowPasswordFields(false);

    if (mode === 'edit' && staff) {
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        username: staff.username,
        phoneNumber: staff.phoneNumber,
        address: staff.address,
        city: staff.city,
        province: staff.province,
        postalCode: staff.postalCode,
        roleId: staff.roleId,
        password: '',
        confirmPassword: '',
      });
    } else if (mode === 'create') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phoneNumber: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        roleId: '',
        password: '',
        confirmPassword: '',
      });
    } else {
      setFormData({});
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    setModalMode(null);
    setFormData({});
    setShowPasswordFields(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Create / Update
  const handleSubmit = async () => {
    if (!modalMode) return;

    const payload: any = {};
    if (formData.firstName !== undefined) payload.first_name = formData.firstName;
    if (formData.lastName !== undefined) payload.last_name = formData.lastName;
    if (formData.email !== undefined) payload.email = formData.email;
    if (formData.username !== undefined) payload.username = formData.username;
    if (formData.phoneNumber !== undefined) payload.phone_number = formData.phoneNumber;
    if (formData.address !== undefined) payload.address = formData.address;
    if (formData.city !== undefined) payload.city = formData.city;
    if (formData.province !== undefined) payload.province = formData.province;
    if (formData.postalCode !== undefined) payload.postal_code = formData.postalCode;
    if (formData.roleId !== undefined && formData.roleId !== '') payload.role_id = formData.roleId;

    // ✅ Password handling
    if (modalMode === 'create' || showPasswordFields) {
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          showMessage('error', 'Passwords do not match.');
          return;
        }
        payload.password = formData.password;
      }
    }

    const currentStaff = getCurrentStaff();
    payload.changed_by =
      `${currentStaff.first_name} ${currentStaff.last_name}`.trim() ||
      currentStaff.username ||
      'Unknown';

    setActionLoading(true);
    try {
      if (modalMode === 'create') {
        await axiosInstance.post('/staff', payload);
        await fetchStaff();
        showMessage('success', 'Staff created successfully.');
        closeModal();
      } else if (modalMode === 'edit') {
        if (!selectedStaff) {
          showMessage('error', 'No staff selected for edit.');
          return;
        }
        await axiosInstance.put(`/staff/${selectedStaff.staff_id}`, payload);
        await fetchStaff();
        showMessage('success', 'Staff updated successfully.');
        closeModal();
      }
    } catch (err: any) {
      console.error('Failed to save staff:', err);
      showMessage('error', err?.response?.data?.message || 'Failed to save staff');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (!selectedStaff) return;
    if (!confirm(`Delete ${selectedStaff.firstName} ${selectedStaff.lastName}?`)) return;

    const currentStaff = getCurrentStaff();
    const payload = {
      changed_by:
        `${currentStaff.first_name} ${currentStaff.last_name}`.trim() ||
        currentStaff.username ||
        'Unknown',
    };

    setActionLoading(true);
    try {
      await axiosInstance.delete(`/staff/${selectedStaff.staff_id}`, { data: payload });
      await fetchStaff();
      showMessage('success', 'Staff deleted successfully.');
      closeModal();
    } catch (err: any) {
      console.error('Failed to delete staff:', err);
      showMessage('error', err?.response?.data?.message || 'Failed to delete staff');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStaff = staffList.filter(s =>
    `${s.firstName ?? ''} ${s.lastName ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.roleName ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="relative overflow-hidden py-10 px-6 text-[#3e2e3d] min-h-screen bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be]">
      <div className="max-w-5xl mx-auto z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#3e2e3d]">Staff Management</h1>
          <button
            onClick={() => openModal('create')}
            className="px-4 py-2 bg-[#c1a38f] text-white rounded-md hover:bg-[#a78974] transition flex items-center"
          >
            <FaPlus className="mr-2" /> Add Staff
          </button>
        </div>

        {/* ✅ Messages */}
        {success && <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700">{success}</div>}
        {error && <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700">{error}</div>}

        {/* Search */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-full border border-[#e8dcd4] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#c1a38f] transition"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78974]" />
        </div>

        {/* Staff list */}
        <div className="border border-[#e8dcd4] rounded-xl bg-white/50 backdrop-blur-md shadow-sm">
          <div className="hidden sm:grid grid-cols-12 px-4 py-3 text-sm font-semibold text-[#3e2e3d] bg-[#f9f4ef] rounded-t-xl">
            <div className="col-span-3 flex items-center">Name</div>
            <div className="col-span-3 flex items-center">Email</div>
            <div className="col-span-2 flex items-center">Phone</div>
            <div className="col-span-2 flex items-center">Role</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <ul className="divide-y divide-[#e8dcd4]">
            {filteredStaff.length > 0 ? filteredStaff.map(staff => (
              <li key={staff.staff_id} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-white/70 transition text-sm text-[#5f4b5a]">
                <div className="sm:col-span-3 font-medium flex items-center">
                  <FaUserTie className="mr-2 text-[#3e2e3d]" /> {staff.firstName} {staff.lastName}
                </div>
                <div className="sm:col-span-3">{staff.email}</div>
                <div className="sm:col-span-2 flex items-center">
                  <FaPhone className="mr-2" /> {staff.phoneNumber || '-'}
                </div>
                <div className="sm:col-span-2">{staff.roleName || '-'}</div>
                <div className="sm:col-span-2 flex justify-end space-x-2">
                  <button onClick={() => openModal('info', staff)} className="p-2 rounded-full bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition"><FaInfoCircle /></button>
                  <button onClick={() => openModal('edit', staff)} className="p-2 rounded-full bg-[#c1a38f] text-white hover:bg-[#a78974] transition"><FaEdit /></button>
                  <button onClick={() => openModal('delete', staff)} className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition"><FaTrash /></button>
                </div>
              </li>
            )) : (
              <div className="p-6 text-center font-medium text-[#5f4b5a]">No staff found.</div>
            )}
          </ul>
        </div>

        {/* Modals */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] border border-[#e8dcd4]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#3e2e3d]">
                  {modalMode === 'create' ? 'Create Staff' : modalMode === 'edit' ? 'Edit Staff' : modalMode === 'info' ? 'Staff Info' : 'Delete Staff'}
                </h2>
                <button onClick={closeModal}><FaTimes className="text-2xl text-gray-500 hover:text-gray-700" /></button>
              </div>

              {/* Info Modal */}
              {modalMode === 'info' && selectedStaff && (
                <div className="space-y-4 text-sm text-[#5f4b5a]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#3e2e3d] text-white flex items-center justify-center font-semibold">
                      {`${selectedStaff.firstName?.[0] ?? ""}${selectedStaff.lastName?.[0] ?? ""}`.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#3e2e3d] leading-tight">
                        {selectedStaff.firstName} {selectedStaff.lastName}
                      </h2>
                      <p className="text-xs text-[#3e2e3d]/70">
                        ID: {selectedStaff.staff_id} • Username: {selectedStaff.username || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {selectedStaff.email}</p>
                    <p><strong>Phone:</strong> {selectedStaff.phoneNumber || '-'}</p>
                    <p><strong>Address:</strong> {[selectedStaff.address, selectedStaff.city, selectedStaff.province, selectedStaff.postalCode].filter(Boolean).join(', ') || '-'}</p>
                    <p><strong>Role:</strong> {selectedStaff.roleName || '-'}</p>
                  </div>
                </div>
              )}

              {/* Create / Edit Form */}
              {(modalMode === 'create' || modalMode === 'edit') && (
                <form className="space-y-3">
                  {/* Basic fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">First name</label>
                      <input name="firstName" value={formData.firstName ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Last name</label>
                      <input name="lastName" value={formData.lastName ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Email</label>
                      <input name="email" value={formData.email ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Username</label>
                      <input name="username" value={formData.username ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Phone</label>
                      <input name="phoneNumber" value={formData.phoneNumber ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Postal Code</label>
                      <input name="postalCode" value={formData.postalCode ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Address</label>
                    <input name="address" value={formData.address ?? ''} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">City</label>
                      <input name="city" value={formData.city ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Province</label>
                      <input name="province" value={formData.province ?? ''} onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                    </div>
                  </div>

                  {/* Role dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Role</label>
                    <select name="roleId" value={formData.roleId ?? ''} onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm">
                      <option value="">Select Role</option>
                      {roles.map(r => (
                        <option key={r.role_id} value={r.role_id}>{r.role_id} - {r.role_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Password fields */}
                  {modalMode === 'create' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Password</label>
                          <input name="password" type="password" value={formData.password ?? ''} onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Confirm Password</label>
                          <input name="confirmPassword" type="password" value={formData.confirmPassword ?? ''} onChange={handleFormChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                        </div>
                      </div>
                      {formData.password && (
                        <div className="h-2 w-full bg-gray-200 rounded">
                          <div
                            className={`h-2 rounded ${getStrengthLabel(getPasswordStrength(formData.password)).color}`}
                            style={{ width: `${(getPasswordStrength(formData.password) / 4) * 100}%` }}
                          />
                          <p className="text-xs mt-1 text-[#3e2e3d]">
                            Strength: {getStrengthLabel(getPasswordStrength(formData.password)).label}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {modalMode === 'edit' && (
                    <div>
                      {!showPasswordFields ? (
                        <button type="button" onClick={() => setShowPasswordFields(true)}
                          className="mt-2 px-4 py-2 border rounded-md text-sm text-[#3e2e3d] hover:bg-gray-100">
                          Change Password
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-[#3e2e3d] mb-1">New Password</label>
                              <input name="password" type="password" value={formData.password ?? ''} onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#3e2e3d] mb-1">Confirm Password</label>
                              <input name="confirmPassword" type="password" value={formData.confirmPassword ?? ''} onChange={handleFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm" />
                            </div>
                          </div>
                          {formData.password && (
                            <div className="h-2 w-full bg-gray-200 rounded">
                              <div
                                className={`h-2 rounded ${getStrengthLabel(getPasswordStrength(formData.password)).color}`}
                                style={{ width: `${(getPasswordStrength(formData.password) / 4) * 100}%` }}
                              />
                              <p className="text-xs mt-1 text-[#3e2e3d]">
                                Strength: {getStrengthLabel(getPasswordStrength(formData.password)).label}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={closeModal}
                      className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm">
                      Cancel
                    </button>
                    <button type="button" onClick={handleSubmit}
                      className="px-4 py-2 bg-[#c1a38f] text-white rounded-md hover:bg-[#a78974] text-sm">
                      {modalMode === 'create' ? 'Create' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Delete confirmation */}
              {modalMode === 'delete' && selectedStaff && (
                <div className="space-y-4 text-sm text-[#5f4b5a]">
                  <p>
                    Are you sure you want to delete <strong>{selectedStaff.firstName} {selectedStaff.lastName}</strong>?
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button onClick={closeModal}
                      className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm">
                      Cancel
                    </button>
                    <button onClick={handleDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(loading || actionLoading) && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
            <div className="w-16 h-16 border-4 border-[#c1a38f] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StaffPage;
