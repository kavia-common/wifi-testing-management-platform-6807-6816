import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../api/client";

const keys = {
  all: ["testRuns"]
};

// PUBLIC_INTERFACE
export function useTestRuns() {
  /** Query hook for test runs list. */
  const client = getApiClient();
  return useQuery({
    queryKey: keys.all,
    queryFn: () => client.getTestRuns()
  });
}

// PUBLIC_INTERFACE
export function useStartTestRun() {
  /** Mutation hook to start a run and refresh runs/results. */
  const client = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.startTestRun(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: ["results"] });
    }
  });
}
