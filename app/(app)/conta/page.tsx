import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings, User, Bell, Crown, Shield, LogOut } from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { NotificationsForm } from "@/components/settings/NotificationsForm";
import { PlanCard } from "@/components/settings/PlanCard";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/supabase/types";

export default async function ContaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as Profile | null;
  if (!profile) redirect("/login");

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-6 h-6 text-brand-gold" />
          <h1 className="font-display text-3xl font-bold text-white">Configurações</h1>
        </div>
        <p className="text-muted-foreground">Gerencie seu perfil, notificações e plano</p>
      </div>

      {/* Perfil */}
      <section className="glass rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-brand-gold" />
          Informações pessoais
        </h2>
        <ProfileForm profile={profile} />
      </section>

      {/* Notificações */}
      <section className="glass rounded-xl p-6 space-y-2">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-brand-gold" />
          Notificações
        </h2>
        <NotificationsForm profile={profile} />
      </section>

      {/* Plano */}
      <section className="space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Crown className="w-4 h-4 text-brand-gold" />
          Meu plano
        </h2>
        <PlanCard profile={profile} />
      </section>

      {/* Segurança */}
      <section className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-gold" />
          Segurança
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Senha</p>
            <p className="text-xs text-muted-foreground">Autenticação gerenciada pelo Supabase Auth</p>
          </div>
          <a
            href={`https://ghehbewdtgujgzoqirfe.supabase.co/auth/v1/recover`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">Redefinir senha</Button>
          </a>
        </div>
        <div className="pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Conta vinculada a <strong className="text-white">{profile.email}</strong>
          </p>
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
