import { rtdb } from "./firebase";
import { 
  ref, 
  push, 
  set,
  onValue, 
  off, 
  serverTimestamp,
  query,
  limitToLast,
  orderByChild,
  onDisconnect
} from "firebase/database";

export interface ChatMessage {
  id?: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: any;
}

export const messagingService = {
  getMessagesRef(squadId: string) {
    return ref(rtdb, `messages/${squadId}`);
  },

  async sendMessage(squadId: string, userId: string, userName: string, content: string) {
    try {
    const messagesRef = this.getMessagesRef(squadId);
    await push(messagesRef, {
      userId,
      userName,
      content,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Send message error:", err);
  }
  },

  subscribeToMessages(squadId: string, callback: (messages: ChatMessage[]) => void) {
    try {
      const messagesRef = query(this.getMessagesRef(squadId), limitToLast(100));
      const listener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          callback([]);
          return;
        }

        const messages = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        })) as ChatMessage[];
        
        callback(messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
      });

      return () => off(this.getMessagesRef(squadId), "value", listener);
    } catch (err) {
      console.error("Subscribe to messages error:", err);
      return () => {};
    }
  },

  async updatePresence(squadId: string, userId: string, userName: string) {
    const presenceRef = ref(rtdb, `presence/${squadId}/${userId}`);
    try {
      await set(presenceRef, {
        userName,
        status: "online",
        lastActive: serverTimestamp()
      });
      await onDisconnect(presenceRef).remove();
    } catch (err) {
      console.error("Update presence error:", err);
    }
  },

  subscribeToPresence(squadId: string, callback: (users: any[]) => void) {
    const squadPresenceRef = ref(rtdb, `presence/${squadId}`);
    const listener = onValue(squadPresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      const users = Object.entries(data).map(([userId, val]: [string, any]) => ({
        userId,
        ...val
      }));
      callback(users);
    });
    return () => off(squadPresenceRef, "value", listener);
  }
};
