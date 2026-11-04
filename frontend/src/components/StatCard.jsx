export default function StatCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon tone-${tone}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}