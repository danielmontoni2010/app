import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { matchGoalToOpportunity } from "@/lib/matching/engine";
import type { Goal, Opportunity } from "@/lib/supabase/types";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: goals } = await admin.from("goals").select("*").eq("status", "active");
  const { data: opportunities } = await admin.from("opportunities").select("*").eq("active", true);

  if (!goals?.length || !opportunities?.length) {
    return NextResponse.json({
      goals: goals?.length ?? 0,
      opportunities: opportunities?.length ?? 0,
      message: "Sem dados suficientes para matching",
    });
  }

  const results = [];

  for (const goal of goals as Goal[]) {
    for (const opp of opportunities as Opportunity[]) {
      if (opp.type !== "passagem" && goal.type === "flight") continue;
      if (opp.type === "passagem" && goal.type !== "flight") continue;

      const matched = matchGoalToOpportunity(goal, opp);
      results.push({
        goal_id: goal.id,
        goal_type: goal.type,
        goal_origin: goal.origin,
        goal_destination: goal.destination,
        goal_program: goal.program,
        goal_cabin: goal.cabin_class,
        goal_max_miles: goal.max_miles,
        goal_date_from: goal.date_from,
        goal_date_to: goal.date_to,
        opp_id: opp.id,
        opp_type: opp.type,
        opp_title: opp.title,
        opp_origin: opp.origin,
        opp_destination: opp.destination,
        opp_program: opp.program,
        opp_cabin: opp.cabin_class,
        opp_miles: opp.miles_amount,
        opp_from: opp.available_from,
        opp_to: opp.available_to,
        matched,
      });
    }
  }

  return NextResponse.json({
    goals: goals.length,
    opportunities: opportunities.length,
    comparisons: results,
    matches: results.filter(r => r.matched).length,
  });
}
