"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function ConferenciaFolhaPage() {
  const [fopag, setFopag] = useState<File | null>(null);
  const [previa, setPrevia] = useState<File | null>(null);
  const [competencia, setCompetencia] = useState("");
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [fopagDrag, setFopagDrag] = useState(false);
  const [previaDrag, setPreviewDrag] = useState(false);

  const fopagRef = useRef<HTMLInputElement>(null);
  const previaRef = useRef<HTMLInputElement>(null);

  const competencias = useMemo(() => {
    const hoje = new Date();
    return Array.from({ length: 5 }, (_, index) => {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + index - 2, 1);
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const ano = data.getFullYear();
      return `${mes}/${ano}`;
    });
  }, []);

  useEffect(() => {
    setCompetencia(competencias[2]);
  }, [competencias]);

  useEffect(() => {
    if (!loading) return;
    setProgresso(10);
    const interval = setInterval(() => {
      setProgresso((atual) => {
        if (atual >= 90) return atual;
        return atual + 8;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [loading]);

  async function analisar() {
    if (!fopag || !previa) {
      alert("Envie a FOPAG e a PRÉVIA.");
      return;
    }
    setLoading(true);
    setMensagem(null);

    const formData = new FormData();
    formData.append("fopag", fopag);
    formData.append("previa", previa);
    formData.append("competencia", competencia);

   let response: Response;

    try {
      response = await fetch("/api/conferencia-folha", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      setLoading(false);
      setProgresso(0);
      setMensagem(`Erro de conexão: ${String(error)}`);
      return;
    }

    if (!response.ok) {
    const erro = await response.json();

    setLoading(false);
    setProgresso(0);

    setMensagem(
      erro?.error
        ? `Erro ao gerar relatório: ${erro.error}`
        : "Erro ao gerar relatório."
    );

    return;
  }

    setProgresso(100);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resultado_conferencia_${competencia.replace("/", "-")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      setLoading(false);
      setProgresso(0);
      setMensagem(null);
    }, 600);
    }


  const UploadCard = ({
    label,
    sublabel,
    file,
    inputRef,
    onFile,
    isDrag,
    onDragEnter,
    onDragLeave,
  }: {
    label: string;
    sublabel?: string;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onFile: (f: File | null) => void;
    isDrag: boolean;
    onDragEnter: () => void;
    onDragLeave: () => void;
  }) => (
    <div
      className="rounded-2xl border transition-all duration-300"
      style={{
        borderColor: file ? "#16a34a" : isDrag ? "#2563eb" : "#e2e8f0",
        backgroundColor: file ? "#f0fdf4" : isDrag ? "#eff6ff" : "#f8fafc",
        boxShadow: isDrag
          ? "0 0 0 3px rgba(37,99,235,0.15)"
          : file
          ? "0 0 0 2px rgba(22,163,74,0.12)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDragLeave();
        onFile(e.dataTransfer.files?.[0] || null);
      }}
    >
      {/* Accent bar */}
      <div
        className="h-1 w-full transition-all duration-300"
        style={{ backgroundColor: file ? "#16a34a" : isDrag ? "#2563eb" : "#e2e8f0" }}
      />

      <div className="flex flex-col items-center px-6 py-7 text-center">
        {/* Ícone */}
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300"
          style={{
            backgroundColor: file ? "#dcfce7" : isDrag ? "#dbeafe" : "#ffffff",
            border: `1.5px solid ${file ? "#86efac" : isDrag ? "#93c5fd" : "#e2e8f0"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {file ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDrag ? "#2563eb" : "#94a3b8"} strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          )}
        </div>

        {/* Título */}
        <p
          className="text-lg font-black"
          style={{ color: file ? "#15803d" : "#0f172a", letterSpacing: "-0.02em" }}
        >
          {label}
        </p>

        {sublabel && (
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {sublabel}
          </p>
        )}

        {/* Estado do arquivo */}
        {file ? (
          <div className="mt-4 flex w-full max-w-xs items-center gap-2 rounded-xl border border-green-200 bg-white px-3 py-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            <p className="flex-1 truncate text-xs font-semibold text-green-700">{file.name}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            {isDrag ? "Solte o arquivo aqui" : "Arraste o arquivo ou clique no botão abaixo"}
          </p>
        )}

        {/* Botão que aciona o input — sem overlay */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md"
        >
          {file ? "Trocar arquivo" : "Selecionar arquivo"}
        </button>

        {/* Input real — escondido, acionado por ref */}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );

  return (
    <main
      className="flex min-h-screen flex-col p-8 text-slate-900"
      style={{ backgroundColor: "#f1f5f9" }}
    >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900" style={{ letterSpacing: "-0.04em" }}>
              Conferência de Folha
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Compare FOPAG e prévia e gere o relatório de divergências
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/modelos/modelo_fopag.xlsx"
              download
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Modelo FOPAG
            </a>

            <button
              type="button"
              onClick={() => setMostrarInfo(!mostrarInfo)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Requisitos
            </button>
          </div>
        </div>

        {/* Info box */}
        {mostrarInfo && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-500">
              Requisitos da prévia
            </p>
            <ul className="space-y-2 text-sm text-blue-800">
              {[
                "A aba DINAMICA é ignorada automaticamente.",
                "O sistema detecta automaticamente a aba principal da prévia.",
                "A prévia deve conter: MATRÍCULA, RUBRICA e COMPETENCIA.",
                "As abas FERIAS e DESLIGADOS são opcionais.",
                "Competência no formato MM/AAAA.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-400">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main card */}
        <div
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {/* Competência compacta */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Competência
            </p>
            <select
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {competencias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Upload cards */}
          <div className="flex flex-col gap-4">
            <UploadCard
              label="FOPAG"
              sublabel="Folha de pagamento"
              file={fopag}
              inputRef={fopagRef}
              onFile={setFopag}
              isDrag={fopagDrag}
              onDragEnter={() => setFopagDrag(true)}
              onDragLeave={() => setFopagDrag(false)}
            />
            <UploadCard
              label="PRÉVIA"
              sublabel="Arquivo de conferência"
              file={previa}
              inputRef={previaRef}
              onFile={setPrevia}
              isDrag={previaDrag}
              onDragEnter={() => setPreviewDrag(true)}
              onDragLeave={() => setPreviewDrag(false)}
            />
          </div>

          {/* Progress bar */}
          {loading && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Analisando arquivos...</span>
                <span className="text-xs font-bold text-slate-700">{progresso}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progresso}%`,
                    background: "linear-gradient(90deg, #1d4ed8, #60a5fa)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Botão principal */}
          <button
            onClick={analisar}
            disabled={loading}
            className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
              boxShadow: loading
                ? "none"
                : "0 4px 16px rgba(37,99,235,0.4), 0 1px 4px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.transform = "translateY(-1px)";
                btn.style.boxShadow =
                  "0 8px 24px rgba(37,99,235,0.45), 0 2px 8px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.transform = "translateY(0)";
              btn.style.boxShadow = loading
                ? "none"
                : "0 4px 16px rgba(37,99,235,0.4), 0 1px 4px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
          >
            {loading ? "Analisando..." : "Analisar e baixar relatório"}
          </button>

          {/* Mensagem */}
          {mensagem && (
            <div
              className="mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3.5"
              style={{
                borderColor: mensagem.startsWith("Erro") ? "#fca5a5" : "#86efac",
                backgroundColor: mensagem.startsWith("Erro") ? "#fef2f2" : "#f0fdf4",
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: mensagem.startsWith("Erro") ? "#fee2e2" : "#dcfce7" }}
              >
                {mensagem.startsWith("Erro") ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: mensagem.startsWith("Erro") ? "#dc2626" : "#15803d" }}
              >
                {mensagem}
              </p>
            </div>
          )}
        </div>
      </main>
  );
}