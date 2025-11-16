import AppLayout from "../components/AppLayout";

export default async function Home() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/api/v1/home`, { cache: "no-store" });
  const data = res.ok ? await res.json() : null;

  return (
    <AppLayout>
      <main>
        <h1>Hello</h1>
      </main>
    </AppLayout>
  );
}
