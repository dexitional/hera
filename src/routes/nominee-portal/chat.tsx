import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessagesSquare } from "lucide-react";
import { getNomineeMeFn } from "#/server/nominee-portal";
import { deleteOwnNomineeChatFn, getNomineeChatFn, postNomineeChatFn } from "#/server/nominee-chat";
import { ChatRoom } from "#/components/chat/ChatRoom";
import { useChatRoom } from "#/components/chat/useChatRoom";
import { PANEL } from "#/components/nominee/NomineeDashboard";
import { chatSeenKey } from "#/components/nominee/ChatSummaryCard";

export const Route = createFileRoute("/nominee-portal/chat")({
  loader: async () => {
    const me = await getNomineeMeFn();
    if (!me) throw redirect({ to: "/nominee-portal", search: { code: undefined } });
    if (!me.activated) throw redirect({ to: "/nominee-portal/profile" });
    return { me };
  },
  head: () => ({ meta: [{ title: "Nominee Chat | Heravote" }, { name: "robots", content: "noindex" }] }),
  component: NomineeChat,
});

function NomineeChat() {
  const { me } = Route.useLoaderData();
  const room = useChatRoom((since) => getNomineeChatFn({ data: { since } } as any) as Promise<any>);
  const state = room.latest?.state;
  const myId = me.contestant.id;

  // Remember the newest message seen, for the unread badge on the portal home.
  const newest = room.messages[room.messages.length - 1]?.createdAt;
  useEffect(() => {
    if (!newest) return;
    try { localStorage.setItem(chatSeenKey(myId), newest); } catch { /* private mode */ }
  }, [newest, myId]);

  return (
    <div className="mx-auto w-full max-w-4xl">
        <section className="w-full pb-5">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
            <MessagesSquare className="h-7 w-7 text-purple-300" /> Nominees' chat
          </h1>
          <p className="mt-1 text-zinc-300">
            {me.event.title}: every nominee in this event and the organisers. Be respectful; organisers moderate this chat.
          </p>
        </section>

        <div className={`${PANEL} h-[calc(100dvh-15rem)] min-h-[420px] overflow-hidden md:h-[min(72vh,760px)]`}>
          <ChatRoom
            messages={room.messages}
            loading={!room.latest}
            error={room.error}
            mine={(m) => m.author.type === "nominee" && m.author.contestantId === myId}
            canPost={Boolean(state) && !state.locked && !state.muted}
            blockedReason={
              !state ? "Connecting…" : state.locked ? "The organiser has locked this chat. Only organisers can post right now." : "The organiser has paused your messages in this chat."
            }
            onSend={async (body, { image }) => { const fd = new FormData(); fd.append("body", body); if (image) fd.append("image", image); await postNomineeChatFn({ data: fd } as any); await room.refresh(); }}
            canDelete={(m) => m.author.type === "nominee" && m.author.contestantId === myId}
            onDelete={async (m) => { await deleteOwnNomineeChatFn({ data: { id: m.id } } as any); await room.refresh(); }}
            placeholder="Message all nominees…"
            emptyText="No messages yet. Start the conversation: share an idea, ask a question or raise a concern."
          />
        </div>
    </div>
  );
}
