/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:5000/api/v1/:path*",
      },
      // Next 308-strips the trailing slash on /socket.io/ before rewrites,
      // and Express/socket.io 404s the slash-less path — match both shapes.
      {
        source: "/socket.io",
        destination: "http://localhost:5000/socket.io/",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:5000/socket.io/:path*",
      },
    ];
  },
};

export default nextConfig;
