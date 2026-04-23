// Layout público — sem sidebar, sem autenticação obrigatória
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
