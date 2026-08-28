import { Outlet, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api/projects";
import { MainLayout } from "../components/layout/MainLayout";
import { SkeletonList, ErrorState } from "../components/ui/Skeleton";

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout projectMode>
        <SkeletonList count={3} />
      </MainLayout>
    );
  }

  if (isError || !project) {
    return (
      <MainLayout projectMode>
        <ErrorState message="프로젝트를 불러올 수 없습니다." onRetry={refetch} />
      </MainLayout>
    );
  }

  return (
    <MainLayout projectMode projectTitle={project.title}>
      <Outlet context={{ project }} />
    </MainLayout>
  );
}
