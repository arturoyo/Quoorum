import { useCallback, useState } from "react";

export interface UseDeliberationOptions {
  onRoundComplete?: (roundNumber: number) => void;
  onConsensusReached?: (score: number) => void;
  onError?: (error: Error) => void;
}

export interface DeliberationState {
  status: "idle" | "running" | "paused" | "completed" | "error";
  currentRound: number;
  consensusScore: number;
  error: Error | null;
}

export function useDeliberation(options: UseDeliberationOptions = {}) {
  const [state, setState] = useState<DeliberationState>({
    status: "idle",
    currentRound: 0,
    consensusScore: 0,
    error: null,
  });

  const start = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "running",
      currentRound: 1,
      error: null,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "paused",
    }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "running",
    }));
  }, []);

  const complete = useCallback(
    (consensusScore: number) => {
      setState((prev) => ({
        ...prev,
        status: "completed",
        consensusScore,
      }));
      options.onConsensusReached?.(consensusScore);
    },
    [options]
  );

  const advanceRound = useCallback(
    (consensusScore: number) => {
      setState((prev) => {
        const newRound = prev.currentRound + 1;
        options.onRoundComplete?.(prev.currentRound);
        return {
          ...prev,
          currentRound: newRound,
          consensusScore,
        };
      });
    },
    [options]
  );

  const setError = useCallback(
    (error: Error) => {
      setState((prev) => ({
        ...prev,
        status: "error",
        error,
      }));
      options.onError?.(error);
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      currentRound: 0,
      consensusScore: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    start,
    pause,
    resume,
    complete,
    advanceRound,
    setError,
    reset,
  };
}
