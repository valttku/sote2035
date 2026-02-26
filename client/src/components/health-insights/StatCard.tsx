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
    <div className="bg-[white]/10 rounded-xl p-2 shadow-lg border border-white/20">
      <div className="flex items-center text-xs text-gray-300 uppercase whitespace-normal overflow-hidden text-ellipsis">
        {icon && <span className="mr-1">{icon}</span>}
        <span>{label}</span>
      </div>

      <div className="text-md font-semibold ml-1">{value}</div>
    </div>
  );
}
