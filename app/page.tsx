import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Radar, Target, Bell, Crown, Check, ArrowRight,
  Plane, TrendingUp, CreditCard, Shield, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "STM Radar — O radar inteligente de milhas da comunidade STM",
  description: "Cadastre suas metas de milhas e seja avisado automaticamente quando surgir a oportunidade certa. Transferências bônus, passagens e acúmulo turbinado.",
};

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-white">
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border border-brand-gold animate-radar-ping" />
              <Radar className="w-full h-full text-brand-gold" />
            </div>
            <span className="font-display font-bold text-lg">STM Radar</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-white transition-colors hidden sm:block">
              Blog
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button variant="gold" size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-4 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-gold/5 blur-[120px]" />
        </div>

        {/* Radar animado central */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border border-brand-gold/20 animate-radar-ping" style={{ animationDelay: "0s" }} />
          <div className="absolute inset-2 rounded-full border border-brand-gold/15 animate-radar-ping" style={{ animationDelay: "0.5s" }} />
          <div className="absolute inset-4 rounded-full border border-brand-gold/10 animate-radar-ping" style={{ animationDelay: "1s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center">
              <Radar className="w-8 h-8 text-brand-gold" />
            </div>
          </div>
        </div>

        <Badge variant="secondary" className="mb-6 text-xs px-3 py-1.5 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Radar ativo para a comunidade STM
        </Badge>

        <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl mx-auto">
          Nunca mais perca uma{" "}
          <span className="text-brand-gold">oportunidade de milhas</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Cadastre suas metas — destino, programa, bônus de transferência — e seja alertado
          automaticamente quando a oportunidade certa aparecer. Em tempo real.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cadastro">
            <Button variant="gold" size="lg" className="gap-2 text-base px-8">
              Começar grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="#como-funciona">
            <Button variant="outline" size="lg" className="text-base px-8">
              Como funciona
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Sem cartão de crédito · plano gratuito para sempre</p>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold mb-4">Como o radar funciona</h2>
            <p className="text-muted-foreground text-lg">3 passos simples para nunca mais perder uma promoção</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Target,
                title: "Defina sua meta",
                desc: "Quer voar GRU → MIA em executiva? Quer bônus de 100% na Smiles? Cadastre a meta com seus critérios.",
              },
              {
                step: "02",
                icon: Radar,
                title: "O radar monitora",
                desc: "Nossa engine verifica a cada 15 minutos as oportunidades cadastradas pelo time STM e cruza com suas metas.",
              },
              {
                step: "03",
                icon: Bell,
                title: "Você é alertado",
                desc: "Assim que uma oportunidade bate com sua meta, você recebe push e email imediatamente. Sem perder nada.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="glass rounded-2xl p-7 relative group hover:border-brand-gold/30 transition-all">
                <span className="font-display text-6xl font-bold text-white/5 absolute top-5 right-5 leading-none">
                  {step}
                </span>
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-5 group-hover:bg-brand-gold/20 transition-colors">
                  <Icon className="w-6 h-6 text-brand-gold" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIPOS DE METAS ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-card/30 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold mb-4">O que você pode monitorar</h2>
            <p className="text-muted-foreground text-lg">3 tipos de meta, cobrindo todas as oportunidades do mercado de milhas</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Plane,
                title: "Passagem com milhas",
                desc: "Defina origem, destino, datas, máximo de milhas e classe. Seja avisado quando a disponibilidade aparecer no programa que você escolher.",
                tags: ["LATAM Pass", "Smiles", "TudoAzul"],
              },
              {
                icon: TrendingUp,
                title: "Acúmulo turbinado",
                desc: "Monitore transferências bônus, acúmulo turbinado e promoções de clube. Escolha o programa alvo e os tipos de oportunidade.",
                tags: ["Transferência bônus", "Clube", "Acúmulo"],
              },
              {
                icon: CreditCard,
                title: "Cartões de crédito",
                desc: "Fique por dentro de ofertas especiais de cartões parceiros com bônus de pontos, isenção de anuidade e benefícios exclusivos.",
                tags: ["Bônus de boas-vindas", "Anuidade", "Benefícios"],
              },
            ].map(({ icon: Icon, title, desc, tags }) => (
              <div key={title} className="glass rounded-2xl p-6 hover:border-brand-gold/30 transition-all">
                <div className="w-11 h-11 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-gold" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="precos" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold mb-4">Planos simples e transparentes</h2>
            <p className="text-muted-foreground text-lg">Comece grátis, faça upgrade quando quiser</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Essencial */}
            <div className="glass rounded-2xl p-8">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">Essencial</p>
                <div className="flex items-end gap-1">
                  <span className="font-display text-5xl font-bold">R$0</span>
                  <span className="text-muted-foreground mb-1">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Para quem está começando</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Até 3 metas ativas",
                  "Feed de oportunidades",
                  "Alertas por email",
                  "Histórico de alertas",
                  "Solicitações Agência STM",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
                {[
                  "Oportunidades VIP",
                  "Metas ilimitadas",
                  "Alertas por push",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4 shrink-0 text-center text-xs">✕</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block">
                <Button variant="outline" className="w-full">Começar grátis</Button>
              </Link>
            </div>

            {/* PRO */}
            <div className="rounded-2xl p-8 relative bg-gradient-to-b from-brand-gold/10 to-brand-gold/5 border border-brand-gold/40">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="gold" className="gap-1 px-3 py-1">
                  <Star className="w-3 h-3" /> Mais popular
                </Badge>
              </div>
              <div className="mb-6">
                <p className="text-sm text-brand-gold uppercase tracking-wider font-medium mb-2">PRO</p>
                <div className="flex items-end gap-1">
                  <span className="font-display text-5xl font-bold text-brand-gold">R$37</span>
                  <span className="text-muted-foreground mb-1">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Para quem leva milhas a sério</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Metas ilimitadas",
                  "Oportunidades VIP exclusivas",
                  "Alertas push em tempo real",
                  "Alertas por email",
                  "Feed completo com filtros",
                  "Histórico completo",
                  "Solicitações Agência STM",
                  "Suporte prioritário",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block">
                <Button variant="gold" className="w-full gap-2">
                  <Crown className="w-4 h-4" /> Começar PRO
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-card/30 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold mb-4">O que a comunidade STM diz</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Rodrigo M.",
                role: "Aluno STM desde 2022",
                text: "Fui alertado para uma transferência bônus de 100% na Smiles e consegui juntar milhas suficientes para voar em executiva para a Europa. Impossível sem o radar!",
              },
              {
                name: "Camila F.",
                role: "Aluna STM desde 2023",
                text: "Cadastrei minha meta de GRU → MIA em business e em 3 semanas recebi o alerta com a passagem a 70k milhas. Emiti no mesmo dia antes de acabar.",
              },
              {
                name: "Bruno T.",
                role: "Aluno STM desde 2021",
                text: "Já perdi muitas promoções por ficar verificando manualmente. Com o radar, toda oportunidade que bate com minhas metas chega no celular em tempo real.",
              },
            ].map(({ name, role, text }) => (
              <div key={name} className="glass rounded-2xl p-6 hover:border-brand-gold/20 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold text-sm font-bold">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold mb-4">Perguntas frequentes</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Preciso ser aluno da STM para usar?",
                a: "Sim, o STM Radar é uma ferramenta exclusiva para a comunidade STM — alunos dos cursos e membros do grupo.",
              },
              {
                q: "Com que frequência o radar verifica oportunidades?",
                a: "A cada 15 minutos o sistema compara todas as metas ativas com as oportunidades cadastradas pelo time STM. Assim que há match, você é notificado.",
              },
              {
                q: "Quais programas são monitorados?",
                a: "LATAM Pass, Smiles, TudoAzul, Livelo e Azul Fidelidade — os principais programas de fidelidade do Brasil.",
              },
              {
                q: "Como funciona o alerta por push?",
                a: "Com o plano PRO você recebe notificações push direto no celular ou computador (via browser), mesmo com o site fechado. Até 5 por dia para não sobrecarregar.",
              },
              {
                q: "Posso cancelar o plano PRO a qualquer momento?",
                a: "Sim. O cancelamento é feito com 1 clique nas configurações da conta. Você mantém o acesso PRO até o fim do período pago.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="glass rounded-xl group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-medium">
                  {q}
                  <span className="text-brand-gold text-lg group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border border-brand-gold/30 animate-radar-ping" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center">
                <Radar className="w-7 h-7 text-brand-gold" />
              </div>
            </div>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Ative seu radar hoje
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Junte-se à comunidade STM que nunca mais perde uma promoção de milhas.
          </p>
          <Link href="/cadastro">
            <Button variant="gold" size="lg" className="gap-2 text-base px-10">
              Criar conta grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-brand-gold" />
            <span className="font-display font-bold text-white">STM Radar</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/cadastro" className="hover:text-white transition-colors">Cadastrar</Link>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Exclusivo para a comunidade STM · {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
