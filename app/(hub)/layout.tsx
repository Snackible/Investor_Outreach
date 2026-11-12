import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { hubContext } from "@/lib/hub";
import { serviceAccountEmail } from "@/lib/google";
import { FILE_LABEL } from "@/lib/data";
import { Nav } from "@/components/Nav";
import { ThemeMenu } from "@/components/ThemeMenu";
import { ScoreBug } from "@/components/ScoreBug";
import { BrandMark } from "@/components/BrandMark";
import { NotifyBell } from "@/components/NotifyBell";

export const dynamic = "force-dynamic";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await hubContext();
  const sa = serviceAccountEmail();

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <BrandMark />
          Investor Outreach
        </Link>
        <Nav />
        <div className="topbar-end">
          <NotifyBell items={ctx.followUps.due} overdue={ctx.followUps.overdue} />
          <ThemeMenu />
          <span className="who">{session.name}</span>
          <form action="/api/logout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <ScoreBug
        week={ctx.weekNumber}
        thisWeek={ctx.bug.thisWeek}
        today={ctx.bug.today}
        lastWeek={ctx.bug.lastWeek}
        dueToday={ctx.followUps.dueToday}
        overdue={ctx.followUps.overdue}
        replyRate={ctx.replyRate}
      />
      <main className="page">
        {ctx.problems.map((p, i) => (
          <div className={`notice${p.file === "hashmap" ? " bad" : ""}`} role="status" key={i}>
            {"status" in p && p.status === 403 && p.file in FILE_LABEL ? (
              <>
                <b>{FILE_LABEL[p.file as keyof typeof FILE_LABEL]} isn&apos;t shared with the hub yet, so its campaigns and emails are missing.</b>
                <span className="muted">
                  Share it as Viewer with <code>{sa}</code>, then press Sync on the Overview.
                </span>
              </>
            ) : (
              <>
                <b>{p.file === "hashmap" ? "Database problem" : `Couldn't read ${p.file in FILE_LABEL ? FILE_LABEL[p.file as keyof typeof FILE_LABEL] : p.file}`}</b>
                <span className="muted">{p.message}</span>
              </>
            )}
          </div>
        ))}
        {children}
      </main>
    </>
  );
}
