import { useState } from "react";
import { analyze } from "../api/analyze";
import type { AnalyzeResponse } from "../types/api";
import axios from "axios";

export function useAnalyze() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyze(file);
      setResult(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(detail ?? err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, loading, error, run, reset };
}
