"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, cn } from "@/lib/utils";
import { Phone, Mail, MapPin, Calendar, Users, Loader2 } from "lucide-react";
import type { AgencyRequest } from "@/lib/supabase/types";

const STATUS_CONFIG = {
  new:     { label: "Nova",        variant: "warning"   as const },
  quoting: { label: "Cotando",     variant: "secondary" as const },
  sent:    { label: "Enviada",     variant: "success"   as const },
  closed:  { label: "Fechada",     variant: "gold"      as const },
  lost:    { label: "Perdida",     variant: "secondary" as const },
};

const CABIN_LABELS: Record<string, string> = {
  economy: "Econômica",
  business: "Executiva",
  any: "Qualquer",
};

interface AgencyRequestAdminProps {
  request: AgencyRequest;
}

export function AgencyRequestAdmin({ request: initial }: AgencyRequestAdminProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [req, setReq] = useState<AgencyRequest>(initial);
  const [adminNotes, setAdminNotes] = useState(initial.admin_notes ?? "");
  const [quotedPrice, setQuotedPrice] = useState(initial.quoted_price?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save(updates: Partial<AgencyRequest>) {
    setSaving(true);
    const { error } = await supabase
      .from("agency_requests")
      .update(updates as never)
      .eq("id", req.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setReq((prev) => ({ ...prev, ...updates }));
      toast({ title: "Salvo!" });
      router.refresh();
    }
    setSaving(false);
  }

  const statusConfig = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.new;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status + ações rápidas */}
      <div className="glass rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <span className="text-sm text-muted-foreground">Recebida em {formatDate(req.created_at)}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["new", "quoting", "sent", "closed", "lost"] as AgencyRequest["status"][]).map((s) => (
            <button
              key={s}
              onClick={() => save({ status: s })}
              disabled={req.status === s || saving}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                req.status === s
                  ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                  : "border-border text-muted-foreground hover:border-brand-gold/40"
              )}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Dados do voo */}
      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Detalhes da solicitação</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Rota</p>
              <p className="text-white font-medium">{req.origin} → {req.destination}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-gold shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Passageiros · Classe</p>
              <p className="text-white font-medium">
                {req.passengers} · {CABIN_LABELS[req.cabin_class] ?? req.cabin_class}
              </p>
            </div>
          </div>
          {req.travel_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-gold shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Datas</p>
                <p className="text-white font-medium">
                  {formatDate(req.travel_date)}
                  {req.return_date && ` → ${formatDate(req.return_date)}`}
                  {req.flexible_dates && <span className="text-xs text-muted-foreground ml-1">(flex)</span>}
                </p>
              </div>
            </div>
          )}
        </div>
        {req.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Observações do cliente</p>
            <p className="text-sm text-white bg-white/5 rounded-lg p-3">{req.notes}</p>
          </div>
        )}
      </div>

      {/* Contato */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-white">Contato</h2>
        <p className="font-medium text-white">{req.contact_name}</p>
        <div className="flex flex-col gap-2">
          <a href={`https://wa.me/${req.contact_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-green-400 hover:underline">
            <Phone className="w-4 h-4" /> {req.contact_phone}
          </a>
          <a href={`mailto:${req.contact_email}`}
            className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
            <Mail className="w-4 h-4" /> {req.contact_email}
          </a>
        </div>
      </div>

      {/* Anotações do admin + cotação */}
      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Cotação & anotações internas</h2>
        <div className="space-y-2">
          <Label htmlFor="quotedPrice">Valor cotado (R$ ou milhas)</Label>
          <Input
            id="quotedPrice"
            placeholder="Ex: 60.000 milhas + R$150 taxas"
            value={quotedPrice}
            onChange={(e) => setQuotedPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminNotes">Anotações internas</Label>
          <Textarea
            id="adminNotes"
            placeholder="Programas verificados, disponibilidade, próximos passos..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={4}
          />
        </div>
        <Button
          variant="gold"
          disabled={saving}
          onClick={() => save({
            admin_notes: adminNotes,
            quoted_price: quotedPrice ? parseFloat(quotedPrice.replace(/\D/g, "")) : null,
          })}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Salvar anotações
        </Button>
      </div>
    </div>
  );
}
