import { createAdminClient } from "@/lib/supabase/server";
import type { Goal, Opportunity } from "@/lib/supabase/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function iataMatch(goalIata: string | null, oppIata: string | null): boolean {
  if (!goalIata || goalIata.trim() === "") return true; // sem preferência = aceita tudo
  if (!oppIata) return false;
  return goalIata.toUpperCase() === oppIata.toUpperCase();
}

function programMatch(goalProgram: string | null, oppProgram: string | null): boolean {
  if (!goalProgram || goalProgram === "" || goalProgram === "Qualquer") return true;
  if (!oppProgram) return false;
  return goalProgram === oppProgram;
}

function milesMatch(maxMiles: number | null, oppMiles: number | null): boolean {
  if (!maxMiles) return true; // sem limite = aceita qualquer quantidade
  if (!oppMiles) return true; // oportunidade sem milhas informadas = não bloqueia
  return oppMiles <= maxMiles;
}

function cabinMatch(goalCabin: string | null, oppCabin: string | null): boolean {
  if (!goalCabin || goalCabin === "any") return true;
  if (!oppCabin || oppCabin === "any") return true;
  return goalCabin === oppCabin;
}

function datesOverlap(
  goalFrom: string | null,
  goalTo: string | null,
  oppFrom: string | null,
  oppTo: string | null
): boolean {
  // Se algum dos dois não tem datas definidas, considera compatível
  if (!goalFrom && !goalTo) return true;
  if (!oppFrom && !oppTo) return true;

  const gFrom = goalFrom ? new Date(goalFrom) : null;
  const gTo = goalTo ? new Date(goalTo) : gFrom;
  const oFrom = oppFrom ? new Date(oppFrom) : null;
  const oTo = oppTo ? new Date(oppTo) : oFrom;

  if (!gFrom || !oFrom) return true;

  // Overlap: início de um é antes do fim do outro
  return gFrom <= (oTo ?? oFrom) && oFrom <= (gTo ?? gFrom);
}

function oppTypeMatch(goalTypes: string[] | null, oppType: string): boolean {
  if (!goalTypes || goalTypes.length === 0) return true; // sem preferência = aceita tudo
  return goalTypes.includes(oppType);
}

// ─── Core matching function ──────────────────────────────────────────────────

export function matchGoalToOpportunity(goal: Goal, opp: Opportunity): boolean {
  // Meta de PASSAGEM × Oportunidade de passagem
  if (goal.type === "flight" && opp.type === "passagem") {
    return (
      iataMatch(goal.origin, opp.origin) &&
      iataMatch(goal.destination, opp.destination) &&
      milesMatch(goal.max_miles, opp.miles_amount) &&
      cabinMatch(goal.cabin_class, opp.cabin_class) &&
      programMatch(goal.program, opp.program) &&
      datesOverlap(goal.date_from, goal.date_to, opp.available_from, opp.available_to)
    );
  }

  // Meta de ACÚMULO × Oportunidades de acúmulo (transferência, clube, acúmulo turbinado)
  if (goal.type === "accumulation") {
    const accumulationTypes = ["transferencia-bonus", "acumulo-turbinado", "clube", "cartao"];
    if (!accumulationTypes.includes(opp.type)) return false;

    return (
      oppTypeMatch(goal.opportunity_types, opp.type) &&
      programMatch(goal.target_program, opp.program)
    );
  }

  // Meta de CARTÃO × Oportunidades de cartão
  if (goal.type === "card" && opp.type === "cartao") {
    return true;
  }

  return false;
}

// ─── Match result type ───────────────────────────────────────────────────────

export interface MatchResult {
  goalId: string;
  opportunityId: string;
  userId: string;
  isVip: boolean;
}

// ─── Run matching engine ─────────────────────────────────────────────────────

export async function runMatchingEngine(): Promise<{
  checked: number;
  newAlerts: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const errors: string[] = [];

  // 1. Busca todas as metas ativas
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active");

  if (goalsError) {
    return { checked: 0, newAlerts: 0, errors: [`Erro ao buscar metas: ${goalsError.message}`] };
  }

  // 2. Busca todas as oportunidades ativas
  const { data: opportunities, error: oppError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("active", true);

  if (oppError) {
    return { checked: 0, newAlerts: 0, errors: [`Erro ao buscar oportunidades: ${oppError.message}`] };
  }

  if (!goals?.length || !opportunities?.length) {
    return { checked: 0, newAlerts: 0, errors: [] };
  }

  // 3. Busca alertas já existentes para não duplicar
  const { data: existingAlerts } = await supabase
    .from("alerts")
    .select("goal_id, opportunity_id");

  const alreadyAlerted = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existingAlerts ?? []).map((a: any) => `${a.goal_id}:${a.opportunity_id}`)
  );

  // 4. Faz o matching
  const matches: MatchResult[] = [];
  let checked = 0;

  for (const goal of goals as Goal[]) {
    for (const opp of opportunities as Opportunity[]) {
      checked++;
      const key = `${goal.id}:${opp.id}`;

      // Já foi alertado para esse par — pula
      if (alreadyAlerted.has(key)) continue;

      if (matchGoalToOpportunity(goal, opp)) {
        matches.push({
          goalId: goal.id,
          opportunityId: opp.id,
          userId: goal.user_id,
          isVip: opp.is_vip,
        });
      }
    }
  }

  if (!matches.length) {
    return { checked, newAlerts: 0, errors };
  }

  // 5. Insere os novos alertas em lote
  const alertRows = matches.map((m) => ({
    goal_id: m.goalId,
    opportunity_id: m.opportunityId,
    user_id: m.userId,
    notified_push: false,
    notified_email: false,
  }));

  const { error: insertError } = await supabase.from("alerts").insert(alertRows as never);

  if (insertError) {
    errors.push(`Erro ao inserir alertas: ${insertError.message}`);
    return { checked, newAlerts: 0, errors };
  }

  return { checked, newAlerts: matches.length, errors };
}

// ─── Match single opportunity against all goals (usado ao criar oportunidade) ─

export async function matchOpportunityToAllGoals(opportunityId: string): Promise<{
  newAlerts: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const errors: string[] = [];

  const { data: opp, error: oppError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .single();

  if (oppError || !opp) {
    return { newAlerts: 0, errors: ["Oportunidade não encontrada"] };
  }

  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active");

  if (goalsError || !goals) {
    return { newAlerts: 0, errors: [`Erro ao buscar metas: ${goalsError?.message}`] };
  }

  // Alertas existentes para essa oportunidade
  const { data: existingAlerts } = await supabase
    .from("alerts")
    .select("goal_id")
    .eq("opportunity_id", opportunityId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alreadyAlerted = new Set((existingAlerts ?? []).map((a: any) => a.goal_id as string));

  const matches: MatchResult[] = [];

  for (const goal of goals as Goal[]) {
    if (alreadyAlerted.has(goal.id)) continue;
    if (matchGoalToOpportunity(goal, opp as unknown as Opportunity)) {
      matches.push({
        goalId: goal.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        opportunityId: (opp as any).id,
        userId: goal.user_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isVip: (opp as any).is_vip,
      });
    }
  }

  if (!matches.length) return { newAlerts: 0, errors };

  const alertRows = matches.map((m) => ({
    goal_id: m.goalId,
    opportunity_id: m.opportunityId,
    user_id: m.userId,
    notified_push: false,
    notified_email: false,
  }));

  const { error: insertError } = await supabase.from("alerts").insert(alertRows as never);

  if (insertError) {
    errors.push(`Erro ao inserir alertas: ${insertError.message}`);
    return { newAlerts: 0, errors };
  }

  return { newAlerts: matches.length, errors };
}
