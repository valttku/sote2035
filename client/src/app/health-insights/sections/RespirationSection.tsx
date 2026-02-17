"use client";
import { StatCard } from "../components/StatCard";

export type Respiration = {
  id: string;

};


export function RespirationSection({ respiration }: { respiration?: Respiration }) {
  if (!respiration) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">Respiration Summary</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      </div>
    </div>
  );
}
