import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

const AUDIENCE_OPTIONS = [
  { value: "ALL",           label: "Toți utilizatorii",           icon: "👥", desc: "Doctori, asistenți și pacienți" },
  { value: "PATIENTS",      label: "Toți pacienții",              icon: "🧑‍⚕️", desc: "Toți pacienții din cabinet" },
  { value: "DOCTORS",       label: "Doar doctori",                icon: "👨‍⚕️", desc: "Toți doctorii din cabinet" },
  { value: "ASSISTANTS",    label: "Doar asistenți",              icon: "👩‍💼", desc: "Toți asistenții din cabinet" },
  { value: "STAFF",         label: "Staff (doctori + asistenți)", icon: "🏥", desc: "Echipa internă completă" },
  { value: "MY_PATIENTS",   label: "Pacienții mei",               icon: "🫂", desc: "Doar pacienții tăi proprii" },
  { value: "MY_ASSISTANTS", label: "Asistenții mei",              icon: "🤝", desc: "Asistenții atribuiți ție" },
];

const AUDIENCE_LABELS = {
  ALL:           { label: "Toți",            color: "bg-blue-100 text-blue-700" },
  PATIENTS:      { label: "Pacienți",        color: "bg-green-100 text-green-700" },
  DOCTORS:       { label: "Doctori",         color: "bg-purple-100 text-purple-700" },
  ASSISTANTS:    { label: "Asistenți",       color: "bg-orange-100 text-orange-700" },
  STAFF:         { label: "Staff",           color: "bg-indigo-100 text-indigo-700" },
  MY_PATIENTS:   { label: "Pacienții mei",   color: "bg-teal-100 text-teal-700" },
  MY_ASSISTANTS: { label: "Asistenții mei",  color: "bg-violet-100 text-violet-700" },
};

const STATUS_LABELS = {
  ACTIVE: { label: "Activ", color: "bg-green-100 text-green-700" },
  INACTIVE: { label: "Inactiv", color: "bg-slate-100 text-slate-500" },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Modal creare anunț ───────────────────────────────────────
function CreateAnnouncementModal({ onClose, onSaved, token }) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    audience: "ALL",
    startsAt: "",
    endsAt: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = {
        title: form.title,
        content: form.content,
        audience: form.audience,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };

      const res = await fetch(`${API}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Eroare la salvare.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Anunț nou</h2>
            <p className="text-sm text-slate-400">Creează un anunț vizibil utilizatorilor</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Titlu */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Titlu</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="ex: Program modificat de sărbători"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Conținut */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mesaj</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Scrieți mesajul anunțului aici..."
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Audiență */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Destinatari</label>
            <div className="space-y-2">
              {AUDIENCE_OPTIONS.map((opt) => (
                <label key={opt.value}
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${
                    form.audience === opt.value
                      ? "border-teal-400 bg-teal-50"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}>
                  <input
                    type="radio"
                    name="audience"
                    value={opt.value}
                    checked={form.audience === opt.value}
                    onChange={handleChange}
                    className="w-4 h-4 accent-teal-500 shrink-0"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-base">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                      {opt.desc && <p className="text-xs text-slate-400">{opt.desc}</p>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Perioada */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Perioadă <span className="text-slate-400 font-normal">(opțional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">De la</p>
                <input
                  type="date"
                  name="startsAt"
                  value={form.startsAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Până la</p>
                <input
                  type="date"
                  name="endsAt"
                  value={form.endsAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Dacă nu specifici o perioadă, anunțul va fi activ pe termen nelimitat.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Se publică...
                </>
              ) : "Publică anunț"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab Anunțuri Doctor ──────────────────────────────────────
export default function AnnouncementsTab() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [deactivatingId, setDeactivatingId] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [token]);

  const handleDeactivate = async (id) => {
    if (!confirm("Dezactivezi acest anunț?")) return;
    setDeactivatingId(id);
    try {
      await fetch(`${API}/announcements/${id}/deactivate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAnnouncements();
    } catch {
      alert("Eroare la dezactivare.");
    } finally {
      setDeactivatingId(null);
    }
  };

  const filtered = announcements.filter((a) =>
    filter === "ALL" ? true : a.status === filter
  );

  const activeCount = announcements.filter((a) => a.status === "ACTIVE").length;
  const inactiveCount = announcements.filter((a) => a.status === "INACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Anunțuri</h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Anunț nou
        </button>
      </div>

      {/* Filtre */}
      <div className="flex gap-2">
        {[
          { key: "ALL", label: "Toate" },
          { key: "ACTIVE", label: "Active" },
          { key: "INACTIVE", label: "Inactive" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key
                ? "bg-teal-500 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista anunțuri */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-16">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Niciun anunț</p>
          <p className="text-slate-400 text-sm mt-1">Apasă "Anunț nou" pentru a crea primul anunț</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const audience = AUDIENCE_LABELS[a.audience] ?? { label: a.audience, color: "bg-slate-100 text-slate-600" };
            const status = STATUS_LABELS[a.status] ?? { label: a.status, color: "bg-slate-100 text-slate-600" };
            const isActive = a.status === "ACTIVE";

            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  isActive ? "border-slate-100" : "border-slate-100 opacity-60"
                }`}
              >
                <div className="p-6">
                  {/* Header card */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${audience.color}`}>
                        {audience.label}
                      </span>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => handleDeactivate(a.id)}
                        disabled={deactivatingId === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Dezactivează
                      </button>
                    )}
                  </div>

                  {/* Titlu și conținut */}
                  <h3 className="font-bold text-slate-800 text-lg mb-2">{a.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{a.content}</p>

                  {/* Footer */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                    <span>Creat de: {a.createdByUser?.email}</span>
                    {a.startsAt && <span>De la: {formatDate(a.startsAt)}</span>}
                    {a.endsAt && <span>Până la: {formatDate(a.endsAt)}</span>}
                    {!a.startsAt && !a.endsAt && <span>Perioadă: nelimitată</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateAnnouncementModal
          token={token}
          onClose={() => setShowModal(false)}
          onSaved={fetchAnnouncements}
        />
      )}
    </div>
  );
}