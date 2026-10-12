"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useWorkspace } from "./use-workspace";

// Đặt là 1 để test nhanh (25 phút thành 25 giây). Test xong NHỚ đặt lại 60.
const SECONDS_PER_MINUTE = 60;

// Thời gian nghỉ (phút) theo thời lượng phiên tập trung
export const BREAK_MINUTES: Record<number, number> = { 25: 5, 50: 15 };
// Thời lượng nhạc cổ điển (phút) phát trong giờ nghỉ - dùng ở bước gắn nhạc
export const MUSIC_MINUTES: Record<number, number> = { 25: 3, 50: 10 };

type FocusStatus = "idle" | "running" | "paused" | "completed";
type FocusPhase = "focus" | "break";
interface FocusValue {
  duration: number;
  remaining: number;
  status: FocusStatus;
  phase: FocusPhase;
  breakMinutes: number;
  taskId?: string;
  setDuration: (minutes: number) => void;
  selectTask: (id: string) => void;
  toggle: () => void;
  reset: () => void;
  skipBreak: () => void;
}
const FocusContext = createContext<FocusValue | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const { addSession } = useWorkspace();
  const [duration, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * SECONDS_PER_MINUTE);
  const [status, setStatus] = useState<FocusStatus>("idle");
  const [phase, setPhase] = useState<FocusPhase>("focus");
  const [taskId, setTaskId] = useState<string>();
  const deadline = useRef(0);
  const session = useRef<{ id: string; startedAt: string } | null>(null);
  const saveSession = useRef(addSession);
  saveSession.current = addSession;

  const breakMinutes = BREAK_MINUTES[duration] ?? 5;

  // Hết phiên tập trung: lưu phiên rồi tự chuyển sang nghỉ
  const complete = useCallback(() => {
    if (!session.current) return;
    const finished = session.current;
    session.current = null;
    void saveSession.current({
      ...finished,
      taskId,
      durationSeconds: duration * SECONDS_PER_MINUTE,
    });
    const breakSeconds = breakMinutes * SECONDS_PER_MINUTE;
    deadline.current = Date.now() + breakSeconds * 1000;
    setPhase("break");
    setRemaining(breakSeconds);
    setStatus("running");
    toast.success("Một phiên tập trung trọn vẹn!", {
      description: `${duration} phút đã được thêm vào hành trình. Nghỉ ${breakMinutes} phút nhé.`,
    });
  }, [duration, taskId, breakMinutes]);

  // Hết giờ nghỉ: quay về trạng thái chờ phiên mới
  const finishBreak = useCallback(() => {
    setPhase("focus");
    setRemaining(duration * SECONDS_PER_MINUTE);
    setStatus("idle");
    toast.info("Hết giờ nghỉ. Sẵn sàng cho phiên tiếp theo nhé!");
  }, [duration]);

  const skipBreak = () => {
    setPhase("focus");
    setRemaining(duration * SECONDS_PER_MINUTE);
    setStatus("idle");
  };

  useEffect(() => {
    if (status !== "running") return;
    const tick = () => {
      const seconds = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(seconds);
      if (seconds === 0) {
        if (phase === "focus") complete();
        else finishBreak();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [status, phase, complete, finishBreak]);

  const toggle = () => {
    if (status === "running") {
      const seconds = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      if (!seconds) {
        if (phase === "focus") complete();
        else finishBreak();
        return;
      }
      setRemaining(seconds);
      setStatus("paused");
    } else {
      const seconds =
        status === "completed" ? duration * SECONDS_PER_MINUTE : remaining;
      if (phase === "focus" && status !== "paused")
        session.current = {
          id: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
        };
      deadline.current = Date.now() + seconds * 1000;
      setRemaining(seconds);
      setStatus("running");
    }
  };

  return (
    <FocusContext.Provider
      value={{
        duration,
        remaining,
        status,
        phase,
        breakMinutes,
        taskId,
        toggle,
        skipBreak,
        setDuration: (minutes) => {
          if (
            status === "running" ||
            status === "paused" ||
            ![25, 50].includes(minutes)
          )
            return;
          setMinutes(minutes);
          setRemaining(minutes * SECONDS_PER_MINUTE);
          setStatus("idle");
        },
        selectTask: (id) => {
          if (status === "running" || status === "paused") {
            toast.info(
              "Hãy hoàn thành hoặc đặt lại phiên hiện tại trước khi đổi nhiệm vụ.",
            );
            return;
          }
          setTaskId(id || undefined);
        },
        reset: () => {
          session.current = null;
          setPhase("focus");
          setRemaining(duration * SECONDS_PER_MINUTE);
          setStatus("idle");
        },
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) throw new Error("FocusProvider is required");
  return context;
}
