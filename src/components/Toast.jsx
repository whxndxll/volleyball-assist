import { X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md flex flex-col gap-2"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center justify-between gap-2 rounded-xl bg-slate-800 px-4 py-3 shadow-lg dark:bg-slate-700"
        >
          <span className="text-sm">{toast.message}</span>
          <span className="flex items-center gap-2 shrink-0">
            {toast.onAction && (
              <button
                onClick={() => { toast.onAction(); onDismiss(toast.id); }}
                className="text-blue-300 font-semibold text-sm"
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Fechar aviso"
            >
              <X size={16} />
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}