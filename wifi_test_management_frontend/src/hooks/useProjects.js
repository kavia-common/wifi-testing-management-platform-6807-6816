import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../api/client";

const keys = {
  all: ["projects"]
};

// PUBLIC_INTERFACE
export function useProjects() {
  /** Query hook for projects list. */
  const client = getApiClient();
  return useQuery({
    queryKey: keys.all,
    queryFn: () => client.getProjects()
  });
}

// PUBLIC_INTERFACE
export function useCreateProject() {
  /** Mutation hook to create a project and refresh the list. */
  const client = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.createProject(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all })
  });
}
