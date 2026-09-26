 "use client";

import { useState } from "react";

type Format = {
  itag: number;
  quality: string;
  mimeType: string;
  size?: number;
  hasAudio: boolean;
  hasVideo: boolean;
};

type Result = {
  platform: string;
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  formats: Format[];
};

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function analyze() {
    setError("");
    setResult(null);
    if (!url.trim()) {
      setError("Pega un enlace para comenzar.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo analizar el enlace.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  function download(format: Format) {
    if (!result) return;
    const params = new URLSearchParams({
      id: result.id,
      itag: String(format.itag),
      title: result.title,
    });
    window.location.href = `/api/download?${params.toString()}`;
  }

  return (
    <main className="page">
      <div className="glow glowOne" />
      <div className="glow glowTwo" />

      <nav className="nav">
        <div className="brand"><span className="brandMark">L</span> Descargas <strong>Lufer</strong></div>
        <span className="navTag">MVP 1.0</span>
      </nav>

      <section className="hero">
        <div className="eyebrow">EXTRACTOR MULTIMEDIA</div>
        <h1>Descarga contenido<br /><span>de forma sencilla.</span></h1>
        <p className="subtitle">Pega el enlace, analiza el contenido y elige una calidad disponible.</p>

        <div className="searchBox">
          <div className="inputWrap">
            <span className="linkIcon">↗</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="Pega aquí el enlace del video..."
              aria-label="URL del contenido"
            />
            {url && <button className="clear" onClick={() => setUrl("")}>×</button>}
          </div>
          <button className="analyze" onClick={analyze} disabled={loading}>
            {loading ? "Analizando..." : "Analizar"}
          </button>
        </div>

        <div className="platforms">
          <span>Compatible inicialmente con</span>
          <b>YouTube</b>
          <i>•</i>
          <span>Más plataformas en desarrollo</span>
        </div>

        {error && <div className="error">{error}</div>}
      </section>

      {result && (
        <section className="resultCard">
          <div className="preview">
            <img src={result.thumbnail} alt="" />
            <div className="duration">{formatDuration(result.duration)}</div>
          </div>
          <div className="details">
            <div className="resultMeta">{result.platform} · {result.author}</div>
            <h2>{result.title}</h2>
            <p>Selecciona una calidad disponible para iniciar la descarga.</p>
            <div className="formats">
              {result.formats.map((format) => (
                <button key={format.itag} className="format" onClick={() => download(format)}>
                  <span>
                    <strong>{format.quality || "Disponible"}</strong>
                    <small>{format.mimeType.split(";")[0].replace("video/", "").toUpperCase()} {format.hasAudio ? "· audio" : "· video"}</small>
                  </span>
                  <em>{formatSize(format.size)} ↓</em>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="infoGrid">
        <article><span>01</span><h3>Pega el enlace</h3><p>Coloca la URL del contenido que quieres analizar.</p></article>
        <article><span>02</span><h3>Analizamos</h3><p>Descargas Lufer consulta los formatos disponibles.</p></article>
        <article><span>03</span><h3>Descarga</h3><p>El archivo se entrega para que lo guardes en tu dispositivo.</p></article>
      </section>

      <footer>Descargas Lufer · Herramienta de uso responsable</footer>
    </main>
  );
}
