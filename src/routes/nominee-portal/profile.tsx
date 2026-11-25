import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { getNomineeMeFn, updateNomineeProfileFn } from "#/server/nominee-portal";

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
      await updateNomineeProfileFn({ data: fd } as any);
      await router.navigate({ to: "/nominee-portal", search: { code: undefined } });
    } catch (err: any) {
      setError(err?.message || "Couldn't save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1f36] text-white antialiased font-sans">
      <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
        <section className="w-full pt-6 pb-8 sm:pt-12 lg:pt-20">
          {!firstTime && (
            <Link to="/nominee-portal" search={{ code: undefined }} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to portal
            </Link>
          )}
          <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            {firstTime ? "Complete your profile" : "Edit your profile"}
          </h1>
          <p className="text-lg text-zinc-300">
            {me.category.name} · {me.event.title}. This is what voters see on your voting page.
          </p>
        </section>

        <form onSubmit={submit} className="mb-24 space-y-6 rounded-3xl bg-zinc-800/50 p-6 shadow-md sm:p-8">
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
      </main>
    </div>
  );
}
