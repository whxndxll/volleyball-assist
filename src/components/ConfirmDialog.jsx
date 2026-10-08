import { cn } from '../lib/utils';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'neutral',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{description}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'py-2.5 rounded-xl font-bold text-white transition-colors',
              tone === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}