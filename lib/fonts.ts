import localFont from "next/font/local";
import { Bricolage_Grotesque } from "next/font/google";

// Shared by both root layouts. Declaring them once keeps a single subset in
// the build — two declarations of the same face would ship it twice.

// Display face carries the brand. Deliberately not Inter — a grotesque with
// real character reads as designed rather than defaulted.
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-display",
});

export const sans = localFont({
  src: "../app/fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

// Repo names and shell commands are identifiers, not decoration — monospace
// is the semantically correct face for them.
export const mono = localFont({
  src: "../app/fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const fontVars = `${sans.variable} ${display.variable} ${mono.variable}`;
