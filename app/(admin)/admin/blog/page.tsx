import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/supabase/types";

export default async function AdminBlogPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Blog</h1>
          <p className="text-muted-foreground mt-1">Gerencie os posts do blog STM</p>
        </div>
        <Link href="/admin/blog/nova">
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            Novo Post
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {(posts ?? []).length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-white font-medium mb-4">Nenhum post ainda</p>
            <Link href="/admin/blog/nova">
              <Button variant="gold" size="sm">Criar primeiro post</Button>
            </Link>
          </div>
        )}

        {(posts ?? []).map((post: BlogPost) => (
          <Link key={post.id} href={`/admin/blog/${post.id}`}>
            <div className="glass rounded-xl p-4 flex items-center justify-between gap-4 hover:border-brand-gold/20 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
                  {post.published
                    ? <Eye className="w-4 h-4 text-brand-gold" />
                    : <EyeOff className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /blog/{post.slug} · {formatDate(post.created_at)}
                    {post.tags?.length ? ` · ${post.tags.slice(0, 3).join(", ")}` : ""}
                  </p>
                </div>
              </div>
              <Badge variant={post.published ? "success" : "secondary"} className="shrink-0 text-xs">
                {post.published ? "Publicado" : "Rascunho"}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
