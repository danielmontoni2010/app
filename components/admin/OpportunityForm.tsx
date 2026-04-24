"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ChevronDown, ChevronUp, Plane } from "lucide-react";
import type { Opportunity } from "@/lib/supabase/types";

// ── Extrator de texto ───────────────────────────────────────────────────────
function stripMarkdown(text: string) {
  // Remove formatação WhatsApp/Markdown: *, _, ~, `
  return text.replace(/[*_~`]/g, "");
}

function cleanNumber(s: string) {
  // "300.000" → "300000", "1,000" → "1000"
  return s.replace(/\./g, "").replace(/,/g, "");
}

function parseOpportunityText(raw: string) {
  const text = raw;                  // mantém original para descrição
  const t    = stripMarkdown(raw);   // texto limpo para regex

  // ── Programa ──────────────────────────────────────────────────────────────
  const PROG_MAP: [string, string][] = [
    ["latam pass",       "LATAM Pass"],
    ["latam",            "LATAM Pass"],
    ["smiles",           "Smiles"],
    ["tudo azul",        "TudoAzul"],
    ["tudoazul",         "TudoAzul"],
    ["livelo",           "Livelo"],
    ["azul fidelidade",  "Azul Fidelidade"],
  ];
  let program = "";
  for (const [key, val] of PROG_MAP) {
    if (t.toLowerCase().includes(key)) { program = val; break; }
  }

  // ── Tipo ─────────────────────────────────────────────────────────────────
  // Prioridade: voo > transfer-bônus > acúmulo > cartão > clube
  let type = "transferencia-bonus";
  const iataPattern = /\b([A-Z]{3})\s*[→>\-]+\s*([A-Z]{3})\b/;
  const hasIata = iataPattern.test(t);
  if (hasIata) {
    type = "passagem";
  } else if (/transfer[eê]nci/i.test(t) && /b[oô]nus/i.test(t)) {
    type = "transferencia-bonus";
  } else if (/ac[uú]mul/i.test(t)) {
    type = "acumulo-turbinado";
  } else if (/cart[aã]o/i.test(t)) {
    type = "cartao";
  } else if (/clube\s+(?!azul|smiles|latam|livelo)/i.test(t)) {
    // "Clube" sem ser nome de programa = tipo clube
    type = "clube";
  }

  // ── Bônus % ───────────────────────────────────────────────────────────────
  // Busca "até X%" ou "X% de bônus" nos primeiros 300 chars (título/headline)
  let bonusPercentage = "";
  const headline = t.substring(0, 350);
  const headMatch = headline.match(/at[eé]\s+(\d+)\s*%/i)
    || headline.match(/(\d+)\s*%\s*(?:de\s+)?b[oô]nus/i)
    || headline.match(/b[oô]nus\s+de\s+(\d+)\s*%/i);
  if (headMatch) {
    bonusPercentage = headMatch[1];
  } else {
    // Pega o maior % encontrado em todo o texto
    const all = Array.from(t.matchAll(/(\d+)\s*%/g)).map(m => parseInt(m[1])).filter(n => n >= 10 && n <= 500);
    if (all.length) bonusPercentage = Math.max(...all).toString();
  }

  // ── Data válido até ───────────────────────────────────────────────────────
  let validUntil = "";
  const datePatterns = [
    /v[aá]lid[oa]?\s+at[eé][:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
    /at[eé][:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
  ];
  for (const pat of datePatterns) {
    const m = t.match(pat);
    if (m) {
      const d  = m[1].padStart(2, "0");
      const mo = m[2].padStart(2, "0");
      const y  = m[3].length === 2 ? `20${m[3]}` : m[3];
      validUntil = `${y}-${mo}-${d}`;
      break;
    }
  }

  // ── Transferência mínima ──────────────────────────────────────────────────
  let minTransfer = "";
  const minMatch = t.match(/m[ií]nimo\s+de\s+([\d.,]+)/i)
    || t.match(/a\s+partir\s+de\s+([\d.,]+)/i)
    || t.match(/m[ií]n(?:imo)?\s*[:\-]\s*([\d.,]+)/i);
  if (minMatch) minTransfer = cleanNumber(minMatch[1]);

  // ── Transferência máxima ──────────────────────────────────────────────────
  // Exemplo: "limite máximo de pontos bônus ... é de 300.000 pontos"
  let maxTransfer = "";
  const maxMatch = t.match(/(?:CPF\s+(?:[ée]|é)\s+de|CPF:\s*)([\d.,]+)\s*pontos/i)
    || t.match(/(?:limite|m[aá]ximo)[^.]{0,80}?([\d.,]+)\s*pontos/i)
    || t.match(/m[aá]x(?:imo)?\s*[:\-]\s*([\d.,]+)/i);
  if (maxMatch) maxTransfer = cleanNumber(maxMatch[1]);

  // ── Origem → Destino (IATA) ───────────────────────────────────────────────
  let origin = "", destination = "";
  const iataMatch = t.match(iataPattern);
  if (iataMatch) { origin = iataMatch[1]; destination = iataMatch[2]; }

  // ── Milhas ────────────────────────────────────────────────────────────────
  let milesAmount = "";
  const milesMatch = t.match(/([\d.,]+)\s*milhas/i);
  if (milesMatch) milesAmount = cleanNumber(milesMatch[1]);

  // ── URL externa ───────────────────────────────────────────────────────────
  const urlMatch = t.match(/https?:\/\/[^\s\n]+/);
  const externalUrl = urlMatch ? urlMatch[0].replace(/[.,;)]+$/, "") : "";

  // ── Título automático ─────────────────────────────────────────────────────
  let title = "";
  if (program && bonusPercentage && type === "transferencia-bonus") {
    title = `${program} com até ${bonusPercentage}% de bônus na transferência`;
  } else if (program && type === "passagem" && origin && destination) {
    title = `Passagem ${origin} → ${destination} via ${program}`;
  } else if (program && bonusPercentage) {
    title = `${program} com ${bonusPercentage}% de bônus`;
  } else if (program) {
    title = `${program} — nova oportunidade`;
  }

  return { title, program, type, bonusPercentage, validUntil, minTransfer, maxTransfer, origin, destination, milesAmount, externalUrl, description: text.trim() };
}

const PROGRAMS = ["LATAM Pass", "Smiles", "TudoAzul", "Livelo", "Azul Fidelidade"];
const OPPORTUNITY_TYPES = [
  { value: "transferencia-bonus", label: "Transferência Bônus" },
  { value: "acumulo-turbinado", label: "Acúmulo Turbinado" },
  { value: "clube", label: "Clube" },
  { value: "cartao", label: "Cartão" },
  { value: "passagem", label: "Passagem" },
];
const CABIN_CLASSES = [
  { value: "any", label: "Qualquer" },
  { value: "economy", label: "Econômica" },
  { value: "business", label: "Executiva" },
];

interface OpportunityFormProps {
  userId: string;
  opportunity?: Opportunity;
}

export function OpportunityForm({ userId, opportunity }: OpportunityFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // ── Importar texto ──────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(!opportunity);
  const [importText, setImportText] = useState("");
  const [importFlightOpen, setImportFlightOpen] = useState(false);
  const [importFlightText, setImportFlightText] = useState("");

  function handleExtract() {
    if (!importText.trim()) return;
    const e = parseOpportunityText(importText);
    if (e.title)            setTitle(e.title);
    if (e.program)          setProgram(e.program);
    if (e.type)             setType(e.type);
    if (e.bonusPercentage)  setBonusPercentage(e.bonusPercentage);
    if (e.validUntil)       setValidUntil(e.validUntil);
    if (e.minTransfer)      setMinTransfer(e.minTransfer);
    if (e.maxTransfer)      setMaxTransfer(e.maxTransfer);
    if (e.origin)           setOrigin(e.origin);
    if (e.destination)      setDestination(e.destination);
    if (e.milesAmount)      setMilesAmount(e.milesAmount);
    if (e.externalUrl)      setExternalUrl(e.externalUrl);
    if (e.description)      setDescription(e.description);
    setImportOpen(false);

    const found: string[] = [];
    if (e.program)          found.push(`Programa: ${e.program}`);
    if (e.bonusPercentage)  found.push(`Bônus: ${e.bonusPercentage}%`);
    if (e.validUntil)       found.push(`Validade: ${e.validUntil}`);
    if (e.maxTransfer)      found.push(`Máx: ${Number(e.maxTransfer).toLocaleString("pt-BR")} pts`);
    if (e.externalUrl)      found.push("URL extraída");
    toast({
      title: "✅ Informações extraídas!",
      description: found.length ? found.join(" · ") : "Revise os campos antes de salvar.",
    });
  }

  function handleExtractFlight() {
    if (!importFlightText.trim()) return;
    const raw = importFlightText;
    const t = stripMarkdown(raw);

    // ── Programa ────────────────────────────────────────────────────────────
    const PROG_MAP: [string, string][] = [
      ["latam pass",      "LATAM Pass"],
      ["latam",           "LATAM Pass"],
      ["smiles",          "Smiles"],
      ["tudo azul",       "TudoAzul"],
      ["tudoazul",        "TudoAzul"],
      ["livelo",          "Livelo"],
      ["azul fidelidade", "Azul Fidelidade"],
    ];
    let flightProgram = "";
    for (const [key, val] of PROG_MAP) {
      if (t.toLowerCase().includes(key)) { flightProgram = val; break; }
    }

    // ── Origem → Destino (IATA) + nomes das cidades ────────────────────────
    // Suporta: "Recife (REC) → Maceio (MCZ)" / "(REC) → (MCZ)" / "REC → MCZ"
    let flightOrigin = "", flightDestination = "";
    let originCity = "", destCity = "";

    // Tenta extrair "Nome da Cidade (IATA)" para origem e destino
    const cityIataAll = Array.from(t.matchAll(/([A-Za-zÀ-ú][A-Za-zÀ-ú\s]{1,20}?)\s*\(([A-Z]{3})\)/g));
    if (cityIataAll.length >= 2) {
      originCity      = cityIataAll[0][1].trim();
      flightOrigin    = cityIataAll[0][2];
      destCity        = cityIataAll[1][1].trim();
      flightDestination = cityIataAll[1][2];
    } else if (cityIataAll.length === 1) {
      originCity   = cityIataAll[0][1].trim();
      flightOrigin = cityIataAll[0][2];
    }

    // Fallback: apenas IATA sem nome de cidade
    if (!flightOrigin || !flightDestination) {
      const iataMatch = t.match(/\(?([A-Z]{3})\)?\s*[→>\-]+\s*\(?([A-Z]{3})\)?/)
        || t.match(/\(([A-Z]{3})\)[^\(]*\(([A-Z]{3})\)/);
      if (iataMatch) {
        flightOrigin      = flightOrigin      || iataMatch[1];
        flightDestination = flightDestination || iataMatch[2];
      }
    }

    // ── Milhas ──────────────────────────────────────────────────────────────
    // Suporta: "60.000 milhas", "12.2k milhas", "19.6 mil milhas", "19,6 mil milhas"
    let flightMiles = "";
    // "12.2k milhas" ou "60k milhas" — captura parte decimal também
    const kMatch   = t.match(/([\d]+(?:[.,]\d+)?)\s*k\s*milhas/i);
    const milMatch = t.match(/([\d]+[.,]?\d*)\s*mil\s+milhas/i);
    const plainMatch = t.match(/([\d.,]+)\s*milhas/i);
    if (kMatch) {
      // "12.2K" → 12200  |  "60K" → 60000  |  "19,6K" → 19600
      const n = parseFloat(kMatch[1].replace(",", "."));
      flightMiles = Math.round(n * 1000).toString();
    } else if (milMatch) {
      // "19.6 mil" → 19600  |  "20 mil" → 20000
      const n = parseFloat(milMatch[1].replace(",", "."));
      flightMiles = Math.round(n * 1000).toString();
    } else if (plainMatch) {
      flightMiles = plainMatch[1].replace(/\./g, "").replace(",", "");
    }

    // ── Taxa ────────────────────────────────────────────────────────────────
    let flightTax = "";
    const taxMatch = t.match(/taxa\s+de\s+R?\$?\s*([\d.,]+)/i)
      || t.match(/R\$\s*([\d.,]+)/i);
    if (taxMatch) {
      flightTax = taxMatch[1].replace(/\./g, "").replace(/,/g, ".");
    }

    // ── Classe ──────────────────────────────────────────────────────────────
    let flightCabin: "economy" | "business" | "any" = "any";
    if (/executiva/i.test(t)) flightCabin = "business";
    else if (/econ[oô]mica/i.test(t)) flightCabin = "economy";

    // ── Datas de disponibilidade ─────────────────────────────────────────────
    // Coleta TODAS as datas mencionadas (ida + volta) e usa min→max como range
    const MONTH_MAP: Record<string, string> = {
      jan: "01", fev: "02", mar: "03", abr: "04",
      mai: "05", jun: "06", jul: "07", ago: "08",
      set: "09", out: "10", nov: "11", dez: "12",
    };
    const curYear  = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1; // 1–12
    let flightFrom = "", flightTo = "";

    // 1) Tenta "disponível de DD/MM/YYYY" ou "a partir de DD/MM/YYYY"
    const fromDateMatch = t.match(/(?:dispon[ií]vel\s+de|a\s+partir\s+de)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
    const toDateMatch   = t.match(/at[eé]\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
    if (fromDateMatch) {
      flightFrom = `${fromDateMatch[3]}-${fromDateMatch[2].padStart(2,"0")}-${fromDateMatch[1].padStart(2,"0")}`;
    }
    if (toDateMatch) {
      flightTo = `${toDateMatch[3]}-${toDateMatch[2].padStart(2,"0")}-${toDateMatch[1].padStart(2,"0")}`;
    }

    // 2) Coleta TODAS as entradas "NomeMês: dia, dia, dia" do texto inteiro
    //    Cobre padrões como "Junho: 02, 06" e "Julho: 22, 23, 24"
    const monthPattern = new RegExp(
      `(${Object.keys(MONTH_MAP).join("|")})[a-z]*\\s*:\\s*([\\d,\\s]+)`,
      "gi"
    );
    const allDates: string[] = [];

    for (const match of Array.from(t.matchAll(monthPattern))) {
      const mo    = MONTH_MAP[match[1].toLowerCase().substring(0, 3)];
      if (!mo) continue;
      const moNum = parseInt(mo);
      // Se o mês já passou este ano, assume próximo ano
      const year  = moNum >= curMonth ? curYear : curYear + 1;
      const days  = match[2].match(/\d{1,2}/g) || [];
      for (const day of days) {
        const dateStr = `${year}-${mo}-${day.padStart(2, "0")}`;
        if (!allDates.includes(dateStr)) allDates.push(dateStr);
      }
    }

    if (allDates.length > 0) {
      allDates.sort();
      if (!flightFrom) flightFrom = allDates[0];
      if (!flightTo)   flightTo   = allDates[allDates.length - 1];
    }

    // ── URL ─────────────────────────────────────────────────────────────────
    const urlMatch = t.match(/https?:\/\/[^\s\n]+/);
    const flightUrl = urlMatch ? urlMatch[0].replace(/[.,;)]+$/, "") : "";

    // ── Título automático ────────────────────────────────────────────────────
    // Formato: "Recife (REC) - Maceio (MCZ) a partir de 8.000 milhas"
    const originLabel = originCity ? `${originCity} (${flightOrigin})` : flightOrigin;
    const destLabel   = destCity   ? `${destCity} (${flightDestination})` : flightDestination;
    const routePart = (flightOrigin && flightDestination)
      ? `${originLabel} - ${destLabel}`
      : (originLabel || destLabel || "Passagem");
    const milesPart = flightMiles
      ? ` a partir de ${Number(flightMiles).toLocaleString("pt-BR")} milhas`
      : "";
    const flightTitle = `${routePart}${milesPart}`;

    // ── Aplicar aos campos ───────────────────────────────────────────────────
    setType("passagem");
    if (flightOrigin)      setOrigin(flightOrigin);
    if (flightDestination) setDestination(flightDestination);
    if (flightMiles)       setMilesAmount(flightMiles);
    if (flightTax)         setTaxAmount(flightTax);
    if (flightCabin)       setCabinClass(flightCabin);
    if (flightFrom)        setAvailableFrom(flightFrom);
    if (flightTo)          setAvailableTo(flightTo);
    setAvailableDates(allDates);
    if (flightProgram)     setProgram(flightProgram);
    if (flightTitle)       setTitle(flightTitle);
    if (raw.trim())        setDescription(raw.trim());
    if (flightUrl)         setExternalUrl(flightUrl);

    setImportFlightOpen(false);

    const found: string[] = [];
    if (flightProgram)     found.push(`Programa: ${flightProgram}`);
    if (flightOrigin && flightDestination) found.push(`Rota: ${flightOrigin} → ${flightDestination}`);
    if (flightMiles)       found.push(`Milhas: ${Number(flightMiles).toLocaleString("pt-BR")}`);
    if (flightTax)         found.push(`Taxa: R$ ${flightTax}`);
    if (flightCabin !== "any") found.push(`Classe: ${flightCabin === "business" ? "Executiva" : "Econômica"}`);
    if (flightUrl)         found.push("URL extraída");
    toast({
      title: "✅ Passagem extraída!",
      description: found.length ? found.join(" · ") : "Revise os campos antes de salvar.",
    });
  }

  // Campos gerais
  const [title, setTitle] = useState(opportunity?.title || "");
  const [program, setProgram] = useState(opportunity?.program || "");
  const [type, setType] = useState(opportunity?.type || "transferencia-bonus");
  const [description, setDescription] = useState(opportunity?.description || "");
  const [externalUrl, setExternalUrl] = useState(opportunity?.external_url || "");
  const [isVip, setIsVip] = useState(opportunity?.is_vip ?? false);
  const [active, setActive] = useState(opportunity?.active ?? true);

  // Campos de passagem (tipo "passagem")
  const [origin, setOrigin] = useState(opportunity?.origin || "");
  const [destination, setDestination] = useState(opportunity?.destination || "");
  const [cabinClass, setCabinClass] = useState<"economy" | "business" | "any">((opportunity?.cabin_class as "economy" | "business" | "any") || "any");
  const [milesAmount, setMilesAmount] = useState(opportunity?.miles_amount?.toString() || "");
  const [taxAmount, setTaxAmount] = useState(opportunity?.tax_amount?.toString() || "");
  const [availableFrom, setAvailableFrom] = useState(opportunity?.available_from || "");
  const [availableTo, setAvailableTo] = useState(opportunity?.available_to || "");
  const [availableDates, setAvailableDates] = useState<string[]>(
    (opportunity?.available_dates as string[]) || []
  );

  // Campos de transferência/acúmulo
  const [bonusPercentage, setBonusPercentage] = useState(opportunity?.bonus_percentage?.toString() || "");
  const [minTransfer, setMinTransfer] = useState(opportunity?.min_transfer?.toString() || "");
  const [maxTransfer, setMaxTransfer] = useState(opportunity?.max_transfer?.toString() || "");
  const [validUntil, setValidUntil] = useState(opportunity?.valid_until || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !program || !type) {
      toast({ title: "Preencha título, programa e tipo", variant: "destructive" });
      return;
    }
    setLoading(true);

    const payload = {
      title,
      program,
      type,
      description: description || null,
      external_url: externalUrl || null,
      is_vip: isVip,
      active,
      created_by: userId,
      // Passagem
      ...(type === "passagem" && {
        origin: origin.toUpperCase() || null,
        destination: destination.toUpperCase() || null,
        cabin_class: cabinClass,
        miles_amount: milesAmount ? parseInt(milesAmount) : null,
        tax_amount: taxAmount ? parseFloat(taxAmount) : null,
        available_from: availableFrom || null,
        available_to: availableTo || null,
        available_dates: availableDates.length ? availableDates : null,
      }),
      // Transferência/Acúmulo
      ...(type !== "passagem" && {
        bonus_percentage: bonusPercentage ? parseInt(bonusPercentage) : null,
        min_transfer: minTransfer ? parseInt(minTransfer) : null,
        max_transfer: maxTransfer ? parseInt(maxTransfer) : null,
        valid_until: validUntil || null,
      }),
    };

    // Usa API route (service role) para bypassar RLS
    const body = opportunity
      ? { id: opportunity.id, ...payload }
      : payload;

    const res = await fetch("/api/admin/opportunity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok) {
      toast({ title: "Erro ao salvar", description: json.error ?? "Erro desconhecido", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: opportunity ? "Oportunidade atualizada!" : "Oportunidade criada!" });

    // Dispara matching assíncrono ao criar nova oportunidade
    if (json.id && !opportunity) {
      fetch("/api/matching/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: json.id }),
      }).catch(() => {});
    }

    router.push("/admin/oportunidades");
    router.refresh();
  }

  async function handleDelete() {
    if (!opportunity) return;
    if (!confirm("Excluir esta oportunidade?")) return;
    const res = await fetch("/api/admin/opportunity", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: opportunity.id }),
    });
    if (!res.ok) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    toast({ title: "Oportunidade excluída" });
    router.push("/admin/oportunidades");
    router.refresh();
  }

  async function handleToggleActive() {
    if (!opportunity) return;
    const newActive = !active;
    await fetch("/api/admin/opportunity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: opportunity.id, active: newActive }),
    });
    setActive(newActive);
    toast({ title: newActive ? "Oportunidade ativada" : "Oportunidade desativada" });
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Bloco importar texto ── */}
      <div className="glass rounded-xl border border-brand-gold/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setImportOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="font-semibold text-white text-sm">Importar texto e extrair automaticamente</span>
          </div>
          {importOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {importOpen && (
          <div className="px-5 pb-5 space-y-3 border-t border-border">
            <p className="text-xs text-muted-foreground pt-3">
              Cole qualquer texto sobre a oportunidade (WhatsApp, site, email) e clique em Extrair.
            </p>
            <Textarea
              placeholder={"Ex: Smiles com 100% de bônus na transferência, válido até 30/04/2026, mínimo de 1.000 pontos..."}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={5}
              className="text-sm"
            />
            <Button type="button" variant="gold" onClick={handleExtract} disabled={!importText.trim()}>
              <Sparkles className="w-4 h-4 mr-2" />
              Extrair informações
            </Button>
          </div>
        )}
      </div>

      {/* ── Bloco importar passagem ── */}
      <div className="glass rounded-xl border border-blue-500/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setImportFlightOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-sm">Importar texto de passagem</span>
          </div>
          {importFlightOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {importFlightOpen && (
          <div className="px-5 pb-5 space-y-3 border-t border-border">
            <p className="text-xs text-muted-foreground pt-3">
              Cole o texto da oportunidade de passagem (rota, milhas, taxa, datas, programa).
            </p>
            <Textarea
              placeholder={"Ex: LATAM Pass GRU → MIA por 60.000 milhas, taxa R$ 150, executiva, disponível de jan/2026 até mar/2026..."}
              value={importFlightText}
              onChange={(e) => setImportFlightText(e.target.value)}
              rows={5}
              className="text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleExtractFlight}
              disabled={!importFlightText.trim()}
            >
              <Plane className="w-4 h-4 mr-2" />
              Extrair passagem
            </Button>
          </div>
        )}
      </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título da oportunidade *</Label>
        <Input
          id="title"
          placeholder="Ex: Smiles com 100% de bônus na transferência"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Programa + Tipo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Programa *</Label>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPPORTUNITY_TYPES.map(({ value: v, label }) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campos de passagem */}
      {type === "passagem" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origem (IATA)</Label>
              <Input id="origin" placeholder="GRU" value={origin} onChange={(e) => setOrigin(e.target.value)} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destino (IATA)</Label>
              <Input id="destination" placeholder="MIA" value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={3} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={cabinClass} onValueChange={(v) => setCabinClass(v as "economy" | "business" | "any")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CABIN_CLASSES.map(({ value: v, label }) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milesAmount">Milhas necessárias</Label>
              <Input id="milesAmount" type="number" placeholder="60000" value={milesAmount} onChange={(e) => setMilesAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxAmount">Taxa (R$)</Label>
              <Input id="taxAmount" type="number" step="0.01" placeholder="150.00" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
            <div className="space-y-0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availableFrom">Disponível de</Label>
              <Input id="availableFrom" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableTo">Disponível até</Label>
              <Input id="availableTo" type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Campos de transferência/acúmulo */}
      {type !== "passagem" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bonusPercentage">Bônus (%)</Label>
              <Input id="bonusPercentage" type="number" placeholder="100" value={bonusPercentage} onChange={(e) => setBonusPercentage(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Válido até</Label>
              <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTransfer">Transferência mínima (pts)</Label>
              <Input id="minTransfer" type="number" placeholder="1000" value={minTransfer} onChange={(e) => setMinTransfer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTransfer">Transferência máxima (pts)</Label>
              <Input id="maxTransfer" type="number" placeholder="100000" value={maxTransfer} onChange={(e) => setMaxTransfer(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição / Observações</Label>
        <Textarea
          id="description"
          placeholder="Detalhes adicionais, regras, como aproveitar..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      {/* URL externa */}
      <div className="space-y-2">
        <Label htmlFor="externalUrl">Link externo</Label>
        <Input
          id="externalUrl"
          type="url"
          placeholder="https://..."
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
        />
      </div>

      {/* Flags */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isVip}
            onChange={(e) => setIsVip(e.target.checked)}
            className="w-4 h-4 accent-yellow-500 rounded"
          />
          <span className="text-sm text-white font-medium">Exclusiva PRO (VIP)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-green-500 rounded"
          />
          <span className="text-sm text-white font-medium">Ativa (visível no feed)</span>
        </label>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="gold" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {opportunity ? "Salvar alterações" : "Criar oportunidade"}
        </Button>
        {opportunity && (
          <>
            <Button type="button" variant="outline" onClick={handleToggleActive}>
              {active ? "Desativar" : "Ativar"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </>
        )}
      </div>
    </form>
    </div>
  );
}
