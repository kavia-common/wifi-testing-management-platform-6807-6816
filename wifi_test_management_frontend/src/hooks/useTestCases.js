import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../api/client";

const keys = {
  all: ["testCases"]
};

// PUBLIC_INTERFACE
export function useTestCases() {
  /** Query hook for test cases list. */
  const client = getApiClient();
  return useQuery({
    queryKey: keys.all,
    queryFn: () => client.getTestCases()
  });
}

// PUBLIC_INTERFACE
export function useCreateTestCase() {
  /** Mutation hook to create a test case and refresh the list. */
  const client = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.createTestCase(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all })
  });
}
