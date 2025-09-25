'use client';
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '@/utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { AxiosError } from 'axios';

// Types
interface FormData {
  identifier: string;
  password: string;
}
interface JWTPayload {
  staff_id: number;
  email: string;
  username?: string;
  role_id: number;
  role_name: string;
  first_name?: string;
  last_name?: string;
  permissions: string[];
}
interface LoginResponse {
  message: string;
  token: string;
  staff_id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[];
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ identifier: '', password: '' });
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth', formData);
      const data = response.data as LoginResponse;

      if (data?.token) {
        const decoded = jwtDecode(data.token) as JWTPayload;

        // ✅ Store everything in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('permissions', JSON.stringify(decoded.permissions));
        localStorage.setItem('username', decoded.username || decoded.email);
        localStorage.setItem('staff_id', decoded.staff_id.toString());
        localStorage.setItem('first_name', decoded.first_name || data.first_name || '');
        localStorage.setItem('last_name', decoded.last_name || data.last_name || '');

        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard/appointments';
        }, 300);
      } else {
        setMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setMessage(`Login failed: ${axiosError.response?.data?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-24 px-6 min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be] text-[#3e2e3d]">
      <div className="w-full max-w-md">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-[Soligant] mb-10 text-center tracking-tight"
        >
          Admin Login
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="bg-white/80 p-10 rounded-3xl shadow-lg border border-[#e8dcd4] backdrop-blur-md"
        >
          <form onSubmit={handleSubmit} className="space-y-6 font-[CaviarDreams]">
            <input
              type="text"
              name="identifier"
              placeholder="Email or Username"
              value={formData.identifier}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-full"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-full"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-6 py-3 rounded-full bg-[#3e2e3d] text-white hover:bg-[#5f4b5a]"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {message && (
            <p className={`mt-6 text-center ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Login;
