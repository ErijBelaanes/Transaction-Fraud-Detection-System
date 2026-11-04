// ─────────────────────────────────────────────
// Configuration centrale de l'application
// ─────────────────────────────────────────────
 
// Seuil de décision du modèle (en %). Au-dessus : "Suspecte".
// À REMPLACER par le seuil d'XGBoost (models/threshold.pkl) x 100, arrondi.
// Pour le calculer, depuis la racine du projet :
//   python -c "import joblib; print(round(joblib.load('models/threshold.pkl')*100))"
// (Utilisé pour les niveaux de risque et en mode démo. En mode API, le verdict vient du backend.)
export const DECISION_THRESHOLD = 31;
 
// Niveaux de risque (du plus grave au plus faible). "min" = score minimum (0-100).
export const RISK_LEVELS = [
  { key: 'critique', min: 95, label: 'Critique', labelF: 'Critique', color: '#d9475d' },
  { key: 'eleve', min: 60, label: 'Élevé', labelF: 'Élevée', color: '#ee9b3b' },
  { key: 'modere', min: DECISION_THRESHOLD, label: 'Modéré', labelF: 'Modérée', color: '#e9c84f' },
  { key: 'faible', min: 0, label: 'Faible', labelF: 'Faible', color: '#5fae93' },
];
 
export function getRiskLevel(score) {
  if (score === null || score === undefined) return RISK_LEVELS[RISK_LEVELS.length - 1];
  return RISK_LEVELS.find((l) => score >= l.min) ?? RISK_LEVELS[RISK_LEVELS.length - 1];
}
 
export function getRiskByKey(key) {
  return RISK_LEVELS.find((l) => l.key === key) ?? RISK_LEVELS[RISK_LEVELS.length - 1];
}
 
// Statuts d'un dossier (progression du travail de l'analyste)
export const STATUSES = [
  { key: 'a_examiner', label: 'À examiner' },
  { key: 'en_investigation', label: 'En investigation' },
  { key: 'resolu', label: 'Résolu' },
];
 
// Résultat de l'investigation (différent de la prédiction du modèle !)
export const OUTCOMES = [
  { key: 'fraude_confirmee', label: 'Fraude confirmée' },
  { key: 'legitime', label: 'Transaction légitime' },
  { key: 'non_determine', label: 'Non déterminé' },
];
 
export const ANALYSTS = ['Sophie Martin', 'Marc Leroy', 'Nadia Benali', 'Julien Perrin'];
export const CURRENT_ANALYST = { name: 'Sophie Martin', role: 'Analyste fraude' };
 
// Carte "modèle" de la barre latérale.
// Passe "connected" à true quand useMock vaut false dans services/fraudApi.js.
export const MODEL_INFO = {
  name: 'XGBoost',
  connected: true,
  updatedLabel: 'Modèle chargé depuis le backend',
};
