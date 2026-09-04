/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "GlobalReach",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.5:8001",
  },
};

module.exports = nextConfig;
