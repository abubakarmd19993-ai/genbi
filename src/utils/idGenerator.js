export function generateId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}