"use client";

import { useEffect, useState } from "react";

// Cache em memória compartilhado entre todos os cards da sessão
const cache = new Map<string, string | null>();

/**
 * Busca uma foto representativa da cidade via Wikipedia (sem custo, sem API key).
 * Retorna: undefined = carregando, null = sem imagem encontrada, string = URL da imagem.
 */
export function useCityImage(cityName: string | null): string | null | undefined {
  const [image, setImage] = useState<string | null | undefined>(
    cityName ? cache.get(cityName) : null
  );

  useEffect(() => {
    if (!cityName) {
      setImage(null);
      return;
    }
    if (cache.has(cityName)) {
      setImage(cache.get(cityName)!);
      return;
    }

    let cancelled = false;
    setImage(undefined);

    fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const url: string | null = data?.thumbnail?.source ?? data?.originalimage?.source ?? null;
        cache.set(cityName, url);
        if (!cancelled) setImage(url);
      })
      .catch(() => {
        cache.set(cityName, null);
        if (!cancelled) setImage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [cityName]);

  return image;
}
