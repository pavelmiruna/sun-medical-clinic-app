import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

function ImageUploadBox({ label, description, currentUrl, uploadUrl, fieldName, token, onUploaded }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(currentUrl ? `${API.replace("/api", "")}${currentUrl}` : null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError("");

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
      <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
      <p className="text-xs text-slate-400 mb-4">{description}</p>

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-28 h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-contain p-1" />
          ) : (
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {loading ? "Se încarcă..." : preview ? "Schimbă imaginea" : "Încarcă imagine"}
          </button>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP · max 5MB</p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function DoctorProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    specialization: "",
    parafaCode: "",
  });

  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    serialPrefix: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/doctor-profile/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/clinic`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([profileData, clinicData]) => {
      if (profileData && !profileData.message) {
        setProfile(profileData);
        setForm({
          firstName: profileData.firstName ?? "",
          lastName: profileData.lastName ?? "",
          specialization: profileData.specialization ?? "",
          parafaCode: profileData.parafaCode ?? "",
        });
      }
      if (clinicData && !clinicData.message) {
        setClinic(clinicData);
        setClinicForm({
          name: clinicData.name ?? "",
          address: clinicData.address ?? "",
          phone: clinicData.phone ?? "",
          email: clinicData.email ?? "",
          serialPrefix: clinicData.serialPrefix ?? "",
        });
      }
    }).finally(() => setLoading(false));
  }, [token]);

  const saveProfile = async () => {
    setSaving(true);
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API}/doctor-profile/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, clinicId: clinic?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfile(data);
      setSuccess("Profilul a fost salvat!");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const saveClinic = async () => {
    setSavingClinic(true);
    setError(""); setSuccess("");
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
      setSuccess("Datele cabinetului au fost salvate!");
    } catch (err) { setError(err.message); }
    finally { setSavingClinic(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profil doctor</h1>
        <p className="text-slate-500 text-sm mt-1">Completează datele tale și ale cabinetului pentru rețete și trimiteri</p>
      </div>

      {/* ── Date personale doctor ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Date personale</h2>
            <p className="text-sm text-slate-400">Apar pe rețete și trimiteri</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "firstName", label: "Prenume", placeholder: "Ion" },
            { key: "lastName", label: "Nume", placeholder: "Popescu" },
            { key: "specialization", label: "Specializare", placeholder: "ex: Medic de familie" },
            { key: "parafaCode", label: "Cod parafă", placeholder: "ex: F07066" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          ))}
        </div>

        <button onClick={saveProfile} disabled={saving}
          className="mt-5 w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? "Se salvează..." : "Salvează datele personale"}
        </button>
      </div>

      {/* ── Semnătură și parafă ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Semnătură și parafă</h2>
            <p className="text-sm text-slate-400">Imagini care apar automat pe PDF-urile generate</p>
          </div>
        </div>

        <div className="space-y-4">
          <ImageUploadBox
            label="Semnătură electronică"
            description="Imaginea semnăturii tale (PNG/JPG cu fundal transparent recomandat)"
            currentUrl={profile?.signatureUrl}
            uploadUrl="/doctor-profile/me/signature"
            fieldName="signature"
            token={token}
            onUploaded={(url) => setProfile(p => ({ ...p, signatureUrl: url }))}
          />
          <ImageUploadBox
            label="Parafă"
            description="Imaginea parafei tale de medic"
            currentUrl={profile?.parafaImageUrl}
            uploadUrl="/doctor-profile/me/parafa"
            fieldName="parafa"
            token={token}
            onUploaded={(url) => setProfile(p => ({ ...p, parafaImageUrl: url }))}
          />
        </div>
      </div>

      {/* ── Date cabinet ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Date cabinet medical</h2>
            <p className="text-sm text-slate-400">Apar pe toate documentele generate</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "name", label: "Denumire cabinet *", placeholder: "ex: Cabinet Medical Dr. Popescu", full: true },
            { key: "address", label: "Adresă", placeholder: "ex: Str. Exemplu, nr.1, sector 1, București", full: true },
            { key: "phone", label: "Telefon", placeholder: "ex: 021 9268" },
            { key: "email", label: "Email", placeholder: "cabinet@exemplu.ro" },
            { key: "serialPrefix", label: "Seria rețetelor", placeholder: "ex: RM5880" },
          ].map(({ key, label, placeholder, full }) => (
            <div key={key} className={full ? "col-span-2" : ""}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
              <input
                type="text"
                value={clinicForm[key]}
                onChange={(e) => setClinicForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          ))}
        </div>

        <button onClick={saveClinic} disabled={savingClinic || !clinicForm.name}
          className="mt-5 w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-60">
          {savingClinic ? "Se salvează..." : "Salvează datele cabinetului"}
        </button>
      </div>

      {/* Mesaje */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  );
}