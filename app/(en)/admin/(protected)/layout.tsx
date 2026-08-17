import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/auth";

/**
 * Guards everything in this route group. The guard lives here rather than in
 * edge middleware: one protected subtree does not justify shipping a
 * middleware bundle, and the Worker script has a hard size ceiling.
 *
 * /admin/login sits outside the group, so it stays reachable. Route groups do
 * not appear in the URL — this subtree is still served at /admin.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <>{children}</>;
}
