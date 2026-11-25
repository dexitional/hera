import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, LockOpen, MessagesSquare, Mic, MicOff, UsersRound } from "lucide-react";
import { getAdminNomineeChatFn, moderateNomineeChatFn, postAdminNomineeChatFn } from "#/server/nominee-chat";
import { ChatRoom } from "#/components/chat/ChatRoom";
import { useChatRoom } from "#/components/chat/useChatRoom";

export const Route = createFileRoute("/admin/events/$eventId/chat")({
  component: AdminNomineeChat,
});

function AdminNomineeChat() {
  const { eventId } = Route.useParams();
  const room = useChatRoom((since) => getAdminNomineeChatFn({ data: { eventId, since } } as any) as Promise<any>);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const state = room.latest?.state;
  const members: any[] = room.latest?.members ?? [];
  const muted = members.filter((m) => m.mutedAt).length;

  const moderate = async (key: string, payload: Record<string, unknown>) => {
    setBusy(key);
    setActionError(null);
    try {
      await moderateNomineeChatFn({ data: { eventId, ...payload } } as any);
      await room.refresh();
    } catch (e: any) {
      setActionError(e?.message || "That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link to="/admin/events/$eventId/manage" params={{ eventId }} className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-purple-400" /> Nominees' Group Chat
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {room.latest?.event.title ? `${room.latest.event.title}: ` : ""}a shared room for every nominee with portal access. Post announcements, answer concerns, and moderate.
          </p>
        </div>
        <button
          type="button"
          disabled={!state || busy === "lock"}
          onClick={() => moderate("lock", { action: state?.locked ? "unlock" : "lock" })}
          className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg font-medium border transition-all disabled:opacity-50 ${
            state?.locked ? "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20" : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-600"
          }`}
        >
          {state?.locked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {state?.locked ? "Unlock chat" : "Lock chat (organisers only)"}
        </button>
      </div>

      {actionError && <p role="alert" className="text-xs text-red-400">{actionError}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="h-[min(72vh,760px)] min-h-[460px] overflow-hidden rounded-xl border border-zinc-800 bg-[#0a192a]/50">
          <ChatRoom
            messages={room.messages}
            loading={!room.latest}
            error={room.error}
            mine={(m) => m.author.type === "admin"}
            canPost
            onSend={async (body, { announce, image }) => { const fd = new FormData(); fd.append("eventId", eventId); fd.append("body", body); if (announce) fd.append("pin", "true"); if (image) fd.append("image", image); await postAdminNomineeChatFn({ data: fd } as any); await room.refresh(); }}
            canDelete={() => true}
            onDelete={(m) => moderate(`del-${m.id}`, { action: "delete", messageId: m.id })}
            onPin={(m, pinned) => moderate(`pin-${m.id}`, { action: pinned ? "pin" : "unpin", messageId: m.id })}
            onMute={(contestantId) => moderate(`mute-${contestantId}`, { action: "mute", contestantId })}
            announceToggle
            placeholder="Message every nominee as the organiser…"
            emptyText="No messages yet. Post a welcome or an announcement to get things started."
          />
        </div>

        <aside className="rounded-xl border border-zinc-800 bg-[#0a192a]/50">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white"><UsersRound className="h-4 w-4 text-purple-400" /> Members</h2>
            <span className="text-[11px] text-zinc-500">{members.length} nominees{muted ? ` · ${muted} muted` : ""}</span>
          </div>
          {members.length === 0 ? (
            <p className="px-4 py-6 text-xs text-zinc-500">
              No nominees have portal access yet. Invite them from the{" "}
              <Link to="/admin/events/$eventId/contestants" params={{ eventId }} className="text-purple-300 hover:underline">nominee list</Link>.
            </p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-zinc-900 overflow-y-auto">
              {members.map((m) => (
                <li key={m.contestantId} className="flex items-center gap-3 px-4 py-2.5">
                  {m.imageUrl ? <img src={m.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <span className="h-8 w-8 shrink-0 rounded-full bg-zinc-800" />}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-semibold ${m.mutedAt ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{m.name}</p>
                    <p className="truncate text-[11px] text-zinc-500">{m.activatedAt ? m.category : "Invited, not signed in yet"}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy === `mute-${m.contestantId}`}
                    onClick={() => moderate(`mute-${m.contestantId}`, { action: m.mutedAt ? "unmute" : "mute", contestantId: m.contestantId })}
                    title={m.mutedAt ? `Let ${m.name} post again` : `Stop ${m.name} posting`}
                    aria-label={m.mutedAt ? `Unmute ${m.name}` : `Mute ${m.name}`}
                    className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${m.mutedAt ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "text-zinc-500 hover:bg-zinc-800 hover:text-white"}`}
                  >
                    {m.mutedAt ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
