"use client";

import { cn } from "@/lib/utils";
import { Plane, TrendingUp, CreditCard } from "lucide-react";

const types = [
  { value: "flight", label: "Passagem", icon: Plane, desc: "Quero voar para um destino específico" },
  { value: "accumulation", label: "Acúmulo", icon: TrendingUp, desc: "Quero acumular mais milhas" },
  { value: "card", label: "Cartão", icon: CreditCard, desc: "Interesse em cartões de crédito" },
];

interface GoalTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function GoalTypeSelector({ value, onChange }: GoalTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {types.map(({ value: v, label, icon: Icon, desc }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
            value === v
              ? "border-brand-gold bg-brand-gold/10 text-white"
              : "border-border bg-card text-muted-foreground hover:border-brand-gold/50 hover:text-white"
          )}
        >
          <Icon className={cn("w-5 h-5", value === v ? "text-brand-gold" : "")} />
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
