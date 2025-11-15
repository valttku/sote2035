import AppLayout from "../components/AppLayout";

export default async function Home() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/api/v1/home`, { cache: "no-store" });
  if (!res.ok) {
    return <main className="p-8">Failed to load home data.</main>;
  }

  const data = await res.json();
  const highlights: string[] = Array.isArray(data?.highlights) ? data.highlights : [];

  return (
    <AppLayout>

      <main>
        <h1>Hello</h1>

        {/* later: body graphic + Garmin data */}
      </main>
    </AppLayout>
  );
}