import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className="bg-[white]/10 rounded-xl p-2 shadow-lg border border-white/20 whitespace-nowrap overflow-hidden text-ellipsis"
    >
      <div className="flex items-center text-xs text-gray-300 uppercase">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>

      <div className="text-md font-semibold mt-1">{value}</div>
    </div>
  );
}
