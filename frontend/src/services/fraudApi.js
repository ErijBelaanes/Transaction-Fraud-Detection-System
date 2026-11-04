import { DECISION_THRESHOLD } from '../config';
 
// ─────────────────────────────────────────────────────────
// SERVICE D'ACCÈS AU MODÈLE
// useMock: true  -> scores fictifs (aucun backend nécessaire)
// useMock: false -> appelle le backend FastAPI (uvicorn investigation.main:app --reload)
// ─────────────────────────────────────────────────────────
export const API_CONFIG = {
  useMock: false,
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
};
 
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
 
// Score FICTIF calculé à partir de quelques composantes PCA (mode démo uniquement).
export function simulateScore(features = {}) {
  const g = (k) => Number(features[k] ?? 0);
  const z = -3 + 0.25 * g('V4') + 0.2 * g('V11') - 0.3 * g('V14') - 0.25 * g('V12') - 0.2 * g('V10') - 0.15 * g('V17');
  return Math.round(100 / (1 + Math.exp(-z)));
}
 
function toResult(score, simulated) {
  return {
    score,
    threshold: DECISION_THRESHOLD,
    prediction: score >= DECISION_THRESHOLD ? 'Suspecte' : 'Légitime',
    simulated,
  };
}
 
// Extrait un message lisible d'une réponse d'erreur du backend.
// FastAPI renvoie "detail" soit en texte, soit en liste (erreurs de validation).
export async function readError(response) {
  let message = `Erreur de l’API (${response.status})`;
  try {
    const body = await response.json();
    if (typeof body.detail === 'string') {
      message = body.detail;
    } else if (Array.isArray(body.detail)) {
      const field = (d) => d.loc?.[d.loc.length - 1];
      const missing = body.detail.filter((d) => d.type === 'missing').map(field);
      const others = body.detail.filter((d) => d.type !== 'missing').map((d) => `${field(d)} : ${d.msg}`);
      message = [missing.length ? `Champs manquants : ${missing.join(', ')}` : null, ...others].filter(Boolean).join(' ; ');
    }
  } catch {
    // corps vide ou non JSON : on garde le message par défaut
  }
  return message;
}
 
// Reçoit une transaction, renvoie { score (0-100), threshold (0-100), prediction, simulated }
export async function predictTransaction(tx) {
  if (API_CONFIG.useMock) {
    await wait(600);
    return toResult(tx.score ?? simulateScore(tx.features), true);
  }
 
  // Le backend exige "transaction_id" + Time + Amount + V1…V28, et REFUSE tout autre champ.
  // On construit donc le corps champ par champ (jamais de "...tx.features" aveugle).
  const payload = { transaction_id: tx.id, Time: tx.time, Amount: tx.amount };
  for (let i = 1; i <= 28; i += 1) payload[`V${i}`] = tx.features?.[`V${i}`];
 
  const response = await fetch(`${API_CONFIG.baseUrl}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
 
  // Réponse : { transaction_id, risk_score (0-1), prediction: "FRAUD"|"LEGITIMATE", threshold (0-1) }
  const data = await response.json();
  return {
    score: Math.round(data.risk_score * 100),
    percent: data.risk_score * 100, // valeur exacte (0-100), pour l'affichage
    threshold: Math.round(data.threshold * 100),
    thresholdPercent: data.threshold * 100,
    prediction: data.prediction === 'FRAUD' ? 'Suspecte' : 'Légitime', // verdict du backend, pas recalculé
    simulated: false,
  };
}
 
// Ligne renvoyée par le backend (transaction_id, Time, Amount, V1…V28, + risk_score / actual_class facultatifs)
// -> transaction au format utilisé par l'interface.
// IMPORTANT : "features" ne doit contenir QUE V1…V28 (le backend refuse tout champ en trop).
export function rowToTx({ transaction_id: id, risk_score: riskScore, actual_class: actualClass, Time, Amount, ...features }) {
  return {
    id,
    testIndex: Number(String(id).replace('txn_', '')),
    source: 'api',
    merchant: null,
    location: null,
    category: null,
    amount: Amount,
    time: Time,
    score: riskScore === undefined ? null : Math.round(riskScore * 100),
    percent: riskScore === undefined ? null : riskScore * 100,
    actualClass: actualClass ?? null, // 1 = fraude réelle dans le jeu de test (information de démonstration)
    ageMinutes: null,
    features, // V1…V28
  };
}
 
// Transactions du jeu de test (GET /transactions/samples), dont quelques vraies fraudes
export async function fetchSamples(limit = 20, frauds = 5) {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/transactions/samples?limit=${limit}&frauds=${frauds}`);
    if (!response.ok) throw new Error(await readError(response));
    const rows = await response.json();
    return rows.map(rowToTx);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions :', error);
    throw error;
  }
}
 
// Chiffres réels du tableau de bord (GET /dashboard/summary)
export async function fetchDashboard() {
  try {
    const url = `${API_CONFIG.baseUrl}/dashboard/summary`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(await readError(response));
 
    // Vérifier que FastAPI retourne bien du JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Réponse invalide du serveur. URL appelée : ${url}`);
    }
    const data = await response.json();
    const risk = data.risk_distribution || {};
 
    return {
      threshold: data.threshold,
      totalAnalyzed: data.total_analyzed,
      alertsDetected: data.alerts_detected,
      distribution: [
        { key: 'critique', value: risk.critique ?? 0 },
        { key: 'eleve', value: risk.eleve ?? 0 },
        { key: 'modere', value: risk.modere ?? 0 },
      ],
      volume: (data.volume || []).map((item) => ({ ...item, name: item.label })),
      // rowToTx (et non un simple spread) : les alertes doivent avoir "features" et "testIndex"
      topAlerts: (data.top_alerts || []).map(rowToTx),
      metrics: data.metrics || null,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du tableau de bord :', error);
    throw error;
  }
}