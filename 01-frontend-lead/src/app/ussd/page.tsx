import Link from "next/link";
import { ArrowLeft, Smartphone } from "lucide-react";
import { UssdPhone } from "@/components/UssdPhone";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "AgriFlow — USSD demo",
  description: "Feature-phone USSD access to the AgriFlow marketplace.",
};

export default function UssdPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Smartphone size={13} aria-hidden />
            USSD demo
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            AgriFlow over USSD
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The same marketplace, on a 2G feature phone.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft size={14} aria-hidden />
            Home
          </Link>
        </Button>
      </div>
      <UssdPhone />
    </div>
  );
}