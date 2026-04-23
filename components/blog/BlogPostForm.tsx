"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TipTapEditor } from "./TipTapEditor";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { slugify } from "@/lib/utils";
import type { BlogPost } from "@/lib/supabase/types";

interface BlogPostFormProps {
  userId: string;
  post?: BlogPost;
}

export function BlogPostForm({ userId, post }: BlogPostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image_url ?? "");
  const [tags, setTags] = useState(post?.tags?.join(", ") ?? "");
  const [published, setPublished] = useState(post?.published ?? false);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!post) setSlug(slugify(v)); // auto-slug apenas em novo post
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content || !slug) {
      toast({ title: "Preencha título, slug e conteúdo", variant: "destructive" });
      return;
    }
    setLoading(true);

    const tagsArr = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      cover_image_url: coverImageUrl || null,
      tags: tagsArr.length ? tagsArr : null,
      published,
      published_at: published ? (post?.published_at ?? new Date().toISOString()) : null,
      created_by: userId,
    };

    let error;
    if (post) {
      ({ error } = await supabase.from("blog_posts").update(payload as never).eq("id", post.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload as never));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: post ? "Post atualizado!" : "Post criado!" });
    router.push("/admin/blog");
    router.refresh();
  }

  async function handleDelete() {
    if (!post || !confirm("Excluir este post?")) return;
    await supabase.from("blog_posts").delete().eq("id", post.id);
    toast({ title: "Post excluído" });
    router.push("/admin/blog");
    router.refresh();
  }

  async function togglePublished() {
    if (!post) return;
    const newVal = !published;
    await supabase.from("blog_posts").update({
      published: newVal,
      published_at: newVal ? new Date().toISOString() : null,
    } as never).eq("id", post.id);
    setPublished(newVal);
    toast({ title: newVal ? "Post publicado!" : "Post despublicado" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Título do post"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo *</Label>
            <TipTapEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar de metadados */}
        <div className="space-y-5">
          {/* Publicar */}
          <div className="glass rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-white text-sm">Publicação</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 accent-yellow-500"
              />
              <span className="text-sm text-white">Publicar no site</span>
            </label>
            {post && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={togglePublished}
                className="w-full gap-2"
              >
                {published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {published ? "Despublicar" : "Publicar agora"}
              </Button>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <Input
              id="slug"
              placeholder="meu-post-incrivel"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">/blog/{slug || "..."}</p>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Resumo (SEO)</Label>
            <Textarea
              id="excerpt"
              placeholder="Breve descrição que aparece nas listagens e no Google..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Imagem de capa */}
          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">URL da imagem de capa</Label>
            <Input
              id="coverImageUrl"
              type="url"
              placeholder="https://..."
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImageUrl} alt="Capa" className="rounded-lg w-full h-32 object-cover mt-2" />
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="milhas, smiles, transferência"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separadas por vírgula</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <Button type="submit" variant="gold" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {post ? "Salvar alterações" : "Criar post"}
        </Button>
        {post && (
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
        )}
        {post && (
          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto">
            <Button type="button" variant="outline" className="gap-2">
              <Eye className="w-4 h-4" /> Ver post
            </Button>
          </a>
        )}
      </div>
    </form>
  );
}
