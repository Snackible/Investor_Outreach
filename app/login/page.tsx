import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { BrandMark } from "@/components/BrandMark";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentSession()) redirect("/");
  return (
    <div className="login">
      <div className="login-bug" aria-hidden>
        <div className="bug-bat">
          <small>Snackible</small>
          <b className="login-brand">
            <BrandMark size={38} />
            Investor Outreach
          </b>
        </div>
        <div className="bug-need">Outreach, replies and follow-ups</div>
      </div>
      <main className="login-main">
        <LoginForm />
      </main>
    </div>
  );
}
