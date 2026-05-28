import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

const WEEKDAYS = [
  { value: 0, label: "Duminică" },
  { value: 1, label: "Luni" },
  { value: 2, label: "Marți" },
  { value: 3, label: "Miercuri" },
  { value: 4, label: "Joi" },
  { value: 5, label: "Vineri" },
  { value: 6, label: "Sâmbătă" },
];

const WEEKDAYS_SHORT = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

const SLOT_OPTIONS = [
  { value: 15, label: "15 minute" },
  { value: 20, label: "20 minute" },
  { value: 30, label: "30 minute" },
  { value: 45, label: "45 minute" },
  { value: 60, label: "60 minute" },
];

// ─── Modal adăugare interval ──────────────────────────────────
function AddScheduleModal({ onClose, onSaved, token }) {
  const [form, setForm] = useState({
    weekday: 1,
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) || e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/doctors/me/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weekday: Number(form.weekday),
          startTime: form.startTime,
          endTime: form.endTime,
          slotMinutes: Number(form.slotMinutes),
        }),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interval nou</h2>
            <p className="text-sm text-slate-400">Adaugă un interval în orar</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ziua */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ziua săptămânii</label>
            <select
              name="weekday"
              value={form.weekday}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Ore */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ora de start</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ora de final</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Durată slot */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Durata unui slot</label>
            <div className="grid grid-cols-5 gap-2">
              {SLOT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, slotMinutes: opt.value }))}
                  className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                    form.slotMinutes === opt.value
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {opt.value}m
                </button>
              ))}
            </div>
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
                  Se salvează...
                </>
              ) : "Salvează"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panou sloturi disponibile ────────────────────────────────
function AvailableSlotsPanel({ doctorId, token }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSlots = async (selectedDate) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/doctors/${doctorId}/available-slots?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) fetchSlots(date);
  }, [doctorId, date]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800">Sloturi disponibile</h2>
          <p className="text-sm text-slate-400">Verifică orele libere pentru o zi</p>
        </div>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slots === null ? null : slots.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium text-sm">Niciun slot disponibil</p>
          <p className="text-slate-400 text-xs mt-1">Nu există program pentru această zi sau toate sloturile sunt ocupate</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 mb-3">{slots.length} sloturi disponibile</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {slots.map((slot) => (
              <div
                key={slot.time}
                className="bg-teal-50 border border-teal-100 text-teal-700 font-semibold text-sm py-2 rounded-xl text-center hover:bg-teal-100 transition-colors"
              >
                {slot.time}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab Orar Doctor ──────────────────────────────────────────
export default function ScheduleTab() {
  const { token, user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/doctors/me/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [token]);

  const handleDelete = async (id) => {
    if (!confirm("Ștergi acest interval din orar?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API}/doctors/me/schedules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSchedules();
    } catch {
      alert("Eroare la ștergere.");
    } finally {
      setDeletingId(null);
    }
  };

  // Grupăm pe zile
  const byDay = WEEKDAYS.map((day) => ({
    ...day,
    intervals: schedules
      .filter((s) => s.weekday === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const activeDays = byDay.filter((d) => d.intervals.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orar săptămânal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestionează programul tău de lucru
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă interval
        </button>
      </div>

      {/* Vizualizare calendar săptămână */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Vedere săptămânală</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Niciun interval configurat</p>
            <p className="text-slate-400 text-sm mt-1">Apasă "Adaugă interval" pentru a configura orarul</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {byDay.map((day) => {
              const isToday = new Date().getDay() === day.value;
              return (
                <div key={day.value} className={`p-3 min-h-32 ${isToday ? "bg-teal-50/50" : ""}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-2 text-center ${
                    isToday ? "text-teal-600" : "text-slate-400"
                  }`}>
                    {WEEKDAYS_SHORT[day.value]}
                  </p>
                  <div className="space-y-1.5">
                    {day.intervals.map((interval) => (
                      <div
                        key={interval.id}
                        className="bg-teal-500 text-white rounded-lg p-2 text-center group relative"
                      >
                        <p className="text-xs font-bold leading-tight">{interval.startTime}</p>
                        <p className="text-xs opacity-75">–</p>
                        <p className="text-xs font-bold leading-tight">{interval.endTime}</p>
                        <p className="text-xs opacity-75 mt-1">{interval.slotMinutes}m</p>

                        {/* Delete on hover */}
                        <button
                          onClick={() => handleDelete(interval.id)}
                          disabled={deletingId === interval.id}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full hidden group-hover:flex items-center justify-center transition-colors"
                          title="Șterge interval"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista detaliată */}
      {activeDays.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Detalii program</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {activeDays.map((day) => (
              <div key={day.value} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                    <span className="text-teal-700 font-bold text-xs">{WEEKDAYS_SHORT[day.value]}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{day.label}</p>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {day.intervals.length} {day.intervals.length === 1 ? "interval" : "intervale"}
                  </span>
                </div>
                <div className="space-y-2 ml-11">
                  {day.intervals.map((interval) => {
                    // Calculăm nr de sloturi
                    const [sh, sm] = interval.startTime.split(":").map(Number);
                    const [eh, em] = interval.endTime.split(":").map(Number);
                    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
                    const slotsCount = Math.floor(totalMinutes / interval.slotMinutes);

                    return (
                      <div key={interval.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-sm">{interval.startTime} – {interval.endTime}</span>
                          </div>
                          <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">
                            {interval.slotMinutes} min/slot
                          </span>
                          <span className="text-xs text-slate-400">
                            {slotsCount} sloturi
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(interval.id)}
                          disabled={deletingId === interval.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Șterge
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sloturi disponibile */}
      <AvailableSlotsPanel doctorId={user?.id} token={token} />

      {/* Modal */}
      {showModal && (
        <AddScheduleModal
          token={token}
          onClose={() => setShowModal(false)}
          onSaved={fetchSchedules}
        />
      )}
    </div>
  );
}