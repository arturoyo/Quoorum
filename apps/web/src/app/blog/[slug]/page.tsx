import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Share2,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout";
import { LandingFooter } from "@/components/layout/landing-footer";
import { blogPosts, getBlogPost, getRelatedPosts } from "../data";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Artículo no encontrado | Quoorum Blog",
    };
  }

  return {
    title: `${post.title} | Quoorum Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 2);
  const Icon = post.icon;

  // Find previous and next posts for navigation
  const currentIndex = blogPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-40 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[var(--theme-text-secondary)] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al blog</span>
          </Link>

          {/* Category badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${post.gradient} text-xs font-medium text-white mb-6`}
          >
            <Icon className="w-3 h-3" />
            {post.category}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-[var(--theme-text-secondary)] mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} de lectura</span>
            </div>
            <div className="text-[var(--theme-text-tertiary)]">{post.date}</div>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--theme-text-tertiary)]">Compartir:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://quoorum.com/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en X (Twitter)"
              title="Compartir en X (Twitter)"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://quoorum.com/blog/${post.slug}`)}&title=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir en LinkedIn"
              title="Compartir en LinkedIn"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share) {
                  navigator.share({
                    title: post.title,
                    url: `https://quoorum.com/blog/${post.slug}`,
                  });
                }
              }}
              aria-label="Compartir"
              title="Compartir"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div
            className={`${post.image} h-64 md:h-80 rounded-3xl flex items-center justify-center`}
          >
            <div
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${post.gradient} flex items-center justify-center`}
            >
              <Icon className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <article className="prose prose-invert prose-lg max-w-none">
            <div
              className="
                [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-12 [&>h2]:mb-6
                [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-10 [&>h3]:mb-4
                [&>h4]:text-xl [&>h4]:font-semibold [&>h4]:text-white [&>h4]:mt-8 [&>h4]:mb-3
                [&>p]:text-[var(--theme-text-secondary)] [&>p]:leading-relaxed [&>p]:mb-6
                [&>ul]:text-[var(--theme-text-secondary)] [&>ul]:mb-6 [&>ul]:space-y-2
                [&>ol]:text-[var(--theme-text-secondary)] [&>ol]:mb-6 [&>ol]:space-y-2
                [&>li]:text-[var(--theme-text-secondary)]
                [&>blockquote]:border-l-4 [&>blockquote]:border-purple-500 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-[var(--theme-text-secondary)]
                [&>strong]:text-white [&>strong]:font-semibold
                [&>em]:text-[var(--theme-text-secondary)]
                [&>hr]:border-white/10 [&>hr]:my-12
                [&>code]:bg-white/10 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-purple-400
              "
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/^## /gm, '<h2>')
                  .replace(/^### /gm, '<h3>')
                  .replace(/^#### /gm, '<h4>')
                  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                  .replace(/^- (.+)$/gm, '<li>$1</li>')
                  .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
                  .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
                    if (match.includes('1.')) {
                      return `<ol>${match}</ol>`;
                    }
                    return `<ul>${match}</ul>`;
                  })
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^(?!<[hulo])/gm, '<p>')
                  .replace(/(?<![>])$/gm, '</p>')
                  .replace(/<p><\/p>/g, '')
                  .replace(/<p>(<[hulo])/g, '$1')
                  .replace(/(<\/[hulo][l]?>)<\/p>/g, '$1')
                  .replace(/<h2>/g, '</p><h2>')
                  .replace(/<\/h2>/g, '</h2><p>')
                  .replace(/<h3>/g, '</p><h3>')
                  .replace(/<\/h3>/g, '</h3><p>')
                  .replace(/<h4>/g, '</p><h4>')
                  .replace(/<\/h4>/g, '</h4><p>')
                  .replace(/<p>\s*<\/p>/g, '')
                  .trim(),
              }}
            />
          </article>
        </div>
      </section>

      {/* Post Navigation */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            {prevPost && (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="group relative p-6 rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl group-hover:bg-white/10 transition-colors" />
                <div className="absolute inset-0 border border-white/10 rounded-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[var(--theme-text-tertiary)] text-sm mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Artículo anterior</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                    {prevPost.title}
                  </h3>
                </div>
              </Link>
            )}

            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group relative p-6 rounded-2xl overflow-hidden md:text-right"
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl group-hover:bg-white/10 transition-colors" />
                <div className="absolute inset-0 border border-white/10 rounded-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[var(--theme-text-tertiary)] text-sm mb-3 md:justify-end">
                    <span>Siguiente artículo</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                    {nextPost.title}
                  </h3>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="pb-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-8">
              Artículos relacionados
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="group relative rounded-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl group-hover:bg-white/10 transition-colors" />
                  <div className="absolute inset-0 border border-white/10 rounded-2xl" />

                  <div className="relative z-10 p-6">
                    {/* Image */}
                    <div
                      className={`${relatedPost.image} h-32 rounded-xl mb-4 flex items-center justify-center`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${relatedPost.gradient} flex items-center justify-center`}
                      >
                        <relatedPost.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Category */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${relatedPost.gradient} text-xs font-medium text-white mb-3`}
                    >
                      {relatedPost.category}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
                      {relatedPost.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-[var(--theme-text-tertiary)]">
                      <span>{relatedPost.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-12 rounded-3xl overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />

            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para tomar mejores decisiones?
              </h2>
              <p className="text-lg text-[var(--theme-text-secondary)] mb-8 max-w-2xl mx-auto">
                Prueba Quoorum gratis y experimenta el poder de la deliberación
                multi-agente para tus decisiones de negocio.
              </p>
              <Link href="/debates/new-unified?new=1">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-8 py-6 text-lg">
                  Probar Quoorum gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
