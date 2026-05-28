import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

const REASON_OPTIONS = [
  { value: "ROUTINE_CHECK", label: "Control de rutină", icon: "🩺" },
  { value: "SICK_VISIT", label: "Consultație boală", icon: "🤒" },
  { value: "PRESCRIPTION_RENEWAL", label: "Reînnoire rețetă", icon: "💊" },
  { value: "LAB_RESULTS", label: "Rezultate analize", icon: "🔬" },
  { value: "VACCINATION", label: "Vaccinare", icon: "💉" },
  { value: "ADMINISTRATIVE", label: "Administrativ", icon: "📋" },
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Step indicator ───────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ["Doctor", "Data & Ora", "Confirmare"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              done ? "bg-indigo-500 text-white"
              : active ? "bg-indigo-500 text-white ring-4 ring-indigo-100"
              : "bg-slate-100 text-slate-400"
            }`}>
              {done ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : step}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? "text-indigo-600" : "text-slate-400"}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${done ? "bg-indigo-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Selectare doctor ─────────────────────────────────
function StepDoctor({ token, onSelect, assignedDoctorId }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const all = Array.isArray(d) ? d : [];
        // Dacă pacientul are un doctor atribuit, filtrează la el
        const filtered = assignedDoctorId
          ? all.filter((doc) => doc.id === assignedDoctorId)
          : all;
        setDoctors(filtered);
        // Auto-selectare dacă există un singur doctor
        if (filtered.length === 1) {
          onSelect(filtered[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, assignedDoctorId]);

  const filtered = doctors.filter((d) =>
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Selectează doctorul</h3>
        <p className="text-sm text-slate-400">Alege medicul la care vrei programarea</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Caută doctor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Niciun doctor disponibil</p>
        ) : (
          filtered.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => onSelect(doctor)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-slate-100 transition-all text-left"
            >
              <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">🩺</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">Dr. {doctor.email.split("@")[0]}</p>
                <p className="text-xs text-slate-400">{doctor.email}</p>
              </div>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Selectare dată și slot ──────────────────────────
function StepDateTime({ doctor, token, onSelect, onBack }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");

  const fetchSlots = async (d) => {
    setLoadingSlots(true);
    setSlots(null);
    setSelectedSlot(null);
    try {
      const res = await fetch(`${API}/doctors/${doctor.id}/available-slots?date=${d}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots(date);
  }, [date]);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    onSelect({ scheduledAt: selectedSlot.scheduledAt, time: selectedSlot.time, date, reason: reason || null });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Selectează data și ora</h3>
        <p className="text-sm text-slate-400">
          Doctor: <span className="font-medium text-slate-600">Dr. {doctor.email.split("@")[0]}</span>
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Data</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Ora {selectedSlot && <span className="text-indigo-600 normal-case font-medium">– {selectedSlot.time} selectat</span>}
        </label>
        {loadingSlots ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slots === null ? null : slots.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm">Niciun slot disponibil pentru această zi</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedSlot?.time === slot.time
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Motiv <span className="normal-case font-normal text-slate-400">(opțional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {REASON_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(reason === r.value ? "" : r.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                reason === r.value
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-indigo-300"
              }`}
            >
              <span>{r.icon}</span>
              <span className="text-xs">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
          ← Înapoi
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedSlot}
          className="flex-1 py-3 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuă →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirmare ───────────────────────────────────────
function StepConfirm({ doctor, dateTime, patientId, token, onBack, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reasonLabel = REASON_OPTIONS.find((r) => r.value === dateTime.reason);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          doctorId: doctor.id,
          scheduledAt: new Date(dateTime.scheduledAt).toISOString(),
          reason: dateTime.reason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare la crearea programării."); return; }

      onSuccess();
      onClose();
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Confirmă programarea</h3>
        <p className="text-sm text-slate-400">Verifică detaliile înainte de confirmare</p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white text-lg">🩺</span>
          </div>
          <div>
            <p className="font-bold text-slate-800">Dr. {doctor.email.split("@")[0]}</p>
            <p className="text-xs text-slate-400">{doctor.email}</p>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        <div className="space-y-3">
          {[
            {
              icon: <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
              label: "Data",
              value: formatDate(dateTime.date),
            },
            {
              icon: <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              label: "Ora",
              value: dateTime.time,
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">{icon}</div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value}</p>
              </div>
            </div>
          ))}

          {reasonLabel && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm text-base">{reasonLabel.icon}</div>
              <div>
                <p className="text-xs text-slate-400">Motiv</p>
                <p className="text-sm font-semibold text-slate-700">{reasonLabel.label}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
          ← Înapoi
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se creează...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Confirmă programarea</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────
export default function CreatePatientAppointmentModal({ onClose, onCreated, patientId, assignedDoctorId }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [dateTime, setDateTime] = useState(null);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Programare nouă</h2>
            <p className="text-sm text-slate-400">Pasul {step} din 3</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <StepIndicator current={step} />

          {step === 1 && (
            <StepDoctor
              token={token}
              assignedDoctorId={assignedDoctorId}
              onSelect={(d) => { setDoctor(d); setStep(2); }}
            />
          )}
          {step === 2 && (
            <StepDateTime
              doctor={doctor}
              token={token}
              onSelect={(dt) => { setDateTime(dt); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepConfirm
              doctor={doctor}
              dateTime={dateTime}
              patientId={patientId}
              token={token}
              onBack={() => setStep(2)}
              onSuccess={onCreated}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}