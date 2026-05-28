import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = "http://localhost:4000/api";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ─── Afișare cod generat (reutilizabil) ───────────────────────
function ClaimCodeDisplay({ code, expiresAt, onClose, patientName }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-green-800">Cod generat pentru {patientName}</p>
          <p className="text-sm text-green-600">Înmânează codul pacientului pentru activare cont.</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">Cod de activare</p>
        <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
          <span className="text-white font-mono text-2xl tracking-widest font-bold">{code}</span>
          <button
            onClick={handleCopy}
            className={`transition-colors ${copied ? "text-green-400" : "text-slate-400 hover:text-white"}`}
            title="Copiază codul"
          >
            {copied ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Expiră la: {formatDate(expiresAt)}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">Cum folosește pacientul codul?</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>Accesează pagina de înregistrare</li>
          <li>Alege opțiunea "Am cod de activare"</li>
          <li>Introduce email, parolă și codul de mai sus</li>
        </ol>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors"
      >
        Închide
      </button>
    </div>
  );
}

// ─── Modal creare pacient ─────────────────────────────────────
function CreatePatientModal({ onClose, onCreated, token, role }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", dateOfBirth: "", isMinor: false,
    cnp: "", sex: "", assignedDoctorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimResult, setClaimResult] = useState(null);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (role !== "ASSISTANT") return;
    fetch(`${API}/doctor/list`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setDoctors(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [role, token]);

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: val }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === "ASSISTANT" && !form.assignedDoctorId) {
      setError("Selectează medicul responsabil.");
      return;
    }
    if (!/^\d{13}$/.test(form.cnp)) {
      setError("CNP-ul trebuie să conțină exact 13 cifre.");
      return;
    }
    if (!form.sex) {
      setError("Sexul este obligatoriu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        isMinor: form.isMinor,
        cnp: form.cnp || undefined,
        sex: form.sex || undefined,
        ...(role === "ASSISTANT" && form.assignedDoctorId
          ? { assignedDoctorId: form.assignedDoctorId }
          : {}),
      };
      const res = await fetch(`${API}/doctor/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare la crearea pacientului."); return; }
      setClaimResult(data);
      onCreated();
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {claimResult ? "Pacient creat" : "Pacient nou"}
            </h2>
            <p className="text-sm text-slate-400">
              {claimResult ? "Cod de activare generat" : "Completează datele pacientului"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {claimResult ? (
          <div className="p-6">
            <ClaimCodeDisplay
              code={claimResult.claimCode}
              expiresAt={claimResult.claimCodeExpiresAt}
              patientName={`${claimResult.patient.firstName} ${claimResult.patient.lastName}`}
              onClose={onClose}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Prenume</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Ion" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nume</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Popescu" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Telefon <span className="text-slate-400 font-normal">(opțional)</span>
              </label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="07xx xxx xxx"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Data nașterii <span className="text-slate-400 font-normal">(opțional)</span>
              </label>
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  CNP <span className="text-red-400">*</span>
                </label>
                <input type="text" name="cnp" value={form.cnp} onChange={handleChange}
                  placeholder="13 cifre" maxLength={13} inputMode="numeric" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Sex <span className="text-red-400">*</span>
                </label>
                <select name="sex" value={form.sex} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all">
                  <option value="">Selectează...</option>
                  <option value="M">Masculin</option>
                  <option value="F">Feminin</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isMinor" checked={form.isMinor} onChange={handleChange} className="w-4 h-4 text-teal-500 rounded" />
              <span className="text-sm font-medium text-slate-700">Pacient minor</span>
            </label>

            {role === "ASSISTANT" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Medic responsabil <span className="text-red-400">*</span>
                </label>
                <select
                  name="assignedDoctorId"
                  value={form.assignedDoctorId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">Selectează medicul...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName && d.lastName
                        ? `Dr. ${d.firstName} ${d.lastName}${d.specialization ? ` — ${d.specialization}` : ""}`
                        : d.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              <button type="submit" disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se creează...</>
                ) : "Creează pacient"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Modal regenerare cod activare ────────────────────────────
function RegenerateCodeModal({ patient, onClose, token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/doctor/patients/${patient.id}/claim-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare la generare."); return; }
      setResult(data);
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cod de activare</h2>
            <p className="text-sm text-slate-400">
              {patient.firstName} {patient.lastName}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <ClaimCodeDisplay
              code={result.claimCode}
              expiresAt={result.claimCodeExpiresAt}
              patientName={`${result.firstName} ${result.lastName}`}
              onClose={onClose}
            />
          ) : (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Generezi un cod nou pentru acest pacient</p>
                <p>Orice cod anterior va fi invalidat. Codul nou va fi valabil 30 de zile.</p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{patient.firstName} {patient.lastName}</p>
                  {patient.dateOfBirth && (
                    <p className="text-sm text-slate-400">{formatDate(patient.dateOfBirth)}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Anulează
                </button>
                <button onClick={handleGenerate} disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se generează...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>Generează cod</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Pacienți ─────────────────────────────────────────────
export default function PatientsTab() {
  const { token, user } = useAuth();
  const role = user?.role;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [claimPatient, setClaimPatient] = useState(null);
  const search = searchParams.get("patientSearch") ?? "";
  const setSearch = (val) => setSearchParams((prev) => { const p = new URLSearchParams(prev); val ? p.set("patientSearch", val) : p.delete("patientSearch"); return p; }, { replace: true });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = () => {
    setLoading(true);
    fetch(`${API}/doctor/patients`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setPatients(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, [token]);

  const filtered = patients
    .filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.lastName ?? "").localeCompare(b.lastName ?? "", "ro"));

  const claimed = patients.filter((p) => p.userId).length;
  const unclaimed = patients.filter((p) => !p.userId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacienți</h1>
          <p className="text-slate-500 text-sm mt-1">
            {patients.length} pacienți · {claimed} cu cont · {unclaimed} fără cont
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Pacient nou
        </button>
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
          placeholder="Caută după nume..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Lista pacienți */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Niciun pacient găsit</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? "Încearcă alt termen de căutare" : "Adaugă primul pacient folosind butonul de mai sus"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header tabel */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50">
              <span className="col-span-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pacient</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Data nașterii</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Programări</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Ultima vizită</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Cont</span>
            </div>

            {filtered.map((p) => {
              const age = calculateAge(p.dateOfBirth);
              const isClaimed = !!p.userId;
              return (
                <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                  {/* Nume + avatar */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{p.firstName} {p.lastName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.isMinor && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Minor</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Data nașterii */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">{formatDate(p.dateOfBirth)}</p>
                    {age !== null && <p className="text-xs text-slate-400">{age} ani</p>}
                  </div>

                  {/* Nr programări */}
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg">
                      {p.appointmentsCount}
                    </span>
                  </div>

                  {/* Ultima vizită */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">{formatDate(p.lastAppointment)}</p>
                  </div>

                  {/* Status cont + acțiuni */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Activ
                      </span>
                    ) : (
                      <button
                        onClick={() => setClaimPatient(p)}
                        title="Generează cod de activare"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Cod activare
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/doctor/patients/${p.id}`)}
                      className="text-xs font-semibold px-2.5 py-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                    >
                      Vezi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePatientModal
          token={token}
          role={role}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchPatients}
        />
      )}
      {claimPatient && (
        <RegenerateCodeModal
          patient={claimPatient}
          token={token}
          onClose={() => setClaimPatient(null)}
        />
      )}
    </div>
  );
}
