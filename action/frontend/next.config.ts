import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 注释掉 output: 'export' 以支持 Vercel 的完整 Next.js 功能
  // output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  typescript: {
    // 在构建时忽略 TypeScript 错误（Vercel 部署时）
    ignoreBuildErrors: true,
  },
  async headers() {
    // Required by FHEVM 
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

