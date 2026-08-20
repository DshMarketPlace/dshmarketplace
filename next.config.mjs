/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Plugin screenshots and avatars come from GitHub-hosted assets.
      { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "user-images.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "github.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "github.githubassets.com", pathname: "/**" },
      { protocol: "https", hostname: "opengraph.githubassets.com", pathname: "/**" },
    ],
  },

  // Dependency tracing runs under Node, so packages that expose a separate
  // "workerd" export condition get traced to their Node file only — the Worker
  // build then bundles for workerd and cannot resolve the web build that was
  // never copied. @libsql/isomorphic-ws is exactly that case, so its whole
  // directory is force-included.
  outputFileTracingIncludes: {
    "**": [
      "./node_modules/@libsql/isomorphic-ws/**",
      "./node_modules/@libsql/isomorphic-fetch/**",
    ],
  },

  // Detail pages used to live at /p/[slug]. They were already submitted in the
  // sitemap under that path, so the old URLs redirect permanently rather than
  // 404 — a 404 on a submitted URL is a wasted crawl and a lost signal.
  async redirects() {
    return [
      { source: "/p/:slug", destination: "/plugins/:slug", permanent: true },
      { source: "/zh/p/:slug", destination: "/zh/plugins/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
