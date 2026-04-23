import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OpportunityForm } from "@/components/admin/OpportunityForm";

export default async function NovaOportunidadePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/oportunidades" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para oportunidades
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Nova Oportunidade</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre uma oportunidade que será matcheada com as metas dos alunos
        </p>
      </div>
      <OpportunityForm userId={user.id} />
    </div>
  );
}
