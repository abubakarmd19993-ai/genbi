const CONVERSATIONS_KEY = "genbi_conversations";
const CURRENT_ID_KEY = "genbi_current_conversation";

export function loadConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations) {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    return true;
  } catch {
    return false;
  }
}

export function loadCurrentId() {
  try {
    return localStorage.getItem(CURRENT_ID_KEY) || null;
  } catch {
    return null;
  }
}

export function saveCurrentId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_ID_KEY, id);
    else localStorage.removeItem(CURRENT_ID_KEY);
    return true;
  } catch {
    return false;
  }
}