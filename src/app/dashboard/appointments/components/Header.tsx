import React from 'react';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => (
  <div className="flex justify-between items-center mb-10">
    <div>
      <h1 className="text-4xl font-serif text-gray-900">Appointments</h1>
      <p className="text-lg text-gray-500">Manage your upcoming appointments.</p>
    </div>
    <button
      onClick={onLogout}
      className="px-6 py-2 rounded-full bg-gray-800 text-white text-sm shadow-md hover:bg-gray-700 transition"
    >
      Logout
    </button>
  </div>
);

export default Header;
