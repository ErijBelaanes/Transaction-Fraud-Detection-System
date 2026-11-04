// Transactions fictives. "features" = quelques composantes PCA anonymisées (V1…V28).
// "score" = probabilité de fraude FICTIVE (0-100).
export const mockTransactions = [
  { id: 'TRX-8A42F1', testIndex: 20117, merchant: 'Nova Digital Services', location: 'Singapour', category: 'Services numériques', amount: 8420, time: 61240, score: 96, ageMinutes: 4, features: { V14: -9.1, V4: 5.6, V12: -8.2, V10: -6.9 } },
  { id: 'TRX-6B19D4', testIndex: 20093, merchant: 'Atlas Travel Group', location: 'Dubaï', category: 'Agence de voyage', amount: 4890.5, time: 60712, score: 87, ageMinutes: 12, features: { V14: -6.4, V4: 4.1, V12: -5.2, V10: -4.3 } },
  { id: 'TRX-4C77E2', testIndex: 20041, merchant: 'MarketPlace EU', location: 'Paris', category: 'Commerce en ligne', amount: 1240, time: 59986, score: 72, ageMinutes: 28, features: { V14: -4.2, V4: 3.0, V12: -3.6, V10: -2.8 } },
  { id: 'TRX-2F31A8', testIndex: 19988, merchant: 'Le Jardin Café', location: 'Lyon', category: 'Restauration', amount: 86.4, time: 59210, score: 18, ageMinutes: 41, features: { V14: 0.4, V4: -0.8, V12: 0.6, V10: 0.2 } },
  { id: 'TRX-9D1E05', testIndex: 18432, merchant: 'Electro Premium Online', location: 'Bucarest', category: 'Électronique', amount: 1249, time: 52318, score: 93, ageMinutes: 185, features: { V14: -7.3, V4: 4.8, V12: -6.1, V10: -5.2 } },
  { id: 'TRX-7E20B3', testIndex: 19954, merchant: 'Station Nord Énergie', location: 'Lille', category: 'Carburant', amount: 64.2, time: 58420, score: 6, ageMinutes: 55, features: { V14: 0.9, V4: -0.3, V12: 0.8, V10: 0.5 } },
  { id: 'TRX-5A9C14', testIndex: 19902, merchant: 'CryptoSwap Ltd', location: 'Malte', category: 'Crypto-actifs', amount: 3150, time: 57740, score: 91, ageMinutes: 75, features: { V14: -6.8, V4: 4.4, V12: -5.9, V10: -4.8 } },
  { id: 'TRX-3D8F62', testIndex: 19871, merchant: 'Boulangerie Martin', location: 'Toulouse', category: 'Alimentation', amount: 12.8, time: 57015, score: 3, ageMinutes: 92, features: { V14: 0.2, V4: -0.1, V12: 0.3, V10: 0.1 } },
  { id: 'TRX-1B6A77', testIndex: 19820, merchant: 'Skyline Hotels', location: 'Istanbul', category: 'Hôtellerie', amount: 2260, time: 56380, score: 64, ageMinutes: 110, features: { V14: -3.9, V4: 2.7, V12: -3.1, V10: -2.4 } },
  { id: 'TRX-0C4E39', testIndex: 19777, merchant: 'Pharmacie du Centre', location: 'Nantes', category: 'Santé', amount: 38.9, time: 55790, score: 9, ageMinutes: 130, features: { V14: 0.6, V4: -0.5, V12: 0.4, V10: 0.3 } },
  { id: 'TRX-A1F5D8', testIndex: 19730, merchant: 'Gift&Win Online', location: 'Chypre', category: 'Jeux en ligne', amount: 520, time: 55102, score: 55, ageMinutes: 150, features: { V14: -2.8, V4: 2.2, V12: -2.1, V10: -1.7 } },
  { id: 'TRX-B7C2E4', testIndex: 19684, merchant: 'Maison & Co', location: 'Marseille', category: 'Ameublement', amount: 349, time: 54450, score: 34, ageMinutes: 210, features: { V14: -1.6, V4: 1.4, V12: -1.2, V10: -0.9 } },
  { id: 'TRX-C93D10', testIndex: 19640, merchant: 'Quick Transfer SA', location: 'Lagos', category: 'Transfert d’argent', amount: 5600, time: 53870, score: 97, ageMinutes: 240, features: { V14: -9.8, V4: 6.0, V12: -8.7, V10: -7.4 } },
];

export function getTransactionById(id) {
  return mockTransactions.find((t) => t.id === id) ?? null;
}