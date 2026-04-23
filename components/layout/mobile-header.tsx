"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import {
  LayoutDashboard, Target, Zap, Bell, Plane, Settings, LogOut, Radar, Menu, X, Crown,
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

export function MobileHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-brand-gold" />
          <span className="font-display font-bold text-white">STM Radar</span>
        </Link>
        <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-white p-1">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-display font-bold text-white">STM Radar</span>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="px-3 py-3 mx-3 mt-3 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Plano</p>
                <p className="text-sm font-semibold text-white capitalize">{profile.plan}</p>
              </div>
              {profile.plan === "pro" && <Badge variant="gold"><Crown className="w-3 h-3 mr-1" />Pro</Badge>}
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active ? "bg-brand-gold/15 text-brand-gold" : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />{label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border">
              <form action={signOut}>
                <button type="submit" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive w-full px-2 py-1.5 rounded-md hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
