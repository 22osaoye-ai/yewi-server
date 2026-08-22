// Lightweight performance helpers for manual instrumentation
export function mark(name: string) {
  try {
    // console.time is sufficient for now; can be wired to analytics later
    // prefix to avoid collisions
    console.time(`perf:${name}`);
  } catch {}
}

export function measure(name: string) {
  try {
    console.timeEnd(`perf:${name}`);
  } catch {}
}
