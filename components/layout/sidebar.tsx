"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import {
  LayoutDashboard, Target, Zap, Bell, Plane, Settings, LogOut, Radar, Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/supabase/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/oportunidades", label: "Oportunidades", icon: Zap },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/metas", label: "Minhas Metas", icon: Target },
  { href: "/agencia", label: "Agência STM", icon: Plane },
  { href: "/conta", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border border-brand-gold animate-radar-ping" />
            <div className="w-full h-full flex items-center justify-center">
              <Radar className="w-5 h-5 text-brand-gold" />
            </div>
          </div>
          <span className="font-display font-bold text-lg text-white">STM Radar</span>
        </Link>
      </div>

      {/* Plano */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Seu plano</p>
          <p className="text-sm font-semibold text-white capitalize">{profile.plan}</p>
        </div>
        {profile.plan === "essencial" ? (
          <Link href="/conta#upgrade">
            <Badge variant="gold-outline" className="cursor-pointer hover:bg-brand-gold/10 text-xs">
              <Crown className="w-3 h-3 mr-1" /> Pro
            </Badge>
          </Link>
        ) : (
          <Badge variant="gold" className="text-xs">
            <Crown className="w-3 h-3 mr-1" /> Pro
          </Badge>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-gold/15 text-brand-gold"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center shrink-0">
            <span className="text-brand-gold text-sm font-bold">
              {(profile.name ?? profile.email ?? "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile.name ?? profile.email ?? "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full px-2 py-1.5 rounded-md hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
