/** @type {import('next').NextConfig} */
const backendOrigin = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.DJANGO_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/portal-proxy/:path*",
          destination: `${backendOrigin}/api/:path*`
        },
        {
          source: "/api/portal/:path*",
          destination: `${backendOrigin}/api/portal/:path*`
        },
        {
          source: "/api/affiliate/:path*",
          destination: `${backendOrigin}/api/affiliate/:path*`
        },
        {
          source: "/api/track/:path*",
          destination: `${backendOrigin}/api/track/:path*`
        }
      ]
    };
  },
  async redirects() {
    return [
      { source: "/challenges", destination: "/", permanent: false },
      { source: "/challenges/:path*", destination: "/", permanent: false }
    ];
  }
};

module.exports = nextConfig;
