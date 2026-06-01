/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['padded-celtic-retouch.ngrok-free.dev'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.line.me https://*.line-apps.com https://*.line-scdn.net https://static.line-scdn.net;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
