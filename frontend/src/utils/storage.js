import { buildSeedInvestigations } from '../data/mockInvestigations';

const KEY = 'transactionguard.investigations.v1';

// Charge les dossiers depuis localStorage (ou crée les dossiers de démonstration)
export function loadInvestigations() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('Lecture du localStorage impossible :', error);
  }
  return buildSeedInvestigations();
}

export function saveInvestigations(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('Écriture du localStorage impossible :', error);
  }
}

export function resetInvestigations() {
  try {
    localStorage.removeItem(KEY);
  } catch (error) {
    console.warn(error);
  }
  return buildSeedInvestigations();
}

// Génère le prochain identifiant : INV-2026-043, INV-2026-044…
export function generateInvestigationId(list) {
  const year = new Date().getFullYear();
  const max = list.reduce((m, inv) => {
    const n = parseInt(String(inv.id).split('-')[2], 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `INV-${year}-${String(max + 1).padStart(3, '0')}`;
}