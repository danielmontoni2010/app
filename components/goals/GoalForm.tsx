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
import { GoalTypeSelector } from "./GoalTypeSelector";
import { Loader2 } from "lucide-react";
import type { Goal } from "@/lib/supabase/types";

const PROGRAMS = ["LATAM Pass", "Smiles", "TudoAzul", "Livelo", "Azul Fidelidade", "Qualquer"];
const OPPORTUNITY_TYPES = [
  { value: "transferencia-bonus", label: "Transferência Bônus" },
  { value: "acumulo-turbinado", label: "Acúmulo Turbinado" },
  { value: "clube", label: "Clube" },
  { value: "cartao", label: "Cartão" },
];

interface GoalFormProps {
  userId: string;
  goal?: Goal;
}

export function GoalForm({ userId, goal }: GoalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"flight" | "accumulation" | "card">(goal?.type || "flight");
  const [title, setTitle] = useState(goal?.title || "");
  const [origin, setOrigin] = useState(goal?.origin || "");
  const [destination, setDestination] = useState(goal?.destination || "");
  const [dateFrom, setDateFrom] = useState(goal?.date_from || "");
  const [dateTo, setDateTo] = useState(goal?.date_to || "");
  const [maxMiles, setMaxMiles] = useState(goal?.max_miles?.toString() || "");
  const [cabinClass, setCabinClass] = useState<"economy" | "business" | "any">((goal?.cabin_class as "economy" | "business" | "any") || "any");
  const [program, setProgram] = useState(goal?.program || "");
  const [passengers, setPassengers] = useState(goal?.passengers?.toString() || "1");
  const [description, setDescription] = useState(goal?.description || "");
  const [oppTypes, setOppTypes] = useState<string[]>(goal?.opportunity_types || []);
  const [targetProgram, setTargetProgram] = useState(goal?.target_program || "");

  function toggleOppType(v: string) {
    setOppTypes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) {
      toast({ title: "Informe um título para a meta", variant: "destructive" });
      return;
    }
    setLoading(true);

    const payload = {
      user_id: userId,
      type,
      title,
      status: "active" as const,
      ...(type === "flight" && {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        date_from: dateFrom || null,
        date_to: dateTo || null,
        max_miles: maxMiles ? parseInt(maxMiles) : null,
        cabin_class: cabinClass as "economy" | "business" | "any",
        program: program || null,
        passengers: parseInt(passengers) || 1,
      }),
      ...(type === "accumulation" && {
        description: description || null,
        opportunity_types: oppTypes.length ? oppTypes : null,
        target_program: targetProgram || null,
      }),
    };

    let error;
    if (goal) {
      ({ error } = await supabase.from("goals").update(payload as never).eq("id", goal.id));
    } else {
      ({ error } = await supabase.from("goals").insert(payload as never));
    }

    if (error) {
      toast({ title: "Erro ao salvar meta", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: goal ? "Meta atualizada!" : "Meta criada!", variant: "default" });
    router.push("/metas");
    router.refresh();
  }

  async function handleDelete() {
    if (!goal) return;
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    toast({ title: "Meta excluída" });
    router.push("/metas");
    router.refresh();
  }

  async function handlePause() {
    if (!goal) return;
    const newStatus = goal.status === "active" ? "paused" : "active";
    await supabase.from("goals").update({ status: newStatus } as never).eq("id", goal.id);
    toast({ title: newStatus === "paused" ? "Meta pausada" : "Meta reativada" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Tipo */}
      {!goal && (
        <div className="space-y-2">
          <Label>Tipo de meta</Label>
          <GoalTypeSelector value={type} onChange={(v) => setType(v as "flight" | "accumulation" | "card")} />
        </div>
      )}

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título da meta</Label>
        <Input
          id="title"
          placeholder={type === "flight" ? "Ex: GRU → MIA em dezembro" : "Ex: Acumular 50k Smiles em 2025"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Campos para PASSAGEM */}
      {type === "flight" && (
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
              <Label htmlFor="dateFrom">Data de ida (início)</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Data de ida (fim)</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMiles">Máximo de milhas</Label>
              <Input id="maxMiles" type="number" placeholder="Ex: 60000" value={maxMiles} onChange={(e) => setMaxMiles(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengers">Passageiros</Label>
              <Input id="passengers" type="number" min="1" max="9" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={cabinClass} onValueChange={(v) => setCabinClass(v as "economy" | "business" | "any")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="economy">Econômica</SelectItem>
                  <SelectItem value="business">Executiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Programa</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Qualquer</SelectItem>
                  {PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Campos para ACÚMULO */}
      {type === "accumulation" && (
        <>
          <div className="space-y-2">
            <Label>Tipos de oportunidade de interesse</Label>
            <div className="grid grid-cols-2 gap-2">
              {OPPORTUNITY_TYPES.map(({ value: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleOppType(v)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    oppTypes.includes(v)
                      ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                      : "border-border text-muted-foreground hover:border-brand-gold/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Programa alvo</Label>
            <Select value={targetProgram} onValueChange={setTargetProgram}>
              <SelectTrigger><SelectValue placeholder="Qualquer programa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                {PROGRAMS.slice(0, -1).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Observações (opcional)</Label>
            <Textarea id="description" placeholder="Descreva o que você está buscando..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </>
      )}

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="gold" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {goal ? "Salvar alterações" : "Criar meta"}
        </Button>
        {goal && (
          <>
            <Button type="button" variant="outline" onClick={handlePause}>
              {goal.status === "active" ? "Pausar" : "Reativar"}
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
