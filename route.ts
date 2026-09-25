import { Innertube } from "youtubei.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getYouTubeId(input: string): string | null {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = String(body?.url || "").trim();
    const id = getYouTubeId(input);

    if (!id) {
      return Response.json(
        { error: "Por ahora la V1 acepta enlaces de YouTube. Estamos preparando más plataformas." },
        { status: 400 }
      );
    }

    const youtube = await Innertube.create();
    const info: any = await youtube.getInfo(id);
    const basic = info.basic_info || {};
    const streaming = info.streaming_data || {};

    const allFormats = [
      ...(streaming.formats || []),
      ...(streaming.adaptive_formats || []),
    ];

    // V1: mostramos formatos que ya incluyen audio + video para que
    // la descarga no necesite una etapa de mezcla en el servidor.
    const formats = allFormats
      .filter((f: any) => f?.url && f?.has_video !== false && f?.has_audio !== false)
      .map((f: any) => ({
        itag: Number(f.itag),
        quality: f.quality_label || f.quality || `${f.height || ""}p`,
        mimeType: f.mime_type || f.mimeType || "video/mp4",
        size: f.content_length ? Number(f.content_length) : undefined,
        hasAudio: true,
        hasVideo: true,
      }))
      .filter((f: any) => Number.isFinite(f.itag))
      .sort((a: any, b: any) => {
        const ah = parseInt(String(a.quality).replace(/\\D/g, ""), 10) || 0;
        const bh = parseInt(String(b.quality).replace(/\\D/g, ""), 10) || 0;
        return bh - ah;
      });

    const thumbnail =
      basic.thumbnail?.[0]?.url ||
      basic.thumbnails?.[0]?.url ||
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    if (!formats.length) {
      return Response.json(
        { error: "El video no ofrece en este momento un formato progresivo con audio y video que la V1 pueda entregar directamente." },
        { status: 422 }
      );
    }

    return Response.json({
      platform: "YouTube",
      id,
      title: basic.title || "Video",
      author: basic.author || basic.channel_name || "YouTube",
      duration: Number(basic.duration || basic.length_seconds || 0),
      thumbnail,
      formats,
    });
  } catch (error) {
    console.error("analyze error", error);
    return Response.json(
      { error: "No fue posible analizar el enlace. Puede ser un contenido no disponible, restringido o temporalmente incompatible." },
      { status: 500 }
    );
  }
}
