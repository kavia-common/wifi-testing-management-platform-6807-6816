import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "../api/client";

const keys = {
  all: ["results"]
};

// PUBLIC_INTERFACE
export function useResults() {
  /** Query hook for results list. */
  const client = getApiClient();
  return useQuery({
    queryKey: keys.all,
    queryFn: () => client.getResults()
  });
}
