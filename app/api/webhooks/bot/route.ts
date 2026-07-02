import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { matchOpportunityToAllGoals } from "@/lib/matching/engine";
import { sendPendingNotifications, sendBroadcastPush } from "@/lib/notifications/sender";

const BOT_SECRET = process.env.BOT_SECRET;

// Mapeia tipo do bot → tipo da oportunidade
function mapTipo(botTipo: string, texto: string): string {
  if (botTipo === "passagens") return "passagem";
  const t = texto.toLowerCase();
  if (t.includes("transfer") && (t.includes("bônus") || t.includes("bonus"))) return "transferencia-bonus";
  if (t.includes("clube") || t.includes("assinatura")) return "clube";
  if (t.includes("cartão") || t.includes("cartao")) return "cartao";
  return "acumulo-turbinado";
}

// Extrai título limpando formatação WhatsApp
function extrairTitulo(texto: string): string {
  const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);
  const primeira = (linhas[0] || "Nova oportunidade")
    .replace(/[*_~`]/g, "")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    .trim();
  return primeira.substring(0, 120) || "Nova oportunidade";
}

// Extrai bônus percentual (ex: "100% de bônus", "+100%")
function extrairBonus(texto: string): number | null {
  const m = texto.match(/(\d+)\s*%\s*de\s*b[oô]nus/i)
    || texto.match(/b[oô]nus\s*de\s*(\d+)\s*%/i)
    || texto.match(/\+(\d+)\s*%/);
  return m ? parseInt(m[1]) : null;
}

// Extrai quantidade de milhas — suporta vários formatos
function extrairMilhas(texto: string): number | null {
  // Formato K: 72,6K / 12.2K / 95.7K milhas
  const kMatch = texto.match(/([\d]+(?:[.,]\d+)?)\s*[kK]\s*milhas/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1000);

  // Formato "X a Y mil milhas" — pega o menor valor
  const faixaMilMatch = texto.match(/([\d]+)\s*a\s*[\d]+\s*mil\s*milhas/i);
  if (faixaMilMatch) return parseInt(faixaMilMatch[1]) * 1000;

  // Formato "X mil milhas"
  const milMatch = texto.match(/([\d]+(?:[.,]\d+)?)\s*mil\s*milhas/i);
  if (milMatch) return Math.round(parseFloat(milMatch[1].replace(",", ".")) * 1000);

  // Formato numérico com separador: 12.200 / 95.700
  const numMatch = texto.match(/([\d]{1,3}(?:[.,][\d]{3})+)\s*milhas/i)
    || texto.match(/([\d]{4,6})\s*milhas/i);
  if (numMatch) return parseInt(numMatch[1].replace(/[.,]/g, ""));

  return null;
}

// Extrai datas de ida e volta do texto do bot
function extrairDatas(texto: string): { ida: string[]; volta: string[] } | null {
  const MESES: Record<string, string> = {
    janeiro:"01", fevereiro:"02", março:"03", marco:"03", abril:"04",
    maio:"05", junho:"06", julho:"07", agosto:"08", setembro:"09",
    outubro:"10", novembro:"11", dezembro:"12",
  };

  function parseDatasSecao(secao: string): string[] {
    const datas: string[] = [];
    const anoAtual = new Date().getFullYear();
    const linhas = secao.split("\n");
    let mesAtual = "";
    let anoAtualLinha = anoAtual;

    for (const linha of linhas) {
      // Formato "Maio/26: 25, 27" ou "Maio: 25, 27" ou "Maio/2026: 25, 27"
      const mesMatch = linha.match(/^(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\/(\d{2,4}))?:/i);
      if (mesMatch) {
        mesAtual = MESES[mesMatch[1].toLowerCase()] || "";
        // Extrai o ano se presente (ex: /26 → 2026, /2026 → 2026)
        if (mesMatch[2]) {
          const y = mesMatch[2];
          anoAtualLinha = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
        } else {
          anoAtualLinha = anoAtual;
        }
        const dias = linha.replace(/^[^:]+:/, "").split(",").map(d => d.trim()).filter(Boolean);
        for (const d of dias) {
          if (mesAtual && /^\d+$/.test(d)) datas.push(`${anoAtualLinha}-${mesAtual}-${d.padStart(2,"0")}`);
        }
      } else if (mesAtual && linha.trim()) {
        const dias = linha.split(",").map(d => d.trim()).filter(Boolean);
        for (const d of dias) {
          if (/^\d+$/.test(d)) datas.push(`${anoAtualLinha}-${mesAtual}-${d.padStart(2,"0")}`);
        }
      }
    }
    return datas;
  }

  const idaIdx = texto.search(/datas?\s*de\s*ida/i);
  const voltaIdx = texto.search(/datas?\s*de\s*volta/i);

  if (idaIdx < 0 && voltaIdx < 0) return null;

  const idaDates = idaIdx >= 0
    ? parseDatasSecao(texto.substring(idaIdx, voltaIdx > idaIdx ? voltaIdx : undefined))
    : [];
  const voltaDates = voltaIdx >= 0
    ? parseDatasSecao(texto.substring(voltaIdx))
    : [];

  if (!idaDates.length && !voltaDates.length) return null;
  return { ida: idaDates, volta: voltaDates };
}

// Extrai rota (ex: "São Paulo (CGH) → Joinville (JOI)", "GRU → MIA")
function extrairRota(texto: string): { origin: string | null; destination: string | null } {
  // Formato com IATA entre parênteses: "Cidade (XXX) → Cidade (XXX)"
  const rotaCompleta = texto.match(/\(([A-Z]{3})\)\s*[→\-]\s*.*?\(([A-Z]{3})\)/);
  if (rotaCompleta) return { origin: rotaCompleta[1], destination: rotaCompleta[2] };

  // Formato só IATA: "GRU → MIA"
  const iataSimples = texto.match(/\b([A-Z]{3})\s*[→\-]\s*([A-Z]{3})\b/);
  if (iataSimples) return { origin: iataSimples[1], destination: iataSimples[2] };

  return { origin: null, destination: null };
}

// Extrai classe de cabine
function extrairCabine(texto: string): "economy" | "business" | "any" {
  const t = texto.toLowerCase();
  if (t.includes("executiva") || t.includes("business") || t.includes("executive")) return "business";
  if (t.includes("econômica") || t.includes("economica") || t.includes("economy")) return "economy";
  return "any";
}

// Limpa formatação WhatsApp (*bold*, _italic_, etc) e emojis de linha
function limparTexto(texto: string): string {
  return texto
    .replace(/\*([^*]+)\*/g, "$1")   // *negrito* → negrito
    .replace(/_([^_]+)_/g, "$1")     // _itálico_ → itálico
    .replace(/~([^~]+)~/g, "$1")     // ~tachado~ → tachado
    .replace(/```([^`]+)```/g, "$1") // ```código``` → código
    .trim();
}

// Extrai URL externa do texto
function extrairUrl(texto: string): string | null {
  const m = texto.match(/https?:\/\/[^\s\n)>]+/);
  return m ? m[0].replace(/[.,;)]+$/, "") : null;
}

// Extrai data de validade (ex: "válido até 31/05", "até 31/05/2026")
function extrairValidUntil(texto: string): string | null {
  const m = texto.match(/v[aá]lid[ao]\s*at[eé]\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i)
    || texto.match(/at[eé]\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i);
  if (!m) return null;

  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  const year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : new Date().getFullYear().toString();
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (BOT_SECRET && token !== BOT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { texto?: string; programa?: string; tipo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { texto = "", programa = "", tipo = "promos" } = body;
  if (!texto) return NextResponse.json({ error: "texto obrigatório" }, { status: 400 });

  const supabase = createAdminClient();
  const tipoOpp = mapTipo(tipo, texto);
  const isPassagem = tipoOpp === "passagem";

  // Parsing completo do texto
  const titulo = extrairTitulo(texto);
  const bonusPercentage = !isPassagem ? extrairBonus(texto) : null;
  const milesAmount = isPassagem ? extrairMilhas(texto) : null;
  const { origin, destination } = isPassagem ? extrairRota(texto) : { origin: null, destination: null };
  const cabinClass = isPassagem ? extrairCabine(texto) : null;
  const availableDates = isPassagem ? extrairDatas(texto) : null;
  const validUntil = extrairValidUntil(texto);
  const externalUrl = extrairUrl(texto);
  const isVip = tipo === "passagens";

  // Se não encontrou data de validade, define 3 dias a partir de agora
  const validUntilFinal = validUntil ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  })();

  // Limpa o texto para exibição (remove asteriscos e formatação WhatsApp)
  const descricaoLimpa = limparTexto(texto);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opp, error } = await (supabase as any)
    .from("opportunities")
    .insert({
      title: titulo,
      type: tipoOpp,
      program: programa || null,
      description: descricaoLimpa,
      bonus_percentage: bonusPercentage,
      is_vip: isVip,
      active: true,
      external_url: externalUrl,
      // Campos de passagem
      ...(isPassagem && {
        origin,
        destination,
        miles_amount: milesAmount,
        cabin_class: cabinClass,
        available_dates: availableDates,
      }),
      valid_until: validUntilFinal,
    })
    .select("id")
    .single();

  if (error || !opp) {
    console.error("[bot-webhook] Erro ao criar oportunidade:", error);
    return NextResponse.json({ error: "Erro ao criar oportunidade" }, { status: 500 });
  }

  // Matching + notificações em background
  Promise.resolve().then(async () => {
    try {
      const [match, broadcastSent] = await Promise.all([
        matchOpportunityToAllGoals(opp.id),
        sendBroadcastPush(opp.id),
      ]);
      if (match.newAlerts > 0) await sendPendingNotifications();
      console.log(`[bot-webhook] ✅ "${titulo}" | ${match.newAlerts} alertas | ${broadcastSent} broadcast`);
    } catch (err) {
      console.error("[bot-webhook] Erro no matching:", err);
    }
  });

  return NextResponse.json({ ok: true, id: opp.id, titulo, milesAmount, origin, destination, externalUrl });
}
