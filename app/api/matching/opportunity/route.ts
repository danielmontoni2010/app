import { NextResponse } from "next/server";
import { matchOpportunityToAllGoals } from "@/lib/matching/engine";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Verifica se é admin
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminData } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!adminData) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { opportunityId } = body as { opportunityId: string };

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const result = await matchOpportunityToAllGoals(opportunityId);

  return NextResponse.json({
    success: true,
    newAlerts: result.newAlerts,
    errors: result.errors,
  });
}
