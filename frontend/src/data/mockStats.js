// Statistiques globales FICTIVES (agrégats de la journée). Quand tu auras un backend,
// ces valeurs viendront d'une API (ex. GET /stats).
export const BASE_STATS = {
  totalAnalyzed: 12847,
  vsYesterday: 8.2,
  accuracy: 97.8,
  accuracyDelta: 0.4,
};

// Alertes actives par niveau (le total = nombre d'alertes détectées)
export const RISK_DISTRIBUTION = [
  { key: 'critique', value: 18 },
  { key: 'eleve', value: 54 },
  { key: 'modere', value: 72 },
  { key: 'faible', value: 40 },
];

export const ALERT_VOLUME = {
  '7j': {
    label: '7 derniers jours',
    subtitle: 'Évolution sur les 7 derniers jours',
    ticks: [0, 100, 200, 300],
    data: [
      { name: 'Lun', suspectes: 24, legitimes: 126 },
      { name: 'Mar', suspectes: 22, legitimes: 183 },
      { name: 'Mer', suspectes: 20, legitimes: 150 },
      { name: 'Jeu', suspectes: 36, legitimes: 234 },
      { name: 'Ven', suspectes: 24, legitimes: 191 },
      { name: 'Sam', suspectes: 32, legitimes: 263 },
      { name: 'Dim', suspectes: 26, legitimes: 214 },
    ],
  },
  '4s': {
    label: '4 dernières semaines',
    subtitle: 'Évolution sur les 4 dernières semaines',
    ticks: [0, 500, 1000, 1500, 2000],
    data: [
      { name: 'Sem. 1', suspectes: 171, legitimes: 1480 },
      { name: 'Sem. 2', suspectes: 158, legitimes: 1610 },
      { name: 'Sem. 3', suspectes: 192, legitimes: 1520 },
      { name: 'Sem. 4', suspectes: 184, legitimes: 1587 },
    ],
  },
};