import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">🔮💨</div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Conversation not found</h2>
      <p className="text-[var(--text-secondary)] mb-6">This chat may have been deleted, or the link is incorrect.</p>
      <button
        onClick={() => navigate("/")}
        className="bg-[#f78166] hover:bg-[#e06b52] text-white text-sm font-medium px-6 py-2 rounded-xl transition-all"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}