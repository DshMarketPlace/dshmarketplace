/**
 * Turso is a network hop, and any run long enough to walk the catalogue will
 * meet a connect timeout or a 502 eventually. Losing an hour of work to one
 * dropped packet is the wrong failure mode — these scripts are resumable, but
 * only because they get to finish.
 */
export async function persist<T>(write: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await write();
    } catch (err) {
      if (attempt >= 4) throw err;
      const wait = 2000 * attempt;
      console.warn(`  write failed (${attempt}/3) — retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
