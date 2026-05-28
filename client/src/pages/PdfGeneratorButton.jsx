import { useState } from "react";

const API = "http://localhost:4000/api";

// ─────────────────────────────────────────────────────────────
// Buton reutilizabil pentru generare PDF
// type: "prescription" | "referral"
// sourceId: ID-ul rețetei sau trimiterii
// token: JWT
// ─────────────────────────────────────────────────────────────

export default function PdfGeneratorButton({ type, sourceId, token, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("idle"); // idle | generating | finalizing | done | error
  const [withSignature, setWithSignature] = useState(true);

  const generateEndpoint =
    type === "prescription"
      ? `/documents/generate-from-prescription/${sourceId}`
      : `/documents/generate-from-referral/${sourceId}`;

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setStep("generating");

    try {
      // Pasul 1: Generează document draft
      const genRes = await fetch(`${API}${generateEndpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const genData = await genRes.json();

      if (!genRes.ok) {
        throw new Error(genData.message || "Eroare la generarea documentului.");
      }

      const documentId = genData.id;

      // Pasul 2: Aplică overrides (include/exclude semnătură)
      await fetch(`${API}/documents/${documentId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ overrides: { includeSignature: withSignature } }),
      });

      setStep("finalizing");

      // Pasul 3: Finalizează documentul și generează PDF
      const finalRes = await fetch(`${API}/documents/${documentId}/finalize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const finalData = await finalRes.json();

      if (!finalRes.ok) {
        if (finalRes.status === 400 && finalData.message?.includes("finalized")) {
          await downloadPdf(documentId);
          return;
        }
        throw new Error(finalData.message || "Eroare la finalizarea documentului.");
      }

      setStep("done");

      // Pasul 4: Descarcă PDF-ul
      await downloadPdf(documentId);
    } catch (err) {
      setError(err.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (documentId) => {
    // Deschidem PDF-ul într-un tab nou
    const pdfUrl = `${API}/documents/${documentId}/pdf`;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    // Adăugăm header Authorization via fetch și blob
    const res = await fetch(pdfUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type === "prescription" ? "reteta" : "trimitere"}_${sourceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStep("done");
    } else {
      throw new Error("Eroare la descărcarea PDF-ului.");
    }
  };

  const getButtonLabel = () => {
    if (step === "generating") return "Se generează...";
    if (step === "finalizing") return "Se finalizează...";
    if (step === "done") return compact ? "PDF" : "Descarcă PDF";
    return compact ? "PDF" : "Generează PDF";
  };

  const getButtonColor = () => {
    if (step === "done") return "text-green-600 bg-green-50 hover:bg-green-100 border-green-200";
    if (step === "error") return "text-red-600 bg-red-50 hover:bg-red-100 border-red-200";
    return "text-teal-600 bg-teal-50 hover:bg-teal-100 border-teal-200";
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={withSignature}
          onChange={(e) => { setWithSignature(e.target.checked); setStep("idle"); }}
          className="w-3.5 h-3.5 rounded accent-teal-600"
        />
        <span className="text-xs text-slate-500">Include semnătură și parafă</span>
      </label>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
      >
        {loading ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : step === "done" ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {getButtonLabel()}
      </button>
      {error && (
        <p className="text-xs text-red-500 max-w-48 text-right">{error}</p>
      )}
    </div>
  );
}