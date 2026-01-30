/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    // Frontend calls `NEXT_PUBLIC_API_URL` directly
    const apiBase =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_API_URL // your deployed backend
        : "http://localhost:4000"; // local backend

    return [
      {
        source: "/api/:path*", // Frontend calls `/api/v1/...`
        destination: `${apiBase}/:path*`, // rewrite to backend, remove extra `/api`
      },
    ];
  },
};

export default nextConfig;
