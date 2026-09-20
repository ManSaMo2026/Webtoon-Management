import type { Project } from "../types";

export function getProjectGenreLabel(project: Pick<Project, "genre" | "customGenre">) {
  return project.genre === "기타" ? project.customGenre?.trim() || "기타" : project.genre;
}

export function getProjectStatusLabel(project: Pick<Project, "status" | "customStatus">) {
  if (project.status === "기타") return project.customStatus?.trim() || "기타";
  return project.status || "연재중";
}
