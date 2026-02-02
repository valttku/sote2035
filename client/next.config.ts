/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://sote2035-server.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
