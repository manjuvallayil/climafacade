"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialSimState, stepSimulation } from "@/lib/simulation";
import { trainSurrogate } from "@/lib/ml/surrogate";
import type {
  ControlStep,
  Preferences,
  Season,
  SimState,
  SurrogateModel,
  TrainProgress,
  TrainResult,
} from "@/lib/types";
import { DEFAULT_PREFS } from "@/lib/constants";

export interface SimActions {
  play: () => void;
  pause: () => void;
  setSpeed: (s: number) => void;
  setSeason: (s: Season) => void;
  setOccupancy: (o: number) => void;
  setFree: (free: boolean) => void;
  setManualHour: (h: number) => void;
  setManualCloud: (c: number) => void;
  setManualTemp: (t: number) => void;
  setManualGhi: (g: number) => void;
  setPref: (key: keyof Preferences, value: number) => void;
  resetPrefs: () => void;
  retrain: () => void;
  reset: () => void;
  advanceHour: (dh: number) => void;
  saveHistory: (hist: ControlStep[]) => void;
}

export function useSim() {
  const simRef = useRef(initialSimState());
  const modelRef = useRef<SurrogateModel | null>(null);
  const [sim, setSim] = useState<SimState>(initialSimState());
  const [running, setRunning] = useState(true);
  const [speed, setSpeedState] = useState(1);
  const [model, setModel] = useState<SurrogateModel | null>(null);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
  const [training, setTraining] = useState(true);
  const [trainProgress, setTrainProgress] = useState<TrainProgress>({
    phase: "generating",
    fraction: 0,
    epoch: 0,
    trainLoss: 0,
    valLoss: 0,
    message: "Initialising",
  });
  const [history, setHistory] = useState<ControlStep[]>([]);

  const bump = useCallback(() => {
    setSim({ ...simRef.current });
  }, []);

  const pushHistory = useCallback((step: ControlStep) => {
    setHistory((prev) => {
      const next = [...prev, step];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });
  }, []);

  const runTraining = useCallback(async () => {
    setTraining(true);
    try {
      const result = await trainSurrogate(setTrainProgress);
      modelRef.current = result.model;
      setModel(result.model);
      setTrainResult(result);
    } finally {
      setTraining(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await runTraining();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [runTraining]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (!simRef.current) return;
      const dt = 0.24 * speed;
      const { state, step } = stepSimulation(simRef.current, modelRef.current, dt);
      simRef.current = state;
      setSim({ ...state });
      if (step) pushHistory(step);
    }, 900);
    return () => window.clearInterval(id);
  }, [speed, running, pushHistory]);

  const actions: SimActions = {
    play: () => {
      setRunning(true);
    },
    pause: () => {
      setRunning(false);
    },
    setSpeed: setSpeedState,
    setSeason: (s) => {
      simRef.current.season = s;
      bump();
    },
    setOccupancy: (o) => {
      simRef.current.occupancy = o;
      simRef.current.freeEnv.occupancy = o;
      bump();
    },
    setFree: (free) => {
      simRef.current.freeConditions = free;
      bump();
    },
    setManualHour: (h) => {
      simRef.current.hour = h;
      bump();
    },
    setManualCloud: (c) => {
      simRef.current.cloud = c;
      bump();
    },
    setManualTemp: (t) => {
      simRef.current.freeEnv.tOut = t;
      bump();
    },
    setManualGhi: (g) => {
      simRef.current.freeEnv.ghi = g;
      bump();
    },
    setPref: (key, value) => {
      simRef.current.prefs[key] = value;
      simRef.current.overrideTimer = 90;
      bump();
    },
    resetPrefs: () => {
      simRef.current.prefs = { ...DEFAULT_PREFS };
      simRef.current.overrideTimer = 0;
      bump();
    },
    retrain: () => {
      void runTraining();
    },
    reset: () => {
      simRef.current = initialSimState();
      simRef.current.overrideTimer = 0;
      setHistory([]);
      simRef.current.energyKWh = 0;
      bump();
    },
    advanceHour: (dh) => {
      simRef.current.hour = Math.max(6, Math.min(19, simRef.current.hour + dh));
      bump();
    },
    saveHistory: (hist) => setHistory(hist),
  };

  return {
    sim,
    running,
    speed,
    model,
    training,
    trainProgress,
    trainResult,
    history,
    actions,
  };
}