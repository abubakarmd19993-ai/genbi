export function generateTitle(text) {
  if (!text) return "New Chat";
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 30) return cleaned;
  return cleaned.slice(0, 30).trim() + "...";
}