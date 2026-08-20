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
    // The homepage and the catalogue were one page once, so Google still holds
    // `/?category=…`, `/?sort=…` and `/?page=…` from that era and re-crawls
    // them. They currently resolve to the landing page and canonicalise to
    // `/`, which is correct and still wasteful: every one is a crawl that
    // learns nothing and a signal that lands nowhere. Sending them to the
    // catalogue with the parameter intact turns each into the page the visitor
    // was actually asking for, and moves whatever equity they hold.
    const legacyCatalogue = ["category", "sort", "page"].flatMap((key) => [
      {
        source: "/",
        has: [{ type: "query", key, value: "(?<v>.*)" }],
        destination: `/plugins?${key}=:v`,
        permanent: true,
      },
      {
        source: "/zh",
        has: [{ type: "query", key, value: "(?<v>.*)" }],
        destination: `/zh/plugins?${key}=:v`,
        permanent: true,
      },
    ]);

    return [
      { source: "/p/:slug", destination: "/plugins/:slug", permanent: true },
      { source: "/zh/p/:slug", destination: "/zh/plugins/:slug", permanent: true },
      ...legacyCatalogue,
    ];
  },
};

export default nextConfig;
