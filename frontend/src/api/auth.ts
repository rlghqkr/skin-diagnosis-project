import client from "./client";

export interface RegisterPayload {
  email: string;
  nickname: string;
  password: string;
  age?: number | null;
  gender?: "male" | "female" | "other" | null;
  skin_type?: "dry" | "oily" | "combination" | "sensitive" | "normal" | null;
  skin_concerns?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  nickname: string;
  age: number | null;
  gender: string | null;
  skin_type: string | null;
  skin_concerns: string[] | null;
  baseline_skin_score: number | null;
  profile_image_url: string | null;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function register(payload: RegisterPayload): Promise<UserProfile> {
  const { data } = await client.post<UserProfile>("/v1/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>("/v1/auth/login", payload);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>("/v1/users/me");
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
