import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import PdfGeneratorButton from "./PdfGeneratorButton";

const API = "http://localhost:4000/api";

const CONSULTATION_FIELDS = [
  { key: "chiefComplaint", label: "Motiv prezentare", rows: 2 },
  { key: "objectiveFindings", label: "Constatări obiective", rows: 3 },
  { key: "diagnosis", label: "Diagnostic", rows: 2 },
  { key: "treatment", label: "Tratament", rows: 3 },
  { key: "recommendations", label: "Recomandări", rows: 2 },
  { key: "plan", label: "Plan", rows: 2 },
  { key: "notes", label: "Note suplimentare", rows: 2 },
];

// ─── Modal consultație fără programare ────────────────────────
function WalkInConsultationModal({ onClose, onSaved, token }) {
  const { user } = useAuth();
  const isAssistant = user?.role === "ASSISTANT";

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeField, setActiveField] = useState(0);
  const [form, setForm] = useState({
    chiefComplaint: "", objectiveFindings: "", diagnosis: "",
    treatment: "", recommendations: "", plan: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    fetch(`${API}/doctor/patients`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setPatients(Array.isArray(d) ? d : []); setLoadingPatients(false); })
      .catch(() => setLoadingPatients(false));
  }, [token]);

  useEffect(() => {
    if (!isAssistant) return;
    fetch(`${API}/doctor/list`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setDoctors(list);
        if (list.length === 1) setSelectedDoctorId(list[0].id);
      })
      .catch(() => {});
  }, [isAssistant, token]);

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const filledCount = Object.values(form).filter((v) => v.trim().length > 0).length;

  const handleSubmit = async () => {
    if (!selectedPatient) { setError("Selectează un pacient."); return; }
    if (isAssistant && !selectedDoctorId) { setError("Selectează medicul responsabil."); return; }
    setLoading(true); setError("");
    try {
      const body = { patientId: selectedPatient.id, ...form };
      if (isAssistant) body.doctorId = selectedDoctorId;

      const res = await fetch(`${API}/consultations/walk-in`, {
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ height: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Consultație fără programare</h2>
            <p className="text-sm text-slate-400">Pacient prezentat la urgență / fără programare</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Coloana stânga — selector pacient */}
          <div className="w-72 border-r border-slate-100 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Selectează pacient</p>
              <input
                type="text"
                placeholder="Caută după nume..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loadingPatients ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredPatients.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  {search ? "Niciun pacient găsit" : "Niciun pacient în sistem"}
                </p>
              ) : (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setError(""); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1 ${
                      selectedPatient?.id === p.id
                        ? "bg-teal-50 border border-teal-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">{p.firstName?.[0]}{p.lastName?.[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{p.firstName} {p.lastName}</p>
                      {p.isMinor && <span className="text-xs text-orange-500 font-medium">Minor</span>}
                    </div>
                    {selectedPatient?.id === p.id && (
                      <svg className="w-4 h-4 text-teal-500 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
            {selectedPatient && (
              <div className="p-4 border-t border-slate-100 bg-teal-50">
                <p className="text-xs text-teal-600 font-semibold">Pacient selectat:</p>
                <p className="text-sm font-bold text-teal-800">{selectedPatient.firstName} {selectedPatient.lastName}</p>
              </div>
            )}
          </div>

          {/* Coloana dreapta — formular consultație */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Progress */}
            <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-slate-400">{filledCount} din {CONSULTATION_FIELDS.length} câmpuri completate</p>
                <p className="text-xs font-semibold text-teal-600">{Math.round((filledCount / CONSULTATION_FIELDS.length) * 100)}%</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${(filledCount / CONSULTATION_FIELDS.length) * 100}%` }} />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar câmpuri */}
              <div className="w-44 border-r border-slate-100 p-3 space-y-1 flex-shrink-0 overflow-y-auto">
                {CONSULTATION_FIELDS.map((field, i) => {
                  const filled = form[field.key].trim().length > 0;
                  return (
                    <button key={field.key} type="button" onClick={() => setActiveField(i)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                        activeField === i ? "bg-teal-50 text-teal-700 font-semibold" : "text-slate-500 hover:bg-slate-50"
                      }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${filled ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                        {filled ? "✓" : i + 1}
                      </div>
                      <span className="truncate text-xs">{field.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Câmp activ */}
              <div className="flex-1 p-6 overflow-y-auto">
                {CONSULTATION_FIELDS.map((field, i) => (
                  <div key={field.key} className={i === activeField ? "block" : "hidden"}>
                    <label className="block text-base font-bold text-slate-800 mb-3">{field.label}</label>
                    <textarea
                      value={form[field.key]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      rows={field.rows + 4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none text-sm leading-relaxed"
                      placeholder={`Completează ${field.label.toLowerCase()}...`}
                    />
                    <div className="flex gap-3 mt-3">
                      {i > 0 && <button type="button" onClick={() => setActiveField(i - 1)} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">← Anterior</button>}
                      {i < CONSULTATION_FIELDS.length - 1 && <button type="button" onClick={() => setActiveField(i + 1)} className="px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors">Următor →</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex-shrink-0">
              {!selectedPatient && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Selectează un pacient din lista din stânga.
                </div>
              )}
              {isAssistant && doctors.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Medic responsabil <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
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
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</div>
              )}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Anulează
                </button>
                <button onClick={handleSubmit} disabled={loading || !selectedPatient}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se salvează...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Salvează consultația</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function groupConsultations(items) {
  const map = {};
  const firstDateByGroup = {};
  for (const item of items) {
    const dateStr = item.appointment?.scheduledAt;
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

// ─── Modal detalii consultație ─────────────────────────────────
function ConsultationModal({ consultation, onClose, token }) {
  const [prescriptions, setPrescriptions] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (!consultation?.patientId) return;

    Promise.all([
      fetch(`${API}/prescriptions/patient/${consultation.patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API}/referrals/patient/${consultation.patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([presc, ref]) => {
        // Filtrăm doar cele din această consultație
        setPrescriptions(
          Array.isArray(presc)
            ? presc.filter((p) => p.consultationId === consultation.id)
            : []
        );
        setReferrals(
          Array.isArray(ref)
            ? ref.filter((r) => r.consultationId === consultation.id)
            : []
        );
      })
      .catch(() => { setPrescriptions([]); setReferrals([]); })
      .finally(() => setLoadingDocs(false));
  }, [consultation]);

  const fields = [
    { key: "chiefComplaint", label: "Motiv prezentare" },
    { key: "objectiveFindings", label: "Constatări obiective" },
    { key: "diagnosis", label: "Diagnostic" },
    { key: "treatment", label: "Tratament" },
    { key: "recommendations", label: "Recomandări" },
    { key: "plan", label: "Plan" },
    { key: "notes", label: "Note" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {consultation.patient?.firstName} {consultation.patient?.lastName}
            </h2>
            <p className="text-sm text-slate-400">
              {formatDate(consultation.appointment?.scheduledAt)} · {formatTime(consultation.appointment?.scheduledAt)}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Câmpuri consultație */}
          {fields.map(({ key, label }) =>
            consultation[key] ? (
              <div key={key} className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{consultation[key]}</p>
              </div>
            ) : null
          )}

          {fields.every(({ key }) => !consultation[key]) && (
            <p className="text-slate-400 text-center py-4 text-sm">Nu există detalii înregistrate.</p>
          )}

          {/* Rețete din această consultație */}
          {loadingDocs ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Se încarcă documentele...</p>
            </div>
          ) : (
            <>
              {prescriptions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Rețete ({prescriptions.length})
                  </p>
                  <div className="space-y-2">
                    {prescriptions.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {p.items?.length > 0
                              ? p.items.map((i) => i.medicationName).join(", ")
                              : "Rețetă fără medicamente"}
                          </p>
                          <p className="text-xs text-slate-400">{p.items?.length ?? 0} medicamente · {formatDate(p.issuedAt || p.createdAt)}</p>
                        </div>
                        <PdfGeneratorButton
                          type="prescription"
                          sourceId={p.id}
                          token={token}
                          compact={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {referrals?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Trimiteri ({referrals.length})
                  </p>
                  <div className="space-y-2">
                    {referrals.map((r) => (
                      <div key={r.id} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.specialty}</p>
                          <p className="text-xs text-slate-400">
                            {r.priority === "URGENT" ? "🔴 Urgent" : "🟢 Rutină"} · {formatDate(r.issuedAt || r.createdAt)}
                          </p>
                        </div>
                        <PdfGeneratorButton
                          type="referral"
                          sourceId={r.id}
                          token={token}
                          compact={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prescriptions?.length === 0 && referrals?.length === 0 && (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm">Nicio rețetă sau trimitere pentru această consultație.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Consultații Doctor ───────────────────────────────────
export default function ConsultationsTab({ canCreate = true }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [consultations, setConsultations] = useState(null);
  const [loading, setLoading] = useState(true);
  const search = searchParams.get("consultSearch") ?? "";
  const setSearch = (val) => setSearchParams((prev) => { const p = new URLSearchParams(prev); val ? p.set("consultSearch", val) : p.delete("consultSearch"); return p; }, { replace: true });
  const [selected, setSelected] = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);

  const fetchConsultations = () => {
    setLoading(true);
    fetch(`${API}/consultations/doctor/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setConsultations(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchConsultations(); }, [token]);

  const filtered = (consultations ?? []).filter((c) => {
    const name = `${c.patient?.firstName ?? ""} ${c.patient?.lastName ?? ""}`.toLowerCase();
    const diag = (c.diagnosis ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || diag.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Consultațiile mele</h1>
          <p className="text-slate-500 text-sm mt-1">
            {consultations?.length ?? 0} consultații · click pe "Detalii" pentru rețete și trimiteri
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowWalkIn(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Consultație fără programare
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Caută după pacient sau diagnostic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Nicio consultație găsită</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? "Încearcă alt termen de căutare" : "Consultațiile apar după finalizarea programărilor"}
            </p>
          </div>
        ) : (
          <>
            {/* Header tabel */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50">
              <span className="col-span-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pacient</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Data</span>
              <span className="col-span-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Diagnostic</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Acțiuni</span>
            </div>

            <div className="divide-y divide-slate-100">
              {groupConsultations(filtered).flatMap(({ label, items }) => [
                <div key={`h-${label}`} className="px-6 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                </div>,
                ...items.map((c) => (
                  <div key={c.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                    {/* Pacient */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {c.patient?.firstName?.[0]}{c.patient?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => c.patient?.id && navigate(`/doctor/patients/${c.patient.id}`)}
                          className="font-semibold text-slate-800 text-sm hover:text-teal-600 hover:underline transition-colors text-left"
                        >
                          {c.patient?.firstName} {c.patient?.lastName}
                        </button>
                        <p className="text-xs text-slate-400">{formatTime(c.appointment?.scheduledAt)}</p>
                      </div>
                    </div>

                    {/* Data */}
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">{formatDate(c.appointment?.scheduledAt)}</p>
                    </div>

                    {/* Diagnostic */}
                    <div className="col-span-4">
                      {c.diagnosis ? (
                        <p className="text-sm text-slate-700 truncate">{c.diagnosis}</p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Fără diagnostic</span>
                      )}
                      {c.chiefComplaint && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{c.chiefComplaint}</p>
                      )}
                    </div>

                    {/* Acțiuni */}
                    <div className="col-span-2">
                      <button
                        onClick={() => setSelected(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detalii
                      </button>
                    </div>
                  </div>
                )),
              ])}
            </div>
          </>
        )}
      </div>

      {/* Modal detalii */}
      {selected && (
        <ConsultationModal
          consultation={selected}
          onClose={() => setSelected(null)}
          token={token}
        />
      )}

      {/* Modal consultație fără programare */}
      {showWalkIn && (
        <WalkInConsultationModal
          token={token}
          onClose={() => setShowWalkIn(false)}
          onSaved={() => { setShowWalkIn(false); fetchConsultations(); }}
        />
      )}
    </div>
  );
}