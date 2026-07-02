import { NextRequest, NextResponse } from "next/server";

export const revalidate = 86400; // cache por 24h — o destino de uma foto não muda

// Unsplash não lida bem com acentos/qualificadores ("Montevidéu" = 0 resultados,
// "Montevideo" = 88); normaliza para melhorar o match da busca.
function normalizeForSearch(city: string): string {
  const combiningDiacriticsStart = String.fromCharCode(0x0300);
  const combiningDiacriticsEnd = String.fromCharCode(0x036f);
  const diacriticsRe = new RegExp(`[${combiningDiacriticsStart}-${combiningDiacriticsEnd}]`, "g");
  return city
    .replace(/\s*\(.*?\)\s*/g, "") // remove qualificador, ex: "(Bahia)"
    .normalize("NFD")
    .replace(diacriticsRe, ""); // remove acentos
}

async function searchUnsplash(query: string, accessKey: string): Promise<string | null> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${accessKey}` }, next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.results?.[0]?.urls?.regular ?? null;
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  if (!city) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ url: null });
  }

  const normalized = normalizeForSearch(city);

  // Prioriza pontos turísticos/marcos famosos; se não achar (cidades menores),
  // cai para o nome da cidade puro, que ainda costuma trazer paisagem urbana.
  const url =
    (await searchUnsplash(`${normalized} famous landmark`, accessKey)) ??
    (await searchUnsplash(normalized, accessKey));

  return NextResponse.json({ url });
}
