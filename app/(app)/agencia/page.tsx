import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plane, Shield, Clock, Star } from "lucide-react";
import { AgencyRequestForm } from "@/components/agency/AgencyRequestForm";
import type { Profile } from "@/lib/supabase/types";

const benefits = [
  { icon: Shield, title: "Especialistas em milhas", desc: "Nossa equipe usa seus pontos da melhor forma possível" },
  { icon: Clock, title: "Resposta rápida", desc: "Cotação em até 24 horas úteis via WhatsApp" },
  { icon: Star, title: "Maximização garantida", desc: "Buscamos sempre o maior valor para suas milhas" },
];

export default async function AgenciaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as Profile | null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-6 h-6 text-brand-gold" />
          <h1 className="font-display text-3xl font-bold text-white">Agência STM</h1>
        </div>
        <p className="text-muted-foreground max-w-xl">
          Deixa com a gente! Nossa equipe de especialistas pesquisa e emite sua passagem com milhas,
          garantindo o máximo valor para seus pontos.
        </p>
      </div>

      {/* Benefícios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {benefits.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-gold/10 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="font-semibold text-white text-sm mb-1">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Solicitar cotação</h2>
        <AgencyRequestForm
          userId={user.id}
          userName={profile?.name ?? ""}
          userEmail={profile?.email ?? user.email ?? ""}
          userPhone={profile?.phone}
        />
      </div>
    </div>
  );
}
