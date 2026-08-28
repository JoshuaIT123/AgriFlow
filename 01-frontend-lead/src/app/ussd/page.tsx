import Link from "next/link";
import { UssdPhone } from "@/components/UssdPhone";

export const metadata = {
  title: "AgriFlow — USSD demo",
  description: "Feature-phone USSD access to the AgriFlow marketplace.",
};

export default function UssdPage() {
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>AgriFlow over USSD</h1>
          <p className="subtle" style={{ margin: "4px 0 0" }}>
            The same marketplace, on a 2G feature phone.
          </p>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/">
          ← Home
        </Link>
      </div>
      <UssdPhone />
    </div>
  );
}
