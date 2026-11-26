import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { getNomineeMeFn, updateNomineeProfileFn } from "#/server/nominee-portal";
import { PANEL } from "#/components/nominee/NomineeDashboard";
import { NomineeMediaFields, type NomineeMediaChange } from "#/components/media/NomineeMediaFields";
import { Reveal } from "#/components/nominee/Reveal";

export const Route = createFileRoute("/nominee-portal/profile")({
  loader: async () => {
    const me = await getNomineeMeFn();
    if (!me) throw redirect({ to: "/nominee-portal", search: { code: undefined } });
    return { me };
  },
  head: () => ({ meta: [{ title: "Your Profile | Heravote" }, { name: "robots", content: "noindex" }] }),
  component: NomineeProfile,
});

const MAX_NAME = 80;
const MAX_TAGLINE = 140;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const input =
  "w-full rounded-xl border border-zinc-700 bg-[#0a192a]/60 px-3 py-3 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500";

function NomineeProfile() {
  const { me } = Route.useLoaderData();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(me.contestant.name ?? "");
  const [tagline, setTagline] = useState(me.contestant.tagline ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  // Only what the nominee changed is sent; untouched media stays as it is.
  const [media, setMedia] = useState<NomineeMediaChange>({});
  const [preview, setPreview] = useState<string | null>(me.contestant.imageUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstTime = !me.activated;

  useEffect(() => () => { if (photo && preview) URL.revokeObjectURL(preview); }, [photo, preview]);

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > MAX_PHOTO_BYTES) return setError("That photo is over 10 MB. Please choose a smaller one.");
    setError(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("tagline", tagline);
      if (photo) fd.append("image", photo);
      if (media.flyer) fd.append("flyer", media.flyer);
      if (media.removeFlyer) fd.append("removeFlyer", "true");
      if (media.introVideoFile) fd.append("introVideoFile", media.introVideoFile);
      else if (media.introVideoUrl !== undefined) fd.append("introVideoUrl", media.introVideoUrl);
      await updateNomineeProfileFn({ data: fd } as any);
      await router.navigate({ to: "/nominee-portal", search: { code: undefined } });
    } catch (err: any) {
      setError(err?.message || "Couldn't save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
        <Reveal>
          {firstTime && (
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-200">
              Step 1 of 1 · Before you continue
            </p>
          )}
          <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
            {firstTime ? "Complete your profile" : "Edit your profile"}
          </h1>
          <p className="text-zinc-300">
            {me.category.name} · {me.event.title}. This is what voters see on your voting page.
          </p>
        </Reveal>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">

        <Reveal delay={90}>
        <form onSubmit={submit} className={`${PANEL} space-y-6 p-6 sm:p-8`}>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-dashed border-zinc-600 bg-[#0a192a]/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={preview ? "Change your photo" : "Add your photo"}
            >
              {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Camera className="m-auto h-7 w-7 text-zinc-500" />}
              <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                {preview ? "Change" : "Add photo"}
              </span>
            </button>
            <div className="text-sm text-zinc-400">
              <p className="font-semibold text-white">Your photo</p>
              <p>A clear portrait works best. JPG or PNG, up to 10 MB.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Name as voters will see it</span>
            <input required maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </label>

          <label className="block space-y-1.5">
            <span className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Tagline <span className="font-normal normal-case tracking-normal text-zinc-500">{tagline.length}/{MAX_TAGLINE}</span>
            </span>
            <input required maxLength={MAX_TAGLINE} placeholder="A short line about you" value={tagline} onChange={(e) => setTagline(e.target.value)} className={input} />
          </label>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-sm font-semibold text-white">Campaign media <span className="font-normal text-zinc-500">· optional</span></p>
            <NomineeMediaFields
              flyerUrl={me.contestant.flyerUrl}
              introVideoUrl={me.contestant.introVideoUrl}
              disabled={busy}
              onChange={(change) => setMedia((m) => ({ ...m, ...change }))}
            />
          </div>

          <p className="text-xs text-zinc-500">
            Your category, voting code ({me.contestant.code}) and phone number are managed by the organiser.
          </p>

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={busy || (!preview && !photo)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {firstTime ? "Save and continue" : "Save changes"}
          </button>
        </form>
        </Reveal>

        {/* Live preview of the public card */}
        <aside className="space-y-3 lg:sticky lg:top-24 animate-in fade-in slide-in-from-right-4 duration-500 delay-200 fill-mode-both motion-reduce:animate-none">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Live preview</p>
          <div className={`${PANEL} overflow-hidden`}>
            <div className="relative aspect-[4/5] bg-black/30">
              {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">Add a photo</div>}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16">
                <span className="rounded-full bg-purple-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-100">{me.category.name}</span>
                <p className="mt-2 break-words text-xl font-extrabold leading-tight text-white">{name || "Your name"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-200">{tagline || "Your tagline"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-zinc-400">Voting code</span>
              <span className="font-mono text-sm font-bold tracking-wider text-white">{me.contestant.code}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500">This is roughly how your card appears to voters.</p>
        </aside>
        </div>
    </div>
  );
}
