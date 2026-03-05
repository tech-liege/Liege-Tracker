import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { createRoadmapFromPlan, fetchRoadmaps, previewRoadmapFromGoal } from "@/api";
import { BoltIcon, Button, Field, ListIcon, PlusIcon, RoadmapIcon, Section, SparkIcon } from "@/components/ui";
import { useLayout } from "@/context/LayoutContext";
import { useSession } from "@/context/SessionContext";
import { tasks } from "@/func";
import { isGuestSession } from "@/utils/guestSession";

const { normalize } = tasks;

const inputClass =
  "w-full rounded-xl border border-border bg-[#f2f8fd] px-3 py-2.5 text-sm text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30";
const selectClass =
  "w-full rounded-xl border border-border bg-[#f2f8fd] px-3 py-2.5 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30";
const textareaClass =
  "w-full rounded-xl border border-border bg-[#f2f8fd] px-4 py-2.5 text-sm text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30";

function emptyTodo() {
  return { text: "", dueDate: "", priority: "medium", tags: [] };
}

function emptyMilestone(index) {
  return {
    title: `Milestone ${index + 1}`,
    description: "",
    startDate: "",
    endDate: "",
    todos: [emptyTodo()],
  };
}

export default function RoadmapsPage() {
  const { session, checkingSession } = useSession();
  const { setStatus } = useLayout();

  const [goal, setGoal] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [draft, setDraft] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);

  const isGuestUser = isGuestSession(session);

  useEffect(() => {
    let active = true;

    if (!session || isGuestUser) {
      setRoadmaps([]);
      setLoadingRoadmaps(false);
      return () => {
        active = false;
      };
    }

    setLoadingRoadmaps(true);
    fetchRoadmaps()
      .then((items) => {
        if (!active) return;
        setRoadmaps(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setLoadingRoadmaps(false);
      });

    return () => {
      active = false;
    };
  }, [isGuestUser, session?.token]);

  useEffect(() => {
    if (checkingSession) {
      setStatus({
        title: "Roadmaps",
        detail: "Checking session",
        meta: "Hold tight",
      });
      return;
    }

    if (!session) {
      setStatus({
        title: "Roadmaps",
        detail: "Sign in required",
        meta: "Guest",
      });
      return;
    }

    if (isGuestUser) {
      setStatus({
        title: "Roadmaps",
        detail: "Guest mode",
        meta: "AI disabled",
      });
      return;
    }

    setStatus({
      title: "Roadmaps",
      detail: `${roadmaps.length} saved`,
      meta: draft ? "Draft ready" : "No draft",
    });
  }, [
    checkingSession,
    draft,
    isGuestUser,
    roadmaps.length,
    session,
    setStatus,
  ]);

  const draftTaskCount = useMemo(() => {
    if (!draft?.milestones?.length) return 0;
    return draft.milestones.reduce(
      (count, milestone) => count + (milestone.todos?.length || 0),
      0,
    );
  }, [draft]);

  async function handlePreview(event) {
    event.preventDefault();

    if (isGuestUser) {
      setError("AI roadmap generation is unavailable in guest mode.");
      return;
    }

    const normalizedGoal = goal.trim();
    if (normalizedGoal.length < 5) {
      setError("Goal must be at least 5 characters.");
      return;
    }

    setPreviewBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await previewRoadmapFromGoal(normalizedGoal);
      const nextDraft = normalize.plan(
        response?.roadmapPlan,
        response?.goal || normalizedGoal,
      );
      setGoal(nextDraft.goal);
      setDraft(nextDraft);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewBusy(false);
    }
  }

  async function handleCreateRoadmap() {
    if (isGuestUser) {
      setError("AI roadmap generation is unavailable in guest mode.");
      return;
    }

    const normalizedGoal = goal.trim();
    if (!draft || normalizedGoal.length < 5) {
      setError("Generate a roadmap draft first.");
      return;
    }

    setCreateBusy(true);
    setError(null);

    try {
      const payload = await createRoadmapFromPlan(normalizedGoal, draft);
      const createdRoadmap = payload?.roadmap;
      const createdTodos = Array.isArray(payload?.todos)
        ? payload.todos.length
        : 0;

      if (createdRoadmap) {
        setRoadmaps((prev) => [createdRoadmap, ...prev]);
      }

      setSuccess(`Roadmap saved and ${createdTodos} todos created.`);
      setDraft(null);
      setGoal("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateBusy(false);
    }
  }

  function updateDraft(updater) {
    setDraft((previous) => {
      if (!previous) return previous;
      return updater(previous);
    });
  }

  function updateMilestoneField(milestoneIndex, field, value) {
    updateDraft((previous) => ({
      ...previous,
      milestones: previous.milestones.map((milestone, index) =>
        index === milestoneIndex ? { ...milestone, [field]: value } : milestone,
      ),
    }));
  }

  function updateTodoField(milestoneIndex, todoIndex, field, value) {
    updateDraft((previous) => ({
      ...previous,
      milestones: previous.milestones.map((milestone, index) => {
        if (index !== milestoneIndex) return milestone;
        return {
          ...milestone,
          todos: milestone.todos.map((todo, currentTodoIndex) =>
            currentTodoIndex === todoIndex ? { ...todo, [field]: value } : todo,
          ),
        };
      }),
    }));
  }

  function addMilestone() {
    updateDraft((previous) => ({
      ...previous,
      milestones: [...previous.milestones, emptyMilestone(previous.milestones.length)],
    }));
  }

  function removeMilestone(milestoneIndex) {
    updateDraft((previous) => {
      if (previous.milestones.length <= 1) return previous;
      return {
        ...previous,
        milestones: previous.milestones.filter((_, index) => index !== milestoneIndex),
      };
    });
  }

  function addTodo(milestoneIndex) {
    updateDraft((previous) => ({
      ...previous,
      milestones: previous.milestones.map((milestone, index) =>
        index === milestoneIndex
          ? {
              ...milestone,
              todos: [...milestone.todos, emptyTodo()],
            }
          : milestone,
      ),
    }));
  }

  function removeTodo(milestoneIndex, todoIndex) {
    updateDraft((previous) => ({
      ...previous,
      milestones: previous.milestones.map((milestone, index) => {
        if (index !== milestoneIndex) return milestone;
        if (milestone.todos.length <= 1) return milestone;
        return {
          ...milestone,
          todos: milestone.todos.filter(
            (_, currentTodoIndex) => currentTodoIndex !== todoIndex,
          ),
        };
      }),
    }));
  }

  if (checkingSession) {
    return (
      <Section>
        <p className="text-sm text-bark">Checking session...</p>
      </Section>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col gap-5">
      <Section className="ui-enter bg-white/95 sm:p-7">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-bark">
          <RoadmapIcon className="h-4 w-4" />
          Roadmaps
        </p>
        <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.2rem]">Strategy Builder</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bark">
          Generate a plan from a goal, refine milestones and todo details, then create roadmap + tasks in one action.
        </p>
      </Section>

      <Section className="ui-enter-delayed bg-white/95 sm:p-7">
        {isGuestUser ? (
          <div className="rounded-2xl border border-border bg-[#e6f1fa] p-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-bark">
              <SparkIcon className="h-4 w-4" />
              Guest mode
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink">AI roadmap generation is unavailable.</h2>
            <p className="mt-2 text-sm text-bark">Sign in with an account to preview and create AI roadmaps.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handlePreview} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field
                type="text"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Example: launch beta in 8 weeks with onboarding and analytics"
                className="text-base"
              />
              <Button type="submit" disabled={previewBusy} className="min-h-[48px]">
                <SparkIcon className="h-4 w-4" />
                {previewBusy ? "Generating..." : "Preview plan"}
              </Button>
            </form>

            {draft ? (
              <div className="mt-6 space-y-4 rounded-2xl border border-border bg-[#edf5fc] p-4 sm:p-5">
                <div className="grid gap-3">
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) =>
                      updateDraft((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                  <textarea
                    value={draft.summary}
                    onChange={(event) =>
                      updateDraft((previous) => ({
                        ...previous,
                        summary: event.target.value,
                      }))
                    }
                    rows={3}
                    className={textareaClass}
                    placeholder="Roadmap summary"
                  />
                </div>

                <div className="space-y-4">
                  {draft.milestones.map((milestone, milestoneIndex) => (
                    <article
                      key={`milestone-${milestoneIndex}`}
                      className={`rounded-2xl border border-border bg-white p-4 ui-stagger-base ui-stagger-${(milestoneIndex % 6) + 1}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-bark">Milestone {milestoneIndex + 1}</h3>
                        <button
                          type="button"
                          className="text-xs font-semibold text-bark underline hover:text-ink"
                          onClick={() => removeMilestone(milestoneIndex)}
                        >
                          Remove milestone
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(event) => updateMilestoneField(milestoneIndex, "title", event.target.value)}
                          placeholder="Milestone title"
                          className={inputClass}
                        />
                        <input
                          type="text"
                          value={milestone.description}
                          onChange={(event) => updateMilestoneField(milestoneIndex, "description", event.target.value)}
                          placeholder="Milestone description"
                          className={inputClass}
                        />
                        <input
                          type="date"
                          value={milestone.startDate}
                          onChange={(event) => updateMilestoneField(milestoneIndex, "startDate", event.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="date"
                          value={milestone.endDate}
                          onChange={(event) => updateMilestoneField(milestoneIndex, "endDate", event.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div className="mt-4 space-y-3">
                        {milestone.todos.map((todo, todoIndex) => (
                          <div
                            key={`milestone-${milestoneIndex}-todo-${todoIndex}`}
                            className="grid gap-2 rounded-xl border border-border bg-[#f2f8fd] p-3 lg:grid-cols-[1fr_170px_150px_1fr_auto]"
                          >
                            <input
                              type="text"
                              value={todo.text}
                              onChange={(event) => updateTodoField(milestoneIndex, todoIndex, "text", event.target.value)}
                              placeholder="Todo text"
                              className={inputClass}
                            />
                            <input
                              type="date"
                              value={todo.dueDate}
                              onChange={(event) => updateTodoField(milestoneIndex, todoIndex, "dueDate", event.target.value)}
                              className={inputClass}
                            />
                            <select
                              value={todo.priority}
                              onChange={(event) => updateTodoField(milestoneIndex, todoIndex, "priority", event.target.value)}
                              className={selectClass}
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                            <input
                              type="text"
                              value={todo.tags.join(", ")}
                              onChange={(event) => updateTodoField(milestoneIndex, todoIndex, "tags", normalize.tags(event.target.value.split(",")))}
                              placeholder="tags, comma, separated"
                              className={inputClass}
                            />
                            <button
                              type="button"
                              className="text-xs font-semibold text-bark underline hover:text-ink"
                              onClick={() => removeTodo(milestoneIndex, todoIndex)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <Button type="button" variant="secondary" className="mt-3 px-3 py-1.5 text-xs" onClick={() => addTodo(milestoneIndex)}>
                        <PlusIcon className="h-4 w-4" />
                        Add todo
                      </Button>
                    </article>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" onClick={addMilestone}>
                    <PlusIcon className="h-4 w-4" />
                    Add milestone
                  </Button>
                  <Button type="button" onClick={handleCreateRoadmap} disabled={createBusy}>
                    <RoadmapIcon className="h-4 w-4" />
                    {createBusy ? "Saving..." : `Create roadmap + ${draftTaskCount} todos`}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}

        {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
      </Section>

      <Section className="bg-white/95 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-ink">
            <ListIcon className="h-5 w-5" />
            Saved Roadmaps
          </h2>
          <span className="text-sm text-bark">{roadmaps.length} total</span>
        </div>

        {isGuestUser ? (
          <p className="mt-4 rounded-xl bg-[#e6f1fa] px-4 py-3 text-sm text-bark">No cloud roadmaps are available in guest mode.</p>
        ) : loadingRoadmaps ? (
          <p className="mt-4 text-sm text-bark">Loading roadmaps...</p>
        ) : roadmaps.length === 0 ? (
          <p className="mt-4 rounded-xl bg-[#e6f1fa] px-4 py-3 text-sm text-bark">No roadmaps yet. Generate your first plan above.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {roadmaps.map((roadmap, index) => (
              <li
                key={roadmap?._id || `roadmap-${index}`}
                className={`rounded-2xl border border-border bg-white p-4 ui-stagger-base ui-stagger-${(index % 6) + 1}`}
              >
                <p className="text-base font-semibold leading-tight text-ink">{roadmap.title}</p>
                {roadmap.summary ? <p className="mt-1.5 text-sm leading-relaxed text-bark">{roadmap.summary}</p> : null}
                <p className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-bark">
                  <BoltIcon className="h-4 w-4" />
                  {Array.isArray(roadmap.milestones) ? roadmap.milestones.length : 0} milestones
                  {roadmap.createdAt
                    ? ` • ${new Date(roadmap.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
