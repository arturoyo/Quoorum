"use client";

import Link from "next/link";
import { DeliberationCard } from "@quoorum/ui";


const mockDeliberations = [
  {
    id: "1",
    title: "Cloud Infrastructure Migration Strategy",
    description:
      "Evaluate options for migrating our on-premise infrastructure to cloud providers, considering cost, security, and scalability.",
    status: "active" as const,
    consensusScore: 0.65,
    currentRound: 3,
    maxRounds: 5,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Product Pricing Model Revision",
    description:
      "Assess the current pricing strategy and propose adjustments to improve market competitiveness while maintaining profitability.",
    status: "completed" as const,
    consensusScore: 0.85,
    currentRound: 4,
    maxRounds: 5,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    title: "Remote Work Policy Update",
    description:
      "Review and update the company remote work policy to balance employee flexibility with team collaboration needs.",
    status: "draft" as const,
    createdAt: new Date("2024-01-18"),
  },
];

export default function DeliberationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-[var(--theme-text-primary)]">
            Quoorum
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/deliberations"
              className="text-sm font-medium text-blue-600"
            >
              Deliberations
            </Link>
            <Link
              href="/experts"
              className="text-sm font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
            >
              Experts
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)]">Deliberations</h1>
            <p className="mt-1 text-sm text-[var(--theme-text-tertiary)]">
              View and manage your deliberation sessions
            </p>
          </div>
          <Link
            href="/deliberations/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            New Deliberation
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockDeliberations.map((deliberation) => (
            <DeliberationCard
              key={deliberation.id}
              {...deliberation}
              onClick={() => {
                window.location.href = `/deliberations/${deliberation.id}`;
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
