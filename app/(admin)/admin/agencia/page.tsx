import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import type { AgencyRequest } from "@/lib/supabase/types";

const STATUS_CONFIG = {
  new:     { label: "Nova",    variant: "warning"   as const },
  quoting: { label: "Cotando", variant: "secondary" as const },
  sent:    { label: "Enviada", variant: "success"   as const },
  closed:  { label: "Fechada", variant: "gold"      as const },
  lost:    { label: "Perdida", variant: "secondary" as const },
};

export default async function AdminAgenciaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase
    .from("agency_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const byStatus = {
    new:     (requests ?? []).filter((r: AgencyRequest) => r.status === "new").length,
    quoting: (requests ?? []).filter((r: AgencyRequest) => r.status === "quoting").length,
    sent:    (requests ?? []).filter((r: AgencyRequest) => r.status === "sent").length,
    closed:  (requests ?? []).filter((r: AgencyRequest) => r.status === "closed").length,
    lost:    (requests ?? []).filter((r: AgencyRequest) => r.status === "lost").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Agência STM</h1>
        <p className="text-muted-foreground mt-1">Solicitações de cotação de passagens</p>
      </div>

      {/* Resumo por status */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(byStatus) as [AgencyRequest["status"], number][]).map(([status, count]) => (
          <div key={status} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{STATUS_CONFIG[status].label}</p>
          </div>
        ))}
      </div>

      {/* Lista de solicitações */}
      <div className="space-y-2">
        {(requests ?? []).length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <Plane className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-white font-medium">Nenhuma solicitação ainda</p>
          </div>
        )}
        {(requests ?? []).map((req: AgencyRequest) => {
          const statusConfig = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.new;
          return (
            <Link key={req.id} href={`/admin/agencia/${req.id}`}>
              <div className={cn(
                "glass rounded-xl p-4 flex items-center justify-between gap-4 hover:border-brand-gold/20 transition-all",
                req.status === "new" && "border-brand-gold/20"
              )}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
                    <Plane className="w-4 h-4 text-brand-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {req.origin} → {req.destination}
                      <span className="text-muted-foreground font-normal text-sm ml-2">
                        · {req.contact_name}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.passengers} pax · {req.cabin_class === "business" ? "Executiva" : req.cabin_class === "economy" ? "Econômica" : "Qualquer"}
                      {req.travel_date && ` · ${formatDate(req.travel_date)}`}
                      {" · "}{formatDate(req.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant={statusConfig.variant} className="shrink-0">{statusConfig.label}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
