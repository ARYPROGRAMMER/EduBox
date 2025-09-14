// Support multiple components requesting prefetch for the same userId.
// Maintain a ref-counted entry per userId with a single interval and a list of subscribers.
const prefetchRegistry: Record<
  string,
  {
    intervalId: number | null;
    lastResult: any;
    subscribers: Set<(data: any) => void>;
  }
> = {};

export async function startUserContextPrefetch(userId: string, onUpdate: (data: any) => void, intervalMs = 300_000) {
  if (!userId) return () => {};

  if (!prefetchRegistry[userId]) {
    prefetchRegistry[userId] = {
      intervalId: null,
      lastResult: null,
      subscribers: new Set(),
    };
  }

  const entry = prefetchRegistry[userId];
  entry.subscribers.add(onUpdate);

  const fetchContext = async () => {
    try {
      const res = await fetch('/api/prefetch/user-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      entry.lastResult = json?.data;
      entry.subscribers.forEach((s) => {
        try {
          s(entry.lastResult);
        } catch (e) {
          // ignore subscriber errors
        }
      });
    } catch (err) {
      // ignore fetch errors
    }
  };

  // If we already have a lastResult, notify this subscriber immediately
  if (entry.lastResult) {
    try {
      onUpdate(entry.lastResult);
    } catch (e) {
      // ignore
    }
  }

  // If interval not running, start it and run an immediate fetch
  if (entry.intervalId === null) {
    await fetchContext();
    entry.intervalId = window.setInterval(fetchContext, intervalMs);
  }

  // Return a stop function that unsubscribes this caller and clears the interval when no subscribers remain
  return () => {
    entry.subscribers.delete(onUpdate);
    if (entry.subscribers.size === 0) {
      if (entry.intervalId !== null) {
        clearInterval(entry.intervalId);
        entry.intervalId = null;
      }
      delete prefetchRegistry[userId];
    }
  };
}
