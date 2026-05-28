import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import PatientsTab from "./PatientsTab";
import ConsultationsTab from "./ConsultationsTab";
import ScheduleTab from "./ScheduleTab";
import AnnouncementsTab from "./AnnouncementsTab";
import CreateAppointmentModal from "./CreateAppointmentModal";
import ConsultationModal from "./ConsultationModal";
import SettingsPage from "./SettingsPage";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const API = "http://localhost:4000/api";

// ─── Hook pentru fetch cu auth ───────────────────────────────
function useApi(url, refreshKey = 0) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url || !token) return;
    setLoading(true);
    fetch(`${API}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : null);
        setLoading(false);
      })
      .catch((e) => { setError(e); setLoading(false); });
  }, [url, token, refreshKey]);

  return { data, loading, error };
}

// ─── Helpers ──────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", { day: "numeric", month: "long" });
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isFuture(dateStr) {
  return new Date(dateStr) > new Date();
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

const MONTHS_RO = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];

function getGroup(dateStr) {
  if (!dateStr) return "Fără programare";
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDay.getTime() === today.getTime()) return "Azi";
  const dow = today.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const monStart = new Date(today);
  monStart.setDate(today.getDate() - daysFromMon);
  const sunEnd = new Date(monStart);
  sunEnd.setDate(monStart.getDate() + 6);
  if (itemDay >= monStart && itemDay <= sunEnd) return "Săptămâna aceasta";
  const y = d.getFullYear();
  return y === now.getFullYear() ? MONTHS_RO[d.getMonth()] : `${MONTHS_RO[d.getMonth()]} ${y}`;
}

function groupItems(items, getDateFn) {
  const map = {};
  const firstDateByGroup = {};
  for (const item of items) {
    const dateStr = getDateFn(item);
    const g = getGroup(dateStr);
    if (!map[g]) { map[g] = []; }
    map[g].push(item);
    if (dateStr && !firstDateByGroup[g]) firstDateByGroup[g] = new Date(dateStr);
  }
  const PRIORITY = { "Azi": 0, "Săptămâna aceasta": 1, "Fără programare": 99 };
  const sorted = Object.keys(map).sort((a, b) => {
    const pa = PRIORITY[a] ?? 2;
    const pb = PRIORITY[b] ?? 2;
    if (pa !== pb) return pa - pb;
    if (pa === 2) {
      const da = firstDateByGroup[a] ?? new Date(0);
      const db = firstDateByGroup[b] ?? new Date(0);
      return db - da;
    }
    return 0;
  });
  return sorted.map((g) => ({ label: g, items: map[g] }));
}

// ─── Sidebar ──────────────────────────────────────────────────
const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "appointments",
    label: "Programări",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "patients",
    label: "Pacienți",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "consultations",
    label: "Consultații",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "ai",
    label: "AI Insights",
    badge: "AI",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: "schedule",
    label: "Orar",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "announcements",
    label: "Anunțuri",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Setări",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },

];

function Sidebar({ active, setActive, onLogout }) {
  return (
    <aside className="w-64 h-screen bg-slate-900 flex flex-col shrink-0 sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Cabinet Medical</p>
            <p className="text-slate-400 text-xs">Panou doctor</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              active === item.id
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {item.icon}
            {item.label}
            {item.badge && (
              <span className="ml-auto text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value ?? "-"}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Tab: Dashboard Home ──────────────────────────────────────
function DashboardHome({ appointments, consultations, loading, onCreateAppt }) {
  const navigate = useNavigate();
  const todayAppointments = appointments?.filter((a) => isToday(a.scheduledAt) && a.status !== "CANCELED") ?? [];
  const upcomingAppointments = appointments?.filter((a) => isFuture(a.scheduledAt) && !isToday(a.scheduledAt) && a.status !== "CANCELED").slice(0, 5) ?? [];
  const totalScheduled = appointments?.filter((a) => a.status === "SCHEDULED").length ?? 0;
  const totalCompleted = appointments?.filter((a) => a.status === "COMPLETED").length ?? 0;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bună dimineața" : now.getHours() < 18 ? "Bună ziua" : "Bună seara";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{greeting}, Doctore 👋</h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={onCreateAppt}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Programare nouă
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Programări azi" value={todayAppointments.length} color="bg-teal-50"
          sub={`${todayAppointments.filter(a => a.status === "SCHEDULED").length} în așteptare`}
          icon={<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard label="Total programări" value={appointments?.length} color="bg-indigo-50"
          sub={`${totalScheduled} viitoare`}
          icon={<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard label="Consultații finalizate" value={totalCompleted} color="bg-green-50"
          icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Consultații totale" value={consultations?.length} color="bg-purple-50"
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Programări azi</h2>
            <p className="text-sm text-slate-400">{formatDate(new Date())}</p>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8"><p className="text-slate-400 text-sm">Nicio programare pentru azi</p></div>
            ) : (
              todayAppointments.map((a) => {
                const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "bg-slate-100 text-slate-600" };
                return (
                  <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-teal-700 font-bold text-sm">{formatTime(a.scheduledAt)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => a.patient?.id && navigate(`/doctor/patients/${a.patient.id}`)}
                        className="font-semibold text-slate-800 text-sm truncate hover:text-teal-600 hover:underline transition-colors text-left">
                        {a.patient?.firstName} {a.patient?.lastName}
                      </button>
                      <p className="text-xs text-slate-400">{REASON_LABELS[a.reason] ?? a.reason ?? "Motiv nespecificat"}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.color}`}>{status.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Programări viitoare</h2>
            <p className="text-sm text-slate-400">Următoarele {upcomingAppointments.length} programări</p>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8"><p className="text-slate-400 text-sm">Nicio programare viitoare</p></div>
            ) : (
              upcomingAppointments.map((a) => {
                const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "bg-slate-100 text-slate-600" };
                return (
                  <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-bold text-xs leading-tight text-center">{formatDate(a.scheduledAt).split(" ")[0]}</span>
                      <span className="text-indigo-500 text-xs">{formatDate(a.scheduledAt).split(" ").slice(1).join(" ")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => a.patient?.id && navigate(`/doctor/patients/${a.patient.id}`)}
                        className="font-semibold text-slate-800 text-sm truncate hover:text-teal-600 hover:underline transition-colors text-left">
                        {a.patient?.firstName} {a.patient?.lastName}
                      </button>
                      <p className="text-xs text-slate-400">{formatTime(a.scheduledAt)} · {REASON_LABELS[a.reason] ?? "Motiv nespecificat"}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.color}`}>{status.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Toate programările ──────────────────────────────────
function AppointmentsTab({ appointments, loading, onCreateAppt, onRefresh }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("apptFilter") ?? "TODAY";
  const setFilter = (val) => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set("apptFilter", val); return p; }, { replace: true });
  const search = searchParams.get("apptSearch") ?? "";
  const setSearch = (val) => setSearchParams((prev) => { const p = new URLSearchParams(prev); val ? p.set("apptSearch", val) : p.delete("apptSearch"); return p; }, { replace: true });
  const [consultationAppt, setConsultationAppt] = useState(null);
  const filtered = appointments?.filter((a) => {
    if (filter === "TODAY") {
      const d = new Date(a.scheduledAt), n = new Date();
      if (!(d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate())) return false;
    } else if (filter !== "ALL" && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${a.patient?.firstName ?? ""} ${a.patient?.lastName ?? ""}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  }) ?? [];
  const groups = filter !== "TODAY" ? groupItems(filtered, (a) => a.scheduledAt) : null;
  const filters = [
    { key: "TODAY", label: "Azi" },
    { key: "ALL", label: "Toate" },
    { key: "SCHEDULED", label: "Programate" },
    { key: "COMPLETED", label: "Finalizate" },
    { key: "CANCELED", label: "Anulate" },
    { key: "NO_SHOW", label: "Absent" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Programările mele</h1>
        <button
          onClick={onCreateAppt}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Programare nouă
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f.key ? "bg-teal-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Caută după nume pacient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><p className="text-slate-400">Nicio programare găsită</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(groups
              ? groups.flatMap(({ label, items }) => [
                  <div key={`h-${label}`} className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>,
                  ...items.map((a) => {
                    const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "bg-slate-100 text-slate-600" };
                    return (
                      <div key={a.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-slate-700 font-bold text-sm">{formatTime(a.scheduledAt)}</span>
                          <span className="text-slate-400 text-xs">{formatDate(a.scheduledAt)}</span>
                        </div>
                        <div className="flex-1">
                          <button onClick={() => a.patient?.id && navigate(`/doctor/patients/${a.patient.id}`)}
                            className="font-semibold text-slate-800 hover:text-teal-600 hover:underline transition-colors text-left">
                            {a.patient?.firstName} {a.patient?.lastName}
                          </button>
                          <p className="text-sm text-slate-400">{REASON_LABELS[a.reason] ?? "Motiv nespecificat"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {a.consultation && (
                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">Are consultație</span>
                          )}
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.color}`}>{status.label}</span>
                          {(a.status === "SCHEDULED" || a.status === "COMPLETED" || a.status === "NO_SHOW") && (
                            <button
                              onClick={() => setConsultationAppt(a)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                                a.consultation
                                  ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                                  : a.status === "NO_SHOW"
                                  ? "text-green-600 bg-green-50 hover:bg-green-100"
                                  : "text-teal-600 bg-teal-50 hover:bg-teal-100"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {a.consultation
                                ? "Editează consultația"
                                : a.status === "NO_SHOW"
                                ? "S-a prezentat – adaugă consultație"
                                : "Începe consultația"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }),
                ])
              : filtered.map((a) => {
                  const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "bg-slate-100 text-slate-600" };
                  return (
                    <div key={a.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                      <div className="w-14 h-14 bg-slate-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-slate-700 font-bold text-sm">{formatTime(a.scheduledAt)}</span>
                        <span className="text-slate-400 text-xs">{formatDate(a.scheduledAt)}</span>
                      </div>
                      <div className="flex-1">
                        <button onClick={() => a.patient?.id && navigate(`/doctor/patients/${a.patient.id}`)}
                          className="font-semibold text-slate-800 hover:text-teal-600 hover:underline transition-colors text-left">
                          {a.patient?.firstName} {a.patient?.lastName}
                        </button>
                        <p className="text-sm text-slate-400">{REASON_LABELS[a.reason] ?? "Motiv nespecificat"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.consultation && (
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">Are consultație</span>
                        )}
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.color}`}>{status.label}</span>
                        {(a.status === "SCHEDULED" || a.status === "COMPLETED" || a.status === "NO_SHOW") && (
                          <button
                            onClick={() => setConsultationAppt(a)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                              a.consultation
                                ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                                : a.status === "NO_SHOW"
                                ? "text-green-600 bg-green-50 hover:bg-green-100"
                                : "text-teal-600 bg-teal-50 hover:bg-teal-100"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {a.consultation
                              ? "Editează consultația"
                              : a.status === "NO_SHOW"
                              ? "S-a prezentat – adaugă consultație"
                              : "Începe consultația"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
      {consultationAppt && (
        <ConsultationModal
          appointment={consultationAppt}
          onClose={() => setConsultationAppt(null)}
          onSaved={() => { setConsultationAppt(null); onRefresh?.(); }}
        />
      )}
    </div>
  );
}

// ─── Markdown simplu: bold, liste, titluri numerotate ─────────
function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  const renderInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-slate-800">{p.slice(2, -2)}</strong>;
      }
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      elements.push(<div key={i} className="h-3" />);
    } else if (trimmed.startsWith("### ")) {
      elements.push(<p key={i} className="text-sm font-bold text-slate-800 mt-2">{renderInline(trimmed.slice(4))}</p>);
    } else if (trimmed.startsWith("## ")) {
      elements.push(<p key={i} className="text-base font-bold text-slate-800 mt-2">{renderInline(trimmed.slice(3))}</p>);
    } else if (trimmed.startsWith("# ")) {
      elements.push(<p key={i} className="text-base font-extrabold text-slate-900 mt-3">{renderInline(trimmed.slice(2))}</p>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
          <span className="font-bold text-teal-600 shrink-0">{trimmed.match(/^(\d+)\./)[1]}.</span>
          <span>{renderInline(trimmed.replace(/^\d+\.\s*/, ""))}</span>
        </div>
      );
    } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
          <span className="text-teal-500 shrink-0 mt-0.5">•</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-sm text-slate-700 leading-relaxed">{renderInline(trimmed)}</p>
      );
    }
    i++;
  }
  return <div className="space-y-1.5">{elements}</div>;
}

// ─── Culori grafice ────────────────────────────────────────────
const STATUS_COLORS = {
  COMPLETED: "#14b8a6",
  SCHEDULED: "#6366f1",
  CANCELED:  "#f43f5e",
  NO_SHOW:   "#f59e0b",
};
const CHART_COLORS = ["#14b8a6","#6366f1","#f59e0b","#f43f5e","#10b981","#8b5cf6"];

// ─── Tab: AI Insights ─────────────────────────────────────────
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

  const statusData = insights?.rawStats.appointmentsByStatus.map((s) => ({
    name: s.status,
    value: s._count.status,
  })) ?? [];

  const reasonData = insights?.rawStats.appointmentsByReason
    .filter((r) => r.reason)
    .map((r) => ({
      name: REASON_LABELS[r.reason] ?? r.reason,
      value: r._count.reason,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Insights</h1>
          <p className="text-slate-500 text-sm mt-1">Analiză inteligentă a activității cabinetului</p>
        </div>
        <button onClick={fetchInsights} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60">
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
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <p className="text-slate-700 font-semibold mb-2">Analiză AI disponibilă</p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Apasă butonul de mai sus pentru a genera o analiză inteligentă a activității cabinetului tău.</p>
        </div>
      )}

      {insights && (
        <div className="space-y-6">
          {/* ── Statistici rapide ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Pacienți", value: insights.rawStats.totalPatients, color: "bg-teal-50 text-teal-700", ring: "ring-teal-200" },
              { label: "Programări", value: insights.rawStats.totalAppointments, color: "bg-indigo-50 text-indigo-700", ring: "ring-indigo-200" },
              { label: "Consultații", value: insights.rawStats.totalConsultations, color: "bg-green-50 text-green-700", ring: "ring-green-200" },
              { label: "Rețete", value: insights.rawStats.totalPrescriptions, color: "bg-purple-50 text-purple-700", ring: "ring-purple-200" },
              { label: "Trimiteri", value: insights.rawStats.totalReferrals, color: "bg-orange-50 text-orange-700", ring: "ring-orange-200" },
            ].map((s) => (
              <div key={s.label} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center ring-1 ${s.ring}`}>
                <span className={`text-3xl font-extrabold ${s.color.split(" ")[1]}`}>{s.value}</span>
                <span className="text-xs text-slate-500 mt-1 font-medium">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Grafice ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie — status programări */}
            {statusData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4">Status programări</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} />
                    <Legend formatter={(name) => name} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {statusData.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.name] ?? "#94a3b8" }} />
                      {s.name} <span className="font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bar — motive programări */}
            {reasonData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4">Motive programări</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={reasonData} layout="vertical" margin={{ left: 8, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {reasonData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Ultimele 30 zile ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Programări (30 zile)", value: insights.rawStats.last30Days.appointments, cls: "text-slate-800" },
              { label: "Rata anulări", value: insights.rawStats.rates.cancelRate, cls: "text-red-500" },
              { label: "Rata absențe", value: insights.rawStats.rates.noShowRate, cls: "text-yellow-500" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                <p className={`text-2xl font-extrabold ${s.cls}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Analiză AI ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Analiză generată de AI</h3>
                <p className="text-xs text-slate-400">{new Date(insights.generatedAt).toLocaleString("ro-RO")}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5">
              <MarkdownText text={insights.insights} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────
export default function DoctorDashboard() {
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("tab") || "dashboard";
  const setActive = (tab) => setSearchParams({ tab }, { replace: true });
  const [showCreateAppt, setShowCreateAppt] = useState(false);
  const [apptRefreshKey, setApptRefreshKey] = useState(0);

  const { data: appointments, loading: loadingAppts } = useApi("/appointments/my", apptRefreshKey);
  const { data: consultations, loading: loadingConsults } = useApi("/consultations/doctor/me");

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleAppointmentCreated = () => {
    setShowCreateAppt(false);
    setApptRefreshKey((k) => k + 1);
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <DashboardHome appointments={appointments} consultations={consultations} loading={loadingAppts} onCreateAppt={() => setShowCreateAppt(true)} />;
      case "appointments":
        return <AppointmentsTab appointments={appointments} loading={loadingAppts} onCreateAppt={() => setShowCreateAppt(true)} onRefresh={() => setApptRefreshKey((k) => k + 1)} />;
      case "patients":
        return <PatientsTab />;
      case "consultations":
        return <ConsultationsTab />;
      case "ai":
        return <AIInsightsTab token={token} />;
      case "schedule":
        return <ScheduleTab />;
      case "announcements":
        return <AnnouncementsTab />;
      case "settings":
        return <SettingsPage isDoctorRole={true} />;
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
      {showCreateAppt && (
        <CreateAppointmentModal
          onClose={() => setShowCreateAppt(false)}
          onCreated={handleAppointmentCreated}
          appointments={appointments}
          doctorId={user?.id}
        />
      )}
    </div>
  );
}