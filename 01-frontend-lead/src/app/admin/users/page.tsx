"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreVersion } from "@/lib/store-bus";
import { countUsers } from "@/lib/admin";
import { formatRwf } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function AdminUsers() {
  const { t } = useI18n();
  const version = useStoreVersion();

  const users = useMemo(() => countUsers(), [version]);
  const farmers = users.filter((u) => u.role === "farmer");
  const buyers = users.filter((u) => u.role === "buyer");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("admin.users.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {farmers.length} {t("admin.kpi.farmers")} · {buyers.length}{" "}
          {t("admin.kpi.buyers")}
        </p>
      </div>

      <Card className="gap-0 p-0">
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Users size={24} aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                {t("admin.users.empty")}
              </p>
            </div>
          ) : (
            <div className="table w-full text-left">
              <div className="hidden border-b border-border/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:table-row">
                <span className="table-cell">User</span>
                <span className="table-cell">Role</span>
                <span className="table-cell">Listings</span>
                <span className="table-cell">Offers</span>
                <span className="table-cell">Deals</span>
                <span className="table-cell text-right">Volume</span>
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0 sm:table-row sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:table-cell sm:py-3 sm:pr-3 sm:align-middle">
                    <span className="flex items-center gap-3">
                      <Avatar className="size-9 shrink-0 border border-border bg-emerald-500/10 text-emerald-700">
                        <AvatarFallback className="bg-transparent text-xs font-bold text-emerald-700">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {u.name}
                        </span>
                        {u.phone && (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {u.phone}
                          </span>
                        )}
                      </span>
                    </span>
                  </div>
                  <div className="text-xs font-semibold sm:table-cell sm:py-3 sm:pr-3 sm:align-middle">
                    {u.role === "farmer" ? t("role.farmer") : t("role.buyer")}
                  </div>
                  <div className="font-mono text-xs sm:table-cell sm:py-3 sm:pr-3 sm:align-middle sm:text-sm">
                    {u.products}
                  </div>
                  <div className="font-mono text-xs sm:table-cell sm:py-3 sm:pr-3 sm:align-middle sm:text-sm">
                    {u.offers}
                  </div>
                  <div className="font-mono text-xs sm:table-cell sm:py-3 sm:pr-3 sm:align-middle sm:text-sm">
                    {u.deals}
                  </div>
                  <div className="font-mono text-sm font-semibold sm:table-cell sm:py-3 sm:text-right sm:align-middle">
                    {formatRwf(u.volume)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}