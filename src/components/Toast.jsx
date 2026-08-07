export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
    >
      <div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4 dark:bg-slate-700">
        <span className="text-sm">{toast.message}</span>
        {toast.onAction && (
          <button
            onClick={() => { toast.onAction(); onDismiss(); }}
            className="text-blue-300 font-semibold text-sm shrink-0"
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
