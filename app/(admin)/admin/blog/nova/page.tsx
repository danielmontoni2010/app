import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogPostForm } from "@/components/blog/BlogPostForm";

export default async function NovoBlogPostPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o blog
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Novo Post</h1>
      </div>
      <BlogPostForm userId={user.id} />
    </div>
  );
}
