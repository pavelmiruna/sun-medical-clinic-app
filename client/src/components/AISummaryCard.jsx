import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Renderer markdown simplu ──────────────────────────────────
export function MarkdownText({ text, darkMode = false }) {
  if (!text) return null;

  const base = darkMode ? "text-white/90" : "text-slate-700";
  const bold = darkMode ? "text-white font-semibold" : "text-slate-800 font-semibold";
  const bullet = darkMode ? "text-teal-200" : "text-teal-500";
  const num = darkMode ? "text-teal-200 font-bold" : "text-teal-600 font-bold";

  const renderInline = (str, key) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((p, i) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={i} className={bold}>{p.slice(2, -2)}</strong>
            : <span key={i}>{p}</span>
        )}
      </span>
    );
  };

  const lines = text.split("\n");
  const elements = [];

  const heading = darkMode ? "text-white font-bold" : "text-slate-800 font-bold";

  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) {
      elements.push(<div key={i} className="h-2" />);
    } else if (t.startsWith("### ")) {
      elements.push(<p key={i} className={`text-sm ${heading} mt-2`}>{renderInline(t.slice(4), i)}</p>);
    } else if (t.startsWith("## ")) {
      elements.push(<p key={i} className={`text-base ${heading} mt-2`}>{renderInline(t.slice(3), i)}</p>);
    } else if (t.startsWith("# ")) {
      elements.push(<p key={i} className={`text-base ${heading} mt-3`}>{renderInline(t.slice(2), i)}</p>);
    } else if (/^\d+\.\s/.test(t)) {
      elements.push(
        <div key={i} className={`flex gap-2 text-sm ${base} leading-relaxed`}>
          <span className={`${num} shrink-0`}>{t.match(/^(\d+)\./)[1]}.</span>
          <span>{renderInline(t.replace(/^\d+\.\s*/, ""), i)}</span>
        </div>
      );
    } else if (t.startsWith("* ") || t.startsWith("- ")) {
      elements.push(
        <div key={i} className={`flex gap-2 text-sm ${base} leading-relaxed`}>
          <span className={`${bullet} shrink-0 mt-0.5`}>•</span>
          <span>{renderInline(t.slice(2), i)}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className={`text-sm ${base} leading-relaxed`}>
          {renderInline(t, i)}
        </p>
      );
    }
  });

  return <div className="space-y-1.5">{elements}</div>;
}

// ─── Grafic snapshot ───────────────────────────────────────────
const SNAPSHOT_COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#10b981"];

function SnapshotChart({ data }) {
  if (!data || data.every((d) => d.value === 0)) return null;
  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={SNAPSHOT_COLORS[i % SNAPSHOT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Card principal ────────────────────────────────────────────
export default function AISummaryCard({ summary, onRegenerate }) {
  if (!summary) return null;

  const snap = [
    { name: "Consultații", value: summary.dataSnapshot?.consultationsCount ?? 0 },
    { name: "Rețete",      value: summary.dataSnapshot?.prescriptionsCount  ?? 0 },
    { name: "Trimiteri",   value: summary.dataSnapshot?.referralsCount      ?? 0 },
    { name: "Vaccinuri",   value: summary.dataSnapshot?.vaccinationsCount   ?? 0 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800">Sumar generat de AI</p>
            <p className="text-xs text-slate-400">
              {new Date(summary.generatedAt).toLocaleString("ro-RO")}
            </p>
          </div>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            Regenerează
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-px bg-slate-100">
        {snap.map((s, i) => (
          <div key={s.name} className="bg-white py-4 text-center">
            <p className="text-2xl font-extrabold" style={{ color: SNAPSHOT_COLORS[i] }}>
              {s.value}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{s.name}</p>
          </div>
        ))}
      </div>

      {/* Grafic */}
      <div className="px-6 pt-5 pb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Distribuție dosar
        </p>
        <SnapshotChart data={snap} />
      </div>

      {/* Text sumar */}
      <div className="px-6 pb-6 pt-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Analiză AI
        </p>
        <div className="bg-slate-50 rounded-xl p-5">
          <MarkdownText text={summary.summary} />
        </div>
      </div>
    </div>
  );
}
