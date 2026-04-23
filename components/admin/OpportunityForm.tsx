"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Opportunity } from "@/lib/supabase/types";

const PROGRAMS = ["LATAM Pass", "Smiles", "TudoAzul", "Livelo", "Azul Fidelidade"];
const OPPORTUNITY_TYPES = [
  { value: "transferencia-bonus", label: "Transferência Bônus" },
  { value: "acumulo-turbinado", label: "Acúmulo Turbinado" },
  { value: "clube", label: "Clube" },
  { value: "cartao", label: "Cartão" },
  { value: "passagem", label: "Passagem" },
];
const CABIN_CLASSES = [
  { value: "any", label: "Qualquer" },
  { value: "economy", label: "Econômica" },
  { value: "business", label: "Executiva" },
];

interface OpportunityFormProps {
  userId: string;
  opportunity?: Opportunity;
}

export function OpportunityForm({ userId, opportunity }: OpportunityFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Campos gerais
  const [title, setTitle] = useState(opportunity?.title || "");
  const [program, setProgram] = useState(opportunity?.program || "");
  const [type, setType] = useState(opportunity?.type || "transferencia-bonus");
  const [description, setDescription] = useState(opportunity?.description || "");
  const [externalUrl, setExternalUrl] = useState(opportunity?.external_url || "");
  const [isVip, setIsVip] = useState(opportunity?.is_vip ?? false);
  const [active, setActive] = useState(opportunity?.active ?? true);

  // Campos de passagem (tipo "passagem")
  const [origin, setOrigin] = useState(opportunity?.origin || "");
  const [destination, setDestination] = useState(opportunity?.destination || "");
  const [cabinClass, setCabinClass] = useState<"economy" | "business" | "any">((opportunity?.cabin_class as "economy" | "business" | "any") || "any");
  const [milesAmount, setMilesAmount] = useState(opportunity?.miles_amount?.toString() || "");
  const [taxAmount, setTaxAmount] = useState(opportunity?.tax_amount?.toString() || "");
  const [availableFrom, setAvailableFrom] = useState(opportunity?.available_from || "");
  const [availableTo, setAvailableTo] = useState(opportunity?.available_to || "");

  // Campos de transferência/acúmulo
  const [bonusPercentage, setBonusPercentage] = useState(opportunity?.bonus_percentage?.toString() || "");
  const [minTransfer, setMinTransfer] = useState(opportunity?.min_transfer?.toString() || "");
  const [maxTransfer, setMaxTransfer] = useState(opportunity?.max_transfer?.toString() || "");
  const [validUntil, setValidUntil] = useState(opportunity?.valid_until || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !program || !type) {
      toast({ title: "Preencha título, programa e tipo", variant: "destructive" });
      return;
    }
    setLoading(true);

    const payload = {
      title,
      program,
      type,
      description: description || null,
      external_url: externalUrl || null,
      is_vip: isVip,
      active,
      created_by: userId,
      // Passagem
      ...(type === "passagem" && {
        origin: origin.toUpperCase() || null,
        destination: destination.toUpperCase() || null,
        cabin_class: cabinClass,
        miles_amount: milesAmount ? parseInt(milesAmount) : null,
        tax_amount: taxAmount ? parseFloat(taxAmount) : null,
        available_from: availableFrom || null,
        available_to: availableTo || null,
      }),
      // Transferência/Acúmulo
      ...(type !== "passagem" && {
        bonus_percentage: bonusPercentage ? parseInt(bonusPercentage) : null,
        min_transfer: minTransfer ? parseInt(minTransfer) : null,
        max_transfer: maxTransfer ? parseInt(maxTransfer) : null,
        valid_until: validUntil || null,
      }),
    };

    let error: { message: string } | null = null;
    let newOppId: string | null = null;

    if (opportunity) {
      const result = await supabase.from("opportunities").update(payload as never).eq("id", opportunity.id);
      error = result.error;
      newOppId = opportunity.id;
    } else {
      const result = await supabase.from("opportunities").insert(payload as never).select("id").single();
      error = result.error;
      newOppId = (result.data as { id: string } | null)?.id ?? null;
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: opportunity ? "Oportunidade atualizada!" : "Oportunidade criada!", variant: "default" });

    // Dispara matching assíncrono ao criar nova oportunidade
    if (newOppId && !opportunity) {
      fetch("/api/matching/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: newOppId }),
      }).catch(() => {});
    }

    router.push("/admin/oportunidades");
    router.refresh();
  }

  async function handleDelete() {
    if (!opportunity) return;
    if (!confirm("Excluir esta oportunidade?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", opportunity.id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    toast({ title: "Oportunidade excluída" });
    router.push("/admin/oportunidades");
    router.refresh();
  }

  async function handleToggleActive() {
    if (!opportunity) return;
    await supabase.from("opportunities").update({ active: !active } as never).eq("id", opportunity.id);
    setActive(!active);
    toast({ title: active ? "Oportunidade desativada" : "Oportunidade ativada" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título da oportunidade *</Label>
        <Input
          id="title"
          placeholder="Ex: Smiles com 100% de bônus na transferência"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Programa + Tipo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Programa *</Label>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPPORTUNITY_TYPES.map(({ value: v, label }) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campos de passagem */}
      {type === "passagem" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origem (IATA)</Label>
              <Input id="origin" placeholder="GRU" value={origin} onChange={(e) => setOrigin(e.target.value)} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destino (IATA)</Label>
              <Input id="destination" placeholder="MIA" value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={3} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={cabinClass} onValueChange={(v) => setCabinClass(v as "economy" | "business" | "any")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CABIN_CLASSES.map(({ value: v, label }) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milesAmount">Milhas necessárias</Label>
              <Input id="milesAmount" type="number" placeholder="60000" value={milesAmount} onChange={(e) => setMilesAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxAmount">Taxa (R$)</Label>
              <Input id="taxAmount" type="number" step="0.01" placeholder="150.00" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
            <div className="space-y-0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availableFrom">Disponível de</Label>
              <Input id="availableFrom" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableTo">Disponível até</Label>
              <Input id="availableTo" type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Campos de transferência/acúmulo */}
      {type !== "passagem" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bonusPercentage">Bônus (%)</Label>
              <Input id="bonusPercentage" type="number" placeholder="100" value={bonusPercentage} onChange={(e) => setBonusPercentage(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Válido até</Label>
              <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTransfer">Transferência mínima (pts)</Label>
              <Input id="minTransfer" type="number" placeholder="1000" value={minTransfer} onChange={(e) => setMinTransfer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTransfer">Transferência máxima (pts)</Label>
              <Input id="maxTransfer" type="number" placeholder="100000" value={maxTransfer} onChange={(e) => setMaxTransfer(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição / Observações</Label>
        <Textarea
          id="description"
          placeholder="Detalhes adicionais, regras, como aproveitar..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      {/* URL externa */}
      <div className="space-y-2">
        <Label htmlFor="externalUrl">Link externo</Label>
        <Input
          id="externalUrl"
          type="url"
          placeholder="https://..."
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
        />
      </div>

      {/* Flags */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isVip}
            onChange={(e) => setIsVip(e.target.checked)}
            className="w-4 h-4 accent-yellow-500 rounded"
          />
          <span className="text-sm text-white font-medium">Exclusiva PRO (VIP)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-green-500 rounded"
          />
          <span className="text-sm text-white font-medium">Ativa (visível no feed)</span>
        </label>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="gold" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {opportunity ? "Salvar alterações" : "Criar oportunidade"}
        </Button>
        {opportunity && (
          <>
            <Button type="button" variant="outline" onClick={handleToggleActive}>
              {active ? "Desativar" : "Ativar"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
