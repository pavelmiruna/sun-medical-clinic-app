import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

const ROLE_LABELS = {
  DOCTOR: { label: "Doctor", color: "bg-teal-100 text-teal-700", icon: "🩺" },
  PATIENT: { label: "Pacient", color: "bg-indigo-100 text-indigo-700", icon: "🧑" },
  ASSISTANT: { label: "Asistentă", color: "bg-purple-100 text-purple-700", icon: "👩‍💼" },
  ADMIN: { label: "Administrator", color: "bg-red-100 text-red-700", icon: "⚙️" },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Secțiune schimbare parolă ────────────────────────────────
function ChangePasswordSection({ token }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Parolele noi nu coincid.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Parola nouă trebuie să aibă cel puțin 6 caractere.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Eroare la schimbarea parolei.");
        return;
      }

      setSuccess("Parola a fost schimbată cu succes!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Schimbă parola</h2>
          <p className="text-sm text-slate-400">Actualizează parola contului tău</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Parolă curentă */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Parola curentă
          </label>
          <div className="relative">
            <input
              type={showPasswords ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Parolă nouă */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Parola nouă</label>
            <input
              type={showPasswords ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Min. 6 caractere"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmă parola</label>
            <input
              type={showPasswords ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Strength indicator */}
        {form.newPassword && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    form.newPassword.length >= i * 2
                      ? form.newPassword.length >= 8 ? "bg-green-400"
                        : form.newPassword.length >= 6 ? "bg-yellow-400"
                        : "bg-red-400"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400">
              {form.newPassword.length < 6 ? "Prea scurtă"
                : form.newPassword.length < 8 ? "Acceptabilă"
                : form.newPassword.length < 12 ? "Bună"
                : "Excelentă"}
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Se salvează...
            </>
          ) : "Schimbă parola"}
        </button>
      </form>
    </div>
  );
}

// ─── Pagina principală profil ─────────────────────────────────
export default function ProfilePage() {
  const { token, user: authUser, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    const fetchProfile = authUser?.role === "PATIENT"
      ? fetch(`${API}/patients/my-profiles`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => [])
      : Promise.resolve(null);

    Promise.all([fetchUser, fetchProfile])
      .then(([user, profiles]) => {
        setUserData(user);
        if (Array.isArray(profiles)) {
          const own = profiles.find((p) => p.accessRole === "OWNER") ?? profiles[0] ?? null;
          setPatientProfile(own);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, authUser?.role]);

  const roleInfo = ROLE_LABELS[authUser?.role] ?? { label: authUser?.role, color: "bg-slate-100 text-slate-600", icon: "👤" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profilul meu</h1>
        <p className="text-slate-500 text-sm mt-1">Informații despre contul tău</p>
      </div>

      {/* Card profil */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Informații cont</h2>
            <p className="text-sm text-slate-400">Detaliile contului tău</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">
              {userData?.email?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">{userData?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleInfo.color}`}>
                {roleInfo.icon} {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Email",
              value: userData?.email,
              icon: (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              ),
            },
            {
              label: "Rol",
              value: roleInfo.label,
              icon: (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
            },
            ...(authUser?.role === "PATIENT" && patientProfile?.phone ? [{
              label: "Telefon",
              value: patientProfile.phone,
              icon: (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              ),
            }] : []),
            ...(authUser?.role === "PATIENT" && patientProfile?.cnp ? [{
              label: "CNP",
              value: <span className="font-mono text-xs tracking-wider">{patientProfile.cnp}</span>,
              icon: (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              ),
            }] : []),
            {
              label: "ID Cont",
              value: <span className="font-mono text-xs text-slate-400 truncate">{userData?.id}</span>,
              icon: (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              ),
            },
            {
              label: "Membru din",
              value: formatDate(userData?.createdAt),
              icon: (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              </div>
              <p className="text-slate-700 font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schimbă parola */}
      <ChangePasswordSection token={token} />

      {/* Zona periculoasă */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Deconectare</h2>
            <p className="text-sm text-slate-400">Ieși din contul tău curent</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors border border-red-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Deconectare
        </button>
      </div>
    </div>
  );
}