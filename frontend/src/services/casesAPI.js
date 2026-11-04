import { API_CONFIG, readError } from './fraudApi';
 
// ─────────────────────────────────────────────────────────
// Dossiers d'investigation : traduction entre l'interface (français)
// et le backend (vocabulaire anglais, scores entre 0 et 1).
// ─────────────────────────────────────────────────────────
const STATUS = { a_examiner: 'NEW', en_investigation: 'UNDER_INVESTIGATION', resolu: 'CLOSED' };
const OUTCOME = { fraude_confirmee: 'CONFIRMED_FRAUD', legitime: 'LEGITIMATE', non_determine: 'INCONCLUSIVE' };
const PRIORITY = { critique: 'CRITICAL', eleve: 'HIGH', modere: 'MODERATE', faible: 'LOW' };
const PREDICTION = { Suspecte: 'FRAUD', 'Légitime': 'LEGITIMATE' };
 
const invert = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
const STATUS_BACK = invert(STATUS);
const OUTCOME_BACK = invert(OUTCOME);
const PRIORITY_BACK = invert(PRIORITY);
const PREDICTION_BACK = invert(PREDICTION);
 
// Backend -> format utilisé par les composants.
// "id" reste la référence affichée (INV-2026-042) ; "apiId" est l'identifiant numérique de la base.
export function fromApi(c) {
  const year = new Date(c.created_at).getFullYear();
  return {
    id: `INV-${year}-${String(c.id).padStart(3, '0')}`,
    apiId: c.id,
    title: c.title,
    transactionId: c.transaction_id,
    account: c.account ?? '',
    txCount: c.tx_count,
    amount: c.amount,
    time: c.time,
    score: c.risk_score === null ? null : c.risk_score * 100, // valeur exacte (0-100)
    prediction: c.prediction ? PREDICTION_BACK[c.prediction] : 'Non évaluée',
    status: STATUS_BACK[c.status],
    priority: PRIORITY_BACK[c.priority],
    analyst: c.analyst ?? '',
    notes: c.notes ?? '',
    outcome: c.decision ? OUTCOME_BACK[c.decision] : '',
    conclusion: c.conclusion ?? '',
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}
 
// Valeurs du formulaire "Nouveau dossier" -> corps du POST /cases
export function toApiCreate(v) {
  return {
    transaction_id: v.transactionId,
    title: v.title,
    account: v.account || null,
    tx_count: v.txCount ?? 1,
    amount: v.amount,
    time: v.time,
    risk_score: v.score === null || v.score === undefined ? null : Math.min(1, v.score / 100),
    prediction: PREDICTION[v.prediction] ?? null,
    status: STATUS[v.status],
    priority: PRIORITY[v.priority],
    analyst: v.analyst || null,
    notes: v.notes || null,
    decision: v.outcome ? OUTCOME[v.outcome] : null,
    conclusion: v.conclusion || null,
  };
}
 
// Modifications du panneau latéral -> corps du PATCH /cases/{id} (seuls les champs fournis)
export function toApiUpdate(c) {
  const body = {};
  if (c.status !== undefined) body.status = STATUS[c.status];
  if (c.priority !== undefined) body.priority = PRIORITY[c.priority];
  if (c.analyst !== undefined) body.analyst = c.analyst || null;
  if (c.notes !== undefined) body.notes = c.notes || null;
  if (c.outcome !== undefined) body.decision = c.outcome ? OUTCOME[c.outcome] : null;
  if (c.conclusion !== undefined) body.conclusion = c.conclusion || null;
  return body;
}
 
async function request(path, options = {}) {
  const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.status === 204 ? null : response.json();
}
 
export async function listCases() {
  const data = await request('/cases?limit=500'); // le backend doit accepter limit jusqu'à 500
  return data.map(fromApi);
}
 
export async function createCase(values) {
  const data = await request('/cases', { method: 'POST', body: JSON.stringify(toApiCreate(values)) });
  return fromApi(data);
}
 
export async function updateCase(apiId, changes) {
  const data = await request(`/cases/${apiId}`, { method: 'PATCH', body: JSON.stringify(toApiUpdate(changes)) });
  return fromApi(data);
}
 
export async function deleteCase(apiId) {
  await request(`/cases/${apiId}`, { method: 'DELETE' });
}