import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://dev-coffeeconnect-v1.firebaseapp.com/__/auth/:path*',
      },
      {
        source: '/__/firebase/:path*',
        destination: 'https://dev-coffeeconnect-v1.firebaseapp.com/__/firebase/:path*',
      },
      {
        source: '/auth/:path*',
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}/auth/:path*`,
      },
    ]
  },
}

export default nextConfig;
