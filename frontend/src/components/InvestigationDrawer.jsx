import { useState } from 'react';
import { X } from 'lucide-react';
import { ANALYSTS, OUTCOMES, RISK_LEVELS, STATUSES, getRiskByKey } from '../config';
import { formatDateTime, formatEuro, formatInt, formatPercent } from '../utils/format';
import StatusBadge from './StatusBadge';
 
export default function InvestigationDrawer({ investigation: inv, startEditing, closing, onClose, onSave, onDelete }) {
  const initialForm = {
    status: closing ? 'resolu' : inv.status,
    priority: inv.priority,
    analyst: inv.analyst,
    notes: inv.notes || '',
    outcome: inv.outcome || '',
    conclusion: inv.conclusion || '',
  };
  const [editing, setEditing] = useState(Boolean(startEditing || closing));
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
 
  // onSave renvoie true si l'enregistrement a réussi (mode API : appel au backend)
  async function handleSave() {
    const next = {};
    if (form.status === 'resolu' && !form.outcome) {
      next.outcome = 'Choisissez le résultat de l’investigation pour résoudre le dossier.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const ok = await onSave(inv.id, { ...form, outcome: form.status === 'resolu' ? form.outcome : '' });
    if (ok) setEditing(false);
  }
 
  function handleCancel() {
    setForm({ ...initialForm, status: inv.status });
    setErrors({});
    setEditing(false);
  }
 
  const outcomeLabel = OUTCOMES.find((o) => o.key === inv.outcome)?.label;
  const predictionClass = inv.prediction === 'Suspecte' ? 'pred-susp' : 'pred-ok';
 
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{inv.title}</h2>
            <p>{inv.id}</p>
          </div>
          <button type="button" className="icon-btn ghost" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
 
        <div className="modal-body">
          <div className="info-grid">
            <div><span>Transaction</span><strong>{inv.transactionId}</strong></div>
            <div><span>Montant</span><strong>{inv.amount != null ? formatEuro(inv.amount) : '—'}</strong></div>
            <div><span>Heure (secondes)</span><strong>{inv.time != null ? formatInt(inv.time) : '—'}</strong></div>
            <div><span>Compte</span><strong>{inv.account ? `•••• ${inv.account}` : '—'}</strong></div>
            <div><span>Score du modèle</span><strong>{inv.score !== null && inv.score !== undefined ? `${formatPercent(inv.score)} %` : '—'}</strong></div>
            <div><span>Prédiction du modèle</span><strong><span className={`badge ${predictionClass}`}>{inv.prediction}</span></strong></div>
            <div><span>Créé le</span><strong>{formatDateTime(inv.createdAt)}</strong></div>
            <div><span>Dernière modification</span><strong>{formatDateTime(inv.updatedAt)}</strong></div>
          </div>
 
          <p className="hint">
            La prédiction du modèle n’est pas le résultat de l’investigation : seul l’analyste confirme ou infirme la fraude.
          </p>
 
          {!editing ? (
            <>
              <div className="info-grid">
                <div><span>Statut</span><strong><StatusBadge status={inv.status} /></strong></div>
                <div><span>Priorité</span><strong>{getRiskByKey(inv.priority).labelF}</strong></div>
                <div><span>Analyste</span><strong>{inv.analyst || '—'}</strong></div>
                <div><span>Résultat</span><strong>{outcomeLabel ?? '—'}</strong></div>
              </div>
              <div className="drawer-section">
                <h3>Notes de l’analyste</h3>
                <p>{inv.notes || 'Aucune note pour le moment.'}</p>
              </div>
              <div className="drawer-section">
                <h3>Conclusion</h3>
                <p>{inv.conclusion || 'Aucune conclusion saisie.'}</p>
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="d-status">Statut</label>
                  <select id="d-status" className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="d-priority">Priorité</label>
                  <select id="d-priority" className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                    {RISK_LEVELS.map((l) => (
                      <option key={l.key} value={l.key}>{l.labelF}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="d-analyst">Analyste responsable</label>
                <select id="d-analyst" className="input" value={form.analyst} onChange={(e) => set('analyst', e.target.value)}>
                  {ANALYSTS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="d-notes">Notes de l’analyste</label>
                <textarea id="d-notes" className="input" rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
              {form.status === 'resolu' && (
                <div className="field">
                  <label htmlFor="d-outcome">Résultat de l’investigation *</label>
                  <select id="d-outcome" className={`input ${errors.outcome ? 'error' : ''}`} value={form.outcome} onChange={(e) => set('outcome', e.target.value)}>
                    <option value="">— Choisir —</option>
                    {OUTCOMES.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                  {errors.outcome && <p className="error-text">{errors.outcome}</p>}
                </div>
              )}
              <div className="field">
                <label htmlFor="d-conclusion">Conclusion</label>
                <textarea id="d-conclusion" className="input" rows={3} value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} />
              </div>
            </>
          )}
        </div>
 
        <div className="modal-foot spread">
          <button type="button" className="btn btn-danger" onClick={() => onDelete(inv)}>Supprimer</button>
          <div className="foot-actions">
            {editing ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>Annuler</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
              </>
            ) : (
              <>
                {inv.status !== 'resolu' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      set('status', 'resolu');
                      setEditing(true);
                    }}
                  >
                    Clôturer le dossier
                  </button>
                )}
                {/* Un dossier résolu est verrouillé (le backend refuse de le modifier) */}
                {inv.status !== 'resolu' && (
                  <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>Modifier</button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
 