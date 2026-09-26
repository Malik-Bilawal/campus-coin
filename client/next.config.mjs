/** @type {import('next').NextConfig} */
const API_TARGET = process.env.API_PROXY_URL || "http://localhost:5000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_TARGET}/api/v1/:path*`,
      },
      // Next 308-strips the trailing slash on /socket.io/ before rewrites,
      // and Express/socket.io 404s the slash-less path — match both shapes.
      {
        source: "/socket.io",
        destination: `${API_TARGET}/socket.io/`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${API_TARGET}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
