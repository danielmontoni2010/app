import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMiles(miles: number): string {
  return new Intl.NumberFormat("pt-BR").format(miles) + " milhas";
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export function formatDate(date: string | Date): string {
  // Se for string no formato "YYYY-MM-DD", interpreta como local para evitar bug de timezone UTC
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(y, m - 1, d));
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatWeekdayDate(date: string): string {
  // Espera "YYYY-MM-DD"; interpreta como local para evitar bug de timezone UTC
  const [y, m, d] = date.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(local).replace(".", "");
  const day = local.getDate();
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(local).replace(".", "");
  return `${weekday}., ${day} de ${month}`;
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function datesOverlap(
  availableDates: { from: string; to: string }[] | null,
  goalFrom: string | null,
  goalTo: string | null
): boolean {
  if (!availableDates || !goalFrom || !goalTo) return true;
  const gFrom = new Date(goalFrom);
  const gTo = new Date(goalTo);
  return availableDates.some(({ from, to }) => {
    const aFrom = new Date(from);
    const aTo = new Date(to);
    return aFrom <= gTo && aTo >= gFrom;
  });
}

// R$ por 1.000 milhas, usado para estimar o preço de compra das milhas por programa
const MILES_PRICE_PER_THOUSAND: Record<string, number> = {
  "smiles": 19.5,
  "latam pass": 30,
  "tudoazul": 19.5,
  "azul fidelidade": 19.5,
};

export function calculateMilesPrice(program: string | null, milesAmount: number | null): number | null {
  if (!program || !milesAmount) return null;
  const rate = MILES_PRICE_PER_THOUSAND[program.toLowerCase()];
  if (rate == null) return null;
  return (milesAmount / 1000) * rate;
}

export const CABIN_CLASS_LABELS: Record<string, string> = {
  economy: "Econômica",
  business: "Executiva",
  any: "Qualquer",
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  flight: "Passagem",
  accumulation: "Acúmulo",
  card: "Cartão",
};

export const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  "transferencia-bonus": "Transferência Bônus",
  "acumulo-turbinado": "Acúmulo Turbinado",
  clube: "Clube",
  cartao: "Cartão",
};

export const STATUS_AGENCY_LABELS: Record<string, string> = {
  new: "Novo",
  quoting: "Em cotação",
  sent: "Enviado",
  closed: "Fechado",
  lost: "Perdido",
};
