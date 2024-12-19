import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://dev-coffeeconnect-v1.firebaseapp.com/',
      },
      {
        source: '/__/firebase/:path*',
        destination: 'https://dev-coffeeconnect-v1.firebaseapp.com/',
      },
    ]
  },
}

export default nextConfig;
