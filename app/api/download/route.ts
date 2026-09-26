import { Innertube } from "youtubei.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeName(value: string) {
  return value.replace(/[<>:"/\\\\|?*\\x00-\\x1F]/g, "").trim().slice(0, 120) || "descarga";
}

function isYouTubeId(id: string) {
  return /^[a-zA-Z0-9_-]{6,20}$/.test(id);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const itag = Number(searchParams.get("itag"));
    const title = safeName(searchParams.get("title") || "descarga");

    if (!isYouTubeId(id) || !Number.isFinite(itag)) {
      return Response.json({ error: "Parámetros de descarga inválidos." }, { status: 400 });
    }

    const youtube = await Innertube.create();
    const info: any = await youtube.getInfo(id);
    const formats = [
      ...(info.streaming_data?.formats || []),
      ...(info.streaming_data?.adaptive_formats || []),
    ];

    const format = formats.find((item: any) => Number(item.itag) === itag && item.url);
    if (!format?.url) {
      return Response.json({ error: "El formato ya no está disponible. Vuelve a analizar el enlace." }, { status: 404 });
    }

    const upstream = await fetch(format.url, {
      headers: { "User-Agent": "Mozilla/5.0 Descargas-Lufer" },
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "No fue posible obtener el archivo desde el origen." }, { status: 502 });
    }

    const mime = String(format.mime_type || format.mimeType || "video/mp4").split(";")[0];
    const ext = mime.includes("webm") ? "webm" : "mp4";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${title}.${ext}"`,
        ...(upstream.headers.get("content-length")
          ? { "Content-Length": upstream.headers.get("content-length")! }
          : {}),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("download error", error);
    return Response.json({ error: "La descarga no pudo iniciarse." }, { status: 500 });
  }
}
