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

// Dark theme input classes - Quoorum Design System
const inputClasses = "mt-1 block w-full rounded-md border border-[#2a3942] bg-[#2a3942] px-3 py-2 text-white placeholder:text-[#8696a0] shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors";
const labelClasses = "block text-sm font-medium text-[#aebac1]";

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
        <label htmlFor="title" className={labelClasses}>
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClasses}
          placeholder="Enter deliberation title"
        />
      </div>

      <div>
        <label htmlFor="topic" className={labelClasses}>
          Topic
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className={inputClasses}
          placeholder="Main topic for deliberation"
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className={inputClasses}
          placeholder="Describe the context and background"
        />
      </div>

      <div>
        <label htmlFor="objectives" className={labelClasses}>
          Objectives (one per line)
        </label>
        <textarea
          id="objectives"
          value={objectivesText}
          onChange={(e) => setObjectivesText(e.target.value)}
          rows={3}
          className={inputClasses}
          placeholder="What should the deliberation achieve?"
        />
      </div>

      <div>
        <label htmlFor="constraints" className={labelClasses}>
          Constraints (one per line)
        </label>
        <textarea
          id="constraints"
          value={constraintsText}
          onChange={(e) => setConstraintsText(e.target.value)}
          rows={3}
          className={inputClasses}
          placeholder="What limitations must be considered?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="maxRounds" className={labelClasses}>
            Max Rounds
          </label>
          <input
            id="maxRounds"
            type="number"
            value={maxRounds}
            onChange={(e) => setMaxRounds(parseInt(e.target.value, 10))}
            min={1}
            max={20}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="consensusThreshold" className={labelClasses}>
            Consensus Threshold (%)
          </label>
          <input
            id="consensusThreshold"
            type="number"
            value={consensusThreshold}
            onChange={(e) => setConsensusThreshold(parseInt(e.target.value, 10))}
            min={0}
            max={100}
            className={inputClasses}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={clsx(
          "w-full rounded-md bg-purple-600 px-4 py-2 text-white font-medium transition-colors",
          isLoading
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
        )}
      >
        {isLoading ? "Creating..." : "Create Deliberation"}
      </button>
    </form>
  );
}
