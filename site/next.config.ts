import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      // Environment-specific allowed origins for security (with full URLs)
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['https://yapgrid.com', 'https://www.yapgrid.com']
        : ['http://localhost:3002'],
    },
    // Optimize server-side rendering performance
    optimizePackageImports: ['lucide-react'],
  },
  // Prevent bundling of heavy server-only packages
  serverComponentsExternalPackages: ['prisma', '@prisma/client', 'selenium-webdriver'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v.redd.it',
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
      },
      {
        protocol: 'https',
        hostname: '*.redditmedia.com',
      },
      {
        protocol: 'https',
        hostname: 'reddit.com',
      },
      {
        protocol: 'https',
        hostname: '*.pinimg.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    // Prevent bundling of heavy Node-only packages in the client build
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve?.alias || {}),
        'selenium-webdriver': false,
        'undetected-chromedriver': false,
        snoowrap: false,
        bufferutil: false,
        'utf-8-validate': false,
      } as any;
    }
    return config;
  },
  // Limit file tracing and dev root scanning to the app workspace to avoid
  // traversing parent directories with other lockfiles or workspaces.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: __dirname,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false, // Disable for faster dev builds
  swcMinify: true,
};

export default nextConfig;
