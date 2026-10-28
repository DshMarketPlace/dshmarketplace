/**
 * Whether the nightly should write a new weekly issue.
 *
 * Due when nothing is stored yet, or when the newest issue ends at least seven
 * days before the latest snapshot. Counting from the stored issue rather than
 * from a weekday means a night the snapshot missed delays one issue by a day
 * instead of skipping a week, and a rerun of the same night cannot write two.
 */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function epochDay(day: string): number {
  if (!DAY.test(day)) throw new Error(`not a YYYY-MM-DD day: ${day}`);
  const ms = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`not a calendar day: ${day}`);
  return ms / 86_400_000;
}

export function isWeeklyDue(latestSnapshot: string | null, newestIssue: string | null): boolean {
  if (!latestSnapshot) return false;
  if (!newestIssue) return true;
  return epochDay(latestSnapshot) - epochDay(newestIssue) >= 7;
}
