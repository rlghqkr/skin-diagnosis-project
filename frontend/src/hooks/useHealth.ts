import { useEffect, useState } from "react";
import { fetchHealth } from "../api/health";
import type { HealthResponse } from "../types/api";

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const data = await fetchHealth();
        if (!cancelled) {
          setHealth(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { health, error };
}
