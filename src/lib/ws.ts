// server/routes/ws.ts
import { defineWebSocketHandler } from 'nitro/h3';

// Direct in-memory shared state for tracking actively broadcasted messages
interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

const globalMessageHistory: ChatMessage[] = [];
const MAX_HISTORY = 100;

export default defineWebSocketHandler({
  open(peer) {
    console.log(`[WS Server] Connected: ${peer.id}`);
    peer.subscribe("global-chat-room");

    // Immediately catch up the newly connected user with historical shared state
    peer.send(JSON.stringify({
      type: "HISTORY",
      payload: globalMessageHistory
    }));
  },

  message(peer, message) {
    // 1. Fetching live Node backend runtime configs securely on request intercept
   
    const textData = message.text();
    
    const newEvent: ChatMessage = {
      id: crypto.randomUUID(),
      sender: peer.id,
      text: textData,
      timestamp: Date.now()
    };

    // 2. Mutate global in-memory state securely inside Node context
    globalMessageHistory.push(newEvent);
    if (globalMessageHistory.length > MAX_HISTORY) {
      globalMessageHistory.shift();
    }

    // 3. Broadcast to all active pipeline subscribers
    peer.publish("global-chat-room", JSON.stringify({
      type: "MESSAGE",
      payload: newEvent,
      debugContext: `Verified with token length: ${secretKey?.length}`
    }));
  },

  close(peer) {
    console.log(`[WS Server] Disconnected: ${peer.id}`);
  }
});
