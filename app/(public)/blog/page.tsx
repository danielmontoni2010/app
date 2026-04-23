import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import type { BlogPost } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog | STM Radar — Dicas de Milhas e Pontos",
  description: "Aprenda a maximizar suas milhas com dicas, estratégias e análises do time de especialistas da STM.",
};

export default async function BlogPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, tags, published_at, created_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="text-brand-gold text-sm hover:underline mb-6 block">← STM Radar</Link>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-7 h-7 text-brand-gold" />
            <h1 className="font-display text-4xl font-bold text-white">Blog STM</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Estratégias, dicas e análises para maximizar suas milhas
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {(posts ?? []).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Nenhum post publicado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {(posts ?? []).map((post: Partial<BlogPost>) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="glass rounded-xl overflow-hidden hover:border-brand-gold/30 transition-all h-full flex flex-col">
                  {post.cover_image_url && (
                    <div className="aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <h2 className="font-display font-bold text-white text-lg leading-snug mb-2 group-hover:text-brand-gold transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      {formatDate(post.published_at ?? post.created_at ?? "")}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
