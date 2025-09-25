"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

type StaffMember = {
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
};

const IMMUTABLE_FIELDS = new Set<keyof StaffMember>(["staff_id", "role_id", "username"]);

function buildUpdatePayload(
  form: Partial<StaffMember>,
  opts: { includePassword: boolean; newPw?: string }
) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined || value === null) continue;
    if (IMMUTABLE_FIELDS.has(key as keyof StaffMember)) continue;
    out[key] = value;
  }

  if (opts.includePassword && opts.newPw) {
    out.password = opts.newPw; // backend hashes into hashed_password
  }

  return out;
}

function validatePassword(pw: string): string[] {
  const issues: string[] = [];
  if (!pw || pw.length < 8) issues.push("At least 8 characters");
  if (!/[a-z]/.test(pw)) issues.push("One lowercase letter");
  if (!/[A-Z]/.test(pw)) issues.push("One uppercase letter");
  if (!/[0-9]/.test(pw)) issues.push("One number");
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push("One symbol");
  if (/\s/.test(pw)) issues.push("No spaces");
  return issues;
}

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();

  const staffIdParam = (params as Record<string, string | string[] | undefined>)?.id;
  const staffId = useMemo(() => {
    const raw = Array.isArray(staffIdParam) ? staffIdParam[0] : staffIdParam;
    return raw ?? null;
  }, [staffIdParam]);

  const [form, setForm] = useState<Partial<StaffMember>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password state
  const [currentPw, setCurrentPw] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // 🔐 Security check: redirect if URL id doesn’t match logged-in staff_id
  useEffect(() => {
    const loggedInId = localStorage.getItem("staff_id");
    if (!loggedInId) return; // not logged in yet
    if (staffId && staffId !== loggedInId) {
      router.replace(`/dashboard/staff/${loggedInId}`); // force redirect
    }
  }, [staffId, router]);

  // Auto-dismiss messages
  useEffect(() => {
    if (success || error || verifyMsg) {
      const t = setTimeout(() => {
        setSuccess(null);
        setError(null);
        setVerifyMsg(null);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error, verifyMsg]);

  // Fetch staff data
  useEffect(() => {
    if (!staffId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(`/staff/${encodeURIComponent(staffId)}`);
        setForm(res.data as StaffMember);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Failed to load staff info"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [staffId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(null);
    setError(null);
  }, []);

  // Reset verification when current password changes
  useEffect(() => {
    setIsVerified(false);
    if (currentPw.length === 0) setVerifyMsg(null);
  }, [currentPw]);

  const handleVerifyCurrent = useCallback(async () => {
    if (!staffId || !currentPw) return;
    setVerifying(true);
    setVerifyMsg(null);
    try {
      await axiosInstance.post(`/staff/${encodeURIComponent(staffId)}/verify-password`, {
        current_password: currentPw,
      });
      setIsVerified(true);
      setVerifyMsg("Current password verified.");
    } catch (e: any) {
      setIsVerified(false);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Incorrect current password.";
      setVerifyMsg(`(${status ?? "Error"}) ${msg}`);
    } finally {
      setVerifying(false);
    }
  }, [staffId, currentPw]);

  const handleSave = useCallback(async () => {
    if (!staffId) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const wantsPwChange = newPw.length > 0 || confirmPw.length > 0;

      if (wantsPwChange) {
        if (!isVerified) {
          setError("Please verify your current password before changing it.");
          setSaving(false);
          return;
        }
        const issues = validatePassword(newPw);
        if (issues.length > 0) {
          setError("Password not secure: " + issues.join(", "));
          setSaving(false);
          return;
        }
        if (newPw !== confirmPw) {
          setError("Passwords do not match.");
          setSaving(false);
          return;
        }
      }

      const payload = buildUpdatePayload(form, {
        includePassword: wantsPwChange,
        newPw,
      });

      await axiosInstance.put(`/staff/${encodeURIComponent(staffId)}`, payload);

      setSuccess("Profile updated successfully.");
      setNewPw("");
      setConfirmPw("");
      router.refresh();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to update profile.";
      setError(`(${status ?? "Error"}) ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [staffId, form, newPw, confirmPw, isVerified, router]);

  if (!staffId) {
    return (
      <div className="text-center mt-10 text-red-600">
        Invalid staff id in URL. Make sure you navigated from the staff list.
      </div>
    );
  }

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error && !success) return <div className="text-center mt-10 text-red-600">{error}</div>;

  const initials =
    `${form.first_name?.[0] ?? ""}${form.last_name?.[0] ?? ""}`.toUpperCase() || "👤";
  const passwordInputsDisabled = !isVerified;

  const fields: Array<{ label: string; name: keyof StaffMember; type?: string; disabled?: boolean }> = [
    { label: "First Name", name: "first_name" },
    { label: "Last Name", name: "last_name" },
    { label: "Username", name: "username", disabled: true },
    { label: "Email", name: "email", type: "email" },
    { label: "Address", name: "address" },
    { label: "City", name: "city" },
    { label: "Province", name: "province" },
    { label: "Postal Code", name: "postal_code" },
  ];

  return (
    <section className="max-w-2xl mx-auto mt-10 p-6 bg-gradient-to-br from-[#f6e9da] via-[#f2dfce] to-[#e8d4be] rounded-2xl shadow-lg border border-[#3e2e3d]/20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#3e2e3d] text-white flex items-center justify-center font-semibold">
          {initials}
        </div>
        <div>
          <h1 className="text-3xl font-[Soligant] text-[#3e2e3d] leading-tight">My Profile</h1>
          <p className="text-xs text-[#3e2e3d]/70 font-[CaviarDreams]">
            ID: {String(form.staff_id ?? staffId)} • Username: {form.username ?? "-"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm">
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile fields */}
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <label key={String(field.name)} className="flex flex-col">
            <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">{field.label}</span>
            <input
              name={field.name as string}
              type={field.type ?? "text"}
              value={(form[field.name] as string) || ""}
              onChange={handleChange}
              disabled={field.disabled}
              className={`px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none ${
                field.disabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
          </label>
        ))}

        {/* Divider */}
        <div className="my-4 h-px bg-[#3e2e3d]/20" />

        <h2 className="text-xl font-[Soligant] text-[#3e2e3d] mb-2">Change Password</h2>

        {/* Verify current password */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Current Password</span>
          <div className="flex gap-2">
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none"
              autoComplete="current-password" />
            <button type="button" onClick={handleVerifyCurrent}
              disabled={verifying || currentPw.length === 0}
              className="px-3 py-2 rounded-lg border border-[#3e2e3d]/30 text-[#3e2e3d] hover:bg-black/5 disabled:opacity-50">
              {verifying ? "Verifying..." : isVerified ? "Verified ✓" : "Verify"}
            </button>
          </div>
          {verifyMsg && (
            <div className={`text-xs mt-1 ${isVerified ? "text-green-700" : "text-red-600"}`}>{verifyMsg}</div>
          )}
        </label>

        {/* New password */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">New Password</span>
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
            disabled={passwordInputsDisabled}
            className={`px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none ${
              passwordInputsDisabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`} autoComplete="new-password" />
        </label>

        {/* Confirm password */}
        <label className="flex flex-col">
          <span className="text-sm font-[CaviarDreams] text-[#3e2e3d]">Confirm Password</span>
          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            disabled={passwordInputsDisabled}
            className={`px-3 py-2 rounded-lg border border-[#3e2e3d]/30 focus:outline-none ${
              passwordInputsDisabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`} autoComplete="new-password" />
        </label>

        {/* Save */}
        <motion.button whileTap={{ scale: 0.95 }} disabled={saving} onClick={handleSave}
          className="mt-2 px-5 py-2 rounded-xl bg-[#3e2e3d] text-white font-[CaviarDreams] hover:bg-[#5f4b5a] transition shadow disabled:opacity-60">
          {saving ? "Saving..." : "Save Changes"}
        </motion.button>
      </div>
    </section>
  );
}
