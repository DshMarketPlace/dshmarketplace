/**
 * Reads a query in id-ordered pages instead of one response.
 *
 * sqld refuses any single response over its size cap (`RESPONSE_TOO_LARGE`).
 * A select across every plugin's summaries crossed it on 7 Nov 2026 at about
 * 17,600 rows and stopped the nightly sync at its first step for six nights.
 * Keyset paging (`id > after ORDER BY id LIMIT size`) keeps every response
 * bounded however large the catalogue grows, and costs no more reads than the
 * single select did.
 *
 * `page` must apply `gt(id, after)`, order by id ascending and limit to `size`;
 * a short page is how the loop knows it has reached the end.
 */
export async function readAllById<T extends { id: number }>(
  page: (after: number, size: number) => Promise<T[]>,
  size = 2000,
): Promise<T[]> {
  if (!Number.isInteger(size) || size < 1) throw new Error(`bad page size ${size}`);
  const out: T[] = [];
  let after = 0;
  for (;;) {
    const rows = await page(after, size);
    out.push(...rows);
    if (rows.length < size) return out;
    const last = rows[rows.length - 1].id;
    if (!(last > after)) throw new Error(`page did not advance past id ${after}`);
    after = last;
  }
}
