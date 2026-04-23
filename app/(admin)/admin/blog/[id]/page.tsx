import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogPostForm } from "@/components/blog/BlogPostForm";
import type { BlogPost } from "@/lib/supabase/types";

export default async function EditarBlogPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("blog_posts").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const post = data as BlogPost;

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o blog
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Editar Post</h1>
        <p className="text-muted-foreground mt-1">{post.title}</p>
      </div>
      <BlogPostForm userId={user.id} post={post} />
    </div>
  );
}
