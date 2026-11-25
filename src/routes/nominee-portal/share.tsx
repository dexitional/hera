import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, ImageIcon, Loader2, MessageCircle, QrCode, Share2, Smartphone } from "lucide-react";
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

  // Kicker and event.
  ctx.fillStyle = t.accent;
  ctx.font = `800 34px Inter, system-ui, sans-serif`;
  ctx.fillText("VOTE FOR ME", pad, y);
  y += 52;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const ev = wrapText(ctx, o.event, w - pad * 2, 32, 24, 1, 600);
  ctx.fillText(ev.lines[0], pad, y);
  y += ev.size + 40;

  // Photo, name and category: sized to the space, then centred vertically
  // between the event line and the footer card (tall formats would
  // otherwise leave an empty band).
  const footer = o.format === "square" ? 230 : 300;
  const footerTop = h - pad - (footer - 60);
  const nm = wrapText(ctx, o.name, w - pad * 2, 84, 48, 2, 900);
  const nameH = nm.lines.length * nm.size * 1.08;
  const cat = wrapText(ctx, o.category.toUpperCase(), w - pad * 2, 34, 22, 2, 700);
  const catH = cat.lines.length * cat.size * 1.2;
  const textH = 44 + nameH + 12 + catH;
  const region = footerTop - 40 - y;
  const photoSize = Math.max(240, Math.min(w - pad * 2, region - textH));
  y += Math.max(0, (region - photoSize - textH) / 2);

  const px = (w - photoSize) / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 50;
  roundRect(ctx, px, y, photoSize, photoSize, 48);
  ctx.fillStyle = "#1f2b3a";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, px, y, photoSize, photoSize, 48);
  ctx.clip();
  if (o.photo) {
    const s = Math.max(photoSize / o.photo.width, photoSize / o.photo.height);
    const dw = o.photo.width * s, dh = o.photo.height * s;
    ctx.drawImage(o.photo, px + (photoSize - dw) / 2, y + (photoSize - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = t.accent;
    ctx.font = `900 ${photoSize * 0.35}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase(), w / 2, y + photoSize / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }
  ctx.restore();
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 6;
  roundRect(ctx, px, y, photoSize, photoSize, 48);
  ctx.stroke();
  y += photoSize + 44;

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${nm.size}px Inter, "Segoe UI", system-ui, sans-serif`;
  for (const line of nm.lines) { ctx.fillText(line, w / 2, y); y += nm.size * 1.08; }
  y += 12;
  ctx.fillStyle = t.accent;
  ctx.font = `700 ${cat.size}px Inter, "Segoe UI", system-ui, sans-serif`;
  for (const line of cat.lines) { ctx.fillText(line, w / 2, y); y += cat.size * 1.2; }
  ctx.textAlign = "left";

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
  const tx = pad + 36;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `700 24px Inter, system-ui, sans-serif`;
  ctx.fillText("VOTING CODE", tx, fy + 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.min(92, fh * 0.42)}px "SF Mono", Menlo, Consolas, monospace`;
  ctx.fillText(o.code, tx, fy + 62);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `600 24px Inter, system-ui, sans-serif`;
  ctx.fillText(`Scan the QR or dial ${USSD_SHORTCODE}`, tx, fy + fh - 44);
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
      const [{ dataUrl }, QR] = await Promise.all([getNomineePhotoFn() as Promise<any>, import("qrcode")]);
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
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
              <p className="text-xs leading-relaxed text-zinc-300">
                No data? Voters can dial <span className="font-mono font-bold text-white">{USSD_SHORTCODE}</span> and enter <span className="font-mono font-bold text-white">{code}</span>.
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
