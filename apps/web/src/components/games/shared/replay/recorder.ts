export interface Recorder {
  start: () => void;
  stop: () => Promise<Blob | null>;
  readonly state: "idle" | "recording" | "stopped";
}

/**
 * Tiny MediaRecorder wrapper. Captures a canvas stream as WebM.
 * Returns null Blob when MediaRecorder is unavailable (e.g. SSR / Safari fallback).
 */
export function createRecorder(canvas: HTMLCanvasElement | null, fps = 30): Recorder {
  let rec: MediaRecorder | null = null;
  const chunks: Blob[] = [];
  let state: "idle" | "recording" | "stopped" = "idle";

  return {
    get state() {
      return state;
    },
    start() {
      if (!canvas || typeof MediaRecorder === "undefined") return;
      const stream = canvas.captureStream(fps);
      try {
        rec = new MediaRecorder(stream, { mimeType: "video/webm" });
      } catch {
        return;
      }
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.start();
      state = "recording";
    },
    stop() {
      return new Promise<Blob | null>((resolve) => {
        if (!rec) {
          state = "stopped";
          return resolve(null);
        }
        rec.onstop = () => {
          state = "stopped";
          resolve(new Blob(chunks, { type: "video/webm" }));
        };
        rec.stop();
      });
    },
  };
}
