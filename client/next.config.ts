/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    if (process.env.NODE_ENV === "production") {
      // Forward /api/... requests to your backend in production
      rewrites: async () => [
        {
          source: "/api/v1/:path*",
          destination: "https://sote2035-server.onrender.com/api/v1/:path*",
        },
      ];
    }

    // Locally, no rewrites needed
    return [];
  },
};

export default nextConfig;
