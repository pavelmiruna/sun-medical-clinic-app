import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import AnnouncementsTab from "./AnnouncementsTab";
import SettingsPage from "./SettingsPage";

const API = "http://localhost:4000/api";

function useApi(url, refreshKey = 0) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url || !token) return;
    setLoading(true);
    fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e); setLoading(false); });
  }, [url, token, refreshKey]);

  return { data, loading, error };
}

const ROLE_LABELS = {
  DOCTOR: { label: "Doctor", color: "bg-teal-100 text-teal-700" },
  ASSISTANT: { label: "Asistent", color: "bg-violet-100 text-violet-700" },
  ADMIN: { label: "Admin", color: "bg-rose-100 text-rose-700" },
  PATIENT: { label: "Pacient", color: "bg-blue-100 text-blue-700" },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Sidebar ──────────────────────────────────────────────────
const navItems = [
  {
    id: "dashboard", label: "Dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    id: "users", label: "Utilizatori",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    id: "assignments", label: "Atribuiri",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    id: "announcements", label: "Anunțuri",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  },
  {
    id: "ai", label: "AI Insights",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
  {
    id: "clinic", label: "Clinică",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    id: "settings", label: "Setări",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

function Sidebar({ active, setActive, onLogout }) {
  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-100 flex flex-col shrink-0 sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Cabinet Medical</p>
            <p className="text-xs text-rose-600 font-semibold">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              active === item.id
                ? "bg-rose-50 text-rose-700 font-semibold"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Deconectare
        </button>
      </div>
    </aside>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value ?? "-"}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Modal creare cont staff ──────────────────────────────────
const PASSWORD_RULES = [
  { id: "len",     label: "Minim 6 caractere",       test: (p) => p.length >= 6 },
  { id: "digit",   label: "Cel puțin o cifră",        test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Cel puțin un semn special", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

function PasswordRequirements({ password }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.id} className={`flex items-center gap-2 text-xs font-medium transition-colors ${ok ? "text-green-600" : "text-slate-400"}`}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${ok ? "text-green-500" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {ok
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

function CreateStaffModal({ onClose, onCreated, token }) {
  const [form, setForm] = useState({ email: "", password: "", role: "DOCTOR" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordValid = PASSWORD_RULES.every((r) => r.test(form.password));

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailValid) {
      setError("Adresa de email nu este validă (ex: nume@gmail.com).");
      return;
    }
    if (!passwordValid) {
      setError("Parola nu îndeplinește toate cerințele de securitate.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare la creare."); return; }
      onCreated();
      onClose();
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cont nou staff</h2>
            <p className="text-sm text-slate-400">Crează un cont pentru doctor, asistent sau admin</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="ex: doctor@cabinet.ro"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Parolă</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Minim 6 caractere, o cifră și un semn special"
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all ${
                form.password && !passwordValid ? "border-amber-300" : "border-slate-200"
              }`}
            />
            <PasswordRequirements password={form.password} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Rol</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "DOCTOR", label: "Doctor", color: "teal" },
                { value: "ASSISTANT", label: "Asistent", color: "violet" },
                { value: "ADMIN", label: "Admin", color: "rose" },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.role === r.value
                      ? r.color === "teal" ? "border-teal-500 bg-teal-50 text-teal-700"
                        : r.color === "violet" ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Anulează
            </button>
            <button type="submit" disabled={loading || !passwordValid || !emailValid}
              className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se creează...</>
              ) : "Creează cont"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────
function DashboardHome({ users, loading }) {
  const userList = Array.isArray(users) ? users : [];
  const doctors = userList.filter((u) => u.role === "DOCTOR").length;
  const assistants = userList.filter((u) => u.role === "ASSISTANT").length;
  const admins = userList.filter((u) => u.role === "ADMIN").length;
  const patients = userList.filter((u) => u.role === "PATIENT").length;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bună dimineața" : now.getHours() < 18 ? "Bună ziua" : "Bună seara";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{greeting}, Administrator 👋</h1>
        <p className="text-slate-500 mt-1">
          {now.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Doctori" value={doctors} color="bg-teal-50"
          icon={<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Asistenți" value={assistants} color="bg-violet-50"
          icon={<svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard label="Pacienți" value={patients} color="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard label="Administratori" value={admins} color="bg-rose-50"
          icon={<svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Conturi recente</h2>
          <p className="text-sm text-slate-400">Ultimii utilizatori adăugați</p>
        </div>
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : userList.length === 0 ? (
            <div className="text-center py-8"><p className="text-slate-400 text-sm">Niciun utilizator</p></div>
          ) : (
            [...userList].reverse().slice(0, 8).map((u) => {
              const role = ROLE_LABELS[u.role] ?? { label: u.role, color: "bg-slate-100 text-slate-600" };
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-600 font-bold text-sm">{u.email?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{u.email}</p>
                    {u.patientProfile && (
                      <p className="text-xs text-teal-600 font-medium truncate">
                        {u.patientProfile.firstName} {u.patientProfile.lastName}
                      </p>
                    )}
                    {u.doctorProfile && (u.doctorProfile.firstName || u.doctorProfile.lastName) && (
                      <p className="text-xs text-teal-600 font-medium truncate">
                        Dr. {u.doctorProfile.firstName} {u.doctorProfile.lastName}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">{formatDate(u.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${role.color}`}>{role.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal acces tutelă ───────────────────────────────────────
function GuardianAccessModal({ user, token, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/users/${user.id}/patient-accesses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Eroare la încărcarea datelor."); setLoading(false); });
  }, [user.id, token]);

  const handleRevoke = async (patientId, guardianUserId, guardianEmail) => {
    if (!window.confirm(`Ești sigur că vrei să revoci accesul lui ${guardianEmail} la profilul acestui pacient? Tutorele nu va mai putea accesa dosarul.`)) return;
    setRevoking(guardianUserId);
    setError("");
    try {
      const res = await fetch(`${API}/admin/patient-accesses/${patientId}/${guardianUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) { setError(result.message || "Eroare la revocare."); return; }
      setData((prev) => ({
        ...prev,
        accesses: prev.accesses.filter((a) => a.guardianUserId !== guardianUserId),
      }));
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setRevoking(null);
    }
  };

  const ROLE_ACCESS_LABELS = {
    GUARDIAN: "Tutore",
    PROXY: "Reprezentant",
    OWNER: "Proprietar",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Acces tutelă</h2>
            <p className="text-sm text-slate-400 truncate max-w-xs">{user.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data?.accesses?.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-slate-400 text-sm">Niciun tutor asociat acestui pacient.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">
                Pacient: <span className="font-semibold text-slate-700">{data?.patientName}</span>
              </p>
              {data?.accesses?.map((a) => (
                <div key={a.guardianUserId} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-teal-700 font-bold text-sm">{a.guardianEmail?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{a.guardianEmail}</p>
                    <p className="text-xs text-slate-400">
                      {ROLE_ACCESS_LABELS[a.role] ?? a.role} · din {new Date(a.since).toLocaleDateString("ro-RO")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(data.patientId, a.guardianUserId, a.guardianEmail)}
                    disabled={revoking === a.guardianUserId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {revoking === a.guardianUserId ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                    )}
                    Revocare
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────
function UsersTab({ users, loading, onRefresh, token }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const filterRole = searchParams.get("userRole") ?? "ALL";
  const setFilterRole = (val) => setSearchParams((prev) => { const p = new URLSearchParams(prev); val === "ALL" ? p.delete("userRole") : p.set("userRole", val); return p; }, { replace: true });
  const search = searchParams.get("userSearch") ?? "";
  const setSearch = (val) => setSearchParams((prev) => { const p = new URLSearchParams(prev); val ? p.set("userSearch", val) : p.delete("userSearch"); return p; }, { replace: true });
  const [guardianModalUser, setGuardianModalUser] = useState(null);

  const userList = Array.isArray(users) ? users : [];

  const filtered = userList.filter((u) => {
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    const q = search.toLowerCase();
    const matchEmail = u.email?.toLowerCase().includes(q);
    const patientName = u.patientProfile
      ? `${u.patientProfile.firstName} ${u.patientProfile.lastName}`.toLowerCase()
      : "";
    const doctorName = u.doctorProfile
      ? `${u.doctorProfile.firstName} ${u.doctorProfile.lastName}`.toLowerCase()
      : "";
    const matchName = patientName.includes(q) || doctorName.includes(q);
    return matchRole && (matchEmail || matchName);
  });

  const roles = [
    { key: "ALL", label: "Toți" },
    { key: "DOCTOR", label: "Doctori" },
    { key: "ASSISTANT", label: "Asistenți" },
    { key: "ADMIN", label: "Admini" },
    { key: "PATIENT", label: "Pacienți" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Utilizatori</h1>
          <p className="text-slate-500 text-sm mt-1">{userList.length} conturi totale</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Cont nou
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută după email sau nume..."
          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
        />
        <div className="flex gap-2 flex-wrap">
          {roles.map((r) => (
            <button key={r.key} onClick={() => setFilterRole(r.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterRole === r.key ? "bg-rose-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-rose-300"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-slate-400">Niciun utilizator găsit</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const role = ROLE_LABELS[u.role] ?? { label: u.role, color: "bg-slate-100 text-slate-600" };
              return (
                <div key={u.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-600 font-bold">{u.email?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{u.email}</p>
                    {u.patientProfile && (
                      <p className="text-sm text-teal-600 font-medium truncate">
                        {u.patientProfile.firstName} {u.patientProfile.lastName}
                      </p>
                    )}
                    {u.doctorProfile && (u.doctorProfile.firstName || u.doctorProfile.lastName) && (
                      <p className="text-sm text-teal-600 font-medium truncate">
                        Dr. {u.doctorProfile.firstName} {u.doctorProfile.lastName}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">Creat: {formatDate(u.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${role.color}`}>{role.label}</span>
                  {u.role === "PATIENT" && (
                    <button
                      onClick={() => setGuardianModalUser(u)}
                      title="Gestionare acces tutelă"
                      className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateStaffModal
          token={token}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); onRefresh(); }}
        />
      )}

      {guardianModalUser && (
        <GuardianAccessModal
          user={guardianModalUser}
          token={token}
          onClose={() => setGuardianModalUser(null)}
        />
      )}
    </div>
  );
}

// ─── AI Insights Tab ──────────────────────────────────────────
function AIInsightsTab({ token }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/ai/insights`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setInsights(data);
    } catch (e) {
      setError(e.message || "Eroare la generarea insights-urilor");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Insights</h1>
          <p className="text-slate-500 text-sm mt-1">Analiză inteligentă a activității cabinetului</p>
        </div>
        <button onClick={fetchInsights} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/25 disabled:opacity-60">
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se analizează...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>Generează analiză</>
          )}
        </button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">{error}</div>}
      {!insights && !loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <p className="text-slate-700 font-semibold mb-2">Analiză AI disponibilă</p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Apasă butonul de mai sus pentru a genera o analiză a activității cabinetului.</p>
        </div>
      )}
      {insights && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Statistici rapide</h3>
              <div className="space-y-3">
                {[
                  { label: "Total pacienți", value: insights.rawStats.totalPatients, color: "text-blue-600" },
                  { label: "Total programări", value: insights.rawStats.totalAppointments, color: "text-indigo-600" },
                  { label: "Consultații", value: insights.rawStats.totalConsultations, color: "text-green-600" },
                  { label: "Rețete emise", value: insights.rawStats.totalPrescriptions, color: "text-purple-600" },
                  { label: "Trimiteri", value: insights.rawStats.totalReferrals, color: "text-orange-600" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-slate-500 text-sm">{s.label}</span>
                    <span className={`font-bold text-lg ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Ultimele 30 zile</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Programări</span><span className="font-bold text-slate-800">{insights.rawStats.last30Days.appointments}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Rata anulări</span><span className="font-bold text-red-500">{insights.rawStats.rates.cancelRate}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Rata absențe</span><span className="font-bold text-yellow-500">{insights.rawStats.rates.noShowRate}</span></div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Analiză generată de AI</h3>
                <p className="text-xs text-slate-400">{new Date(insights.generatedAt).toLocaleString("ro-RO")}</p>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed bg-slate-50 rounded-xl p-5">{insights.insights}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Atribuiri Asistent ↔ Doctor ─────────────────────────
function AssignmentsTab({ users, token, onRefresh }) {
  const userList = Array.isArray(users) ? users : [];
  const assistants = userList.filter((u) => u.role === "ASSISTANT");
  const doctors = userList.filter((u) => u.role === "DOCTOR");
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const assign = async (assistantId, doctorId) => {
    setSaving(assistantId); setError(""); setSuccess("");
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${assistantId}/assign-doctor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctorId: doctorId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare la atribuire."); return; }
      setSuccess(`Asistentul a fost ${doctorId ? "atribuit" : "dezatribuit"} cu succes.`);
      onRefresh();
    } catch { setError("Eroare de conexiune."); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Atribuiri Asistent ↔ Doctor</h1>
        <p className="text-slate-500 text-sm mt-1">Asociază fiecare asistent cu medicul responsabil</p>
      </div>

      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        {success}
      </div>}

      {assistants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-slate-400">Nu există asistenți în sistem.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header tabel */}
          <div className="grid grid-cols-2 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Asistent</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Medic atribuit</span>
          </div>

          <div className="divide-y divide-slate-100">
            {assistants.map((a) => (
              <div key={a.id} className="grid grid-cols-2 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                {/* Info asistent */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-violet-700 font-bold text-sm">{a.email[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{a.email}</p>
                    {a.assignedDoctor ? (
                      <p className="text-xs text-green-600 font-medium">
                        Atribuit: {a.assignedDoctor.email}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500 font-medium">Neatribuit</p>
                    )}
                  </div>
                </div>

                {/* Selector doctor */}
                <div className="flex items-center gap-3">
                  <select
                    value={a.assignedDoctorId ?? ""}
                    onChange={(e) => assign(a.id, e.target.value)}
                    disabled={saving === a.id}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all disabled:opacity-50"
                  >
                    <option value="">— Neatribuit —</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.email}</option>
                    ))}
                  </select>
                  {saving === a.id && (
                    <svg className="w-4 h-4 animate-spin text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {doctors.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
          Nu există doctori în sistem. Creează mai întâi un cont de doctor.
        </div>
      )}
    </div>
  );
}

// ─── Clinic Tab ───────────────────────────────────────────────
function ClinicTab({ token }) {
  const EMPTY = { name: "", address: "", phone: "", email: "", serialPrefix: "" };
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/clinic`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d) setForm({
          name: d.name ?? "",
          address: d.address ?? "",
          phone: d.phone ?? "",
          email: d.email ?? "",
          serialPrefix: d.serialPrefix ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(""); setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Numele clinicii este obligatoriu."); return; }
    setSaving(true); setError(""); setSuccess(false);
    try {
      const res = await fetch(`${API}/admin/clinic`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare la salvare."); return; }
      setSuccess(true);
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: "name", label: "Nume clinică", placeholder: "ex: Cabinet Medical Dr. Ionescu", required: true },
    { name: "address", label: "Adresă", placeholder: "ex: Str. Unirii nr. 10, Cluj-Napoca" },
    { name: "phone", label: "Telefon", placeholder: "ex: 0264 123 456" },
    { name: "email", label: "Email", placeholder: "ex: contact@cabinet.ro", type: "email" },
    { name: "serialPrefix", label: "Prefix serie documente", placeholder: "ex: RM" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Informații clinică</h1>
        <p className="text-slate-500 text-sm mt-1">Datele de identificare ale cabinetului medical</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-5">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {f.label}
                {f.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                type={f.type ?? "text"}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Informațiile clinicii au fost salvate cu succes.
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/25 disabled:opacity-60"
            >
              {saving ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se salvează...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Salvează</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────
export default function AdminDashboard() {
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("tab") ?? "dashboard";
  const setActive = (tab) => setSearchParams({ tab }, { replace: true });
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);

  const { data: users, loading: loadingUsers } = useApi("/admin/users", usersRefreshKey);

  const handleLogout = () => { logout(); navigate("/login"); };

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <DashboardHome users={users} loading={loadingUsers} />;
      case "users":
        return <UsersTab users={users} loading={loadingUsers} onRefresh={() => setUsersRefreshKey((k) => k + 1)} token={token} />;
      case "assignments":
        return <AssignmentsTab users={users} token={token} onRefresh={() => setUsersRefreshKey((k) => k + 1)} />;
      case "announcements":
        return <AnnouncementsTab />;
      case "ai":
        return <AIInsightsTab token={token} />;
      case "clinic":
        return <ClinicTab token={token} />;
      case "settings":
        return <SettingsPage isDoctorRole={false} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
