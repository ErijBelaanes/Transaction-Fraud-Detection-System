const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const integer = new Intl.NumberFormat('fr-FR');
const amountInput = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatEuro = (n) => euro.format(n);
export const formatInt = (n) => integer.format(n);
export const formatAmountInput = (n) => amountInput.format(n);
export const formatNumber = (n, digits = 1) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

// Pourcentage (0 à 100) sans arrondi trompeur : « 99,63 » plutôt que « 100 ».
// Un score très proche de 100 s'affiche « > 99,99 », très proche de 0 « < 0,01 ».
export function formatPercent(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const step = 10 ** -digits;
  if (value < 100 && value >= 100 - step / 2) return `> ${formatNumber(100 - step, digits)}`;
  if (value > 0 && value < step / 2) return `< ${formatNumber(step, digits)}`;
  return formatNumber(value, digits);
}
export function formatAgo(minutes) {
  if (minutes === null || minutes === undefined) return '';
  if (minutes < 60) return `Il y a ${minutes} min`;
  return `Il y a ${Math.floor(minutes / 60)} h`;
}

export function formatActivity(iso) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  const hm = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Aujourd’hui, ${hm}`;
  if (diffDays === 1) return `Hier, ${hm}`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}