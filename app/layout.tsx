import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Saira, Saira_Condensed } from "next/font/google";
import "./globals.css";

const saira = Saira({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-saira", display: "swap" });
const sairaCondensed = Saira_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-saira-condensed", display: "swap" });

export const metadata: Metadata = {
  title: "Investor Outreach · Snackible",
  description: "Investor outreach, duplicate checks and follow-ups for the Snackible fundraising team.",
  robots: { index: false, follow: false },
};

const THEMES = ["purple", "blue", "green", "red"] as const;
const MODES = ["system", "light", "dark"] as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const theme = THEMES.find((t) => t === jar.get("hub_theme")?.value) ?? "purple";
  const mode = MODES.find((m) => m === jar.get("hub_mode")?.value) ?? "system";
  return (
    <html lang="en-IN" data-theme={theme} data-mode={mode} className={`${saira.variable} ${sairaCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
