import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import AnnouncementsBanner from "./AnnouncementsBanner";
import MyProfilesTab from "./MyProfilesTab";
import ProfilePage from "./ProfilePage";
import CreatePatientAppointmentModal from "./CreatePatientAppointmentModal";
import AISummaryCard from "../components/AISummaryCard";

const API = "http://localhost:4000/api";

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("ro-RO", {
    hour: "2-digit", minute: "2-digit",
  });
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function isFuture(dateStr) {
  return new Date(dateStr) > new Date();
}

function useFetch(url, token, refreshKey = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url || !token) return;
    setLoading(true);
    fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url, token, refreshKey]);

  return { data, loading };
}

const STATUS_LABELS = {
  SCHEDULED: { label: "Programat", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Finalizat", color: "bg-green-100 text-green-700" },
  CANCELED: { label: "Anulat", color: "bg-red-100 text-red-700" },
  NO_SHOW: { label: "Absent", color: "bg-yellow-100 text-yellow-700" },
};

const REASON_LABELS = {
  ROUTINE_CHECK: "Control de rutină",
  PRESCRIPTION_RENEWAL: "Reînnoire rețetă",
  SICK_VISIT: "Consultație boală",
  LAB_RESULTS: "Rezultate analize",
  VACCINATION: "Vaccinare",
  ADMINISTRATIVE: "Administrativ",
};

const PRIORITY_LABELS = {
  ROUTINE: { label: "Rutină", color: "bg-slate-100 text-slate-600" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

// ─── Sidebar ──────────────────────────────────────────────────
const navItems = [
  {
    id: "profiles", label: "Profilele mele",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    id: "overview", label: "Dashboard",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    id: "appointments", label: "Programările mele",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    id: "consultations", label: "Consultații",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    id: "prescriptions", label: "Rețete",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  },
  {
    id: "vaccinations", label: "Vaccinuri",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    id: "referrals", label: "Trimiteri",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  },
  {
    id: "ai", label: "Asistent AI", badge: "AI",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
  {
    id: "profile", label: "Setări cont",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

function Sidebar({ active, setActive, onLogout, profiles, activeProfile, setActiveProfile }) {
  return (
    <aside className="w-64 h-screen bg-slate-900 flex flex-col shrink-0 sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Cabinet Medical</p>
            <p className="text-slate-400 text-xs">Panou pacient</p>
          </div>
        </div>
      </div>

      {profiles && profiles.length > 1 && (
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Profil activ</p>
          <select
            value={activeProfile?.id ?? ""}
            onChange={(e) => {
              const p = profiles.find((pr) => pr.id === e.target.value);
              if (p) setActiveProfile(p);
            }}
            className="w-full bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              active === item.id
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {item.icon}
            {item.label}
            {item.badge && (
              <span className="ml-auto text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
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

// ─── Tab: Profil overview ─────────────────────────────────────
function OverviewTab({ profile, appointments, onCreateAppt }) {
  const upcoming = (appointments ?? []).filter((a) => isFuture(a.scheduledAt) && a.status === "SCHEDULED");
  const completed = (appointments ?? []).filter((a) => a.status === "COMPLETED");
  const age = calculateAge(profile?.dateOfBirth);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bună ziua! 👋</h1>
          <p className="text-slate-500 mt-1">Acesta este dosarul tău medical digital.</p>
        </div>
        <button
          onClick={onCreateAppt}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Programare nouă
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{profile?.firstName?.[0]}{profile?.lastName?.[0]}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{profile?.firstName} {profile?.lastName}</h2>
            <p className="text-slate-500 text-sm">
              {age !== null ? `${age} ani` : ""}
              {profile?.isMinor && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Minor</span>}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          {[
            { label: "Data nașterii", value: formatDate(profile?.dateOfBirth) },
            { label: "Telefon", value: profile?.phone || "-" },
            { label: "CNP", value: profile?.cnp ? <span className="font-mono text-xs">{profile.cnp}</span> : "-" },
            { label: "ID Pacient", value: <span className="font-mono text-xs text-slate-400 truncate">{profile?.id}</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className="text-slate-700 font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: "Programări viitoare", value: upcoming.length, color: "bg-indigo-50", textColor: "text-indigo-600" },
          { label: "Consultații efectuate", value: completed.length, color: "bg-green-50", textColor: "text-green-600" },
          { label: "Total programări", value: appointments?.length ?? 0, color: "bg-purple-50", textColor: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className={`text-3xl font-bold ${s.textColor} mb-1`}>{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Programări viitoare</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {upcoming.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-xs">{formatTime(a.scheduledAt)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{formatDate(a.scheduledAt)}</p>
                  <p className="text-xs text-slate-400">{REASON_LABELS[a.reason] ?? "Motiv nespecificat"}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Programat</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Programări ──────────────────────────────────────────
function AppointmentsTab({ appointments, loading, onCreateAppt, token, onRefresh }) {
  const [filter, setFilter] = useState("ALL");
  const [canceling, setCanceling] = useState(null);
  const filtered = (appointments ?? []).filter((a) => filter === "ALL" ? true : a.status === filter);

  const [cancelError, setCancelError] = useState("");

  const handleCancel = async (apptId) => {
    if (!window.confirm("Ești sigur că vrei să anulezi această programare?")) return;
    setCanceling(apptId); setCancelError("");
    try {
      const res = await fetch(`http://localhost:4000/api/appointments/${apptId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setCancelError(data.message || "Eroare la anularea programării.");
        return;
      }
      onRefresh?.();
    } catch {
      setCancelError("Eroare de conexiune. Încearcă din nou.");
    } finally { setCanceling(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Programările mele</h1>
        <button
          onClick={onCreateAppt}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Programare nouă
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[{ key: "ALL", label: "Toate" }, { key: "SCHEDULED", label: "Viitoare" }, { key: "COMPLETED", label: "Finalizate" }, { key: "CANCELED", label: "Anulate" }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f.key ? "bg-indigo-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"}`}>
            {f.label}
          </button>
        ))}
      </div>
      {cancelError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {cancelError}
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-slate-400">Nicio programare găsită</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((a) => {
              const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "bg-slate-100 text-slate-600" };
              const canCancel = a.status === "SCHEDULED";
              return (
                <div key={a.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-slate-700 font-bold text-sm">{formatTime(a.scheduledAt)}</span>
                    <span className="text-slate-400 text-xs">{formatDate(a.scheduledAt).split(" ").slice(0, 2).join(" ")}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{REASON_LABELS[a.reason] ?? "Motiv nespecificat"}</p>
                    <p className="text-sm text-slate-400">{formatDate(a.scheduledAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.color}`}>{status.label}</span>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        disabled={canceling === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {canceling === a.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        )}
                        Anulează
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Consultații ─────────────────────────────────────────
function ConsultationsTab({ patientId, token }) {
  const { data, loading } = useFetch(`/consultations/patient/${patientId}`, token);
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Consultațiile mele</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          : !data?.length ? <div className="text-center py-16"><p className="text-slate-400">Nicio consultație înregistrată</p></div>
          : (
            <div className="divide-y divide-slate-100">
              {data.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{c.diagnosis || "Fără diagnostic"}</p>
                    <p className="text-sm text-slate-400">{formatDate(c.appointment?.scheduledAt)} · {c.doctor?.email}</p>
                  </div>
                  <button onClick={() => setSelected(c)} className="px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">Detalii</button>
                </div>
              ))}
            </div>
          )}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div><h3 className="font-bold text-slate-800">Detalii consultație</h3><p className="text-sm text-slate-400">{formatDate(selected.appointment?.scheduledAt)}</p></div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {[{ key: "chiefComplaint", label: "Motiv prezentare" }, { key: "objectiveFindings", label: "Constatări obiective" }, { key: "diagnosis", label: "Diagnostic" }, { key: "treatment", label: "Tratament" }, { key: "recommendations", label: "Recomandări" }, { key: "plan", label: "Plan" }, { key: "notes", label: "Note" }].filter(({ key }) => selected[key]).map(({ key, label }) => (
                <div key={key} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{selected[key]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Buton PDF pacient ────────────────────────────────────────
function PdfPatientButton({ type, sourceId, token }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const handleClick = async () => {
    setState("loading");
    setError("");
    try {
      const genEndpoint = type === "prescription"
        ? `/documents/generate-from-prescription/${sourceId}`
        : `/documents/generate-from-referral/${sourceId}`;

      const genRes = await fetch(`${API}${genEndpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.message);
      const docId = genData.id;

      const finRes = await fetch(`${API}/documents/${docId}/finalize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!finRes.ok) {
        const finData = await finRes.json();
        if (!finData.message?.includes("finalized")) throw new Error(finData.message);
      }

      const pdfRes = await fetch(`${API}/documents/${docId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!pdfRes.ok) throw new Error("Eroare la descărcare");

      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type === "prescription" ? "reteta" : "trimitere"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all border disabled:opacity-50 ${
          state === "done" ? "bg-green-50 text-green-700 border-green-200"
          : state === "error" ? "bg-red-50 text-red-600 border-red-200"
          : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
        }`}
      >
        {state === "loading" ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : state === "done" ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {state === "loading" ? "Se generează..." : state === "done" ? "Descărcat!" : "PDF"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Tab: Rețete ──────────────────────────────────────────────
function PrescriptionsTab({ patientId, token }) {
  const { data, loading } = useFetch(`/prescriptions/patient/${patientId}`, token);
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Rețetele mele</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          : !data?.length ? <div className="text-center py-16"><p className="text-slate-400">Nicio rețetă înregistrată</p></div>
          : (
            <div className="divide-y divide-slate-100">
              {data.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{p.items?.length > 0 ? p.items.map((i) => i.medicationName).join(", ") : "Rețetă fără medicamente"}</p>
                    <p className="text-sm text-slate-400">{formatDate(p.issuedAt || p.createdAt)} · {p.doctor?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{p.items?.length ?? 0} medicamente</span>
                    <button onClick={() => setSelected(p)} className="px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">Detalii</button>
                    <PdfPatientButton type="prescription" sourceId={p.id} token={token} />
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div><h3 className="font-bold text-slate-800">Rețetă medicală</h3><p className="text-sm text-slate-400">{formatDate(selected.issuedAt || selected.createdAt)}</p></div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {selected.generalInstructions && <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Instrucțiuni generale</p><p className="text-slate-700 text-sm">{selected.generalInstructions}</p></div>}
              {selected.items?.map((item, i) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 mb-2 text-sm">{i + 1}. {item.medicationName}{item.concentration && <span className="text-slate-400 font-normal"> · {item.concentration}</span>}{item.form && <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.form}</span>}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    {item.dosage && <span>Doză: <strong className="text-slate-700">{item.dosage}</strong></span>}
                    {item.frequency && <span>Frecvență: <strong className="text-slate-700">{item.frequency}</strong></span>}
                    {item.duration && <span>Durată: <strong className="text-slate-700">{item.duration}</strong></span>}
                    {item.route && <span>Cale: <strong className="text-slate-700">{item.route}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Vaccinuri ───────────────────────────────────────────
function VaccinationsTab({ patientId, token }) {
  const { data, loading } = useFetch(`/vaccinations/patient/${patientId}`, token);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Istoricul vaccinărilor</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          : !data?.length ? <div className="text-center py-16"><p className="text-slate-400">Niciun vaccin înregistrat</p></div>
          : (
            <div className="divide-y divide-slate-100">
              {data.map((v) => (
                <div key={v.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{v.vaccineName}{v.doseLabel && <span className="ml-1 text-slate-400 font-normal">({v.doseLabel})</span>}</p>
                    <p className="text-sm text-slate-400">{formatDate(v.administeredAt || v.scheduledAt)}{v.manufacturer && ` · ${v.manufacturer}`}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${v.status === "COMPLETED" ? "bg-green-100 text-green-700" : v.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                    {v.status === "COMPLETED" ? "Efectuat" : v.status === "SCHEDULED" ? "Programat" : "Anulat"}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── Tab: Trimiteri ───────────────────────────────────────────
function ReferralsTab({ patientId, token }) {
  const { data, loading } = useFetch(`/referrals/patient/${patientId}`, token);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Trimiterile mele</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          : !data?.length ? <div className="text-center py-16"><p className="text-slate-400">Nicio trimitere înregistrată</p></div>
          : (
            <div className="divide-y divide-slate-100">
              {data.map((r) => {
                const priority = PRIORITY_LABELS[r.priority] ?? { label: r.priority, color: "bg-slate-100 text-slate-600" };
                return (
                  <div key={r.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 text-sm">{r.specialty}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priority.color}`}>{priority.label}</span>
                        </div>
                        <p className="text-xs text-slate-400">{formatDate(r.issuedAt || r.createdAt)}</p>
                      </div>
                      <PdfPatientButton type="referral" sourceId={r.id} token={token} />
                    </div>
                    {(r.reason || r.clinicalSummary) && (
                      <div className="mt-3 ml-16 bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                        {r.reason && <p><span className="font-medium">Motiv:</span> {r.reason}</p>}
                        {r.clinicalSummary && <p className="mt-1"><span className="font-medium">Sumar clinic:</span> {r.clinicalSummary}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── Tab: AI ─────────────────────────────────────────────────
function AITab({ patientId, token }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: "Bună ziua! Sunt asistentul tău medical virtual. Îți pot răspunde la întrebări despre programările, rețetele și vaccinurile tale. Cum te pot ajuta?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const isFirstMessage = messages.filter((m) => m.role === "user").length === 0;
      const res = await fetch(`${API}/ai/chat/${patientId}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: userMsg, isFirstMessage }) });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.message || "Nu am putut genera un răspuns." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Eroare de conexiune." }]);
    } finally { setLoading(false); }
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(`${API}/ai/summary/${patientId}`, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(await res.json());
    } catch { setSummary({ error: "Eroare." }); } finally { setSummaryLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Asistent AI</h1><p className="text-slate-500 text-sm mt-1">Întreabă despre dosarul tău sau generează un sumar complet.</p></div>
      <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
        {[{ id: "chat", label: "💬 Chat" }, { id: "summary", label: "📋 Sumar dosar" }].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === "chat" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col" style={{ height: "520px" }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 mt-1"><svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>}
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-500 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"}`}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mr-3 flex-shrink-0"><svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm"><div className="flex gap-1">{[0, 150, 300].map((d) => <div key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-slate-100">
            <div className="flex gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Scrie o întrebare..." className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all" />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["Care e ultima mea programare?", "Ce vaccinuri am făcut?", "Ce medicamente mi s-au prescris?"].map((q) => (
                <button key={q} onClick={() => setInput(q)} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">{q}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="space-y-4">
          {!summary && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
              <p className="text-slate-700 font-semibold mb-2">Sumar medical complet</p>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">Generează un rezumat AI al întregului tău dosar medical.</p>
              <button onClick={generateSummary} disabled={summaryLoading} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold rounded-xl mx-auto transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60">
                {summaryLoading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se generează...</> : <>Generează sumar AI</>}
              </button>
            </div>
          )}
          {summary && !summary.error && (
            <AISummaryCard summary={summary} onRegenerate={generateSummary} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Principal ──────────────────────────────────────
export default function PatientDashboard() {
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";
  const setActive = (tab) => setSearchParams({ tab }, { replace: true });
  const [showCreateAppt, setShowCreateAppt] = useState(false);
  const [apptRefreshKey, setApptRefreshKey] = useState(0);

  const { data: profiles, loading: loadingProfiles } = useFetch("/patients/my-profiles", token);
  const [activeProfile, setActiveProfile] = useState(null);
  const { data: appointments, loading: loadingAppts } = useFetch("/appointments/my", token, apptRefreshKey);

  useEffect(() => {
    if (profiles && profiles.length > 0 && !activeProfile) setActiveProfile(profiles[0]);
  }, [profiles]);

  // Filtrează programările doar pentru profilul activ selectat
  const profileAppointments = appointments?.filter(
    (a) => a.patient?.id === activeProfile?.id
  ) ?? [];

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleAppointmentCreated = () => {
    setShowCreateAppt(false);
    setApptRefreshKey((k) => k + 1);
  };

  if (loadingProfiles) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const renderContent = () => {
    if (!activeProfile && active !== "profile") return <div className="flex items-center justify-center h-96"><p className="text-slate-400">Niciun profil găsit.</p></div>;

    switch (active) {
      case "profiles":
        return (
          <MyProfilesTab
            profiles={profiles}
            activeProfile={activeProfile}
            onSelectProfile={setActiveProfile}
            token={token}
            onRefresh={() => window.location.reload()}
          />
        );
      case "overview":
        return (
          <>
            <AnnouncementsBanner token={token} />
            <OverviewTab profile={activeProfile} appointments={profileAppointments} onCreateAppt={() => setShowCreateAppt(true)} />
          </>
        );
      case "appointments":
        return <AppointmentsTab appointments={profileAppointments} loading={loadingAppts} onCreateAppt={() => setShowCreateAppt(true)} token={token} onRefresh={() => setApptRefreshKey((k) => k + 1)} />;
      case "consultations":
        return <ConsultationsTab patientId={activeProfile.id} token={token} />;
      case "prescriptions":
        return <PrescriptionsTab patientId={activeProfile.id} token={token} />;
      case "vaccinations":
        return <VaccinationsTab patientId={activeProfile.id} token={token} />;
      case "referrals":
        return <ReferralsTab patientId={activeProfile.id} token={token} />;
      case "ai":
        return <AITab patientId={activeProfile.id} token={token} />;
      case "profile":
        return <ProfilePage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} profiles={profiles} activeProfile={activeProfile} setActiveProfile={setActiveProfile} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>

      {showCreateAppt && activeProfile && (
        <CreatePatientAppointmentModal
          onClose={() => setShowCreateAppt(false)}
          onCreated={handleAppointmentCreated}
          patientId={activeProfile.id}
          assignedDoctorId={activeProfile.assignedDoctorId ?? null}
        />
      )}
    </div>
  );
}