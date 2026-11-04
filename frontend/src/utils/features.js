const V_KEYS = Array.from({ length: 28 }, (_, i) => `V${i + 1}`);

// Toutes les variables V1…V28 disponibles pour une transaction, de la plus marquée (plus grande valeur absolue) à la moins marquée.
// ATTENTION : ce n'est pas une explication réelle du modèle (type SHAP), juste un aperçu.
export function getAllFeatures(tx) {
  if (!tx || !tx.features) return [];
  return V_KEYS.filter((k) => typeof tx.features[k] === 'number' && !Number.isNaN(tx.features[k]))
    .map((k) => ({ name: k, value: tx.features[k] }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}
// Obtenir les "n" variables les plus marquées
export function getTopFeatures(tx, n = 4) {
  return getAllFeatures(tx).slice(0, n);
}