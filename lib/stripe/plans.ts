// Planos STM Radar — PagTrust
// Configure os IDs dos produtos após criar na PagTrust

export const PLANS = {
  essencial: {
    name: "Essencial",
    price: 3700, // R$37 em centavos
    maxGoals: 3,
    historyDays: 30,
    vipDelay: 7200000, // 2h em ms
    productId: process.env.PAGTRUST_PRODUCT_ESSENCIAL || "618598",
  },
  pro: {
    name: "Pro",
    price: 7700,
    maxGoals: Infinity,
    historyDays: 365,
    vipDelay: 0,
    productId: process.env.PAGTRUST_PRODUCT_PRO || "618599",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.productId === productId) return key as PlanKey;
  }
  return null;
}
