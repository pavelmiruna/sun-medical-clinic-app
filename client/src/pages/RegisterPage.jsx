import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

const EYE_ICON_OPEN = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EYE_ICON_CLOSED = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [flow, setFlow] = useState("new"); // "new" | "claim"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    sex: "",
    cnp: "",
    claimCode: "",
    assignedDoctorId: "",
  });

  useEffect(() => {
    fetch(`${API}/public/doctors`)
      .then((r) => r.json())
      .then((d) => setDoctors(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  // Evaluare putere parolă
  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(form.password);

  const strengthLabel = () => {
    if (!form.password) return null;
    const s = passwordStrength;
    if (s <= 1) return { label: "Foarte slabă", color: "bg-red-500", textColor: "text-red-600", bars: 1 };
    if (s === 2) return { label: "Slabă", color: "bg-orange-400", textColor: "text-orange-500", bars: 2 };
    if (s === 3) return { label: "Medie", color: "bg-yellow-400", textColor: "text-yellow-600", bars: 3 };
    if (s === 4) return { label: "Bună", color: "bg-teal-400", textColor: "text-teal-600", bars: 4 };
    return { label: "Excelentă", color: "bg-green-500", textColor: "text-green-600", bars: 5 };
  };

  const passwordRules = [
    { test: (p) => p.length >= 6, label: "Minim 6 caractere" },
    { test: (p) => /[0-9]/.test(p), label: "Cel puțin o cifră" },
    { test: (p) => /[^a-zA-Z0-9]/.test(p), label: "Cel puțin un semn special (!@#$...)" },
  ];

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const validate = () => {
    if (!validateEmail(form.email)) return "Adresa de email nu este validă (ex: nume@gmail.com).";
    if (form.password !== form.confirmPassword) return "Parolele nu coincid.";
    if (form.password.length < 6) return "Parola trebuie să aibă cel puțin 6 caractere.";
    if (!/[0-9]/.test(form.password)) return "Parola trebuie să conțină cel puțin o cifră.";
    if (!/[^a-zA-Z0-9]/.test(form.password)) return "Parola trebuie să conțină cel puțin un semn special (!@#$%^&*...).";

    if (flow === "new") {
      if (!form.firstName.trim()) return "Prenumele este obligatoriu.";
      if (!form.lastName.trim()) return "Numele este obligatoriu.";
      if (!form.dateOfBirth) return "Data nașterii este obligatorie.";
      if (!form.sex) return "Sexul este obligatoriu.";
      if (!form.cnp.trim()) return "CNP-ul este obligatoriu.";
      if (!/^\d{13}$/.test(form.cnp.trim())) return "CNP-ul trebuie să conțină exact 13 cifre numerice (fără spații sau litere).";
      if (form.phone.trim()) {
        const cleanPhone = form.phone.trim().replace(/\s/g, "");
        if (!/^07\d{8}$/.test(cleanPhone)) return "Numărul de telefon trebuie să aibă 10 cifre și să înceapă cu 07 (ex: 0712 345 678).";
      }
      if (doctors.length > 0 && !form.assignedDoctorId) return "Selectează medicul la care dorești să te înscrii.";
    } else {
      if (!form.claimCode.trim()) return "Codul de activare este obligatoriu.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");

    try {
      const body = flow === "claim"
        ? { email: form.email, password: form.password, claimCode: form.claimCode }
        : {
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
            dateOfBirth: form.dateOfBirth,
            sex: form.sex,
            cnp: form.cnp,
            assignedDoctorId: form.assignedDoctorId || undefined,
          };

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message || "Eroare la înregistrare."); return; }

      // Auto-login
      const loginRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        login(loginData.accessToken);
        navigate("/dashboard/patient");
      } else {
        navigate("/login");
      }
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* ── Panoul stânga ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-500 flex-col items-center justify-center p-16">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-300/20 blur-2xl" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Creează un cont</h1>
          <p className="text-indigo-200 text-lg max-w-sm mx-auto leading-relaxed">
            Înregistrează-te și ai acces complet la dosarul tău medical digital.
          </p>
          <div className="mt-12 space-y-4 text-left max-w-xs mx-auto">
            {[
              { icon: "🔒", label: "Date protejate și criptate" },
              { icon: "📋", label: "Acces la istoricul medical" },
              { icon: "🤖", label: "Asistent AI personal" },
              { icon: "👨‍👩‍👧", label: "Gestionează familia ta" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panoul dreapta ── */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Header mobil */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">Cabinet Medical</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Înregistrare</h2>
            <p className="text-slate-500">Completează datele pentru a crea contul</p>
          </div>

          {/* Toggle flux */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button type="button" onClick={() => { setFlow("new"); setError(""); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${flow === "new" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Pacient nou
            </button>
            <button type="button" onClick={() => { setFlow("claim"); setError(""); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${flow === "claim" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Am cod de activare
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="email@exemplu.ro" required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
            </div>

            {/* Parola */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Parolă *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password"
                      value={form.password} onChange={handleChange}
                      placeholder="Min. 6 caractere" required
                      className="w-full px-4 py-3 pr-10 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showPassword ? EYE_ICON_CLOSED : EYE_ICON_OPEN}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmă parola *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="confirmPassword"
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="••••••••" required
                      className="w-full px-4 py-3 pr-10 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showPassword ? EYE_ICON_CLOSED : EYE_ICON_OPEN}
                    </button>
                  </div>
                </div>
              </div>

              {/* Strength meter + rules */}
              {form.password && (() => {
                const s = strengthLabel();
                return (
                  <div className="space-y-2">
                    {/* Bare putere */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= s.bars ? s.color : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-semibold ${s.textColor} whitespace-nowrap`}>{s.label}</span>
                    </div>
                    {/* Reguli parolă */}
                    <div className="grid grid-cols-1 gap-1">
                      {passwordRules.map(({ test, label }) => {
                        const ok = test(form.password);
                        return (
                          <div key={label} className="flex items-center gap-1.5">
                            <svg className={`w-3.5 h-3.5 flex-shrink-0 ${ok ? "text-green-500" : "text-slate-300"}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {ok
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              }
                            </svg>
                            <span className={`text-xs ${ok ? "text-green-600" : "text-slate-400"}`}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Flux pacient nou */}
            {flow === "new" && (
              <>
                {/* Nume */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prenume *</label>
                    <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                      placeholder="Ion" required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nume *</label>
                    <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                      placeholder="Popescu" required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </div>
                </div>

                {/* CNP */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">CNP *</label>
                  <input type="text" name="cnp" value={form.cnp} onChange={handleChange}
                    placeholder="1234567890123" required maxLength={13} inputMode="numeric" pattern="\d{13}"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono tracking-wider" />
                  <p className="text-xs text-slate-400 mt-1">Exact 13 cifre numerice, fără spații sau litere</p>
                </div>

                {/* Data nașterii + Sex */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data nașterii *</label>
                    <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sex *</label>
                    <div className="flex gap-2 h-[50px]">
                      {[{ value: "M", label: "♂ Masculin" }, { value: "F", label: "♀ Feminin" }].map((opt) => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(p => ({ ...p, sex: opt.value }))}
                          className={`flex-1 rounded-xl text-sm font-semibold border transition-all ${
                            form.sex === opt.value
                              ? "bg-indigo-500 text-white border-indigo-500"
                              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Telefon (opțional) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Telefon <span className="text-slate-400 font-normal">(opțional)</span>
                  </label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="07xx xxx xxx" maxLength={13} inputMode="numeric"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  <p className="text-xs text-slate-400 mt-1">10 cifre, format 07xx xxx xxx</p>
                </div>

                {/* Selector medic */}
                {doctors.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Medicul tău *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <select
                        name="assignedDoctorId"
                        value={form.assignedDoctorId}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                      >
                        <option value="">Selectează medicul...</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}{d.specialization ? ` — ${d.specialization}` : ""}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Medicul la care ești sau vrei să fii înscris</p>
                  </div>
                )}
              </>
            )}

            {/* Flux claim code */}
            {flow === "claim" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cod de activare *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input type="text" name="claimCode" value={form.claimCode} onChange={handleChange}
                    placeholder="XXXX-XXXX" required={flow === "claim"}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono tracking-widest" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Codul ți-a fost furnizat de medicul tău la cabinet.</p>
              </div>
            )}

            {/* Eroare */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Se înregistrează...
                </>
              ) : "Creează cont"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Ai deja un cont?{" "}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
              Autentifică-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}