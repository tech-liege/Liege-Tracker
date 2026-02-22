import type { FormEvent } from "react";
import type { Roadmap } from "../types";

type Props = {
  goal: string;
  setGoal: (value: string) => void;
  handleGenerateRoadmap: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isGeneratingRoadmap: boolean;
  roadmapError: string | null;
  latestRoadmap: Roadmap | null;
};

export default function AiRoadmapPanel({
  goal,
  setGoal,
  handleGenerateRoadmap,
  isGeneratingRoadmap,
  roadmapError,
  latestRoadmap,
}: Props) {
  return (
    <div className="rounded-2xl border border-border/70 bg-sand/70 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bark">
        AI Roadmap
      </p>
      <h2 className="mt-2 text-xl font-semibold text-ink sm:text-2xl">
        Describe a goal and auto-generate todos.
      </h2>
      <form
        onSubmit={handleGenerateRoadmap}
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
      >
        <input
          type="text"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Launch MVP by June with weekly deliverables"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-base text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
        />
        <button
          type="submit"
          disabled={isGeneratingRoadmap}
          className="rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGeneratingRoadmap ? "Generating..." : "Generate"}
        </button>
      </form>
      {roadmapError ? (
        <p className="mt-3 text-sm text-red-700">{roadmapError}</p>
      ) : null}
      {latestRoadmap ? (
        <div className="mt-4 rounded-xl border border-border bg-white/80 p-4">
          <p className="text-sm font-semibold text-ink">{latestRoadmap.title}</p>
          {latestRoadmap.summary ? (
            <p className="mt-1 text-sm text-bark">{latestRoadmap.summary}</p>
          ) : null}
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-bark">
            {latestRoadmap.milestones?.length || 0} milestones saved
          </p>
        </div>
      ) : null}
    </div>
  );
}
