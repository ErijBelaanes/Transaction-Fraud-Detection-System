import { useState } from 'react';
import { X } from 'lucide-react';
import { ANALYSTS, CURRENT_ANALYST, DECISION_THRESHOLD, OUTCOMES, RISK_LEVELS, STATUSES, getRiskLevel } from '../config';
import { formatEuro, formatInt } from '../utils/format';

export default function InvestigationModal({ transactions, initialTx, initialResult, onClose, onSubmit }) {
  // Liste des transactions proposées (+ la transaction importée, si elle n'est pas dans la liste)
  const txList = initialTx && !transactions.some((t) => t.id === initialTx.id) ? [initialTx, ...transactions] : transactions;

  const scoreOf = (tx) => {
    if (!tx) return null;
    if (initialTx && tx.id === initialTx.id && initialResult) return initialResult.score;
    return tx.score ?? null;
  };
  const autoTitle = (tx) => `Alerte ${tx.id}${tx.merchant ? ` – ${tx.merchant}` : ''}`;

  const [form, setForm] = useState(() => {
    const tx = initialTx ?? null;
    const score = scoreOf(tx);
    return {
      transactionId: tx ? tx.id : '',
      title: tx ? autoTitle(tx) : '',
      account: '',
      analyst: CURRENT_ANALYST.name,
      priority: score !== null ? getRiskLevel(score).key : 'modere',
      status: 'a_examiner',
      notes: '',
      outcome: '',
      conclusion: '',
    };
  });
  const [titleTouched, setTitleTouched] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedTx = txList.find((t) => t.id === form.transactionId) ?? null;
  const selectedScore = scoreOf(selectedTx);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function handleTxChange(id) {
    const tx = txList.find((t) => t.id === id);
    setForm((f) => ({
      ...f,
      transactionId: id,
      title: tx && !titleTouched ? autoTitle(tx) : f.title,
      priority: tx && scoreOf(tx) !== null ? getRiskLevel(scoreOf(tx)).key : f.priority,
    }));
  }

  function validate() {
    const e = {};
    if (!form.transactionId) e.transactionId = 'Choisissez la transaction concernée.';
    if (form.title.trim().length < 5) e.title = 'Le titre doit contenir au moins 5 caractères.';
    if (form.account && !/^\d{4}$/.test(form.account)) e.account = 'Saisissez exactement les 4 derniers chiffres du compte.';
    if (!form.analyst) e.analyst = 'Désignez un analyste responsable.';
    if (form.status === 'resolu' && !form.outcome) e.outcome = 'Indiquez le résultat de l’investigation.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: form.title.trim(),
      transactionId: selectedTx.id,
      account: form.account,
      txCount: 1,
      amount: selectedTx.amount,
      time: selectedTx.time,
      score: selectedScore,
      prediction: selectedScore === null ? 'Non évaluée' : selectedScore >= DECISION_THRESHOLD ? 'Suspecte' : 'Légitime',
      status: form.status,
      priority: form.priority,
      analyst: form.analyst,
      notes: form.notes.trim(),
      outcome: form.status === 'resolu' ? form.outcome : '',
      conclusion: form.conclusion.trim(),
    });
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <div className="modal-head">
          <div>
            <h2>Nouveau dossier d’investigation</h2>
            <p>Les informations de la transaction sont reprises automatiquement.</p>
          </div>
          <button type="button" className="icon-btn ghost" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label htmlFor="m-tx">Transaction *</label>
            <select id="m-tx" className={`input ${errors.transactionId ? 'error' : ''}`} value={form.transactionId} onChange={(e) => handleTxChange(e.target.value)}>
              <option value="">— Choisir une transaction —</option>
              {txList.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  {tx.id} · {tx.merchant ?? 'Transaction importée'} · {formatEuro(tx.amount)}
                </option>
              ))}
            </select>
            {errors.transactionId && <p className="error-text">{errors.transactionId}</p>}
          </div>

          {selectedTx && (
            <div className="summary-box">
              <div><span>Montant</span><strong>{formatEuro(selectedTx.amount)}</strong></div>
              <div><span>Heure (s)</span><strong>{formatInt(selectedTx.time)}</strong></div>
              <div><span>Score (fictif)</span><strong>{selectedScore !== null ? `${selectedScore} /100` : '—'}</strong></div>
              <div>
                <span>Prédiction</span>
                <strong>{selectedScore === null ? 'Non évaluée' : selectedScore >= DECISION_THRESHOLD ? 'Suspecte' : 'Légitime'}</strong>
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="m-title">Titre du dossier *</label>
            <input
              id="m-title"
              className={`input ${errors.title ? 'error' : ''}`}
              value={form.title}
              onChange={(e) => {
                setTitleTouched(true);
                set('title', e.target.value);
              }}
              placeholder="Ex. Achats internationaux inhabituels"
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="m-account">4 derniers chiffres du compte</label>
              <input
                id="m-account"
                className={`input ${errors.account ? 'error' : ''}`}
                value={form.account}
                maxLength={4}
                inputMode="numeric"
                onChange={(e) => set('account', e.target.value.replace(/\D/g, ''))}
                placeholder="4821"
              />
              {errors.account && <p className="error-text">{errors.account}</p>}
            </div>
            <div className="field">
              <label htmlFor="m-analyst">Analyste responsable *</label>
              <select id="m-analyst" className={`input ${errors.analyst ? 'error' : ''}`} value={form.analyst} onChange={(e) => set('analyst', e.target.value)}>
                {ANALYSTS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              {errors.analyst && <p className="error-text">{errors.analyst}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="m-priority">Priorité</label>
              <select id="m-priority" className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {RISK_LEVELS.map((l) => (
                  <option key={l.key} value={l.key}>{l.labelF}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="m-status">Statut</label>
              <select id="m-status" className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="m-notes">Notes de l’analyste</label>
            <textarea id="m-notes" className="input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observations, démarches effectuées…" />
          </div>

          {form.status === 'resolu' && (
            <>
              <div className="field">
                <label htmlFor="m-outcome">Résultat de l’investigation *</label>
                <select id="m-outcome" className={`input ${errors.outcome ? 'error' : ''}`} value={form.outcome} onChange={(e) => set('outcome', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {OUTCOMES.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                {errors.outcome && <p className="error-text">{errors.outcome}</p>}
              </div>
              <div className="field">
                <label htmlFor="m-conclusion">Conclusion</label>
                <textarea id="m-conclusion" className="input" rows={2} value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Créer le dossier</button>
        </div>
      </form>
    </div>
  );
}