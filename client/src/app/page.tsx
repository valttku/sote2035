export default async function Home() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/api/v1/home`, { cache: "no-store" });
  if (!res.ok) {
    return <main className="p-8">Failed to load home data.</main>;
  }

  const data = await res.json();
  const highlights: string[] = Array.isArray(data?.highlights) ? data.highlights : [];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-4">{data?.title ?? "Home"}</h1>
      <p className="text-lg mb-6">{data?.intro ?? ""}</p>
      <ul className="list-disc">
        {highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}