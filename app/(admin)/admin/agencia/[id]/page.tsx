import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgencyRequestAdmin } from "@/components/agency/AgencyRequestAdmin";
import type { AgencyRequest } from "@/lib/supabase/types";

export default async function AdminAgenciaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("agency_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/agencia" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para solicitações
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">
          {(data as AgencyRequest).origin} → {(data as AgencyRequest).destination}
        </h1>
        <p className="text-muted-foreground mt-1">{(data as AgencyRequest).contact_name}</p>
      </div>
      <AgencyRequestAdmin request={data as AgencyRequest} />
    </div>
  );
}
