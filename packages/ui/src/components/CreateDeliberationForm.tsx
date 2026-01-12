import { clsx } from "clsx";
import { useState, type FormEvent, type ReactNode } from "react";

export interface CreateDeliberationInput {
  title: string;
  description: string;
  topic: string;
  objectives: string[];
  constraints: string[];
  maxRounds: number;
  consensusThreshold: number;
}

export interface CreateDeliberationFormProps {
  onSubmit: (data: CreateDeliberationInput) => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function CreateDeliberationForm({
  onSubmit,
  isLoading = false,
  className,
}: CreateDeliberationFormProps): ReactNode {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [objectivesText, setObjectivesText] = useState("");
  const [constraintsText, setConstraintsText] = useState("");
  const [maxRounds, setMaxRounds] = useState(5);
  const [consensusThreshold, setConsensusThreshold] = useState(70);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const objectives = objectivesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const constraints = constraintsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      title,
      description,
      topic,
      objectives,
      constraints,
      maxRounds,
      consensusThreshold,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={clsx("space-y-6", className)}>
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter deliberation title"
        />
      </div>

      <div>
        <label
          htmlFor="topic"
          className="block text-sm font-medium text-gray-700"
        >
          Topic
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Main topic for deliberation"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe the context and background"
        />
      </div>

      <div>
        <label
          htmlFor="objectives"
          className="block text-sm font-medium text-gray-700"
        >
          Objectives (one per line)
        </label>
        <textarea
          id="objectives"
          value={objectivesText}
          onChange={(e) => setObjectivesText(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="What should the deliberation achieve?"
        />
      </div>

      <div>
        <label
          htmlFor="constraints"
          className="block text-sm font-medium text-gray-700"
        >
          Constraints (one per line)
        </label>
        <textarea
          id="constraints"
          value={constraintsText}
          onChange={(e) => setConstraintsText(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="What limitations must be considered?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="maxRounds"
            className="block text-sm font-medium text-gray-700"
          >
            Max Rounds
          </label>
          <input
            id="maxRounds"
            type="number"
            value={maxRounds}
            onChange={(e) => setMaxRounds(parseInt(e.target.value, 10))}
            min={1}
            max={20}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="consensusThreshold"
            className="block text-sm font-medium text-gray-700"
          >
            Consensus Threshold (%)
          </label>
          <input
            id="consensusThreshold"
            type="number"
            value={consensusThreshold}
            onChange={(e) => setConsensusThreshold(parseInt(e.target.value, 10))}
            min={0}
            max={100}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={clsx(
          "w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium transition-colors",
          isLoading
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        )}
      >
        {isLoading ? "Creating..." : "Create Deliberation"}
      </button>
    </form>
  );
}
