import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Clapperboard, Copy, Download, ExternalLink, ImageIcon, Loader2, MessageCircle, QrCode, Share2, Smartphone, Sparkles } from "lucide-react";
import { parseMediaUrl } from "#/lib/media-embed";
import { MediaPlayer } from "#/components/media/MediaEmbed";
import ShareMenu from "#/components/ShareMenu";
import { USSD_SHORTCODE } from "#/lib/utils";
import { getNomineeMeFn, getNomineePhotoFn } from "#/server/nominee-portal";
import { PANEL } from "#/components/nominee/NomineeDashboard";

export const Route = createFileRoute("/nominee-portal/share")({
  loader: async () => {
    const me = await getNomineeMeFn();
    if (!me) throw redirect({ to: "/nominee-portal", search: { code: undefined } });
    if (!me.activated) throw redirect({ to: "/nominee-portal/profile" });
    return { me };
  },
  head: () => ({ meta: [{ title: "Share Kit | Heravote" }, { name: "robots", content: "noindex" }] }),
  component: ShareKit,
});

const FORMATS = {
  post: { label: "Post", hint: "4:5 · Instagram & Facebook", w: 1080, h: 1350 },
  story: { label: "Story", hint: "9:16 · WhatsApp & IG stories", w: 1080, h: 1920 },
  square: { label: "Square", hint: "1:1 · anywhere", w: 1080, h: 1080 },
} as const;
type FormatKey = keyof typeof FORMATS;

const THEMES = {
  olive: { label: "Olive", from: "#1b2a0b", to: "#0b1a2e", accent: "#c3d34a", glow: "rgba(195,211,74,0.35)" },
  midnight: { label: "Midnight", from: "#0b1a2e", to: "#1d1147", accent: "#8ab4ff", glow: "rgba(138,180,255,0.35)" },
  sunset: { label: "Sunset", from: "#3b0f2e", to: "#1a0b0b", accent: "#ffb15c", glow: "rgba(255,177,92,0.35)" },
} as const;
type ThemeKey = keyof typeof THEMES;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Largest font size (<= max) that fits `text` on at most `lines` lines of `width`. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, width: number, max: number, min: number, lines: number, weight = 800) {
  for (let size = max; size >= min; size -= 2) {
    ctx.font = `${weight} ${size}px Inter, "Segoe UI", system-ui, sans-serif`;
    const words = text.split(/\s+/);
    const out: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width <= width) line = test;
      else { if (line) out.push(line); line = w; }
    }
    if (line) out.push(line);
    if (out.length <= lines && out.every((l) => ctx.measureText(l).width <= width)) return { size, lines: out };
  }
  ctx.font = `${weight} ${min}px Inter, system-ui, sans-serif`;
  return { size: min, lines: [text.length > 40 ? `${text.slice(0, 38)}…` : text] };
}

async function drawPoster(canvas: HTMLCanvasElement, o: {
  format: FormatKey; theme: ThemeKey; name: string; category: string; event: string; code: string; url: string; photo: HTMLImageElement | null; qr: HTMLImageElement | null;
}) {
  const { w, h } = FORMATS[o.format];
  const t = THEMES[o.theme];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  await document.fonts?.ready;

  // Background, glow and texture.
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, t.from);
  bg.addColorStop(1, t.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.8, h * 0.1, 0, w * 0.8, h * 0.1, w * 0.9);
  glow.addColorStop(0, t.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  for (let i = -h; i < w; i += 60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke(); }

  const pad = 80;
  let y = pad;
  ctx.textBaseline = "top";

  // Headline: a big, heavy, slanted "VOTE FOR ME" in the theme's accent
  // gradient, with a drop shadow, glow, fine outline and a swoosh underline.
  const headline = "VOTE FOR ME";
  let headSize = o.format === "square" ? 112 : 136;
  const headFont = (size: number) => `italic 900 ${size}px Inter, "Arial Black", "Segoe UI", system-ui, sans-serif`;
  ctx.font = headFont(headSize);
  while (ctx.measureText(headline).width > w - pad * 2 - 20 && headSize > 60) { headSize -= 4; ctx.font = headFont(headSize); }
  const headW = ctx.measureText(headline).width;
  ctx.save();
  ctx.translate(w / 2, y + headSize / 2);
  ctx.rotate(-0.04);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(headline, 7, 10);
  const fill = ctx.createLinearGradient(-headW / 2, -headSize / 2, headW / 2, headSize / 2);
  fill.addColorStop(0, "#ffffff");
  fill.addColorStop(0.45, t.accent);
  fill.addColorStop(1, "#ffffff");
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 48;
  ctx.fillStyle = fill;
  ctx.fillText(headline, 0, 0);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.strokeText(headline, 0, 0);
  // Swoosh underline
  ctx.beginPath();
  ctx.moveTo(-headW * 0.42, headSize * 0.62);
  ctx.quadraticCurveTo(0, headSize * 0.78, headW * 0.42, headSize * 0.56);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.strokeStyle = t.accent;
  ctx.stroke();
  ctx.restore();
  y += headSize * 1.35;

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const ev = wrapText(ctx, o.event, w - pad * 2, 34, 24, 1, 600);
  ctx.fillText(ev.lines[0], w / 2, y);
  ctx.textAlign = "left";
  y += ev.size + 36;

  // Photo, name and category, laid out in the space between the event line
  // and the footer card so nothing can overlap:
  //   square        -> photo left, name + category right (too little height to stack)
  //   post / story  -> stacked; the name's type and the photo shrink together
  //                    until the block fits, then it's centred vertically.
  const footer = o.format === "square" ? 300 : 400;
  const footerTop = h - pad - (footer - 60);
  const regionTop = y;
  const regionH = footerTop - 36 - regionTop;
  const font = (weight: number, size: number) => `${weight} ${size}px Inter, "Segoe UI", system-ui, sans-serif`;

  const drawPhoto = (px: number, py: number, size: number) => {
    const r = Math.min(48, size * 0.14);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 50;
    roundRect(ctx, px, py, size, size, r);
    ctx.fillStyle = "#1f2b3a";
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, px, py, size, size, r);
    ctx.clip();
    if (o.photo) {
      const sc = Math.max(size / o.photo.width, size / o.photo.height);
      const dw = o.photo.width * sc, dh = o.photo.height * sc;
      ctx.drawImage(o.photo, px + (size - dw) / 2, py + (size - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = t.accent;
      ctx.font = font(900, size * 0.35);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(o.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase(), px + size / 2, py + size / 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
    }
    ctx.restore();
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 6;
    roundRect(ctx, px, py, size, size, r);
    ctx.stroke();
  };

  if (o.format === "square") {
    const photoSize = Math.min(regionH, (w - pad * 2) * 0.42);
    const textX = pad + photoSize + 44;
    const textW = w - pad - textX;
    const nm = wrapText(ctx, o.name, textW, 72, 34, 3, 900);
    const cat = wrapText(ctx, o.category.toUpperCase(), textW, 30, 18, 3, 700);
    const blockH = nm.lines.length * nm.size * 1.1 + 18 + cat.lines.length * cat.size * 1.25;
    drawPhoto(pad, regionTop + (regionH - photoSize) / 2, photoSize);
    let ty = regionTop + Math.max(0, (regionH - blockH) / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = font(900, nm.size);
    for (const line of nm.lines) { ctx.fillText(line, textX, ty); ty += nm.size * 1.1; }
    ty += 18;
    ctx.fillStyle = t.accent;
    ctx.font = font(700, cat.size);
    for (const line of cat.lines) { ctx.fillText(line, textX, ty); ty += cat.size * 1.25; }
  } else {
    const minPhoto = o.format === "story" ? 460 : 360;
    let nm = wrapText(ctx, o.name, w - pad * 2, 84, 48, 2, 900);
    let cat = wrapText(ctx, o.category.toUpperCase(), w - pad * 2, 34, 22, 2, 700);
    const textH = () => 40 + nm.lines.length * nm.size * 1.08 + 12 + cat.lines.length * cat.size * 1.2;
    // Shrink the type a step at a time while the photo would be too small.
    for (let max = 84; regionH - textH() < minPhoto && max > 40; max -= 6) {
      nm = wrapText(ctx, o.name, w - pad * 2, max, Math.min(40, max), 2, 900);
      cat = wrapText(ctx, o.category.toUpperCase(), w - pad * 2, Math.max(20, Math.round(max * 0.4)), 18, 2, 700);
    }
    const photoSize = Math.max(160, Math.min(w - pad * 2, regionH - textH()));
    let ty = regionTop + Math.max(0, (regionH - photoSize - textH()) / 2);
    drawPhoto((w - photoSize) / 2, ty, photoSize);
    ty += photoSize + 40;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = font(900, nm.size);
    for (const line of nm.lines) { ctx.fillText(line, w / 2, ty); ty += nm.size * 1.08; }
    ty += 12;
    ctx.fillStyle = t.accent;
    ctx.font = font(700, cat.size);
    for (const line of cat.lines) { ctx.fillText(line, w / 2, ty); ty += cat.size * 1.2; }
    ctx.textAlign = "left";
  }

  // Footer card: code, how to vote, QR.
  const fy = footerTop;
  const fh = footer - 60;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, pad, fy, w - pad * 2, fh, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();
  const qrSize = fh - 48;
  if (o.qr) {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, w - pad - 24 - qrSize, fy + 24, qrSize, qrSize, 16);
    ctx.fill();
    ctx.drawImage(o.qr, w - pad - 24 - qrSize + 8, fy + 32, qrSize - 16, qrSize - 16);
  }
  // Left column: voting code, then a bright USSD band that reads at a glance.
  const tx = pad + 32;
  const colW = w - pad * 2 - qrSize - 24 - 32 - 28;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = `800 ${Math.round(fh * 0.075)}px Inter, system-ui, sans-serif`;
  ctx.fillText("VOTING CODE", tx, fy + 26);
  ctx.fillStyle = "#ffffff";
  // Square has the shortest card: a slightly smaller code leaves the USSD band room to read.
  const codeSize = Math.round(fh * (o.format === "square" ? 0.24 : 0.3));
  ctx.font = `900 ${codeSize}px "SF Mono", Menlo, Consolas, monospace`;
  ctx.fillText(o.code, tx, fy + 26 + fh * 0.1);

  const bandY = fy + 26 + fh * 0.1 + codeSize + 14;
  const bandH = fy + fh - 24 - bandY;
  ctx.fillStyle = t.accent;
  roundRect(ctx, tx - 8, bandY, colW, bandH, 20);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.font = `800 ${Math.round(bandH * 0.22)}px Inter, system-ui, sans-serif`;
  ctx.fillText("NO DATA? DIAL", tx + 10, bandY + bandH * 0.12);
  let ussdSize = Math.round(bandH * 0.55);
  const ussdFont = (size: number) => `900 ${size}px "SF Mono", Menlo, Consolas, monospace`;
  ctx.font = ussdFont(ussdSize);
  while (ctx.measureText(USSD_SHORTCODE).width > colW - 36 && ussdSize > 24) { ussdSize -= 2; ctx.font = ussdFont(ussdSize); }
  ctx.fillStyle = "#0b1a2e";
  ctx.fillText(USSD_SHORTCODE, tx + 10, bandY + bandH * 0.38);
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* selectable */ } }}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {done ? "Copied" : label}
    </button>
  );
}

/** The nominee's uploaded flyer and intro video, ready to send to voters. */
function CampaignMediaCard({ me, url, canShareFiles }: { me: any; url: string; canShareFiles: boolean }) {
  const flyer: string | null = me.contestant.flyerUrl;
  const video: string | null = me.contestant.introVideoUrl;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const isLinkVideo = video ? parseMediaUrl(video)?.kind === "iframe" : false;
  // Uploaded videos are shared as the voting page, opened at the video.
  const videoShareUrl = video ? (isLinkVideo ? video : url ? `${url}#intro-video` : video) : "";
  const flyerPageUrl = url ? `${url}#flyer` : "";
  const name = me.contestant.name;

  const flyerFile = async () => {
    const { dataUrl } = (await getNomineePhotoFn({ data: { which: "flyer" } } as any)) as any;
    if (!dataUrl) throw new Error("We couldn't load your flyer just now. Please try again.");
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], `heravote-${me.contestant.code.toLowerCase()}-flyer.${blob.type.split("/")[1] ?? "webp"}`, { type: blob.type });
  };
  const shareFlyer = async () => {
    setBusy(true); setNote(null);
    try {
      const file = await flyerFile();
      await navigator.share({ files: [file], text: `Vote for ${name}! Code ${me.contestant.code}: ${url}` });
    } catch (e: any) {
      if (e?.name !== "AbortError") setNote(e?.message || "Sharing didn't work on this device. Download the flyer instead.");
    } finally { setBusy(false); }
  };
  const downloadFlyer = async () => {
    setBusy(true); setNote(null);
    try {
      const file = await flyerFile();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e: any) {
      setNote(e?.message || "We couldn't download your flyer just now.");
    } finally { setBusy(false); }
  };

  if (!flyer && !video) {
    return (
      <section className={`${PANEL} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <p className="flex items-start gap-2 text-sm text-zinc-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
          Add a campaign flyer or an intro video to your profile, and you'll be able to share them with voters from here.
        </p>
        <Link to="/nominee-portal/profile" className="shrink-0 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500">Add media</Link>
      </section>
    );
  }

  const button = "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50";
  return (
    <section className={`${PANEL} space-y-4 p-5`}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-white"><Sparkles className="h-4 w-4 text-purple-300" /> Your campaign media</h2>
      <div className={`grid gap-5 ${flyer && video ? "lg:grid-cols-2" : ""}`}>
        {flyer && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"><ImageIcon className="h-3.5 w-3.5" /> Flyer</p>
            <img src={flyer} alt={`${name} campaign flyer`} className="mx-auto max-h-80 w-auto rounded-lg" />
            <div className="flex flex-wrap gap-2">
              {canShareFiles && (
                <button type="button" onClick={shareFlyer} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />} Share flyer image
                </button>
              )}
              <button type="button" onClick={downloadFlyer} disabled={busy} className={button}><Download className="h-3.5 w-3.5" /> Download</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(`See my campaign flyer and vote for me (${me.contestant.code}): ${flyerPageUrl}`)}`} target="_blank" rel="noopener noreferrer" className={button}>
                <MessageCircle className="h-3.5 w-3.5 text-[#7ee2a8]" /> WhatsApp
              </a>
              <ShareMenu title={`${name}: campaign flyer`} text={`See my campaign flyer and vote for me! Code ${me.contestant.code}`} url={flyerPageUrl || undefined} heading="Share your flyer" align="right" buttonClassName={button} />
            </div>
          </div>
        )}
        {video && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"><Clapperboard className="h-3.5 w-3.5" /> Intro video</p>
            <MediaPlayer url={video} maxWidth={520} />
            <div className="flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Watch my intro video and vote for me (${me.contestant.code}): ${videoShareUrl}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-3 py-2 text-xs font-semibold text-[#7ee2a8] hover:bg-[#25D366]/25">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
              <ShareMenu title={`${name}: intro video`} text={`Watch my intro video and vote for me! Code ${me.contestant.code}`} url={videoShareUrl || undefined} heading="Share your video" align="right" buttonClassName={button} />
              <CopyButton text={videoShareUrl} label="Copy link" />
              {!isLinkVideo && (
                <a href={video} target="_blank" rel="noopener noreferrer" download className={button}><ExternalLink className="h-3.5 w-3.5" /> Open video file</a>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {isLinkVideo ? "Shares the original video link." : "Shares your voting page, opened right at your video."}
            </p>
          </div>
        )}
      </div>
      {note && <p role="alert" className="text-xs text-amber-300">{note}</p>}
    </section>
  );
}

function ShareKit() {
  const { me } = Route.useLoaderData();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<FormatKey>("post");
  const [theme, setTheme] = useState<ThemeKey>("olive");
  const [assets, setAssets] = useState<{ photo: HTMLImageElement | null; qr: HTMLImageElement | null; qrUrl: string } | null>(null);
  const [drawing, setDrawing] = useState(true);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [origin, setOrigin] = useState("");
  const code = me.contestant.code;
  const url = origin ? `${origin}/nominee/${code}` : "";

  // Photo (via the server, so the canvas stays exportable) and QR code.
  useEffect(() => {
    const o = window.location.origin;
    setOrigin(o);
    let cancelled = false;
    (async () => {
      const [{ dataUrl }, QR] = await Promise.all([getNomineePhotoFn({ data: { which: "photo" } } as any) as Promise<any>, import("qrcode")]);
      const qrUrl = await QR.toDataURL(`${o}/nominee/${code}`, { margin: 1, width: 640, errorCorrectionLevel: "M", color: { dark: "#0b1a2e", light: "#ffffff" } });
      const [photo, qr] = await Promise.all([dataUrl ? loadImage(dataUrl).catch(() => null) : null, loadImage(qrUrl)]);
      if (!cancelled) setAssets({ photo, qr, qrUrl });
    })().catch(() => { if (!cancelled) setAssets({ photo: null, qr: null, qrUrl: "" }); });
    try {
      const probe = new File([""], "x.png", { type: "image/png" });
      setCanShareFiles(typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] }));
    } catch { /* not supported */ }
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if (!assets || !canvas.current) return;
    setDrawing(true);
    drawPoster(canvas.current, { format, theme, name: me.contestant.name, category: me.category.name, event: me.event.title, code, url, photo: assets.photo, qr: assets.qr })
      .finally(() => setDrawing(false));
  }, [assets, format, theme, me, code, url]);

  const fileName = `heravote-${code.toLowerCase()}-${format}.png`;
  const toBlob = () => new Promise<Blob | null>((r) => canvas.current?.toBlob(r, "image/png"));
  const download = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const shareImage = async () => {
    const blob = await toBlob();
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], fileName, { type: "image/png" })], text: `Vote for ${me.contestant.name}! Code ${code}: ${url}` });
    } catch { /* dismissed */ }
  };

  const captions = [
    { label: "Announcement", text: `🗳️ I've been nominated for ${me.category.name} at ${me.event.title}! Please vote for me here: ${url}\nVoting code: ${code}. No data? Dial ${USSD_SHORTCODE} and enter ${code}. Thank you! 🙏` },
    { label: "Short & sweet", text: `Vote ${me.contestant.name} for ${me.category.name}! ✨ ${url} (code ${code})` },
    { label: "Final push", text: `⏳ Voting is still open and every vote counts! Support me in ${me.category.name}: ${url}\nCode: ${code} · USSD: ${USSD_SHORTCODE}` },
  ];

  const pill = (active: boolean) => `rounded-lg px-3 py-2 text-left text-xs transition-colors ${active ? "bg-white/10 text-white ring-1 ring-purple-400/50" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Share kit</h1>
        <p className="mt-1 text-zinc-300">Everything you need to bring in votes: a ready-made poster, your QR code and captions.</p>
      </div>

      <CampaignMediaCard me={me} url={url} canShareFiles={canShareFiles} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Poster studio */}
        <section className={`${PANEL} space-y-4 p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white"><ImageIcon className="h-4 w-4 text-purple-300" /> Campaign poster</h2>
            <span className="text-xs text-zinc-500">{FORMATS[format].w} × {FORMATS[format].h} PNG</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div role="radiogroup" aria-label="Format" className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              {(Object.keys(FORMATS) as FormatKey[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={format === k} onClick={() => setFormat(k)} className={pill(format === k)} title={FORMATS[k].hint}>
                  <span className="block font-semibold">{FORMATS[k].label}</span>
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label="Colour theme" className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={theme === k} onClick={() => setTheme(k)} className={`${pill(theme === k)} flex items-center gap-1.5`}>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${THEMES[k].accent}, ${THEMES[k].from})` }} />
                  <span className="font-semibold">{THEMES[k].label}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-zinc-500">{FORMATS[format].hint}</p>

          <div className="relative flex justify-center rounded-xl border border-white/10 bg-black/30 p-4">
            <canvas
              ref={canvas}
              role="img"
              aria-label={`Campaign poster for ${me.contestant.name}, voting code ${code}`}
              className="h-auto w-full max-w-[380px] rounded-lg shadow-2xl"
              style={{ aspectRatio: `${FORMATS[format].w} / ${FORMATS[format].h}` }}
            />
            {(drawing || !assets) && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-sm text-zinc-300">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Designing your poster…
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={download} disabled={drawing} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
              <Download className="h-4 w-4" /> Download poster
            </button>
            {canShareFiles && (
              <button type="button" onClick={shareImage} disabled={drawing} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50">
                <Share2 className="h-4 w-4" /> Share image
              </button>
            )}
          </div>
        </section>

        <div className="space-y-6">
          {/* QR + link */}
          <section className={`${PANEL} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white"><QrCode className="h-4 w-4 text-purple-300" /> QR code & link</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-36 w-36 shrink-0 items-center justify-center self-center rounded-2xl bg-white p-2">
                {assets?.qrUrl ? <img src={assets.qrUrl} alt={`QR code linking to ${url}`} className="h-full w-full" /> : <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-sm text-zinc-300">Print it on flyers or show it on screen: one scan opens your voting page.</p>
                <div className="flex flex-wrap gap-2">
                  {assets?.qrUrl && (
                    <a href={assets.qrUrl} download={`heravote-${code.toLowerCase()}-qr.png`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10">
                      <Download className="h-3.5 w-3.5" /> Download QR
                    </a>
                  )}
                  <ShareMenu
                    title={me.contestant.name}
                    text={`Vote for ${me.contestant.name} in ${me.category.name}! Voting code: ${code}`}
                    url={url || undefined}
                    heading="Share your voting page"
                    align="right"
                    buttonClassName="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <span className="select-all truncate font-mono text-xs text-zinc-300">{url.replace(/^https?:\/\//, "")}</span>
              <CopyButton text={url} label="Copy link" />
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-purple-400/40 bg-gradient-to-br from-purple-500/25 via-purple-500/10 to-transparent p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-200">
                <Smartphone className="h-4 w-4" /> No data? Vote by USSD
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="select-all font-mono text-4xl font-black tracking-wider text-white sm:text-5xl">{USSD_SHORTCODE}</span>
                <CopyButton text={USSD_SHORTCODE} label="Copy" />
              </div>
              <p className="mt-2 text-sm text-zinc-200">
                Dial it on any phone, then enter <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono font-bold text-white">{code}</span> to vote for you.
              </p>
            </div>
          </section>

          {/* Captions */}
          <section className={`${PANEL} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white"><MessageCircle className="h-4 w-4 text-purple-300" /> Ready-made captions</h2>
            <ul className="mt-4 space-y-3">
              {captions.map((c) => (
                <li key={c.label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{c.label}</span>
                    <span className="flex gap-1.5">
                      <a href={`https://wa.me/?text=${encodeURIComponent(c.text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#25D366]/15 px-2.5 py-1.5 text-xs font-medium text-[#7ee2a8] hover:bg-[#25D366]/25">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <CopyButton text={c.text} />
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{c.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
