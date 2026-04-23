import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OpportunityForm } from "@/components/admin/OpportunityForm";
import type { Opportunity } from "@/lib/supabase/types";

export default async function EditarOportunidadePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const opportunity = data as Opportunity;

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/oportunidades" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para oportunidades
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Editar Oportunidade</h1>
        <p className="text-muted-foreground mt-1">{opportunity.title}</p>
      </div>
      <OpportunityForm userId={user.id} opportunity={opportunity} />
    </div>
  );
}
