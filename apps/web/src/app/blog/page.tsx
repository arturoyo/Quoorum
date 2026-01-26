'use client'

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";
import { LandingFooter } from "@/components/layout/landing-footer";
import { blogPosts, categories } from "./data";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [visibleCount, setVisibleCount] = useState(4);

  const filteredPosts = selectedCategory === "Todos"
    ? blogPosts
    : blogPosts.filter((post) => post.category === selectedCategory);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <div className="min-h-screen bg-[var(--theme-landing-bg)]">
      {/* Header */}
      <AppHeader variant="landing" showAuth={true} />

      {/* Hero */}
      <section className="pt-40 pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] text-sm text-[var(--theme-text-secondary)] mb-8">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Blog de Quoorum</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-[var(--theme-text-primary)] mb-8 tracking-tight">
              Insights sobre{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                decisiones inteligentes
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-[var(--theme-text-secondary)] max-w-3xl mx-auto leading-relaxed">
              Artículos, casos de estudio y reflexiones sobre cómo la IA está
              transformando la manera en que tomamos decisiones importantes.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setVisibleCount(4);
                }}
                className={`px-6 py-2 rounded-full text-sm transition-all ${
                  category === selectedCategory
                    ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                    : "bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-landing-card-hover)] hover:text-[var(--theme-text-primary)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {visiblePosts.map((post) => {
              const Icon = post.icon;
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group relative rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform"
                >
                  <div className="absolute inset-0 bg-[var(--theme-landing-card)] backdrop-blur-xl" />
                  <div className="absolute inset-0 border border-[var(--theme-landing-border)] rounded-3xl" />

                  <article className="relative z-10 p-8">
                    {/* Image placeholder with gradient */}
                    <div
                      className={`${post.image} h-48 rounded-2xl mb-6 flex items-center justify-center`}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${post.gradient} flex items-center justify-center`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Category */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${post.gradient} bg-opacity-10 text-xs font-medium text-[var(--theme-text-primary)] mb-4`}
                    >
                      {post.category}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-4 group-hover:text-purple-400 transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-[var(--theme-text-secondary)] mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-6 text-sm text-[var(--theme-text-tertiary)]">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mt-4 text-xs text-[var(--theme-text-tertiary)]">{post.date}</div>

                    {/* Read More */}
                    <div className="mt-6 flex items-center gap-2 text-purple-400 group-hover:gap-3 transition-all">
                      <span className="text-sm font-medium">Leer más</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-16">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="border-[var(--theme-landing-border)] hover:bg-[var(--theme-landing-card-hover)] text-[var(--theme-text-primary)] px-8"
              >
                Cargar más artículos
              </Button>
            </div>
          )}

          {/* No results message */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[var(--theme-text-secondary)] text-lg">
                No hay artículos en esta categoría todavía.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-16 rounded-[3rem] overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-[var(--theme-landing-border)] rounded-[3rem]" />

            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--theme-text-primary)] mb-6">
                Recibe nuevos artículos en tu inbox
              </h2>
              <p className="text-xl text-[var(--theme-text-secondary)] mb-10">
                Únete a cientos de profesionales que reciben nuestros insights
                semanales sobre decisiones estratégicas y tecnología.
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-6 h-12 rounded-2xl bg-[var(--theme-landing-card)] border border-[var(--theme-landing-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-8 h-12">
                  Suscribirse
                </Button>
              </div>

              <p className="text-sm text-[var(--theme-text-tertiary)] mt-4">
                Sin spam. Cancela cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
