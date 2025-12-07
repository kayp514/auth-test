import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //compiler: {
  //  removeConsole: process.env.NODE_ENV === 'production',
  //},

  experimental: {
    serverActions: {
      allowedOrigins: ['https://auth-test-one-chi.vercel.app', 'http://localhost'],
    },
  },

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
    ]
  },
}

export default nextConfig;
