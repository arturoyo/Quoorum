"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateDeliberationForm } from "@quoorum/ui";

export default function NewDeliberationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Forum
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/deliberations"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Deliberations
            </Link>
            <Link
              href="/experts"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Experts
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <Link
            href="/deliberations"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            &larr; Back to Deliberations
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Deliberation
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Set up a new deliberation session with AI experts
          </p>

          <div className="mt-8">
            <CreateDeliberationForm
              onSubmit={(_data) => {
                // TODO: Call tRPC mutation to create deliberation
                router.push("/deliberations");
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
