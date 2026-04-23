import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Plane, TrendingUp, CreditCard, MapPin, Calendar, Gauge, Pause, CheckCircle } from "lucide-react";
import { cn, formatDate, CABIN_CLASS_LABELS } from "@/lib/utils";
import type { Goal } from "@/lib/supabase/types";

const typeIcons = { flight: Plane, accumulation: TrendingUp, card: CreditCard };
const statusConfig = {
  active: { label: "Ativa", variant: "success" as const, icon: null },
  paused: { label: "Pausada", variant: "warning" as const, icon: Pause },
  completed: { label: "Concluída", variant: "secondary" as const, icon: CheckCircle },
};

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const Icon = typeIcons[goal.type] || Plane;
  const status = statusConfig[goal.status] || statusConfig.active;

  return (
    <Link href={`/metas/${goal.id}`}>
      <div className={cn(
        "glass rounded-xl p-5 hover:border-brand-gold/30 transition-all cursor-pointer group",
        goal.status === "paused" && "opacity-60"
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0 group-hover:bg-brand-gold/20 transition-colors">
              <Icon className="w-5 h-5 text-brand-gold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-white truncate">{goal.title}</h3>
                <Badge variant={status.variant} className="text-xs shrink-0">
                  {status.label}
                </Badge>
              </div>

              {/* Detalhes por tipo */}
              {goal.type === "flight" && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {(goal.origin || goal.destination) && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {goal.origin || "?"} → {goal.destination || "?"}
                    </span>
                  )}
                  {goal.date_from && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(goal.date_from)}
                      {goal.date_to && ` — ${formatDate(goal.date_to)}`}
                    </span>
                  )}
                  {goal.max_miles && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Gauge className="w-3 h-3" />
                      até {goal.max_miles.toLocaleString("pt-BR")} milhas
                    </span>
                  )}
                  {goal.cabin_class && goal.cabin_class !== "any" && (
                    <Badge variant="outline" className="text-xs">{CABIN_CLASS_LABELS[goal.cabin_class]}</Badge>
                  )}
                  {goal.program && (
                    <Badge variant="outline" className="text-xs">{goal.program}</Badge>
                  )}
                </div>
              )}

              {goal.type === "accumulation" && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {goal.target_program && (
                    <Badge variant="outline" className="text-xs">{goal.target_program}</Badge>
                  )}
                  {goal.opportunity_types?.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs capitalize">{t.replace("-", " ")}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground shrink-0">
            {formatDate(goal.created_at)}
          </div>
        </div>
      </div>
    </Link>
  );
}
