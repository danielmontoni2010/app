"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminMatchingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    checked?: number;
    newAlerts?: number;
    errors?: string[];
    timestamp?: string;
  } | null>(null);

  async function runMatching() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/matching/run", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, errors: ["Erro de rede"] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Engine de Matching</h1>
        <p className="text-muted-foreground mt-1">
          Compara todas as metas ativas com todas as oportunidades ativas e gera alertas para os pares que batem.
        </p>
      </div>

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Rodar matching manual</h2>
        <p className="text-sm text-muted-foreground">
          O matching roda automaticamente a cada 15 minutos via cron job na Vercel.
          Use este botão para forçar uma execução imediata.
        </p>
        <Button variant="gold" onClick={runMatching} disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rodando...</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" />Rodar Matching Agora</>
          )}
        </Button>
      </div>

      {result && (
        <div className={`glass rounded-xl p-6 border ${result.success ? "border-green-500/30" : "border-red-500/30"}`}>
          <div className="flex items-center gap-2 mb-4">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <h3 className="font-semibold text-white">
              {result.success ? "Matching concluído!" : "Erro no matching"}
            </h3>
          </div>

          {result.success && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{result.checked?.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground mt-1">Pares verificados</p>
              </div>
              <div className="bg-brand-gold/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-gold">{result.newAlerts?.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground mt-1">Novos alertas gerados</p>
              </div>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="space-y-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-400">{err}</p>
              ))}
            </div>
          )}

          {result.timestamp && (
            <p className="text-xs text-muted-foreground mt-2">
              Executado em: {new Date(result.timestamp).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}

      <div className="glass rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-white">Regras de matching</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-brand-gold shrink-0">✈</span>
            <p><strong className="text-white">Meta Passagem</strong> × Oportunidade &quot;passagem&quot;: verifica origem, destino, máx. milhas, classe, programa e datas</p>
          </div>
          <div className="flex gap-2">
            <span className="text-brand-gold shrink-0">📈</span>
            <p><strong className="text-white">Meta Acúmulo</strong> × Oportunidades de acúmulo: verifica tipo de oportunidade e programa alvo</p>
          </div>
          <div className="flex gap-2">
            <span className="text-brand-gold shrink-0">💳</span>
            <p><strong className="text-white">Meta Cartão</strong> × Oportunidades de cartão: match automático</p>
          </div>
          <div className="flex gap-2">
            <span className="text-brand-gold shrink-0">🚫</span>
            <p>Pares já alertados não são duplicados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
