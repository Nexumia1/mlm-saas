/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mlm-saas/database', '@mlm-saas/shared'],
  images: {
    domains: ['res.cloudinary.com', 'storage.googleapis.com', 's3.amazonaws.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_APP_NAME: 'MLM SaaS Platform',
  },
};

module.exports = nextConfig;
