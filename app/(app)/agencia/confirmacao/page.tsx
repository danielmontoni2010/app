import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgenciaConfirmacaoPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass rounded-2xl p-10 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">
          Solicitação enviada! 🎉
        </h1>
        <p className="text-muted-foreground text-sm mb-2">
          Recebemos sua solicitação de cotação.
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          Nossa equipe vai analisar e entrar em contato via WhatsApp ou e-mail em até <strong className="text-white">24 horas úteis</strong>.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button variant="gold" className="w-full">Voltar ao Dashboard</Button>
          </Link>
          <Link href="/agencia">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Nova solicitação
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
