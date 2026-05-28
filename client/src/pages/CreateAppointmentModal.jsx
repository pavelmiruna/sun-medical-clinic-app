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

function calculateAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25));
}

// ─── Step indicator ───────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ["Pacient", "Data & Ora", "Confirmare"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              done ? "bg-teal-500 text-white"
              : active ? "bg-teal-500 text-white ring-4 ring-teal-100"
              : "bg-slate-100 text-slate-400"
            }`}>
              {done ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : step}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? "text-teal-600" : "text-slate-400"}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${done ? "bg-teal-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Selectare pacient ────────────────────────────────
function StepPatient({ appointments, patientsList, onSelect }) {
  const [search, setSearch] = useState("");

  const patients = patientsList
    ? patientsList
    : Object.values(
        (appointments ?? []).reduce((acc, appt) => {
          if (appt.patient && !acc[appt.patient.id]) {
            acc[appt.patient.id] = appt.patient;
          }
          return acc;
        }, {})
      );

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Selectează pacientul</h3>
        <p className="text-sm text-slate-400">Alege pacientul pentru care creezi programarea</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Caută pacient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">
            {search ? "Niciun pacient găsit" : "Nu ai pacienți înregistrați încă"}
          </p>
        ) : (
          filtered.map((p) => {
            const age = calculateAge(p.dateOfBirth);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-teal-50 hover:border-teal-200 border border-slate-100 transition-all text-left"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {p.firstName?.[0]}{p.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{p.firstName} {p.lastName}</p>
                  {age !== null && <p className="text-xs text-slate-400">{age} ani</p>}
                </div>
                <svg className="w-4 h-4 text-slate-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Selectare dată și slot ──────────────────────────
function StepDateTime({ doctorId, token, onSelect, onBack }) {
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
      const res = await fetch(`${API}/doctors/${doctorId}/available-slots?date=${d}`, {
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
    if (doctorId) fetchSlots(date);
  }, [date, doctorId]);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    onSelect({
      scheduledAt: selectedSlot.scheduledAt,
      time: selectedSlot.time,
      date,
      reason: reason || null,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Selectează data și ora</h3>
        <p className="text-sm text-slate-400">Alege o zi și un slot disponibil</p>
      </div>

      {/* Date picker */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Data</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Sloturi */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Ora {selectedSlot && <span className="text-teal-600 normal-case font-medium">– {selectedSlot.time} selectat</span>}
        </label>

        {loadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slots === null ? null : slots.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm">Niciun slot disponibil pentru această zi</p>
            <p className="text-slate-300 text-xs mt-1">Verifică orarul doctorului sau alege altă dată</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedSlot?.time === slot.time
                    ? "bg-teal-500 text-white shadow-sm shadow-teal-200"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-teal-300 hover:bg-teal-50"
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Motiv */}
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
                  ? "bg-teal-500 text-white"
                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-teal-300"
              }`}
            >
              <span>{r.icon}</span>
              <span className="text-xs">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          ← Înapoi
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedSlot}
          className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuă →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirmare ───────────────────────────────────────
function StepConfirm({ patient, dateTime, doctorId, token, onBack, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          patientId: patient.id,
          doctorId,
          scheduledAt: new Date(dateTime.scheduledAt).toISOString(),
          reason: dateTime.reason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Eroare la crearea programării.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  const reasonLabel = REASON_OPTIONS.find((r) => r.value === dateTime.reason);
  const age = calculateAge(patient?.dateOfBirth);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 mb-1">Confirmă programarea</h3>
        <p className="text-sm text-slate-400">Verifică detaliile înainte de confirmare</p>
      </div>

      {/* Card sumar */}
      <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
        {/* Pacient */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-bold text-slate-800">{patient.firstName} {patient.lastName}</p>
            {age !== null && <p className="text-xs text-slate-400">{age} ani</p>}
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Detalii */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400">Data</p>
              <p className="text-sm font-semibold text-slate-700">{formatDate(dateTime.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400">Ora</p>
              <p className="text-sm font-semibold text-slate-700">{dateTime.time}</p>
            </div>
          </div>

          {reasonLabel && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm text-base">
                {reasonLabel.icon}
              </div>
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
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          ← Înapoi
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Se creează...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmă programarea
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────
export default function CreateAppointmentModal({ onClose, onCreated, appointments, doctorId, doctors, patientsList }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState(null);
  const [dateTime, setDateTime] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    doctorId ?? (doctors?.length === 1 ? doctors[0].id : null)
  );

  const effectiveDoctorId = selectedDoctorId;
  const needsDoctorSelect = !doctorId && doctors && doctors.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
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

          {/* Selector medic (doar pentru asistent cu mai mulți doctori) */}
          {needsDoctorSelect && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Medic</label>
              <select
                value={selectedDoctorId ?? ""}
                onChange={(e) => setSelectedDoctorId(e.target.value || null)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selectează medicul...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName && d.lastName ? `Dr. ${d.firstName} ${d.lastName}` : d.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {step === 1 && (
            <StepPatient
              appointments={appointments}
              patientsList={patientsList}
              onSelect={(p) => { setPatient(p); setStep(2); }}
            />
          )}

          {step === 2 && (
            <StepDateTime
              doctorId={effectiveDoctorId}
              token={token}
              onSelect={(dt) => { setDateTime(dt); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepConfirm
              patient={patient}
              dateTime={dateTime}
              doctorId={effectiveDoctorId}
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