import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { BlogPost } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!data) return { title: "Post não encontrado | STM Radar" };
  const post = data as import("@/lib/supabase/types").BlogPost;

  return {
    title: `${post.title} | STM Radar Blog`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!data) notFound();
  const post = data as BlogPost;

  return (
    <div className="min-h-screen bg-background">
      {/* Capa */}
      {post.cover_image_url && (
        <div className="w-full h-72 md:h-96 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Link href="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 w-fit text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o blog
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Título */}
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
          <span>{formatDate(post.published_at ?? post.created_at)}</span>
          <span>·</span>
          <Link href="/" className="text-brand-gold hover:underline">STM Radar</Link>
        </div>

        {/* Conteúdo */}
        <div
          className="prose prose-invert prose-gold max-w-none
            prose-headings:font-display prose-headings:text-white
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-brand-gold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-blockquote:border-brand-gold prose-blockquote:text-muted-foreground
            prose-code:text-brand-gold prose-code:bg-white/5 prose-code:rounded prose-code:px-1
            prose-hr:border-border
            prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between gap-4 flex-wrap">
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Ver mais posts
          </Link>
          <Link href="/cadastro" className="text-sm text-brand-gold hover:underline font-medium">
            Criar conta no STM Radar →
          </Link>
        </div>
      </div>
    </div>
  );
}
