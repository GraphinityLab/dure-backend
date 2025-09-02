'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '@/utils/axiosInstance';
import { FaUserShield, FaEdit, FaTrash, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface Role {
    role_id: number;
    role_name: string;
}

interface Permission {
    permission_id: number;
    permission_name: string;
    permission_description?: string;
}

const RolesPage = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });
    // State for search functionality
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'info' | 'edit' | 'delete' | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    /**
     * Fetches all roles and permissions from the API.
     */
    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesResponse, permissionsResponse] = await Promise.all([
                axiosInstance.get('/roles', { headers: { 'x-user-permissions': JSON.stringify(['role_read_all']) } }),
                axiosInstance.get('/permissions', { headers: { 'x-user-permissions': JSON.stringify(['permission_read_all']) } }),
            ]);
            setRoles(rolesResponse.data);
            setPermissions(permissionsResponse.data);
        } catch (err: unknown) {
            console.error('Failed to fetch data:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data?.message || 'API call failed.');
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches permissions for a specific role.
     */
    const fetchRolePermissions = async (roleId: number) => {
        try {
            const response = await axiosInstance.get(`/roles/${roleId}`, { headers: { 'x-user-permissions': JSON.stringify(['role_read_all']) } });
            setRolePermissions(response.data);
        } catch (err) {
            console.error('Failed to fetch role permissions:', err);
            setRolePermissions([]);
            setStatus({ message: 'Failed to load permissions for this role.', type: 'error' });
        }
    };

    /**
     * Handles the creation of a new role.
     */
    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ message: '', type: '' });
        try {
            await axiosInstance.post('/roles', { role_name: newRoleName }, {
                headers: { 'x-user-permissions': JSON.stringify(['role_create']) },
            });
            setStatus({ message: 'Role created successfully!', type: 'success' });
            setNewRoleName('');
            fetchData();
        } catch (err: unknown) {
            console.error('Failed to create role:', err);
            if (axios.isAxiosError(err) && err.response) {
                setStatus({ message: `Error: ${err.response.data?.message}`, type: 'error' });
            } else {
                setStatus({ message: 'An unknown error occurred.', type: 'error' });
            }
        }
    };

    /**
     * Handles the deletion of a role.
     */
    const handleDeleteRole = async (roleId: number) => {
        try {
            await axiosInstance.delete(`/roles/${roleId}`, {
                headers: { 'x-user-permissions': JSON.stringify(['role_delete']) },
                // Add a data property with a value of null or an empty object
                // to prevent the backend from throwing a SyntaxError for an empty body.
                data: null,
            });
            setStatus({ message: 'Role deleted successfully!', type: 'success' });
            closeModal();
            fetchData();
        } catch (err: unknown) {
            console.error('Failed to delete role:', err);
            if (axios.isAxiosError(err) && err.response) {
                setStatus({ message: `Error: ${err.response.data?.message}`, type: 'error' });
            } else {
                setStatus({ message: 'An unknown error occurred.', type: 'error' });
            }
        }
    };

    /**
     * Toggles a permission for a selected role.
     */
    const handleTogglePermission = async (permissionId: number) => {
        if (!selectedRole) return;
        const hasPermission = rolePermissions.some(p => p.permission_id === permissionId);
        try {
            if (hasPermission) {
                await axiosInstance.delete(`/roles/${selectedRole.role_id}`, {
                    headers: { 'x-user-permissions': JSON.stringify(['role_update']) },
                    data: { permission_id: permissionId }
                });
                setRolePermissions(rolePermissions.filter(p => p.permission_id !== permissionId));
                setStatus({ message: 'Permission removed successfully!', type: 'success' });
            } else {
                await axiosInstance.post(`/roles/${selectedRole.role_id}`, { permission_id: permissionId }, {
                    headers: { 'x-user-permissions': JSON.stringify(['role_update']) },
                });
                const newPermission = permissions.find(p => p.permission_id === permissionId);
                if (newPermission) {
                    setRolePermissions([...rolePermissions, newPermission]);
                }
                setStatus({ message: 'Permission added successfully!', type: 'success' });
            }
        } catch (err: unknown) {
            console.error('Failed to toggle permission:', err);
            if (axios.isAxiosError(err) && err.response) {
                setStatus({ message: `Error: ${err.response.data?.message}`, type: 'error' });
            } else {
                setStatus({ message: 'An unknown error occurred.', type: 'error' });
            }
        }
    };

    const openModal = (mode: 'info' | 'edit' | 'delete', role: Role) => {
        setSelectedRole(role);
        setModalMode(mode);
        fetchRolePermissions(role.role_id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRole(null);
        setModalMode(null);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-hide status messages
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => setStatus({ message: '', type: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    if (loading) return <div className="text-center mt-10 text-[#3e2e3d]">Loading...</div>;
    if (error) return <div className="text-center mt-10 text-red-600">Error: {error}</div>;

    // Filter roles based on search term
    const filteredRoles = roles.filter(role =>
        role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="relative overflow-hidden py-20 px-6 text-[#3e2e3d] min-h-screen bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be]">
            <div className="relative max-w-5xl mx-auto z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-[#3e2e3d]">System Roles</h1>
                    <p className="mt-2 text-[#5f4b5a]">View, create, and manage roles within the system.</p>
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`p-4 rounded-md mb-4 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.message}
                    </div>
                )}

                {/* Create Role Form */}
                <form
                    onSubmit={handleCreateRole}
                    className="p-6 mb-6 rounded-xl bg-white/50 backdrop-blur-md shadow-sm border border-[#e8dcd4]"
                >
                    <h2 className="text-2xl font-bold mb-4 text-[#3e2e3d]">Create New Role</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="Enter role name (e.g., 'Admin')"
                            className="flex-grow p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c1a38f] transition"
                            required
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-[#c1a38f] text-white rounded-md font-semibold hover:bg-[#a78974] transition"
                        >
                            Create Role
                        </button>
                    </div>
                </form>

                {/* Search Input Field */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c1a38f] transition text-[#3e2e3d]"
                    />
                </div>

                {/* Roles List */}
                <div className="divide-y divide-[#e8dcd4] border border-[#e8dcd4] rounded-xl bg-white/50 backdrop-blur-md shadow-sm">
                    <ul>
                        {filteredRoles.length > 0 ? (
                            filteredRoles.map((role) => (
                                <li
                                    key={role.role_id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-white/70 transition text-sm text-[#5f4b5a]"
                                >
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
                                        <span className="flex items-center font-semibold text-base">
                                            <FaUserShield className="mr-2 text-xl" /> {role.role_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                        <button
                                            onClick={() => openModal('info', role)}
                                            className="p-2 rounded-full text-xs bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition"
                                            aria-label="View Permissions"
                                        >
                                            <FaInfoCircle />
                                        </button>
                                        <button
                                            onClick={() => openModal('edit', role)}
                                            className="p-2 rounded-full text-xs bg-[#c1a38f] text-white hover:bg-[#a78974] transition"
                                            aria-label="Edit Permissions"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => openModal('delete', role)}
                                            className="p-2 rounded-full text-xs bg-red-100 text-red-700 hover:bg-red-200 transition"
                                            aria-label="Delete Role"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <div className="p-6 text-center text-[#5f4b5a] font-medium">
                                No roles found.
                            </div>
                        )}
                    </ul>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedRole && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-[#3e2e3d]">
                                {modalMode === 'info' && `Permissions for ${selectedRole.role_name}`}
                                {modalMode === 'edit' && `Edit Permissions for ${selectedRole.role_name}`}
                                {modalMode === 'delete' && 'Delete Role'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <FaTimes className="text-2xl" />
                            </button>
                        </div>

                        {/* Info Modal Content */}
                        {modalMode === 'info' && (
                            <div className="max-h-80 overflow-y-auto">
                                {rolePermissions.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {rolePermissions.map(permission => (
                                            <li key={permission.permission_id} className="py-2 text-sm text-[#5f4b5a]">
                                                <h3 className="font-semibold text-[#3e2e3d]">{permission.permission_name}</h3>
                                                {permission.permission_description && <p className="text-xs text-gray-500 mt-1">{permission.permission_description}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-500">This role has no permissions assigned.</p>
                                )}
                            </div>
                        )}

                        {/* Edit Permissions Modal Content */}
                        {modalMode === 'edit' && (
                            <div className="max-h-80 overflow-y-auto">
                                <ul className="divide-y divide-gray-200">
                                    {permissions.map(permission => (
                                        <li key={permission.permission_id} className="py-2 flex items-center justify-between text-sm text-[#5f4b5a]">
                                            <div className="flex-grow pr-4">
                                                <h3 className="font-semibold text-[#3e2e3d]">{permission.permission_name}</h3>
                                                {permission.permission_description && <p className="text-xs text-gray-500 mt-1">{permission.permission_description}</p>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={rolePermissions.some(p => p.permission_id === permission.permission_id)}
                                                onChange={() => handleTogglePermission(permission.permission_id)}
                                                className="form-checkbox h-5 w-5 text-[#c1a38f] rounded-sm"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Delete Role Modal Content */}
                        {modalMode === 'delete' && (
                            <div>
                                <p className="mb-4 text-sm text-[#5f4b5a]">
                                    Are you sure you want to delete the role <strong className="text-[#3e2e3d]">{selectedRole.role_name}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
                                        Cancel
                                    </button>
                                    <button onClick={() => handleDeleteRole(selectedRole.role_id)} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition">
                                        Confirm Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default RolesPage;