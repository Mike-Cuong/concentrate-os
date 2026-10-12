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
import { buildPlaylist, type Track } from "@/lib/momentum/music";
import { useWorkspace } from "./use-workspace";

// Đang để 1 để test nhanh (25 phút thành 25 giây). Test xong NHỚ đặt lại 60.
const SECONDS_PER_MINUTE = 60;

export const BREAK_MINUTES: Record<number, number> = { 25: 5, 50: 15 };
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
  musicEnabled: boolean;
  musicVolume: number;
  nowPlaying?: string;
  musicBlocked: boolean;
  setDuration: (minutes: number) => void;
  selectTask: (id: string) => void;
  toggle: () => void;
  reset: () => void;
  skipBreak: () => void;
  toggleMusic: () => void;
  setMusicVolume: (volume: number) => void;
  playMusic: () => void;
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

  // ---------- NHẠC ----------
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolumeState] = useState(0.6);
  const [nowPlaying, setNowPlaying] = useState<string>();
  const [musicBlocked, setMusicBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlist = useRef<Track[]>([]);
  const trackIndex = useRef(0);
  const musicEnabledRef = useRef(musicEnabled);
  musicEnabledRef.current = musicEnabled;
  const volumeRef = useRef(musicVolume);
  volumeRef.current = musicVolume;

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    const track = playlist.current[index];
    if (!audio || !track) {
      playlist.current = [];
      setNowPlaying(undefined);
      return;
    }
    trackIndex.current = index;
    audio.src = track.src;
    audio.volume = volumeRef.current;
    setNowPlaying(`${track.title} - ${track.composer}`);
    audio
      .play()
      .then(() => setMusicBlocked(false))
      .catch((error) => {
        if (error?.name === "NotAllowedError") setMusicBlocked(true);
      });
  }, []);

  const startMusic = useCallback(
    (focusMinutes: number) => {
      const targetSeconds = (MUSIC_MINUTES[focusMinutes] ?? 3) * 60;
      playlist.current = buildPlaylist(targetSeconds);
      playTrack(0);
    },
    [playTrack],
  );

  const stopMusic = useCallback(() => {
    playlist.current = [];
    audioRef.current?.pause();
    setNowPlaying(undefined);
    setMusicBlocked(false);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const next = () => playTrack(trackIndex.current + 1);
    audio.addEventListener("ended", next);
    audio.addEventListener("error", next);
    return () => {
      audio.removeEventListener("ended", next);
      audio.removeEventListener("error", next);
      audio.pause();
      audioRef.current = null;
    };
  }, [playTrack]);

  useEffect(() => {
    try {
      if (localStorage.getItem("focus-music") === "off") setMusicEnabled(false);
    } catch {}
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || phase !== "break" || playlist.current.length === 0) return;
    if (status === "paused") audio.pause();
    if (status === "running" && audio.paused && audio.src)
      audio.play().catch(() => {});
  }, [phase, status]);

  const toggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    try {
      localStorage.setItem("focus-music", next ? "on" : "off");
    } catch {}
    if (!next) stopMusic();
    else if (phase === "break" && status === "running") startMusic(duration);
  };
  const setMusicVolume = (volume: number) =>
    setMusicVolumeState(Math.min(1, Math.max(0, volume)));
  const playMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playlist.current.length === 0) {
      if (phase === "break" && musicEnabled) startMusic(duration);
      return;
    }
    audio
      .play()
      .then(() => setMusicBlocked(false))
      .catch(() => {});
  };
  // ---------- HẾT PHẦN NHẠC ----------

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
    if (musicEnabledRef.current) startMusic(duration);
    toast.success("Một phiên tập trung trọn vẹn!", {
      description: `${duration} phút đã được thêm vào hành trình. Nghỉ ${breakMinutes} phút nhé.`,
    });
  }, [duration, taskId, breakMinutes, startMusic]);

  const finishBreak = useCallback(() => {
    stopMusic();
    setPhase("focus");
    setRemaining(duration * SECONDS_PER_MINUTE);
    setStatus("idle");
    toast.info("Hết giờ nghỉ. Sẵn sàng cho phiên tiếp theo nhé!");
  }, [duration, stopMusic]);

  const skipBreak = () => {
    stopMusic();
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
        musicEnabled,
        musicVolume,
        nowPlaying,
        musicBlocked,
        toggleMusic,
        setMusicVolume,
        playMusic,
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
          stopMusic();
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
