export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div
      className="bg-[#1e1c4f]/40 border-l-4 border-l-[#31c2d5]
      rounded-xl p-4 shadow-md"
    >
      <div className="flex items-center gap-2 text-sm text-gray-300">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>

      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
