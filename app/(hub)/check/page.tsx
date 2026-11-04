import { serviceAccountEmail } from "@/lib/google";
import { CheckClient } from "./CheckClient";

export default function CheckPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Check a list</h1>
          <p>
            Every email is checked against the hashmap and the Exhausted list. Checking never marks anyone as used: emails count as contacted only once YAMM
            merges them.
          </p>
        </div>
      </div>
      <CheckClient serviceAccount={serviceAccountEmail() ?? "the hub's service account"} />
    </>
  );
}
