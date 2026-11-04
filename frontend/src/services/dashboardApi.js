import { API_CONFIG, readError, rowToTx } from './fraudApi';
 
// Chiffres réels du tableau de bord (GET /dashboard/summary), calculés par le backend
// sur le jeu de test avec le modèle chargé.
export async function fetchDashboard() {
  const response = await fetch(`${API_CONFIG.baseUrl}/dashboard/summary`);
  if (!response.ok) throw new Error(await readError(response));
  const d = await response.json();
 
  return {
    threshold: d.threshold,
    totalAnalyzed: d.total_analyzed,
    alertsDetected: d.alerts_detected,
    distribution: [
      { key: 'critique', value: d.risk_distribution.critique },
      { key: 'eleve', value: d.risk_distribution.eleve },
      { key: 'modere', value: d.risk_distribution.modere },
    ],
    volume: d.volume.map((v) => ({
      name: v.label,
      critique: v.critique,
      eleve: v.eleve,
      modere: v.modere,
    })),
    topAlerts: d.top_alerts.map(rowToTx),
    metrics: d.metrics, // { frauds, detected, recall, precision, average_precision } ou null
  };
}