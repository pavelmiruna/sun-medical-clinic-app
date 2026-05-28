import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AISummaryCard from "../components/AISummaryCard";
import PdfGeneratorButton from "./PdfGeneratorButton";

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

function useFetch(url, token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url || !token) return;
    setLoading(true);
    fetch(`${API}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url, token]);

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

// ─── Secțiune colapsabilă ─────────────────────────────────────
function Section({ title, icon, count, children, defaultOpen = false, action }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              {icon}
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-800">{title}</p>
              <p className="text-xs text-slate-400">{count} înregistrări</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {action && <div className="pr-4 flex-shrink-0">{action}</div>}
      </div>

      {open && (
        <div className="border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Modal adăugare vaccin ────────────────────────────────────
function AddVaccinationModal({ patientId, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    vaccineName: "", doseLabel: "", status: "COMPLETED",
    administeredAt: "", scheduledAt: "",
    manufacturer: "", batchNumber: "", site: "", route: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vaccineName.trim()) { setError("Numele vaccinului este obligatoriu."); return; }
    setLoading(true);
    try {
      const toISO = (val) => val ? new Date(val).toISOString() : null;
      const body = {
        patientId,
        vaccineName: form.vaccineName.trim(),
        doseLabel: form.doseLabel || null,
        status: form.status,
        administeredAt: toISO(form.administeredAt),
        scheduledAt: toISO(form.scheduledAt),
        manufacturer: form.manufacturer || null,
        batchNumber: form.batchNumber || null,
        site: form.site || null,
        route: form.route || null,
        notes: form.notes || null,
      };
      const res = await fetch(`${API}/vaccinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Eroare la salvare.");
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Adaugă vaccin</h2>
            <p className="text-sm text-slate-400">Înregistrează o nouă vaccinare</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Nume vaccin + doză */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Vaccin <span className="text-red-400">*</span>
              </label>
              <input name="vaccineName" value={form.vaccineName} onChange={handleChange}
                placeholder="ex: Influenza, COVID-19, Hepatita B..." required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Doză</label>
              <input name="doseLabel" value={form.doseLabel} onChange={handleChange}
                placeholder="ex: Doza 1, Rapel..." className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                <option value="COMPLETED">Efectuat</option>
                <option value="SCHEDULED">Programat</option>
                <option value="CANCELED">Anulat</option>
              </select>
            </div>
          </div>

          {/* Date administrare */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Data administrării
              </label>
              <input type="date" name="administeredAt" value={form.administeredAt} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Data programată
              </label>
              <input type="date" name="scheduledAt" value={form.scheduledAt} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          {/* Detalii tehnice */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Producător</label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange}
                placeholder="ex: Pfizer, AstraZeneca..." className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nr. lot</label>
              <input name="batchNumber" value={form.batchNumber} onChange={handleChange}
                placeholder="ex: EW2814" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loc administrare</label>
              <input name="site" value={form.site} onChange={handleChange}
                placeholder="ex: Brațul stâng" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cale administrare</label>
              <input name="route" value={form.route} onChange={handleChange}
                placeholder="ex: Intramuscular" className={inputCls} />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Note</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="Observații suplimentare..." rows={2}
              className={`${inputCls} resize-none`} />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </form>

        <div className="p-6 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Anulează
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-3 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se salvează...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Salvează</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sumar AI ─────────────────────────────────────────────────
function AISummarySection({ patientId, token }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/ai/summary/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSummary(data);
    } catch (e) {
      setError(e.message || "Eroare la generarea sumarului.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header buton */}
      <div className="bg-linear-to-br from-teal-600 to-teal-500 rounded-2xl p-5 shadow-lg shadow-teal-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold">Sumar AI Dosar Medical</p>
              <p className="text-teal-100 text-xs">
                {summary ? "Generat automat din istoricul complet" : "Apasă butonul pentru a genera"}
              </p>
            </div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {loading ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se generează...</>
            ) : summary ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Regenerează</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Generează sumar</>
            )}
          </button>
        </div>
        {error && (
          <div className="bg-red-500/20 text-white px-4 py-3 rounded-xl text-sm mt-3">{error}</div>
        )}
      </div>

      {/* Card rezultat */}
      {summary && (
        <AISummaryCard summary={summary} />
      )}
    </div>
  );
}

// ─── Pagina principală ────────────────────────────────────────
export default function PatientProfilePage() {
  const { patientId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showAddVaccination, setShowAddVaccination] = useState(false);
  const [vaccRefreshKey, setVaccRefreshKey] = useState(0);

  const { data: patient, loading: loadingPatient } = useFetch(`/patients/${patientId}`, token);
  const { data: consultations, loading: loadingConsult } = useFetch(`/consultations/patient/${patientId}`, token);
  const { data: prescriptions, loading: loadingPrescr } = useFetch(`/prescriptions/patient/${patientId}`, token);
  const { data: referrals, loading: loadingRef } = useFetch(`/referrals/patient/${patientId}`, token);

  const [vaccinations, setVaccinations] = useState(null);
  const [loadingVacc, setLoadingVacc] = useState(true);
  useEffect(() => {
    if (!patientId || !token) return;
    setLoadingVacc(true);
    fetch(`${API}/vaccinations/patient/${patientId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setVaccinations(Array.isArray(d) ? d : []); setLoadingVacc(false); })
      .catch(() => setLoadingVacc(false));
  }, [patientId, token, vaccRefreshKey]);

  const isStaff = user?.role === "DOCTOR" || user?.role === "ASSISTANT";

  const appointments = Array.isArray(consultations)
    ? consultations.map((c) => c.appointment).filter(Boolean)
    : [];

  const age = calculateAge(patient?.dateOfBirth);

  if (loadingPatient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient || patient.message) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg font-medium">Pacientul nu a fost găsit.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-teal-600 hover:underline text-sm">
            ← Înapoi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">
                {patient.firstName?.[0]}{patient.lastName?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-xs text-slate-400">
                {age !== null ? `${age} ani · ` : ""}
                {formatDate(patient.dateOfBirth)}
                {patient.isMinor && (
                  <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                    Minor
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Info rapide */}
          <div className="hidden md:flex items-center gap-6 text-center">
            {[
              { label: "Consultații", value: consultations?.length ?? "-", color: "text-purple-600" },
              { label: "Rețete", value: prescriptions?.length ?? "-", color: "text-teal-600" },
              { label: "Trimiteri", value: referrals?.length ?? "-", color: "text-orange-600" },
              { label: "Vaccinuri", value: vaccinations?.length ?? "-", color: "text-green-600" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Card info pacient */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4">
            Informații pacient
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Prenume", value: patient.firstName },
              { label: "Nume", value: patient.lastName },
              { label: "Data nașterii", value: formatDate(patient.dateOfBirth) },
              { label: "Vârstă", value: age !== null ? `${age} ani` : "-" },
              { label: "Telefon", value: patient.phone || "-" },
              { label: "Minor", value: patient.isMinor ? "Da" : "Nu" },
              { label: "Înregistrat la", value: formatDate(patient.createdAt) },
              { label: "ID Pacient", value: <span className="font-mono text-xs text-slate-400 truncate">{patient.id}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-slate-700 font-medium text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sumar AI */}
        <AISummarySection patientId={patientId} token={token} />

        {/* Consultații */}
        <Section
          title="Consultații"
          count={consultations?.length ?? 0}
          defaultOpen={true}
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          {loadingConsult ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !consultations?.length ? (
            <p className="text-slate-400 text-sm text-center py-8">Nicio consultație înregistrată</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {consultations.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-purple-700 font-bold text-xs">{formatTime(c.appointment?.scheduledAt)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      {c.diagnosis || <span className="text-slate-400 italic">Fără diagnostic</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(c.appointment?.scheduledAt)}
                      {c.chiefComplaint && ` · ${c.chiefComplaint}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedConsultation(c)}
                    className="px-3 py-1.5 text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    Detalii
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Rețete */}
        <Section
          title="Rețete"
          count={prescriptions?.length ?? 0}
          icon={
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        >
          {loadingPrescr ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !prescriptions?.length ? (
            <p className="text-slate-400 text-sm text-center py-8">Nicio rețetă înregistrată</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {prescriptions.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-teal-700 font-bold text-sm">{p.items?.length ?? 0}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      {p.items?.length > 0
                        ? p.items.map((i) => i.medicationName).join(", ")
                        : "Rețetă fără medicamente"}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(p.issuedAt || p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPrescription(p)}
                      className="px-3 py-1.5 text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                    >
                      Detalii
                    </button>
                    <PdfGeneratorButton type="prescription" sourceId={p.id} token={token} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Trimiteri */}
        <Section
          title="Trimiteri"
          count={referrals?.length ?? 0}
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          }
        >
          {loadingRef ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !referrals?.length ? (
            <p className="text-slate-400 text-sm text-center py-8">Nicio trimitere înregistrată</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {referrals.map((r) => {
                const priority = PRIORITY_LABELS[r.priority] ?? { label: r.priority, color: "bg-slate-100 text-slate-600" };
                return (
                  <div key={r.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 text-sm">{r.specialty}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{formatDate(r.issuedAt || r.createdAt)}</p>
                      </div>
                      <PdfGeneratorButton type="referral" sourceId={r.id} token={token} compact />
                    </div>
                    {(r.reason || r.clinicalSummary) && (
                      <div className="mt-3 ml-15 bg-slate-50 rounded-lg p-3 ml-16">
                        {r.reason && <p className="text-xs text-slate-600"><span className="font-semibold">Motiv:</span> {r.reason}</p>}
                        {r.clinicalSummary && <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Sumar clinic:</span> {r.clinicalSummary}</p>}
                        {r.destinationUnit && <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Unitate:</span> {r.destinationUnit}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Vaccinuri */}
        <Section
          title="Vaccinuri"
          count={vaccinations?.length ?? 0}
          action={isStaff && (
            <button
              onClick={() => setShowAddVaccination(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adaugă
            </button>
          )}
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        >
          {loadingVacc ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !vaccinations?.length ? (
            <p className="text-slate-400 text-sm text-center py-8">Niciun vaccin înregistrat</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {vaccinations.map((v) => (
                <div key={v.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      {v.vaccineName}
                      {v.doseLabel && <span className="ml-1 text-slate-400 font-normal">({v.doseLabel})</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(v.administeredAt || v.scheduledAt)}
                      {v.manufacturer && ` · ${v.manufacturer}`}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    v.status === "COMPLETED" ? "bg-green-100 text-green-700"
                    : v.status === "SCHEDULED" ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {v.status === "COMPLETED" ? "Efectuat" : v.status === "SCHEDULED" ? "Programat" : "Anulat"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Modal adăugare vaccin ── */}
      {showAddVaccination && (
        <AddVaccinationModal
          patientId={patientId}
          token={token}
          onClose={() => setShowAddVaccination(false)}
          onSaved={() => setVaccRefreshKey(k => k + 1)}
        />
      )}

      {/* ── Modal consultație ── */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">Detalii consultație</h3>
                <p className="text-sm text-slate-400">{formatDate(selectedConsultation.appointment?.scheduledAt)}</p>
              </div>
              <button onClick={() => setSelectedConsultation(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {[
                { key: "chiefComplaint", label: "Motiv prezentare" },
                { key: "objectiveFindings", label: "Constatări obiective" },
                { key: "diagnosis", label: "Diagnostic" },
                { key: "treatment", label: "Tratament" },
                { key: "recommendations", label: "Recomandări" },
                { key: "plan", label: "Plan" },
                { key: "notes", label: "Note" },
              ].filter(({ key }) => selectedConsultation[key]).map(({ key, label }) => (
                <div key={key} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{selectedConsultation[key]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal rețetă ── */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">Rețetă medicală</h3>
                <p className="text-sm text-slate-400">{formatDate(selectedPrescription.issuedAt || selectedPrescription.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedPrescription(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {selectedPrescription.generalInstructions && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Instrucțiuni generale</p>
                  <p className="text-slate-700 text-sm">{selectedPrescription.generalInstructions}</p>
                </div>
              )}
              {selectedPrescription.items?.map((item, i) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 mb-2 text-sm">
                    {i + 1}. {item.medicationName}
                    {item.concentration && <span className="text-slate-400 font-normal"> · {item.concentration}</span>}
                    {item.form && <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.form}</span>}
                  </p>
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