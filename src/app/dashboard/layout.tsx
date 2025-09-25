"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  UserCog,
  Scissors,
  Settings,
  LogOut,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard/appointments", label: "Appointments", icon: Calendar, permission: "see_appointments" },
  { href: "/dashboard/clients", label: "Clients", icon: Users, permission: "see_clients" },
  { href: "/dashboard/staff", label: "Staff", icon: UserCog, permission: "see_staff" },
  { href: "/dashboard/services", label: "Services", icon: Scissors, permission: "see_services" },
  { href: "/dashboard/roles", label: "Roles", icon: Settings, permission: "see_roles" },
  { href: "/dashboard/logs", label: "Logs", icon: FileText, permission: "see_logs" },
  { href: "/dashboard/history", label: "Previous Appointments", icon: FileText, permission: "see_history" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffInitials, setStaffInitials] = useState<string>("👤");
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const storedStaffId = localStorage.getItem("staff_id");
    const storedFirst = localStorage.getItem("first_name");
    const storedLast = localStorage.getItem("last_name");

    if (storedStaffId) {
      setStaffId(storedStaffId);

      if (storedFirst || storedLast) {
        const initials = `${storedFirst?.[0] ?? ""}${storedLast?.[0] ?? ""}`;
        setStaffInitials(initials.toUpperCase() || "👤");
      }
    }

    const storedPermissions = localStorage.getItem("permissions");
    if (storedPermissions) {
      try {
        setPermissions(JSON.parse(storedPermissions));
      } catch {
        console.warn("Failed to parse permissions from localStorage");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    localStorage.removeItem("staff_id");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    window.location.href = "/login";
  };

  return (
    <section className="flex min-h-screen bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be] text-[#3e2e3d]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#3e2e3d] text-white flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-[Soligant] tracking-tight">
            Dashboard
          </h1>

          {staffId && (
            <Link href={`/dashboard/staff/${staffId}`}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#5f4b5a] hover:bg-[#7b6576] cursor-pointer transition text-white font-semibold"
              >
                {staffInitials}
              </motion.div>
            </Link>
          )}
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          {navItems
            .filter((item) => permissions.includes(item.permission))
            .map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition 
                      ${active ? "bg-[#f6e9da] text-[#3e2e3d]" : "hover:bg-[#5f4b5a]"}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-[CaviarDreams]">{label}</span>
                  </motion.div>
                </Link>
              );
            })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg transition hover:bg-[#5f4b5a]"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-[CaviarDreams]">Logout</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10">{children}</main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be] rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-[#3e2e3d]/20"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-[Soligant] text-[#3e2e3d] mb-6">
                Are you sure you want to logout?
              </h2>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#3e2e3d] text-white font-[CaviarDreams] hover:bg-[#5f4b5a] transition shadow"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-[CaviarDreams] hover:bg-red-700 transition shadow"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
