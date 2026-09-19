import { slugify } from "./registry";

type Listing = { fullName: string; slug: string };
type Resolution =
  | { kind: "new"; slug: string }
  | { kind: "existing"; listing: Listing }
  | { kind: "unresolved"; listing: Listing };

/** Reserve before the caller awaits a write, so concurrent candidates cannot
 * choose the same URL. Existing URLs and editorial records are never renamed.
 */
export function topicSlugResolver(
  listings: Listing[],
  repositoryId: (fullName: string) => Promise<number | null>,
) {
  const owners = new Map(listings.map((row) => [row.slug, row]));

  return async (fullName: string, id: number): Promise<Resolution> => {
    const base = slugify(fullName);
    let slug = base;

    for (let attempt = 0; ; attempt++) {
      const owner = owners.get(slug);
      if (!owner) {
        owners.set(slug, { fullName, slug });
        return { kind: "new", slug };
      }
      if (owner.fullName.toLowerCase() === fullName.toLowerCase()) {
        return { kind: "existing", listing: owner };
      }

      // GitHub redirects renamed repositories. A punctuation-only rename can
      // retain the old slug; adding a suffix would duplicate the same plugin.
      // A monorepo subpackage is a separate listing even with the same repo ID.
      if (!owner.fullName.includes("#")) {
        const ownerId = await repositoryId(owner.fullName);
        if (ownerId === null) return { kind: "unresolved", listing: owner };
        if (ownerId === id) return { kind: "existing", listing: owner };
      }

      // Repository IDs survive renames and distinguish punctuation collisions.
      // Check even the suffixed URL: an existing custom slug may occupy it.
      slug = `${base}--${id}${attempt ? `-${attempt}` : ""}`;
    }
  };
}
