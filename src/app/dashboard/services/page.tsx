'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import axios from 'axios';
import {
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaTimes,
  FaSearch,
  FaPlus,
  FaTag,
  FaClock,
  FaDollarSign,
} from 'react-icons/fa';

interface Service {
  service_id: number;
  name: string;
  duration_minutes: number;
  price: number;
  description: string;
  category: string;
}

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const money = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : String(v ?? '');
  };

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'info' | 'edit' | 'delete' | 'create' | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Service, 'service_id'>>({
    name: '',
    duration_minutes: 0,
    price: 0,
    description: '',
    category: '',
  });

  // ---------------- Fetch ----------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/services');
      setServices(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch services:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.message || 'API call failed.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CRUD ----------------
  const handleCreateService = async () => {
    setActionLoading(true);
    try {
      await axiosInstance.post('/services', formData);
      setStatus({ message: 'Service created successfully!', type: 'success' });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to create service:', err);
      if (axios.isAxiosError(err) && err.response) {
        setStatus({ message: err.response.data?.message || 'Error creating service.', type: 'error' });
      } else {
        setStatus({ message: 'Error creating service.', type: 'error' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;
    setActionLoading(true);
    try {
      await axiosInstance.put(`/services/${selectedService.service_id}`, {
        ...formData,
        service_id: selectedService.service_id,
      });
      setStatus({ message: 'Service updated successfully!', type: 'success' });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to update service:', err);
      if (axios.isAxiosError(err) && err.response) {
        setStatus({ message: err.response.data?.message || 'Error updating service.', type: 'error' });
      } else {
        setStatus({ message: 'Error updating service.', type: 'error' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    setActionLoading(true);
    try {
      await axiosInstance.delete(`/services/${serviceId}`);
      setStatus({ message: 'Service deleted successfully!', type: 'success' });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to delete service:', err);
      if (axios.isAxiosError(err) && err.response) {
        setStatus({ message: err.response.data?.message || 'Error deleting service.', type: 'error' });
      } else {
        setStatus({ message: 'Error deleting service.', type: 'error' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- Modal Helpers ----------------
  const openModal = (mode: 'info' | 'edit' | 'delete' | 'create', service?: Service) => {
    setSelectedService(service || null);
    setModalMode(mode);

    if (mode === 'edit' && service) {
      setFormData({
        name: service.name,
        duration_minutes: service.duration_minutes,
        price: service.price,
        description: service.description,
        category: service.category,
      });
    }

    if (mode === 'create') {
      setFormData({
        name: '',
        duration_minutes: 0,
        price: 0,
        description: '',
        category: '',
      });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
    setModalMode(null);
  };

  // ---------------- Effects ----------------
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // ---------------- Filters ----------------
  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      activeCategory.toLowerCase() === 'all' ||
      service.category.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // ---------------- JSX ----------------
  return (
    <section className="relative overflow-hidden py-20 px-6 text-[#3e2e3d] min-h-screen bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be]">
      <div className="relative max-w-5xl mx-auto z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-[#3e2e3d]">Service Management</h1>
          <p className="mt-2 text-[#5f4b5a]">View, update, and manage services.</p>
        </div>

        {status.message && (
          <div
            className={`p-4 rounded-md mb-4 ${
              status.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:w-2/3">
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 rounded-full border border-[#e8dcd4] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#c1a38f] transition"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78974]" />
          </div>
          <button
            onClick={() => openModal('create')}
            className="p-3 rounded-full bg-[#c1a38f] text-white hover:bg-[#a78974] transition-colors duration-300"
          >
            <FaPlus />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {categories.map((category, i) => {
            const isActive = activeCategory.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={i}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm shadow-sm transition
                ${
                  isActive
                    ? 'bg-[#3e2e3d] text-white'
                    : 'bg-white text-[#3e2e3d] border border-[#d8c9c9] hover:bg-[#f5eeee]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Services Table */}
        <div className="border border-[#e8dcd4] rounded-xl bg-white/50 backdrop-blur-md shadow-sm">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 px-4 py-3 text-sm font-semibold text-[#3e2e3d] bg-[#f9f4ef] rounded-t-xl">
            <div className="col-span-4 flex items-center">Service Name</div>
            <div className="col-span-2 flex items-center">Category</div>
            <div className="col-span-2 flex items-center">Duration</div>
            <div className="col-span-2 flex items-center">Price</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List */}
          <ul className="divide-y divide-[#e8dcd4]">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <li
                  key={service.service_id}
                  className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-white/70 transition text-sm text-[#5f4b5a]"
                >
                  <div className="sm:col-span-4 flex items-center font-medium">
                    <FaTag className="mr-2 text-lg text-[#3e2e3d]" />
                    {service.name}
                  </div>
                  <div className="sm:col-span-2 text-[#3e2e3d] font-medium">{service.category}</div>
                  <div className="sm:col-span-2 flex items-center">
                    <FaClock className="mr-1 text-[#3e2e3d]" />
                    {service.duration_minutes} min
                  </div>
                  <div className="sm:col-span-2 flex items-center">
                    <FaDollarSign className="mr-1 text-[#3e2e3d]" />
                    ${money(service.price)}
                  </div>
                  <div className="sm:col-span-2 flex justify-end space-x-2">
                    <button
                      onClick={() => openModal('info', service)}
                      className="p-2 rounded-full bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition"
                    >
                      <FaInfoCircle />
                    </button>
                    <button
                      onClick={() => openModal('edit', service)}
                      className="p-2 rounded-full bg-[#c1a38f] text-white hover:bg-[#a78974] transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => openModal('delete', service)}
                      className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <div className="p-6 text-center text-[#5f4b5a] font-medium">
                No services found.
              </div>
            )}
          </ul>
        </div>
      </div>

      {/* Info Modal */}
      {showModal && selectedService && modalMode === 'info' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3e2e3d]">Service Info</h2>
              <button onClick={closeModal}>
                <FaTimes className="text-2xl text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-[#5f4b5a]">
              <p><strong>ID:</strong> {selectedService.service_id}</p>
              <p><strong>Name:</strong> {selectedService.name}</p>
              <p><strong>Category:</strong> {selectedService.category}</p>
              <p><strong>Duration:</strong> {selectedService.duration_minutes} minutes</p>
              <p><strong>Price:</strong> ${money(selectedService.price)}</p>
              <p><strong>Description:</strong> {selectedService.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (modalMode === 'create' || (modalMode === 'edit' && selectedService)) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3e2e3d]">
                {modalMode === 'create' ? 'Create Service' : 'Edit Service'}
              </h2>
              <button onClick={closeModal}>
                <FaTimes className="text-2xl text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <form className="space-y-3">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#3e2e3d] capitalize mb-1">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [key]:
                          typeof value === 'number'
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c1a38f] text-sm"
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={modalMode === 'create' ? handleCreateService : handleUpdateService}
                  className="px-4 py-2 bg-[#c1a38f] text-white rounded-md hover:bg-[#a78974] text-sm"
                >
                  {modalMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showModal && selectedService && modalMode === 'delete' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3e2e3d]">Delete Service</h2>
              <button onClick={closeModal}>
                <FaTimes className="text-2xl text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <p className="mb-4 text-sm text-[#5f4b5a]">
              Are you sure you want to delete{' '}
              <strong>{selectedService.name}</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteService(selectedService.service_id)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {(loading || actionLoading) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <div className="w-16 h-16 border-4 border-[#c1a38f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </section>
  );
};

export default ServicesPage;
