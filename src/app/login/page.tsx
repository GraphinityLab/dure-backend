'use client';
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '@/utils/axiosInstance';
import { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// Types
interface FormData {
  identifier: string;
  password: string;
}
interface JWTPayload {
  permissions: string[];
  user_id: number;
  email: string;
  role_id: number;
  role_name: string;
  username?: string; // 👈 added
}
interface LoginResponse {
  message: string;
  token: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ identifier: '', password: '' });
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axiosInstance.post<LoginResponse>('/auth', formData);

      if (response.status === 200 && response.data.token) {
        const decodedToken = jwtDecode<JWTPayload>(response.data.token);

        // store everything needed
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('permissions', JSON.stringify(decodedToken.permissions));
        localStorage.setItem('username', decodedToken.username || decodedToken.email); // 👈 now stored
        localStorage.setItem("user_id", decodedToken.user_id.toString()); 
        setMessage('Login successful! Redirecting...');
        window.location.href = '/dashboard/appointments';
      } else {
        setMessage(response.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage =
        (axiosError.response?.data as { message?: string })?.message ||
        'An unknown error occurred. Please try again.';
      setMessage(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-24 px-6 min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be] text-[#3e2e3d]">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[280px] h-[280px] bg-rose-100/40 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] right-[15%] w-[220px] h-[220px] bg-pink-200/30 blur-[90px] rounded-full" />
      </div>

      <div className="w-full max-w-md">
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-[Soligant] mb-10 text-center tracking-tight"
        >
          Admin Login
        </motion.h1>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/80 p-10 rounded-3xl shadow-lg border border-[#e8dcd4] backdrop-blur-md"
        >
          <form onSubmit={handleSubmit} className="space-y-6 font-[CaviarDreams]">
            <div>
              <label htmlFor="identifier" className="block text-sm mb-1">Email or Username</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                required
                value={formData.identifier}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#e8dcd4] rounded-full text-sm bg-white/70 focus:ring-2 focus:ring-[#3e2e3d] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm mb-1">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#e8dcd4] rounded-full text-sm bg-white/70 focus:ring-2 focus:ring-[#3e2e3d] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-6 py-3 rounded-full bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition font-[CaviarDreams] text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {message && (
            <p className={`mt-6 text-center text-sm font-[CaviarDreams] ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Login;
