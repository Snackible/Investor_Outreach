import { serviceAccountEmail } from "@/lib/google";
import { CheckClient } from "./CheckClient";

export default function CheckPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Check a list</h1>
        </div>
      </div>
      <CheckClient serviceAccount={serviceAccountEmail() ?? "the hub's service account"} />
    </>
  );
}
