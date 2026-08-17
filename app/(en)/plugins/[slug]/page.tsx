import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PluginView, pluginMetaFor } from "@/components/views/plugin-view";
import { getPluginBySlug, getRoutablePluginSlugs } from "@/lib/data";
import { alternatesFor } from "@/lib/i18n";
import { OG_COVER } from "@/lib/social";
import { directory } from "@/directory.config";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getRoutablePluginSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  // Next 15 onwards resolves route params asynchronously.
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plugin = await getPluginBySlug(slug);
  if (!plugin) return {};

  const { title, description, url } = pluginMetaFor(plugin, "en");

  // Next omits <meta name="robots"> entirely when the value is undefined.
  // Google reads absence as index,follow — but we would silently forfeit the
  // preview directives, so every state is written out explicitly.
  const indexed = plugin.visibility === "indexed";

  return {
    title,
    description,
    alternates: alternatesFor("en", `/plugins/${plugin.slug}`),
    robots: {
      index: indexed,
      follow: true,
      googleBot: {
        index: indexed,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      type: "website",
      siteName: directory.name,
      url,
      title,
      description,
      locale: "en_US",
      alternateLocale: ["zh_CN"],
      // Falls back to the site cover: a plugin page with no image at all
      // renders as a bare link everywhere it is shared.
      images: plugin.ogImage ? [plugin.ogImage] : [OG_COVER["en"]],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [plugin.ogImage ?? OG_COVER["en"]],
    },
  };
}

export default async function PluginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plugin = await getPluginBySlug(slug);
  if (!plugin) notFound();

  return <PluginView plugin={plugin} locale="en" />;
}
