"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Radar, Check } from "lucide-react";

export default function CadastroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Conta criada!</h2>
          <p className="text-muted-foreground mb-6">
            Enviamos um email de confirmação para <strong className="text-white">{email}</strong>.
            Confirme seu email e faça login.
          </p>
          <Button variant="gold" onClick={() => router.push("/login")} className="w-full">
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-brand-gold animate-radar-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-brand-gold animate-radar-ping [animation-delay:0.5s]" />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Radar className="w-8 h-8 text-brand-gold" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">STM Radar</h1>
          <p className="text-muted-foreground text-sm mt-1">Alertas inteligentes de milhas</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="font-display text-xl font-semibold text-white mb-2">Criar sua conta</h2>
          <p className="text-muted-foreground text-sm mb-6">Comece grátis e não perca nenhuma oportunidade</p>

          <form onSubmit={handleCadastro} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar conta gratuita
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Ao criar sua conta, você concorda com os termos de uso da STM.
          </p>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Já tem conta?{" "}
            <Link href="/login" className="text-brand-gold hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
