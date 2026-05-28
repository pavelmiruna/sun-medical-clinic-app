import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:4000/api";

const ANNOUNCEMENT_COLORS = [
  "from-teal-500 to-teal-600",
  "from-indigo-500 to-indigo-600",
  "from-purple-500 to-purple-600",
  "from-blue-500 to-blue-600",
];

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "long",
  });
}

export default function AnnouncementsBanner({ token }) {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`${API}/announcements/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setAnnouncements(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  const visible = announcements.filter((a) => !dismissed.includes(a.id));

  if (visible.length === 0) return null;

  const announcement = visible[Math.min(current, visible.length - 1)];
  const colorClass = ANNOUNCEMENT_COLORS[current % ANNOUNCEMENT_COLORS.length];

  return (
    <div className={`bg-gradient-to-r ${colorClass} rounded-2xl p-5 shadow-lg mb-6`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>

        {/* Conținut */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-bold text-sm">{announcement.title}</p>
            {visible.length > 1 && (
              <span className="text-white/60 text-xs">
                ({current + 1}/{visible.length})
              </span>
            )}
          </div>
          <p className="text-white/90 text-sm leading-relaxed">{announcement.content}</p>
          {announcement.endsAt && (
            <p className="text-white/60 text-xs mt-2">
              Valabil până la {formatDate(announcement.endsAt)}
            </p>
          )}
        </div>

        {/* Acțiuni */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Navigare între anunțuri */}
          {visible.length > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="w-7 h-7 bg-white/20 hover:bg-white/30 disabled:opacity-30 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrent((c) => Math.min(visible.length - 1, c + 1))}
                disabled={current === visible.length - 1}
                className="w-7 h-7 bg-white/20 hover:bg-white/30 disabled:opacity-30 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Închide */}
          <button
            onClick={() => {
              setDismissed((d) => [...d, announcement.id]);
              setCurrent((c) => Math.max(0, c - 1));
            }}
            className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            title="Închide anunțul"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dots indicator */}
      {visible.length > 1 && (
        <div className="flex gap-1.5 mt-3 justify-center">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "bg-white w-4" : "bg-white/40 w-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}