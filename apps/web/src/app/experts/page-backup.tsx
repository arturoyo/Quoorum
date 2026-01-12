"use client";

import Link from "next/link";
import { ExpertPanel, type ExpertInfo } from "@forum/ui";
import { useState } from "react";

const mockExperts: ExpertInfo[] = [
  {
    id: "1",
    name: "Strategic Analyst",
    expertise: "Business Strategy and Market Analysis",
    category: "Strategy",
    isActive: true,
  },
  {
    id: "2",
    name: "Technical Architect",
    expertise: "Systems Architecture and Technology",
    category: "Technology",
    isActive: true,
  },
  {
    id: "3",
    name: "Risk Manager",
    expertise: "Risk Assessment and Mitigation",
    category: "Risk",
    isActive: true,
  },
  {
    id: "4",
    name: "Financial Advisor",
    expertise: "Financial Analysis and Investment",
    category: "Finance",
    isActive: true,
  },
  {
    id: "5",
    name: "User Advocate",
    expertise: "User Experience and Customer Needs",
    category: "Product",
    isActive: true,
  },
  {
    id: "6",
    name: "Ethics Advisor",
    expertise: "Ethics and Social Responsibility",
    category: "Governance",
    isActive: true,
  },
  {
    id: "7",
    name: "Legal Counsel",
    expertise: "Legal and Regulatory Compliance",
    category: "Governance",
    isActive: true,
  },
  {
    id: "8",
    name: "Innovation Catalyst",
    expertise: "Innovation and Emerging Technologies",
    category: "Technology",
    isActive: true,
  },
];

export default function ExpertsPage() {
  const [selectedExpertId, setSelectedExpertId] = useState<string>();
  const selectedExpert = mockExperts.find((e) => e.id === selectedExpertId);

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
            <Link href="/experts" className="text-sm font-medium text-blue-600">
              Experts
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Experts</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage the AI experts available for deliberations
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Expert Panel</h2>
            <ExpertPanel
              experts={mockExperts}
              selectedExpertId={selectedExpertId}
              onSelectExpert={setSelectedExpertId}
            />
          </div>

          <div className="lg:col-span-2">
            {selectedExpert ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedExpert.name}
                </h2>
                <p className="mt-1 text-sm text-blue-600">
                  {selectedExpert.expertise}
                </p>
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900">About</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    This AI expert specializes in {selectedExpert.expertise.toLowerCase()}.
                    They provide valuable insights during deliberation sessions,
                    contributing unique perspectives based on their domain expertise.
                  </p>
                </div>
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900">Category</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedExpert.category ?? "General"}
                  </p>
                </div>
                <div className="mt-6">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      selectedExpert.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedExpert.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12">
                <p className="text-sm text-gray-500">
                  Select an expert to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
