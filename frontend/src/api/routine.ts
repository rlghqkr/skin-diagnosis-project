import client from "./client";

export interface RoutineStepPayload {
  order: number;
  category: string;
  product_id: string | null;
  product_name: string;
  amount?: string | null;
  duration_seconds?: number | null;
  notes?: string | null;
}

export interface RoutineCreatePayload {
  user_id: string;
  routine_date: string; // YYYY-MM-DD
  time_of_day: "morning" | "night";
  steps: RoutineStepPayload[];
  notes?: string | null;
  is_template?: boolean;
  template_name?: string | null;
}

export interface RoutineUpdatePayload {
  routine_date?: string | null;
  time_of_day?: "morning" | "night" | null;
  steps?: RoutineStepPayload[] | null;
  notes?: string | null;
  is_template?: boolean | null;
  template_name?: string | null;
}

export interface RoutineResponse {
  routine_id: string;
  user_id: string;
  routine_date: string;
  time_of_day: string;
  steps: RoutineStepPayload[] | null;
  notes: string | null;
  is_template: boolean;
  template_name: string | null;
  total_products: number | null;
  created_at: string;
  updated_at: string;
}

export async function listRoutines(date: string): Promise<RoutineResponse[]> {
  const { data } = await client.get<RoutineResponse[]>("/v1/routines", {
    params: { date },
  });
  return data;
}

export async function createRoutine(payload: RoutineCreatePayload): Promise<RoutineResponse> {
  const { data } = await client.post<RoutineResponse>("/v1/routines", payload);
  return data;
}

export async function updateRoutine(
  routineId: string,
  payload: RoutineUpdatePayload,
): Promise<RoutineResponse> {
  const { data } = await client.put<RoutineResponse>(`/v1/routines/${routineId}`, payload);
  return data;
}

export async function deleteRoutine(routineId: string): Promise<void> {
  await client.delete(`/v1/routines/${routineId}`);
}

export async function getStreak(): Promise<number> {
  const { data } = await client.get<{ streak: number }>("/v1/routines/streak");
  return data.streak;
}
