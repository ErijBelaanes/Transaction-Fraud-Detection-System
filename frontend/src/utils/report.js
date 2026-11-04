import { formatAmountInput, formatInt } from './format';
import { getRiskLevel } from '../config';

// Télécharge un rapport texte de l'analyse
export function downloadReport(tx, result) {
  const level = getRiskLevel(result.score);
  const lines = [
    'TransactionGuard AI – Rapport d’analyse',
    '========================================',
    result.simulated
      ? 'ATTENTION : score et prédiction FICTIFS (modèle non connecté).'
      : 'Score produit par le modèle connecté.',
    '',
    `Transaction : ${tx.id}`,
    `Montant : ${formatAmountInput(tx.amount)} €`,
    `Heure (secondes) : ${formatInt(tx.time)}`,
    tx.merchant ? `Marchand : ${tx.merchant} (${tx.location}, ${tx.category})` : null,
    '',
    `Prédiction : ${result.prediction}`,
    `Probabilité de fraude : ${result.score} %`,
    `Seuil de décision : ${result.threshold} %`,
    `Niveau de risque : ${level.label}`,
    '',
    `Généré le ${new Date().toLocaleString('fr-FR')}`,
  ].filter((l) => l !== null);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport-${tx.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}