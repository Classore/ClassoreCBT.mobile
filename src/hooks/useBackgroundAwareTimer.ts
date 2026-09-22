import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * useBackgroundAwareTimer
 *
 * Makes a countdown timer accurate even when the app is backgrounded.
 *
 * Problem:
 *   React Native's JS thread is suspended when the app is minimised, so
 *   `setInterval(() => setSeconds(s => s - 1), 1000)` pauses completely.
 *   When the app returns to the foreground the timer resumes from where it
 *   left off, as if no time had passed.
 *
 * Solution:
 *   Record the wall-clock "deadline" (Date.now() + seconds * 1000) and
 *   derive remaining time from that anchor on every tick AND whenever the
 *   app returns to the foreground via AppState.
 *
 * Usage:
 *   // 1. Keep your own state:
 *   const [secondsLeft, setSecondsLeft] = useState(7200);
 *
 *   // 2. Call the hook — it drives the countdown and self-corrects on resume:
 *   const { syncTimer } = useBackgroundAwareTimer(
 *     setSecondsLeft,       // your state setter
 *     handleTimeExpired,    // called when timer hits zero
 *     timerEnabled,         // boolean guard (e.g. !loading && !!attempt)
 *   );
 *
 *   // 3. Call syncTimer() every time the server gives you an authoritative value:
 *   syncTimer(res.timer_info.remaining_seconds);
 *
 *   // 4. Remove the old setInterval effect — the hook replaces it entirely.
 */
export function useBackgroundAwareTimer(
  setSeconds: React.Dispatch<React.SetStateAction<number>>,
  onExpire: () => void,
  enabled: boolean,
): { syncTimer: (seconds: number) => void } {
  // Wall-clock timestamp of when the timer will reach zero.
  // Initialised to 0; set properly by the first syncTimer() call.
  const endTimeRef = useRef<number>(0);

  // Keep a stable ref to onExpire so we never need it in dependency arrays.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  /**
   * syncTimer — call this whenever the server provides the authoritative
   * remaining seconds (e.g. after resumeExam() or startDemoTest()).
   * It anchors the end-time ref AND updates the displayed state.
   */
  const syncTimer = useCallback(
    (seconds: number) => {
      endTimeRef.current = Date.now() + seconds * 1000;
      setSeconds(seconds);
    },
    [setSeconds],
  );

  // Drive the displayed countdown every second using the wall-clock anchor.
  // Reading from endTimeRef means the value is always correct regardless of
  // how many times the interval fires (self-correcting for any JS throttling).
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (endTimeRef.current === 0) return; // syncTimer not called yet
      const remaining = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (remaining <= 0) onExpireRef.current();
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, setSeconds]);

  // Snap-correct the timer the instant the app returns from the background.
  // Without this, the user would have to wait up to 1 second for the first
  // interval tick to fire after resume.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active' && enabled && endTimeRef.current > 0) {
          const remaining = Math.max(
            0,
            Math.round((endTimeRef.current - Date.now()) / 1000),
          );
          setSeconds(remaining);
          if (remaining <= 0) onExpireRef.current();
        }
      },
    );
    return () => subscription.remove();
  }, [enabled, setSeconds]);

  return { syncTimer };
}
