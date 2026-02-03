/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    const isProduction = process.env.NODE_ENV === "production";

    return [
      {
        source: "/api/:path*",
        destination: isProduction
          ? "https://sote2035-server.onrender.com/api/:path*" // deployed server
          : "http://localhost:4000/api/:path*", // local server
      },
    ];
  },
};

export default nextConfig;
