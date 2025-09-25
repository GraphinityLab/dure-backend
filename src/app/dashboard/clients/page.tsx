'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '@/utils/axiosInstance';
import {
  FaUserCircle, FaEdit, FaTrash, FaInfoCircle, FaTimes,
  FaPhone, FaEnvelope, FaSearch, FaPlus
} from 'react-icons/fa';

interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

// ✅ Helper: format phone numbers
const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

// ✅ Helper: get staff name from localStorage
const getStaffName = () =>
  `${localStorage.getItem("first_name") || ''} ${localStorage.getItem("last_name") || ''}`.trim();

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'info' | 'edit' | 'delete' | 'create' | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form state (edit + create)
  const [formData, setFormData] = useState<Omit<Client, 'client_id'>>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/clients', {
        headers: { 'x-user-permissions': JSON.stringify(['client_read_all']) }
      });
      setClients(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch clients:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.message || 'API call failed.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    try {
      await axiosInstance.delete(`/clients/${clientId}`, {
        headers: { 'x-user-permissions': JSON.stringify(['client_delete']) },
        data: { changed_by: getStaffName() }, // ✅ log who deleted
      });
      setStatus({ message: 'Client deleted successfully!', type: 'success' });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to delete client:', err);
      if (axios.isAxiosError(err) && err.response) {
        setStatus({ message: `Error: ${err.response.data?.message}`, type: 'error' });
      } else {
        setStatus({ message: 'An unknown error occurred.', type: 'error' });
      }
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;
    try {
      await axiosInstance.put(`/clients/${selectedClient.client_id}`, {
        ...formData,
        changed_by: getStaffName(), // ✅ log who updated
      }, {
        headers: { 'x-user-permissions': JSON.stringify(['client_update']) },
      });
      setStatus({ message: 'Client updated successfully!', type: 'success' });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to update client:', err);
      if (axios.isAxiosError(err) && err.response) {
        setStatus({ message: `Error: ${err.response.data?.message}`, type: 'error' });
      } else {
        setStatus({ message: 'An unknown error occurred.', type: 'error' });
      }
    }
  };

  const handleCreateClient = async () => {
    try {
      await axiosInstance.post(`/clients`, {
        ...formData,
        changed_by: getStaffName(), // ✅ log who created
      }, {
        headers: { 'x-user-permissions': JSON.stringify(['client_create']) },
      });
      setStatus({ message: 'Client created successfully!', type: 'success' });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to create client:', err);
      if (axios.isAxiosError(err) && err.response) {
        setStatus({ message: `Error: ${err.response.data?.message}`, type: 'error' });
      } else {
        setStatus({ message: 'An unknown error occurred.', type: 'error' });
      }
    }
  };

  const openModal = (mode: 'info' | 'edit' | 'delete' | 'create', client?: Client) => {
    if (client) {
      setSelectedClient(client);
      if (mode === 'edit') {
        setFormData({
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone_number: client.phone_number,
          address: client.address || '',
          city: client.city || '',
          postal_code: client.postal_code || ''
        });
      }
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        postal_code: ''
      });
    }
    setModalMode(mode);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setModalMode(null);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (loading) return <div className="text-center mt-10 text-[#3e2e3d]">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">Error: {error}</div>;

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="relative overflow-hidden py-20 px-6 text-[#3e2e3d] min-h-screen bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be]">
      <div className="relative max-w-5xl mx-auto z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-[#3e2e3d]">Client Management</h1>
          <p className="mt-2 text-[#5f4b5a]">Meet the amazing people who make it all happen.</p>
        </div>

        {status.message && (
          <div className={`p-4 rounded-md mb-4 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {status.message}
          </div>
        )}

        {/* Search + Floating Plus Button */}
        <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search by ID, name, email, phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-full border border-[#e8dcd4] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#c1a38f] transition"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78974]" />
          </div>
          <button
            onClick={() => openModal('create')}
            className="ml-6 p-4 rounded-full bg-[#c1a38f] text-white hover:bg-[#a78974] shadow-md transition-colors duration-300"
          >
            <FaPlus />
          </button>
        </div>

        {/* Clients List */}
        <div className="divide-y divide-[#e8dcd4] border border-[#e8dcd4] rounded-xl bg-white/50 backdrop-blur-md shadow-sm">
          <ul>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <li
                  key={client.client_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-white/70 transition text-sm text-[#5f4b5a]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="font-semibold text-base flex items-center">
                      <FaUserCircle className="mr-2 text-xl" />
                      {client.first_name} {client.last_name}
                    </span>
                    <span className="flex items-center text-sm">
                      <FaPhone className="mr-1 text-[#3e2e3d]" />
                      {formatPhoneNumber(client.phone_number)}
                    </span>
                    <span className="flex items-center text-sm">
                      <FaEnvelope className="mr-1 text-[#3e2e3d]" />
                      {client.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <button onClick={() => openModal('info', client)} className="p-2 rounded-full text-xs bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition">
                      <FaInfoCircle />
                    </button>
                    <button onClick={() => openModal('edit', client)} className="p-2 rounded-full text-xs bg-[#c1a38f] text-white hover:bg-[#a78974] transition">
                      <FaEdit />
                    </button>
                    <button onClick={() => openModal('delete', client)} className="p-2 rounded-full text-xs bg-red-100 text-red-700 hover:bg-red-200 transition">
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <div className="p-6 text-center text-[#5f4b5a] font-medium">
                No clients found.
              </div>
            )}
          </ul>
        </div>
      </div>

      {/* Info Modal */}
      {showModal && selectedClient && modalMode === 'info' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3e2e3d]">Client Info</h2>
              <button onClick={closeModal}><FaTimes className="text-2xl text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-2 text-sm text-[#5f4b5a]">
              <p><strong>ID:</strong> {selectedClient.client_id}</p>
              <p><strong>Name:</strong> {selectedClient.first_name} {selectedClient.last_name}</p>
              <p className="flex items-center"><FaEnvelope className="mr-2" /> {selectedClient.email}</p>
              <p className="flex items-center"><FaPhone className="mr-2" /> {formatPhoneNumber(selectedClient.phone_number)}</p>
              <p><strong>Address:</strong> {selectedClient.address}</p>
              <p><strong>City:</strong> {selectedClient.city}</p>
              <p><strong>Postal Code:</strong> {selectedClient.postal_code}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && selectedClient && modalMode === 'edit' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3e2e3d]">Edit Client</h2>
              <button onClick={closeModal}><FaTimes className="text-2xl text-gray-500 hover:text-gray-700" /></button>
            </div>
            <form className="space-y-3">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#3e2e3d] capitalize mb-1">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    type="text"
                    value={value || ''}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm"
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm">
                  Cancel
                </button>
                <button type="button" onClick={handleUpdateClient} className="px-4 py-2 bg-[#c1a38f] text-white rounded-md hover:bg-[#a78974] text-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && modalMode === 'create' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3e2e3d]">Create Client</h2>
              <button onClick={closeModal}><FaTimes className="text-2xl text-gray-500 hover:text-gray-700" /></button>
            </div>
            <form className="space-y-3">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#3e2e3d] capitalize mb-1">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    type="text"
                    value={value || ''}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm"
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm">
                  Cancel
                </button>
                <button type="button" onClick={handleCreateClient} className="px-4 py-2 bg-[#3e2e3d] text-white rounded-md hover:bg-[#5f4b5a] text-sm">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showModal && selectedClient && modalMode === 'delete' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3e2e3d]">Delete Client</h2>
              <button onClick={closeModal}><FaTimes className="text-2xl text-gray-500 hover:text-gray-700" /></button>
            </div>
            <p className="mb-4 text-sm text-[#5f4b5a]">
              Are you sure you want to delete <strong>{selectedClient.first_name} {selectedClient.last_name}</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={closeModal} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm">
                Cancel
              </button>
              <button onClick={() => handleDeleteClient(selectedClient.client_id)} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ClientsPage;
