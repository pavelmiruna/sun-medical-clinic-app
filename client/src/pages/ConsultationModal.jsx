import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function formatTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

const REASON_LABELS = {
  ROUTINE_CHECK: "Control de rutină",
  PRESCRIPTION_RENEWAL: "Reînnoire rețetă",
  SICK_VISIT: "Consultație boală",
  LAB_RESULTS: "Rezultate analize",
  VACCINATION: "Vaccinare",
  ADMINISTRATIVE: "Administrativ",
};

const CONSULTATION_FIELDS = [
  { key: "chiefComplaint", label: "Motiv prezentare", rows: 2 },
  { key: "objectiveFindings", label: "Constatări obiective", rows: 3 },
  { key: "diagnosis", label: "Diagnostic", rows: 2 },
  { key: "treatment", label: "Tratament", rows: 3 },
  { key: "recommendations", label: "Recomandări", rows: 2 },
  { key: "plan", label: "Plan", rows: 2 },
  { key: "notes", label: "Note suplimentare", rows: 2 },
];

// ─── PDF Generator inline ─────────────────────────────────────
function PdfButton({ type, sourceId, token, overrides = {} }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [withSignature, setWithSignature] = useState(true);

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

      const finalOverrides = { ...overrides, includeSignature: withSignature };
      await fetch(`${API}/documents/${docId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ overrides: finalOverrides }),
      });

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
      if (!pdfRes.ok) throw new Error("Eroare la descărcarea PDF");

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
    <div className="flex flex-col items-start gap-2">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={withSignature}
          onChange={(e) => { setWithSignature(e.target.checked); setState("idle"); }}
          className="w-4 h-4 rounded accent-teal-600"
        />
        <span className="text-xs text-slate-600">Include semnătură și parafă digitală</span>
      </label>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all border disabled:opacity-50 ${
          state === "done" ? "bg-green-50 text-green-700 border-green-200"
          : state === "error" ? "bg-red-50 text-red-700 border-red-200"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        {state === "loading" ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : state === "done" ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {state === "loading" ? "Se generează..." : state === "done" ? "PDF descărcat!" : "Descarcă PDF"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Tab 1: Consultație ───────────────────────────────────────
function ConsultationTab({ appointment, token, onSaved }) {
  const existing = appointment.consultation;
  const isEdit = !!existing?.id;

  const [form, setForm] = useState({
    chiefComplaint: "",
    objectiveFindings: "",
    diagnosis: "",
    treatment: "",
    recommendations: "",
    plan: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(isEdit);
  const [activeField, setActiveField] = useState(0);

  // Fetch date complete la deschidere (appointments selecteaza doar id)
  useEffect(() => {
    if (!existing?.id) return;
    fetch(`${API}/consultations/${existing.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setForm({
            chiefComplaint:    data.chiefComplaint    ?? "",
            objectiveFindings: data.objectiveFindings ?? "",
            diagnosis:         data.diagnosis         ?? "",
            treatment:         data.treatment         ?? "",
            recommendations:   data.recommendations   ?? "",
            plan:              data.plan              ?? "",
            notes:             data.notes             ?? "",
          });
        }
      })
      .catch(() => {});
  }, [existing?.id]);

  const filledCount = Object.values(form).filter((v) => v.trim().length > 0).length;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (isEdit) {
        res = await fetch(`${API}/consultations/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${API}/consultations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ appointmentId: appointment.id, ...form }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Eroare la salvare.");
      setSaved(true);
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
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

      {/* Layout split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
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
                onChange={(e) => { setForm((prev) => ({ ...prev, [field.key]: e.target.value })); setSaved(false); }}
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
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</div>}
        {saved && !loading && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Consultația a fost salvată.
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se salvează...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{isEdit ? "Salvează modificările" : "Salvează consultația"}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Tab 2: Rețetă ────────────────────────────────────────────
const EMPTY_MED = { medicationName: "", concentration: "", form: "", frequency: "", quantity: "", duration: "" };

function MedRow({ med, index, onChange, onRemove }) {
  const fields = [
    { key: "medicationName", label: "Denumire *",     placeholder: "ex: Nurofen",    col: "col-span-2" },
    { key: "concentration",  label: "Concentrație",   placeholder: "ex: 400mg",       col: "" },
    { key: "form",           label: "Formă farm.",    placeholder: "ex: capsule",     col: "" },
    { key: "frequency",      label: "Mod administrare", placeholder: "ex: 3cap/zi",   col: "" },
    { key: "quantity",       label: "Cantitate",      placeholder: "ex: cutie VI",    col: "" },
    { key: "duration",       label: "Durată",         placeholder: "ex: 7 zile",      col: "" },
  ];
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Medicament {index + 1}</span>
        <button onClick={onRemove} className="text-slate-300 hover:text-red-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(({ key, label, placeholder, col }) => (
          <div key={key} className={col}>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
            <input
              type="text"
              value={med[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NoConsultationMessage({ onGoToConsultation }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-10 text-center">
      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="font-semibold text-slate-700 mb-1">Consultația nu a fost salvată încă</p>
      <p className="text-sm text-slate-400 mb-5 max-w-xs">Salvează consultația înainte de a crea o rețetă sau trimitere.</p>
      <button onClick={onGoToConsultation}
        className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors text-sm">
        Mergi la Consultație
      </button>
    </div>
  );
}

function PrescriptionTab({ consultationId, token, onGoToConsultation }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [meds, setMeds] = useState([{ ...EMPTY_MED }]);
  const [savedItems, setSavedItems] = useState([]);

  const updateMed = (idx, key, value) =>
    setMeds((prev) => prev.map((m, i) => i === idx ? { ...m, [key]: value } : m));

  const addMed = () => setMeds((prev) => [...prev, { ...EMPTY_MED }]);
  const removeMed = (idx) => setMeds((prev) => prev.filter((_, i) => i !== idx));

  const createPrescription = async () => {
    const validMeds = meds.filter((m) => m.medicationName.trim());
    setLoading(true); setError("");
    try {
      // 1. Creează rețeta
      const res = await fetch(`${API}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ consultationId, generalInstructions: generalInstructions || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // 2. Adaugă medicamentele
      const savedMeds = [];
      for (let i = 0; i < validMeds.length; i++) {
        const itemRes = await fetch(`${API}/prescriptions/${data.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...validMeds[i], orderIndex: i }),
        });
        const itemData = await itemRes.json();
        if (itemRes.ok) savedMeds.push(itemData);
      }

      setPrescription(data);
      setSavedItems(savedMeds);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const deleteItem = async (itemId) => {
    try {
      const res = await fetch(`${API}/prescriptions/items/${itemId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Eroare la ștergerea medicamentului.");
        return;
      }
      setSavedItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      setError("Eroare de conexiune la ștergere.");
    }
  };

  if (!consultationId) return <NoConsultationMessage onGoToConsultation={onGoToConsultation} />;

  // ── Formular creare ──
  if (!prescription) {
    return (
      <div className="p-6 space-y-5 overflow-y-auto h-full">
        <div>
          <p className="font-bold text-slate-800 mb-1">Rețetă medicală</p>
          <p className="text-sm text-slate-400">Adaugă medicamentele și instrucțiunile</p>
        </div>

        {/* Lista medicamente */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Tratament</p>
            <button onClick={addMed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Adaugă medicament
            </button>
          </div>
          {meds.map((med, idx) => (
            <MedRow key={idx} med={med} index={idx}
              onChange={(key, val) => updateMed(idx, key, val)}
              onRemove={() => removeMed(idx)} />
          ))}
        </div>

        {/* Instrucțiuni generale */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Instrucțiuni generale <span className="text-slate-400 font-normal">(opțional)</span>
          </label>
          <textarea value={generalInstructions} onChange={(e) => setGeneralInstructions(e.target.value)} rows={2}
            placeholder="ex: Administrare conform indicațiilor medicului"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>}
        <button onClick={createPrescription} disabled={loading || !meds.some(m => m.medicationName.trim())}
          className="w-full py-3 bg-linear-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60">
          {loading ? "Se creează..." : "Creează rețeta"}
        </button>
      </div>
    );
  }

  // ── Rețetă creată ──
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-slate-800">Rețetă creată</p>
          {prescription.generalInstructions && <p className="text-sm text-slate-500 mt-0.5">{prescription.generalInstructions}</p>}
        </div>
        <PdfButton type="prescription" sourceId={prescription.id} token={token} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Medicamente ({savedItems.length})</p>
        {savedItems.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400 text-sm">Niciun medicament</div>
        ) : savedItems.map((item, i) => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">
                {i + 1}. {item.medicationName}
                {item.concentration && <span className="ml-2 text-xs text-slate-500">{item.concentration}</span>}
                {item.form && <span className="ml-1 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.form}</span>}
              </p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                {item.frequency && <span>Mod admin.: <strong className="text-slate-700">{item.frequency}</strong></span>}
                {item.quantity && <span>Cantitate: <strong className="text-slate-700">{item.quantity}</strong></span>}
                {item.duration && <span>Durată: <strong className="text-slate-700">{item.duration}</strong></span>}
              </div>
            </div>
            <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ReferralTab({ consultationId, token, onGoToConsultation }) {
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Câmpuri principale trimitere
  const [form, setForm] = useState({
    specialty: "",
    priority: "ROUTINE",
    reason: "",
    clinicalSummary: "",
    destinationUnit: "",
    notes: "",
  });

  // Câmpuri extra pentru PDF (categorii asigurat + info suplimentare)
  const [pdfExtras, setPdfExtras] = useState({
    codDiagnostic: "",
    codCardAsigurat: "",
    categorieAsigurat: [], // array cu categoriile selectate
  });

  const CATEGORII = [
    { key: "salariat",        label: "Salariat" },
    { key: "coasigurat",      label: "Coasigurat" },
    { key: "liberProfesionist", label: "Liber-profesionist" },
    { key: "copii",           label: "Copii (<18 ani)" },
    { key: "elevUcenic",      label: "Elev/Ucenic/Student (18-26 ani)" },
    { key: "gravidaLauza",    label: "Gravidă/Lăuză" },
    { key: "pensionar",       label: "Pensionar" },
    { key: "alteCategoii",    label: "Alte categorii" },
    { key: "veteran",         label: "Veteran" },
    { key: "revolutionar",    label: "Revoluționar" },
    { key: "handicap",        label: "Handicap" },
    { key: "pns",             label: "PNS" },
    { key: "ajutorSocial",    label: "Ajutor social" },
    { key: "somaj",           label: "Șomaj" },
    { key: "cardEuropean",    label: "Card European (CE)" },
    { key: "acorduriInt",     label: "Acorduri internaționale" },
  ];

  const toggleCategorie = (key) => {
    setPdfExtras((p) => ({
      ...p,
      categorieAsigurat: p.categorieAsigurat.includes(key)
        ? p.categorieAsigurat.filter((k) => k !== key)
        : [...p.categorieAsigurat, key],
    }));
  };

  const createReferral = async () => {
    if (!form.specialty.trim()) { setError("Specialitatea este obligatorie."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/referrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ consultationId, ...form, issuedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReferral(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!consultationId) return <NoConsultationMessage onGoToConsultation={onGoToConsultation} />;

  if (!referral) {
    return (
      <div className="p-6 space-y-5 overflow-y-auto h-full">
        <div>
          <p className="font-bold text-slate-800 mb-1">Bilet de trimitere</p>
          <p className="text-sm text-slate-400">Completează datele trimiterii la specialist</p>
        </div>

        {/* ── Câmpuri principale ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Specialitate *</label>
            <input type="text" value={form.specialty}
              onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
              placeholder="ex: Cardiologie, Neurologie..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Prioritate</label>
            <div className="flex gap-3">
              {[{ value: "ROUTINE", label: "🟢 Rutină" }, { value: "URGENT", label: "🔴 Urgent" }].map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setForm((p) => ({ ...p, priority: opt.value }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.priority === opt.value ? "bg-teal-500 text-white border-teal-500" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: "reason", label: "Motiv trimitere", placeholder: "Motivul pentru care pacientul este trimis...", rows: 2 },
            { key: "clinicalSummary", label: "Sumar clinic", placeholder: "Rezumatul stării clinice a pacientului...", rows: 2 },
            { key: "destinationUnit", label: "Unitate destinație", placeholder: "ex: Spitalul X, Secția Y", rows: 1 },
            { key: "notes", label: "Note suplimentare", placeholder: "Alte informații relevante...", rows: 2 },
          ].map(({ key, label, placeholder, rows }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
              <textarea value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                rows={rows} placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none" />
            </div>
          ))}
        </div>

        {/* ── Câmpuri suplimentare PDF ── */}
        <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date suplimentare pentru PDF</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cod diagnostic</label>
              <input type="text" value={pdfExtras.codDiagnostic}
                onChange={(e) => setPdfExtras(p => ({ ...p, codDiagnostic: e.target.value }))}
                placeholder="ex: J45"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cod card asigurat</label>
              <input type="text" value={pdfExtras.codCardAsigurat}
                onChange={(e) => setPdfExtras(p => ({ ...p, codCardAsigurat: e.target.value }))}
                placeholder="Cod card asigurat CNAS"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
            </div>
          </div>

          {/* Categorii asigurat */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Categorie asigurat</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORII.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => toggleCategorie(key)}
                    className={`w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center cursor-pointer transition-colors ${
                      pdfExtras.categorieAsigurat.includes(key)
                        ? "bg-teal-500 border-teal-500"
                        : "border-slate-300 group-hover:border-teal-400"
                    }`}
                  >
                    {pdfExtras.categorieAsigurat.includes(key) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>}

        <button onClick={createReferral} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? "Se creează..." : "Creează trimiterea"}
        </button>
      </div>
    );
  }

  // Trimitere creată → sumar + PDF
  const overrides = {
    codDiagnostic:    pdfExtras.codDiagnostic    || undefined,
    codCardAsigurat:  pdfExtras.codCardAsigurat  || undefined,
    categorieAsigurat: pdfExtras.categorieAsigurat.length > 0 ? pdfExtras.categorieAsigurat : undefined,
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="font-semibold text-green-800">Trimitere creată cu succes!</p>
          <p className="text-sm text-green-600">Poți descărca acum PDF-ul biletului de trimitere.</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-5 space-y-3">
        {[
          { label: "Specialitate", value: referral.specialty },
          { label: "Prioritate", value: referral.priority === "URGENT" ? "🔴 Urgent" : "🟢 Rutină" },
          { label: "Motiv", value: referral.reason },
          { label: "Sumar clinic", value: referral.clinicalSummary },
          { label: "Unitate destinație", value: referral.destinationUnit },
          { label: "Categorii asigurat", value: pdfExtras.categorieAsigurat.length > 0 ? pdfExtras.categorieAsigurat.join(", ") : null },
        ].filter(({ value }) => value).map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm text-slate-700 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <PdfButton type="referral" sourceId={referral.id} token={token} overrides={overrides} />
    </div>
  );
}

// ─── Modal Principal ──────────────────────────────────────────
export default function ConsultationModal({ appointment, onClose, onSaved }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("consultation");
  const [savedConsultation, setSavedConsultation] = useState(appointment.consultation ?? null);

  const consultationId = savedConsultation?.id ?? appointment.consultation?.id;
  const canAccessDocs = !!consultationId;

  const tabs = [
    { id: "consultation", label: "Consultație", icon: "🩺" },
    { id: "prescription", label: "Rețetă", icon: "💊" },
    { id: "referral", label: "Trimitere", icon: "📋" },
  ];

  const handleConsultationSaved = (data) => {
    setSavedConsultation(data);
    onSaved();
    setActiveTab("prescription");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ height: "90vh" }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {appointment.patient?.firstName?.[0]}{appointment.patient?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {appointment.patient?.firstName} {appointment.patient?.lastName}
              </h2>
              <p className="text-sm text-slate-500">
                {formatDate(appointment.scheduledAt)} · {formatTime(appointment.scheduledAt)}
                {appointment.reason && ` · ${REASON_LABELS[appointment.reason] ?? appointment.reason}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conținut tab */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "consultation" && (
            <ConsultationTab
              appointment={{ ...appointment, consultation: savedConsultation }}
              token={token}
              onSaved={handleConsultationSaved}
            />
          )}
          {activeTab === "prescription" && (
            <PrescriptionTab consultationId={consultationId} token={token}
              onGoToConsultation={() => setActiveTab("consultation")} />
          )}
          {activeTab === "referral" && (
            <ReferralTab consultationId={consultationId} token={token}
              onGoToConsultation={() => setActiveTab("consultation")} />
          )}
        </div>
      </div>
    </div>
  );
}