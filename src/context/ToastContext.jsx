import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const getToastStyles = (type) => {
    switch (type) {
      case "success": return "bg-green-500/20 border-green-500/50 text-green-400";
      case "error": return "bg-red-500/20 border-red-500/50 text-red-400";
      case "warning": return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400";
      default: return "bg-blue-500/20 border-blue-500/50 text-blue-400";
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "warning": return "⚠️";
      default: return "ℹ️";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg min-w-[280px] max-w-[380px] animate-pulse ${getToastStyles(toast.type)}`}
            style={{
              animation: "slideIn 0.3s ease-out"
            }}
          >
            <span>{getToastIcon(toast.type)}</span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}