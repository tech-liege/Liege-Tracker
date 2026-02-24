import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  createRoadmapFromPlan,
  fetchRoadmaps,
  previewRoadmapFromGoal,
} from "../../api";
import { useLayout } from "../../context/LayoutContext";
import { useSession } from "../../context/SessionContext";
import { isGuestSession } from "../../utils/guestSession";
import functions from "../functions";

const { task_todo } = functions;
const { normalize } = task_todo;

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
      milestones: [
        ...previous.milestones,
        emptyMilestone(previous.milestones.length),
      ],
    }));
  }

  function removeMilestone(milestoneIndex) {
    updateDraft((previous) => {
      if (previous.milestones.length <= 1) return previous;
      return {
        ...previous,
        milestones: previous.milestones.filter(
          (_, index) => index !== milestoneIndex,
        ),
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
      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-sm text-bark">Checking session...</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="ui-enter rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-bark">
          Strategy
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          Roadmap Generator
        </h1>
        <p className="mt-2 text-sm text-bark">
          Define a goal, review the AI plan, edit details, then confirm to
          create todos.
        </p>
      </header>

      <section className="ui-enter-delayed rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        {isGuestUser ? (
          <div className="rounded-2xl border border-border bg-sand p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bark">
              Guest mode
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink">
              AI roadmap is disabled for guests.
            </h2>
            <p className="mt-2 text-sm text-bark">
              Sign in with an account to preview and create AI roadmaps.
            </p>
          </div>
        ) : (
          <>
            <form
              onSubmit={handlePreview}
              className="grid gap-3 sm:grid-cols-[1fr_auto]"
            >
              <input
                type="text"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Example: launch beta in 8 weeks with onboarding and analytics"
                className="w-full rounded-2xl border border-border bg-sand px-4 py-3 text-base text-ink placeholder:text-bark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
              />
              <button
                type="submit"
                disabled={previewBusy}
                className="rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {previewBusy ? "Generating..." : "Preview plan"}
              </button>
            </form>

            {draft ? (
              <div className="mt-6 rounded-2xl border border-border bg-sand/70 p-4 sm:p-5">
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
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
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
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                    placeholder="Roadmap summary"
                  />
                </div>

                <div className="mt-5 grid gap-4">
                  {draft.milestones.map((milestone, milestoneIndex) => (
                    <article
                      key={`milestone-${milestoneIndex}`}
                      className="rounded-2xl border border-border bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-bark">
                          Milestone {milestoneIndex + 1}
                        </h3>
                        <button
                          type="button"
                          className="text-xs text-bark underline"
                          onClick={() => removeMilestone(milestoneIndex)}
                        >
                          Remove milestone
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(event) =>
                            updateMilestoneField(
                              milestoneIndex,
                              "title",
                              event.target.value,
                            )
                          }
                          placeholder="Milestone title"
                          className="w-full rounded-xl border border-border bg-sand px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                        />
                        <input
                          type="text"
                          value={milestone.description}
                          onChange={(event) =>
                            updateMilestoneField(
                              milestoneIndex,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Milestone description"
                          className="w-full rounded-xl border border-border bg-sand px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                        />
                        <input
                          type="date"
                          value={milestone.startDate}
                          onChange={(event) =>
                            updateMilestoneField(
                              milestoneIndex,
                              "startDate",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-border bg-sand px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                        />
                        <input
                          type="date"
                          value={milestone.endDate}
                          onChange={(event) =>
                            updateMilestoneField(
                              milestoneIndex,
                              "endDate",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-border bg-sand px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                        />
                      </div>

                      <div className="mt-4 grid gap-3">
                        {milestone.todos.map((todo, todoIndex) => (
                          <div
                            key={`milestone-${milestoneIndex}-todo-${todoIndex}`}
                            className="grid gap-2 rounded-xl border border-border bg-sand p-3 lg:grid-cols-[1fr_170px_150px_1fr_auto]"
                          >
                            <input
                              type="text"
                              value={todo.text}
                              onChange={(event) =>
                                updateTodoField(
                                  milestoneIndex,
                                  todoIndex,
                                  "text",
                                  event.target.value,
                                )
                              }
                              placeholder="Todo text"
                              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                            />
                            <input
                              type="date"
                              value={todo.dueDate}
                              onChange={(event) =>
                                updateTodoField(
                                  milestoneIndex,
                                  todoIndex,
                                  "dueDate",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                            />
                            <select
                              value={todo.priority}
                              onChange={(event) =>
                                updateTodoField(
                                  milestoneIndex,
                                  todoIndex,
                                  "priority",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                            <input
                              type="text"
                              value={todo.tags.join(", ")}
                              onChange={(event) =>
                                updateTodoField(
                                  milestoneIndex,
                                  todoIndex,
                                  "tags",
                                  normalize.tags(event.target.value.split(",")),
                                )
                              }
                              placeholder="tags, comma, separated"
                              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
                            />
                            <button
                              type="button"
                              className="text-xs text-bark underline"
                              onClick={() =>
                                removeTodo(milestoneIndex, todoIndex)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="mt-3 rounded-full border border-border px-3 py-1 text-xs text-ink transition hover:border-ember/70"
                        onClick={() => addTodo(milestoneIndex)}
                      >
                        Add todo
                      </button>
                    </article>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-border px-4 py-2 text-sm text-ink transition hover:border-ember/70"
                    onClick={addMilestone}
                  >
                    Add milestone
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRoadmap}
                    disabled={createBusy}
                    className="rounded-2xl bg-ember px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(217,115,66,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {createBusy
                      ? "Saving..."
                      : `Create roadmap + ${draftTaskCount} todos`}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {success ? (
          <p className="mt-4 text-sm text-emerald-700">{success}</p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-border bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">Saved Roadmaps</h2>
          <span className="text-sm text-bark">{roadmaps.length} total</span>
        </div>

        {isGuestUser ? (
          <p className="mt-4 text-sm text-bark">
            No cloud roadmaps are available in guest mode.
          </p>
        ) : loadingRoadmaps ? (
          <p className="mt-4 text-sm text-bark">Loading roadmaps...</p>
        ) : roadmaps.length === 0 ? (
          <p className="mt-4 text-sm text-bark">
            No roadmaps yet. Generate your first plan above.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {roadmaps.map((roadmap, index) => (
              <li
                key={roadmap?._id || `roadmap-${index}`}
                className="rounded-2xl border border-border bg-sand p-4"
              >
                <p className="text-sm font-semibold text-ink">
                  {roadmap.title}
                </p>
                {roadmap.summary ? (
                  <p className="mt-1 text-sm text-bark">{roadmap.summary}</p>
                ) : null}
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-bark">
                  {Array.isArray(roadmap.milestones)
                    ? roadmap.milestones.length
                    : 0}{" "}
                  milestones
                  {roadmap.createdAt
                    ? ` • ${new Date(roadmap.createdAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
