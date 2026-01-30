/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    // Use the environment variable if defined, otherwise default to your deployed server
    const apiBase =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_API_URL ||
          "https://sote2035-server.onrender.com"
        : "http://localhost:4000";

    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`, // must be absolute URL
      },
    ];
  },
};

export default nextConfig;
