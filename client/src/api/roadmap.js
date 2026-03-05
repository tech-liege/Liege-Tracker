import { authHeaders, handleJson, toApiUrl } from "./func";

export async function fetchRoadmaps() {
  const res = await fetch(toApiUrl("/roadmaps"), { headers: authHeaders() });
  return handleJson(res);
}

export async function previewRoadmapFromGoal(goal) {
  const res = await fetch(toApiUrl("/roadmaps/preview"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ goal }),
  });
  return handleJson(res);
}

export async function createRoadmapFromPlan(goal, roadmapPlan) {
  const res = await fetch(toApiUrl("/roadmaps"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ goal, roadmapPlan }),
  });
  return handleJson(res);
}
