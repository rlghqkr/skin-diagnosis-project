import { create } from "zustand";
import * as routineApi from "../api/routine";

/* ── Shared types ── */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
}

export interface RoutineStep {
  id: string;
  product: Product;
  completed: boolean;
  order: number;
  daysUsed: number;
}

export interface DailyRoutine {
  routineId: string | null; // null = not yet persisted
  date: string;
  morning: RoutineStep[];
  night: RoutineStep[];
  streak: number;
}

/* ── Category mapping (Korean UI → API enum) ── */

const CATEGORY_TO_API: Record<string, string> = {
  "클렌저": "cleanser",
  "토너": "toner",
  "세럼/에센스": "serum",
  "크림/로션": "cream",
  "선크림": "sunscreen",
  "마스크팩": "mask",
  "아이크림": "eye_cream",
};

const API_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_API).map(([k, v]) => [v, k]),
);

/* ── Store interface ── */

interface RoutineState {
  routines: Record<string, DailyRoutine>;
  currentDate: string;
  activeTab: "morning" | "night";
  streak: number;
  isLoading: boolean;
  error: string | null;

  setActiveTab: (tab: "morning" | "night") => void;
  setCurrentDate: (date: string) => void;
  toggleStep: (date: string, tab: "morning" | "night", stepId: string) => void;
  addStep: (date: string, tab: "morning" | "night", product: Product) => void;
  removeStep: (date: string, tab: "morning" | "night", stepId: string) => void;

  // API actions
  fetchRoutines: (date: string) => Promise<void>;
  saveRoutine: (date: string, tab: "morning" | "night") => Promise<void>;
  fetchStreak: () => Promise<void>;
}

/* ── Helpers ── */

const fmt = (d: Date) => d.toISOString().slice(0, 10);

function apiResponseToDaily(
  responses: routineApi.RoutineResponse[],
  date: string,
  existingStreak: number,
): DailyRoutine {
  const routine: DailyRoutine = {
    routineId: null,
    date,
    morning: [],
    night: [],
    streak: existingStreak,
  };

  for (const r of responses) {
    const tab = r.time_of_day === "morning" ? "morning" : "night";
    const steps: RoutineStep[] = (r.steps ?? []).map((s, i) => ({
      id: `${tab[0]}${i + 1}_${r.routine_id}`,
      product: {
        id: s.product_id ?? "",
        name: s.product_name,
        brand: "",
        category: API_TO_CATEGORY[s.category] ?? s.category,
      },
      completed: false,
      order: s.order,
      daysUsed: 1,
    }));
    routine[tab] = steps;
    if (tab === "morning" || tab === "night") {
      // Store the routine_id for updates — use a combined approach
      // We'll store one routineId for the overall DailyRoutine
      if (!routine.routineId) routine.routineId = r.routine_id;
    }
  }

  return routine;
}

function stepsToApiPayload(steps: RoutineStep[]): routineApi.RoutineStepPayload[] {
  return steps.map((s) => ({
    order: s.order,
    category: CATEGORY_TO_API[s.product.category] ?? "other",
    product_id: s.product.id || null,
    product_name: `${s.product.brand} ${s.product.name}`.trim(),
  }));
}

/* ── Mock data for offline / no-auth fallback ── */

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return fmt(d);
};

function makeMockRoutines(): Record<string, DailyRoutine> {
  const baseMorning: Omit<RoutineStep, "daysUsed">[] = [
    { id: "m1", product: { id: "CLN-0001", name: "그린티 폼 클렌저", brand: "이니스프리", category: "클렌저" }, completed: false, order: 1 },
    { id: "m2", product: { id: "TNR-0001", name: "독도 토너", brand: "라운드랩", category: "토너" }, completed: false, order: 2 },
    { id: "m3", product: { id: "SRM-0001", name: "스네일 96 뮤신 에센스", brand: "COSRX", category: "세럼/에센스" }, completed: false, order: 3 },
    { id: "m4", product: { id: "CRM-0001", name: "레드 블레미쉬 수딩 크림", brand: "닥터지", category: "크림/로션" }, completed: false, order: 4 },
    { id: "m5", product: { id: "SUN-0001", name: "선밀크", brand: "아이소이", category: "선크림" }, completed: false, order: 5 },
  ];
  const baseNight: Omit<RoutineStep, "daysUsed">[] = [
    { id: "n1", product: { id: "CLN-0006", name: "퓨어 클렌징 오일", brand: "닥터지", category: "클렌저" }, completed: false, order: 1 },
    { id: "n2", product: { id: "CLN-0001", name: "그린티 폼 클렌저", brand: "이니스프리", category: "클렌저" }, completed: false, order: 2 },
    { id: "n3", product: { id: "TNR-0001", name: "독도 토너", brand: "라운드랩", category: "토너" }, completed: false, order: 3 },
    { id: "n4", product: { id: "SRM-0001", name: "스네일 96 뮤신 에센스", brand: "COSRX", category: "세럼/에센스" }, completed: false, order: 4 },
    { id: "n5", product: { id: "CRM-0001", name: "레드 블레미쉬 수딩 크림", brand: "닥터지", category: "크림/로션" }, completed: false, order: 5 },
  ];

  const result: Record<string, DailyRoutine> = {};
  for (let i = 0; i < 5; i++) {
    const date = daysAgo(i);
    const allDone = i > 0; // Past days fully completed
    result[date] = {
      routineId: null,
      date,
      morning: baseMorning.map((s) => ({
        ...s,
        completed: allDone || (i === 0 && s.order <= 3),
        daysUsed: 45 - i,
      })),
      night: baseNight.map((s) => ({
        ...s,
        completed: allDone,
        daysUsed: 40 - i,
      })),
      streak: 5 - i,
    };
  }
  return result;
}

/* ── Store ── */

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: makeMockRoutines(),
  currentDate: fmt(today),
  activeTab: "morning",
  streak: 5,
  isLoading: false,
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentDate: (date) => set({ currentDate: date }),

  toggleStep: (date, tab, stepId) =>
    set((state) => {
      const routine = state.routines[date];
      if (!routine) return state;
      const steps = routine[tab].map((s) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s,
      );
      return {
        routines: {
          ...state.routines,
          [date]: { ...routine, [tab]: steps },
        },
      };
    }),

  addStep: (date, tab, product) =>
    set((state) => {
      const routine = state.routines[date] ?? {
        routineId: null,
        date,
        morning: [],
        night: [],
        streak: 0,
      };
      const steps = routine[tab];
      const newStep: RoutineStep = {
        id: `${tab[0]}${Date.now()}`,
        product,
        completed: false,
        order: steps.length + 1,
        daysUsed: 1,
      };
      return {
        routines: {
          ...state.routines,
          [date]: { ...routine, [tab]: [...steps, newStep] },
        },
      };
    }),

  removeStep: (date, tab, stepId) =>
    set((state) => {
      const routine = state.routines[date];
      if (!routine) return state;
      const steps = routine[tab]
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 }));
      return {
        routines: {
          ...state.routines,
          [date]: { ...routine, [tab]: steps },
        },
      };
    }),

  /* ── API actions ── */

  fetchRoutines: async (date) => {
    if (!localStorage.getItem("access_token")) return;
    set({ isLoading: true, error: null });
    try {
      const responses = await routineApi.listRoutines(date);
      if (responses.length > 0) {
        const daily = apiResponseToDaily(responses, date, get().streak);
        set((state) => ({
          routines: { ...state.routines, [date]: daily },
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false, error: "루틴을 불러오지 못했습니다." });
    }
  },

  saveRoutine: async (date, tab) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const routine = get().routines[date];
    if (!routine) return;
    const steps = routine[tab];

    set({ isLoading: true, error: null });
    try {
      // Find if a server-side routine already exists for this date+tab
      const existing = await routineApi.listRoutines(date);
      const match = existing.find((r) => r.time_of_day === tab);

      if (match) {
        await routineApi.updateRoutine(match.routine_id, {
          steps: stepsToApiPayload(steps),
        });
      } else {
        await routineApi.createRoutine({
          user_id: userId,
          routine_date: date,
          time_of_day: tab,
          steps: stepsToApiPayload(steps),
        });
      }
      set({ isLoading: false });
    } catch {
      set({ isLoading: false, error: "루틴 저장에 실패했습니다." });
    }
  },

  fetchStreak: async () => {
    if (!localStorage.getItem("access_token")) return;
    try {
      const streak = await routineApi.getStreak();
      set({ streak });
    } catch {
      // keep existing streak value
    }
  },
}));
