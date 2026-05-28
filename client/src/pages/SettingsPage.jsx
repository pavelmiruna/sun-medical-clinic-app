import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:4000/api";

// ─── Secțiune upload imagine (cu drag & drop) ─────────────────
function ImageUploadBox({ label, description, currentUrl, uploadUrl, fieldName, token, onUploaded }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(currentUrl ? `${API.replace("/api", "")}${currentUrl}` : null);
  const [dragging, setDragging] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Doar imagini JPG, PNG, WEBP sunt acceptate.");
      return;
    }
    setLoading(true); setError("");
    const formData = new FormData();
    formData.append(fieldName, file);
    try {
      const res = await fetch(`${API}${uploadUrl}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Eroare la upload");
      const url = data.signatureUrl || data.parafaImageUrl;
      setPreview(`${API.replace("/api", "")}${url}`);
      onUploaded(url);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => uploadFile(e.target.files[0]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
      <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
      <p className="text-xs text-slate-400 mb-4">{description}</p>

      {/* Zona drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-8
          ${dragging
            ? "border-teal-400 bg-teal-50 scale-[1.01]"
            : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/30"
          } ${loading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <img src={preview} alt={label}
            className="max-h-28 max-w-full object-contain rounded-xl shadow-sm" />
        ) : (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
            ${dragging ? "bg-teal-100" : "bg-slate-100"}`}>
            <svg className={`w-7 h-7 transition-colors ${dragging ? "text-teal-500" : "text-slate-400"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        )}

        <div className="text-center">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-teal-600 font-semibold">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Se încarcă...
            </div>
          ) : dragging ? (
            <p className="text-sm font-semibold text-teal-600">Eliberează pentru a încărca</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600">
                {preview ? "Trage o imagine nouă sau " : "Trage imaginea aici sau "}
                <span className="text-teal-600 underline underline-offset-2">alege din calculator</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP · max 5MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Reguli parolă (reutilizabile) ───────────────────────────
const PASSWORD_RULES = [
  { id: "len",     label: "Minim 6 caractere",        test: (p) => p.length >= 6 },
  { id: "digit",   label: "Cel puțin o cifră",         test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Cel puțin un semn special", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

function PasswordChecklist({ password }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.id} className={`flex items-center gap-2 text-xs font-medium transition-colors ${ok ? "text-green-600" : "text-slate-400"}`}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${ok ? "text-green-500" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {ok
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

// ─── Secțiune schimbare parolă ────────────────────────────────
function ChangePasswordSection({ token }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  const newPasswordValid = PASSWORD_RULES.every((r) => r.test(form.newPassword));
  const passwordsMatch = form.newPassword === form.confirmPassword;
  const canSubmit = form.currentPassword && newPasswordValid && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!newPasswordValid) { setError("Parola nouă nu îndeplinește toate cerințele de securitate."); return; }
    if (!passwordsMatch) { setError("Parolele noi nu coincid."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare."); return; }
      setSuccess("Parola a fost schimbată cu succes!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch { setError("Eroare de conexiune."); }
    finally { setLoading(false); }
  };

  const eyeIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {show
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      }
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Parola curentă */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Parola curentă</label>
        <div className="relative">
          <input type={show ? "text" : "password"} value={form.currentPassword}
            onChange={(e) => setForm(p => ({ ...p, currentPassword: e.target.value }))}
            placeholder="••••••••" required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all pr-12" />
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {eyeIcon}
          </button>
        </div>
      </div>

      {/* Parola nouă */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Parola nouă</label>
        <div className="relative">
          <input type={show ? "text" : "password"} value={form.newPassword}
            onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="Min. 6 caractere, o cifră și un semn special" required
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all pr-12 ${
              form.newPassword && !newPasswordValid ? "border-amber-300" : "border-slate-200"
            }`} />
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {eyeIcon}
          </button>
        </div>
        <PasswordChecklist password={form.newPassword} />
      </div>

      {/* Confirmă parola */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmă parola nouă</label>
        <input type={show ? "text" : "password"} value={form.confirmPassword}
          onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="••••••••" required
          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
            form.confirmPassword && !passwordsMatch ? "border-red-300" : "border-slate-200"
          }`} />
        {form.confirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-500 mt-1.5">Parolele nu coincid.</p>
        )}
        {form.confirmPassword && passwordsMatch && newPasswordValid && (
          <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Parolele coincid
          </p>
        )}
      </div>

      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{success}</div>}

      <button type="submit" disabled={loading || !canSubmit}
        className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60">
        {loading ? "Se salvează..." : "Schimbă parola"}
      </button>
    </form>
  );
}

// ─── Pagina principală Setări ─────────────────────────────────
export default function SettingsPage({ isDoctorRole = false }) {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("cont");

  // Date user
  const [userData, setUserData] = useState(null);

  // Date doctor profile
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Date profil pacient
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientForm, setPatientForm] = useState({ firstName: "", lastName: "", phone: "", dateOfBirth: "", sex: "" });
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientSuccess, setPatientSuccess] = useState("");
  const [patientError, setPatientError] = useState("");

  const [profileForm, setProfileForm] = useState({
    firstName: "", lastName: "", specialization: "", parafaCode: "",
  });
  const [clinicForm, setClinicForm] = useState({
    name: "", address: "", phone: "", email: "", serialPrefix: "",
  });

  useEffect(() => {
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUserData);

    if (isDoctorRole) {
      Promise.all([
        fetch(`${API}/doctor-profile/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API}/clinic`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]).then(([p, c]) => {
        if (p && !p.message) {
          setDoctorProfile(p);
          setProfileForm({ firstName: p.firstName ?? "", lastName: p.lastName ?? "", specialization: p.specialization ?? "", parafaCode: p.parafaCode ?? "" });
        }
        if (c && !c.message) {
          setClinic(c);
          setClinicForm({ name: c.name ?? "", address: c.address ?? "", phone: c.phone ?? "", email: c.email ?? "", serialPrefix: c.serialPrefix ?? "" });
        }
      });
    }

    if (user?.role === "PATIENT") {
      fetch(`${API}/patients/my-profiles`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(profiles => {
          const own = Array.isArray(profiles) ? profiles.find(p => p.accessRole === "OWNER") : null;
          if (own) {
            setPatientProfile(own);
            setPatientForm({
              firstName: own.firstName ?? "",
              lastName: own.lastName ?? "",
              phone: own.phone ?? "",
              dateOfBirth: own.dateOfBirth ? own.dateOfBirth.split("T")[0] : "",
              sex: own.sex ?? "",
            });
          }
        });
    }
  }, [token, isDoctorRole, user?.role]);

  const saveProfile = async () => {
    setSavingProfile(true); setProfileError(""); setProfileSuccess("");
    try {
      const res = await fetch(`${API}/doctor-profile/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...profileForm, clinicId: clinic?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDoctorProfile(data);
      setProfileSuccess("Profilul a fost salvat!");
    } catch (err) { setProfileError(err.message); }
    finally { setSavingProfile(false); }
  };

  const saveClinic = async () => {
    setSavingClinic(true); setProfileError(""); setProfileSuccess("");
    try {
      const url = clinic?.id ? `${API}/clinic/${clinic.id}` : `${API}/clinic`;
      const method = clinic?.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(clinicForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setClinic(data);
      setProfileSuccess("Datele cabinetului au fost salvate!");
    } catch (err) { setProfileError(err.message); }
    finally { setSavingClinic(false); }
  };

  const savePatientProfile = async () => {
    setSavingPatient(true); setPatientError(""); setPatientSuccess("");
    try {
      const res = await fetch(`${API}/patients/my-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(patientForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPatientProfile(prev => ({ ...prev, ...data }));
      setPatientSuccess("Datele au fost salvate cu succes!");
    } catch (err) { setPatientError(err.message); }
    finally { setSavingPatient(false); }
  };

  const sections = [
    { id: "cont", label: "Contul meu", icon: "👤" },
    { id: "parola", label: "Schimbă parola", icon: "🔒" },
    ...(user?.role === "PATIENT" ? [
      { id: "profil", label: "Date personale", icon: "📋" },
    ] : []),
    ...(isDoctorRole ? [
      { id: "doctor", label: "Date doctor", icon: "🩺" },
      { id: "semnaturi", label: "Semnătură și parafă", icon: "✍️" },
      { id: "cabinet", label: "Date cabinet", icon: "🏥" },
    ] : []),
  ];

  const ROLE_LABELS = { DOCTOR: "Doctor", PATIENT: "Pacient", ASSISTANT: "Asistentă", ADMIN: "Administrator" };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Setări</h1>
        <p className="text-slate-500 text-sm mt-1">Gestionează contul și preferințele tale</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar navigare secțiuni */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {sections.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === s.id
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}>
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all text-left">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Deconectare
            </button>
          </div>
        </div>

        {/* Conținut secțiune */}
        <div className="flex-1 min-w-0">

          {/* ── Contul meu ── */}
          {activeSection === "cont" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-5">Informații cont</h2>
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-2xl">{userData?.email?.[0]?.toUpperCase() ?? "?"}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{userData?.email}</p>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 mt-1 inline-block">
                    {ROLE_LABELS[user?.role] ?? user?.role}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Email", value: userData?.email },
                  { label: "Rol", value: ROLE_LABELS[user?.role] },
                  { label: "Membru din", value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "-" },
                  { label: "ID Cont", value: <span className="font-mono text-xs text-slate-400 truncate">{userData?.id}</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-slate-700 font-medium text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Schimbă parola ── */}
          {activeSection === "parola" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-5">Schimbă parola</h2>
              <ChangePasswordSection token={token} />
            </div>
          )}

          {/* ── Date personale pacient ── */}
          {activeSection === "profil" && user?.role === "PATIENT" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-1">Date personale</h2>
              <p className="text-sm text-slate-400 mb-5">Actualizează informațiile profilului tău de pacient</p>
              {!patientProfile ? (
                <p className="text-slate-400 text-sm text-center py-8">Nu există un profil de pacient asociat contului tău.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Prenume</label>
                      <input type="text" value={patientForm.firstName}
                        onChange={(e) => setPatientForm(p => ({ ...p, firstName: e.target.value }))}
                        placeholder="Ion"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nume</label>
                      <input type="text" value={patientForm.lastName}
                        onChange={(e) => setPatientForm(p => ({ ...p, lastName: e.target.value }))}
                        placeholder="Popescu"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Număr de telefon</label>
                      <input type="tel" value={patientForm.phone}
                        onChange={(e) => setPatientForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="07xx xxx xxx" inputMode="numeric" maxLength={13}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
                      <p className="text-xs text-slate-400 mt-1">Format: 07xx xxx xxx (10 cifre)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Sex</label>
                      <select value={patientForm.sex}
                        onChange={(e) => setPatientForm(p => ({ ...p, sex: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all">
                        <option value="">Selectează...</option>
                        <option value="M">Masculin</option>
                        <option value="F">Feminin</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Data nașterii</label>
                      <input type="date" value={patientForm.dateOfBirth}
                        onChange={(e) => setPatientForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
                    </div>
                  </div>
                  {patientProfile.cnp && (
                    <div className="mt-4 bg-slate-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">CNP</p>
                      <p className="text-slate-700 font-mono text-sm">{patientProfile.cnp}</p>
                      <p className="text-xs text-slate-400 mt-1">CNP-ul nu poate fi modificat din setări.</p>
                    </div>
                  )}
                  {patientError && <p className="text-sm text-red-600 mt-4 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{patientError}</p>}
                  {patientSuccess && <p className="text-sm text-green-700 mt-4 bg-green-50 px-4 py-3 rounded-xl border border-green-200">{patientSuccess}</p>}
                  <button onClick={savePatientProfile} disabled={savingPatient}
                    className="mt-5 w-full py-3 bg-linear-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60">
                    {savingPatient ? "Se salvează..." : "Salvează"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Date doctor ── */}
          {activeSection === "doctor" && isDoctorRole && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-1">Date personale doctor</h2>
              <p className="text-sm text-slate-400 mb-5">Apar automat pe rețete și trimiteri</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "firstName", label: "Prenume", placeholder: "Ion" },
                  { key: "lastName", label: "Nume", placeholder: "Popescu" },
                  { key: "specialization", label: "Specializare", placeholder: "ex: Medic de familie" },
                  { key: "parafaCode", label: "Cod parafă", placeholder: "ex: F07066" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
                    <input type="text" value={profileForm[key]}
                      onChange={(e) => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
                  </div>
                ))}
              </div>
              {profileError && <p className="text-sm text-red-600 mt-4 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{profileError}</p>}
              {profileSuccess && <p className="text-sm text-green-700 mt-4 bg-green-50 px-4 py-3 rounded-xl border border-green-200">{profileSuccess}</p>}
              <button onClick={saveProfile} disabled={savingProfile}
                className="mt-5 w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60">
                {savingProfile ? "Se salvează..." : "Salvează"}
              </button>
            </div>
          )}

          {/* ── Semnătură și parafă ── */}
          {activeSection === "semnaturi" && isDoctorRole && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-1">Semnătură și parafă</h2>
              <p className="text-sm text-slate-400 mb-2">Apare automat pe PDF-urile generate</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
                <p className="font-semibold mb-1">Cum să pregătești imaginea</p>
                <p>Într-o singură imagine, scrie semnătura deasupra și aplică parafa dedesubt — exact ca pe un document real. Salvează ca PNG cu fundal transparent pentru un rezultat profesional.</p>
              </div>
              <ImageUploadBox
                label="Semnătură și parafă"
                description="O singură imagine cu semnătura scrisă deasupra și parafa aplicată dedesubt (PNG cu fundal transparent recomandat)"
                currentUrl={doctorProfile?.signatureUrl}
                uploadUrl="/doctor-profile/me/signature"
                fieldName="signature"
                token={token}
                onUploaded={(url) => setDoctorProfile(p => ({ ...p, signatureUrl: url }))}
              />
            </div>
          )}

          {/* ── Date cabinet ── */}
          {activeSection === "cabinet" && isDoctorRole && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-1">Date cabinet medical</h2>
              <p className="text-sm text-slate-400 mb-5">Apar pe toate documentele generate</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Denumire cabinet *", placeholder: "Cabinet Medical Dr. Popescu", full: true },
                  { key: "address", label: "Adresă", placeholder: "Str. Exemplu, nr.1, sector 1, București", full: true },
                  { key: "phone", label: "Telefon", placeholder: "021 9268" },
                  { key: "email", label: "Email cabinet", placeholder: "cabinet@exemplu.ro" },
                  { key: "serialPrefix", label: "Seria rețetelor", placeholder: "ex: RM5880" },
                ].map(({ key, label, placeholder, full }) => (
                  <div key={key} className={full ? "col-span-2" : ""}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
                    <input type="text" value={clinicForm[key]}
                      onChange={(e) => setClinicForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
                  </div>
                ))}
              </div>
              {profileError && <p className="text-sm text-red-600 mt-4 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{profileError}</p>}
              {profileSuccess && <p className="text-sm text-green-700 mt-4 bg-green-50 px-4 py-3 rounded-xl border border-green-200">{profileSuccess}</p>}
              <button onClick={saveClinic} disabled={savingClinic || !clinicForm.name}
                className="mt-5 w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60">
                {savingClinic ? "Se salvează..." : "Salvează datele cabinetului"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}