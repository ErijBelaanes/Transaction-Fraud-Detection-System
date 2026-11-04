import { Check, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className={`toast ${isError ? 'error' : ''}`} role="status">
      {isError ? <Info size={18} /> : <Check size={18} />}
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  );
}