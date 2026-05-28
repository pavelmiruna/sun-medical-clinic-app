import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function calculateAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25));
}

// ─── Card profil ──────────────────────────────────────────────
function ProfileCard({ profile, isOwner, isActive, onSelect, token, onRefresh }) {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [showGuardians, setShowGuardians] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [removingAccess, setRemovingAccess] = useState(false);
  const age = calculateAge(profile.dateOfBirth);

  const loadGuardians = async () => {
    if (!isOwner) return;
    try {
      const res = await fetch(`${API}/patients/${profile.id}/guardians`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGuardians(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    if (showGuardians) loadGuardians();
  }, [showGuardians]);

  const handleRevoke = async (guardianUserId) => {
    if (!confirm("Revocare acces tutor?")) return;
    setRevoking(guardianUserId);
    try {
      await fetch(`${API}/patients/${profile.id}/guardian/${guardianUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadGuardians();
      onRefresh();
    } catch {}
    finally { setRevoking(null); }
  };

  const handleRemoveMyAccess = async () => {
    if (!confirm(`Ești sigur că vrei să renunți la accesul pentru ${profile.firstName} ${profile.lastName}? Această acțiune nu poate fi anulată.`)) return;
    setRemovingAccess(true);
    try {
      await fetch(`${API}/patients/${profile.id}/guardian/${user?.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch {}
    finally { setRemovingAccess(false); }
  };

  const ROLE_LABELS = {
    OWNER:    { label: "Profilul meu",     color: "bg-indigo-100 text-indigo-700" },
    GUARDIAN: { label: "Sunt tutore",      color: "bg-teal-100 text-teal-700" },
    PROXY:    { label: "Sunt reprezentant", color: "bg-purple-100 text-purple-700" },
  };

  const roleKey = isOwner ? "OWNER" : (profile.accessRole ?? "GUARDIAN");
  const roleInfo = ROLE_LABELS[roleKey] ?? ROLE_LABELS.GUARDIAN;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
      isActive ? "border-indigo-400 shadow-indigo-100" : "border-slate-100 hover:border-slate-200"
    }`}>
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-linear-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800">
                {profile.firstName} {profile.lastName}
              </p>
              {isActive && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Activ
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {age !== null ? `${age} ani` : ""}
              {profile.dateOfBirth ? ` · ${formatDate(profile.dateOfBirth)}` : ""}
              {profile.isMinor && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Minor</span>}
            </p>
            {(profile.phone || profile.cnp) && (
              <div className="flex flex-wrap gap-3 mt-2">
                {profile.phone && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {profile.phone}
                  </span>
                )}
                {profile.cnp && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                    CNP: {profile.cnp}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Acțiuni */}
          <div className="flex items-center gap-2 shrink-0">
            {!isActive && (
              <button onClick={() => onSelect(profile)}
                className="px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                Selectează
              </button>
            )}
            {!isOwner && (
              <button
                onClick={handleRemoveMyAccess}
                disabled={removingAccess}
                title="Renunță la accesul pentru acest profil"
                className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {removingAccess ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Modal adăugare guardian ──────────────────────────────────
function AddGuardianModal({ onClose, onAdded, token }) {
  const [claimCode, setClaimCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/patients/claim-guardian`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ claimCode: claimCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cod invalid.");
      setSuccess(true);
      setTimeout(() => { onAdded(); onClose(); }, 1200);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Adaugă profil cu cod</h2>
            <p className="text-sm text-slate-400">Introdu codul primit de la medic</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
            <p className="font-semibold mb-1">Cum funcționează?</p>
            <p className="text-xs leading-relaxed">
              Medicul a creat un profil pentru persoana pe care o reprezinți (ex: copilul tău) și ți-a dat un cod de activare.
              Introdu codul de mai jos pentru a obține acces ca tutore/reprezentant.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Cod de activare</label>
            <input
              type="text"
              value={claimCode}
              onChange={(e) => { setClaimCode(e.target.value); setError(""); }}
              placeholder="XXXX-XXXX"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono tracking-widest text-center text-lg"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Acces obținut! Profilul a fost adăugat.
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Anulează
            </button>
            <button type="submit" disabled={loading || success}
              className="flex-1 py-3 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Se verifică...</>
              ) : "Activează accesul"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab principal Profilele mele ─────────────────────────────
export default function MyProfilesTab({ profiles, activeProfile, onSelectProfile, token, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);

  // Separăm profilul propriu de profilele unde suntem guardian/proxy
  const ownProfile = profiles?.find(p => p.accessRole === "OWNER") ?? profiles?.[0];
  const guardianProfiles = profiles?.filter(p => p.accessRole !== "OWNER") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profilele mele</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestionează profilul tău și profilele la care ai acces ca tutore
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adaugă profil
        </button>
      </div>

      {/* Profilul propriu */}
      {ownProfile && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Profilul meu</p>
          <ProfileCard
            profile={ownProfile}
            isOwner={true}
            isActive={activeProfile?.id === ownProfile.id}
            onSelect={onSelectProfile}
            token={token}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* Profilele unde ești guardian/proxy */}
      {guardianProfiles.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
            Profilele la care am acces ({guardianProfiles.length})
          </p>
          <div className="space-y-3">
            {guardianProfiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                isOwner={false}
                isActive={activeProfile?.id === p.id}
                onSelect={onSelectProfile}
                token={token}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dacă nu există niciun profil propriu și nici guardian */}
      {(!ownProfile && guardianProfiles.length === 0) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400">Niciun profil găsit. Adaugă un profil cu butonul de mai sus.</p>
        </div>
      )}

      {/* Explicație */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Cum funcționează accesul ca tutore?</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Poți gestiona dosarul medical al unui copil sau al unei persoane pe care o reprezinți legal.
              Medicul creează profilul și îți dă un <strong>cod de activare</strong>. Introdu codul cu butonul
              "Adaugă profil" pentru a obține acces ca tutore. Când persoana devine majoră sau dorește să
              preia controlul, poate să-și revendice singur profilul.
            </p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddGuardianModal
          token={token}
          onClose={() => setShowAddModal(false)}
          onAdded={onRefresh}
        />
      )}
    </div>
  );
}