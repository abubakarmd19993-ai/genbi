import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { loadConversations, saveConversations, loadCurrentId, saveCurrentId } from "../utils/storage";
import { generateTitle } from "../utils/titleGenerator";
import { generateId, generateMessageId } from "../utils/idGenerator";

const API = "http://127.0.0.1:8000";

const ConversationContext = createContext();

export function ConversationProvider({ children }) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState(() => loadConversations());
  const [currentConversationId, setCurrentConversationId] = useState(() => loadCurrentId());
  const [loading, setLoading] = useState(false);
  const [pendingFileId, setPendingFileId] = useState("");
  const streamTimers = useRef({});

  // Persist conversations any time they change
  useEffect(() => {
    const ok = saveConversations(conversations);
    if (!ok) showToast("Couldn't save chat history locally.", "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    saveCurrentId(currentConversationId);
  }, [currentConversationId]);

  const headers = { Authorization: `Bearer ${token}` };

  const getConversation = useCallback(
    (id) => conversations.find((c) => c.id === id),
    [conversations]
  );

  const updateConversation = useCallback((id, updater) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...updater(c), updatedAt: Date.now() } : c))
    );
  }, []);

  // Reveals assistant text word-by-word, simulating streaming
  const streamAnswer = (conversationId, messageId, fullText) => {
    const words = fullText.split(" ");
    let i = 0;
    clearInterval(streamTimers.current[conversationId]);
    streamTimers.current[conversationId] = setInterval(() => {
      i++;
      const partial = words.slice(0, i).join(" ");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, content: partial, streaming: i < words.length } : m
                ),
                updatedAt: Date.now(),
              }
            : c
        )
      );
      if (i >= words.length) clearInterval(streamTimers.current[conversationId]);
    }, 35);
  };

  const askBackend = async (conversationId, question, fileId) => {
    setLoading(true);
    const assistantId = generateMessageId();

    updateConversation(conversationId, (c) => ({
      ...c,
      messages: [...c.messages, { id: assistantId, role: "assistant", content: "", pending: true, timestamp: Date.now() }],
    }));

    try {
      const res = await axios.post(`${API}/query`, { question, file_id: fileId }, { headers });
      const answer = res.data.answer || "";
      updateConversation(conversationId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === assistantId ? { ...m, pending: false, streaming: true } : m)),
      }));
      streamAnswer(conversationId, assistantId, answer);
    } catch {
      updateConversation(conversationId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? { ...m, pending: false, streaming: false, content: "Sorry, something went wrong. Please try again." }
            : m
        ),
      }));
      showToast("Something went wrong getting a response.", "error");
    }
    setLoading(false);
  };

  // Creates a brand new conversation starting with the user's first message
  const createConversation = useCallback((firstMessage, fileId) => {
    const id = generateId();
    const now = Date.now();
    const userMsg = { id: generateMessageId(), role: "user", content: firstMessage, timestamp: now };
    const newConv = {
      id,
      title: "New Chat",
      createdAt: now,
      updatedAt: now,
      fileId: fileId || "",
      messages: [userMsg],
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(id);

    // Auto-generate the title from the first message
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: generateTitle(firstMessage) } : c)));

    askBackend(id, firstMessage, fileId);
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sends a follow-up message inside an existing conversation
  const sendMessage = useCallback(
    (conversationId, text, fileId) => {
      const now = Date.now();
      const userMsg = { id: generateMessageId(), role: "user", content: text, timestamp: now };
      updateConversation(conversationId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg],
        fileId: fileId || c.fileId,
      }));
      askBackend(conversationId, text, fileId || getConversation(conversationId)?.fileId);
    },
    [updateConversation, getConversation]
  );

  const deleteConversation = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setCurrentConversationId((prev) => (prev === id ? null : prev));
  }, []);

  const renameConversation = useCallback(
    (id, title) => {
      updateConversation(id, (c) => ({ ...c, title: title.slice(0, 30) }));
    },
    [updateConversation]
  );

  const selectConversation = useCallback((id) => {
    setCurrentConversationId(id);
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        loading,
        pendingFileId,
        setPendingFileId,
        getConversation,
        createConversation,
        sendMessage,
        deleteConversation,
        renameConversation,
        selectConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  return useContext(ConversationContext);
}