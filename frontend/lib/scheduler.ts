// Minimal greedy scheduler for EduBox
// Inputs: assignments (with dueDate, priority, estimatedMinutes?), existingEvents (array of {startTime,endTime}), options
// Output: array of suggested blocks { assignmentIds: string[], startTime, endTime, minutes }

export interface AssignmentForScheduling {
  _id: string;
  title: string;
  dueDate?: number | string;
  priority?: "high" | "medium" | "low";
  estimatedMinutes?: number; // optional
}

export interface CalendarEvent {
  startTime: number;
  endTime: number;
}

export interface SuggestedBlock {
  id: string;
  assignmentId?: string;
  title: string;
  startTime: number;
  endTime: number;
  minutes: number;
}

export interface SchedulerOptions {
  horizonDays?: number; // lookahead days
  blockMinutes?: number; // default block size
  maxMinutesPerDay?: number; // cap per day
  workStartHour?: number; // local day start (e.g., 8)
  workEndHour?: number; // local day end (e.g., 22)
}

function dayRange(startDate: Date, days: number) {
  const r: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    r.push(d);
  }
  return r;
}

export function suggestSchedule(
  assignments: AssignmentForScheduling[],
  existingEvents: CalendarEvent[] = [],
  opts?: SchedulerOptions
): SuggestedBlock[] {
  const options: SchedulerOptions = {
    horizonDays: opts?.horizonDays ?? 7,
    blockMinutes: opts?.blockMinutes ?? 60,
    maxMinutesPerDay: opts?.maxMinutesPerDay ?? 180,
    workStartHour: opts?.workStartHour ?? 8,
    workEndHour: opts?.workEndHour ?? 22,
  };

  // Filter pending assignments (we expect caller to pass only pending if desired)
  const now = Date.now();
  const days = dayRange(new Date(), options.horizonDays || 7);

  // Create busy slots map per day (in ms)
  const busyByDay: Record<string, CalendarEvent[]> = {};
  days.forEach((d) => (busyByDay[d.toDateString()] = []));
  for (const ev of existingEvents || []) {
    const d = new Date(ev.startTime).toDateString();
    if (busyByDay[d]) busyByDay[d].push(ev);
  }

  // Sort assignments by dueDate asc then priority
  const assignSorted = [...assignments].sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    const p = { high: 0, medium: 1, low: 2 } as any;
    return (p[a.priority || "medium"] || 1) - (p[b.priority || "medium"] || 1);
  });

  const blocks: SuggestedBlock[] = [];
  let blkCounter = 0;

  // Helper: find next free slot on or before due date within horizon
  for (const a of assignSorted) {
    const estimated =
      a.estimatedMinutes && a.estimatedMinutes > 0
        ? a.estimatedMinutes
        : options.blockMinutes || 60;
    let remaining = estimated;

    // We'll allocate blocks of blockMinutes up until remaining is 0 or horizon exhausted
    for (const day of days) {
      const dayKey = day.toDateString();
      // skip days in the past
      if (day.getTime() + 24 * 60 * 60 * 1000 < now) continue;
      // If there's a dueDate and this day is after dueDate, skip
      if (a.dueDate) {
        const due = new Date(a.dueDate).setHours(23, 59, 59, 999);
        if (day.getTime() > due) break;
      }

      // compute free windows for the day between workStartHour and workEndHour
      const dayStart = new Date(day);
      dayStart.setHours(options.workStartHour || 8, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(options.workEndHour || 22, 0, 0, 0);

      // build busy windows and sort; include already allocated blocks so we don't overlap
      const busy = [
        ...(busyByDay[dayKey] || []),
        ...blocks
          .filter((bb) => new Date(bb.startTime).toDateString() === dayKey)
          .map((bb) => ({ startTime: bb.startTime, endTime: bb.endTime })),
      ]
        .slice()
        .sort((x, y) => x.startTime - y.startTime);
      // start from dayStart and find gaps
      let cursor = Math.max(dayStart.getTime(), now); // never schedule before now
      let dayAllocatedMinutes = blocks
        .filter((b) => new Date(b.startTime).toDateString() === dayKey)
        .reduce((s, b) => s + b.minutes, 0);
      if (dayAllocatedMinutes >= (options.maxMinutesPerDay || 180)) continue;

      for (const b of busy) {
        const gapStart = cursor;
        const gapEnd = Math.min(b.startTime, dayEnd.getTime());
        // if we have at least blockMinutes available, allocate blocks
        if (gapEnd - gapStart >= 1000 * 60) {
          // compute how many whole blocks of blockMinutes we can place (but allow smaller final block to satisfy remaining)
          while (
            remaining > 0 &&
            gapEnd - gapStart >= 1000 * 60 &&
            dayAllocatedMinutes < (options.maxMinutesPerDay || 180)
          ) {
            const allowed = Math.min(
              options.blockMinutes || 60,
              remaining,
              (options.maxMinutesPerDay || 180) - dayAllocatedMinutes
            );
            const mins = Math.max(15, allowed); // don't create sub-15 minute micro-blocks; floor to sensible minimum
            const start = gapStart;
            const end = Math.min(start + mins * 60 * 1000, gapEnd);
            // guard: ensure end > start
            if (end <= start) break;
            blocks.push({
              id: `blk-${blkCounter++}-${dayKey.replace(/\s+/g, "-")}`,
              assignmentId: a._id,
              title: a.title,
              startTime: start,
              endTime: end,
              minutes: Math.round((end - start) / 60000),
            });
            remaining -= Math.round((end - start) / 60000);
            cursor = end;
            dayAllocatedMinutes += Math.round((end - start) / 60000);
            if (remaining <= 0) break;
          }
        }
        // move cursor past this busy event
        cursor = Math.max(cursor, b.endTime);
        if (cursor >= dayEnd.getTime()) break;
      }

      // final gap after last busy
      if (
        remaining > 0 &&
        cursor < dayEnd.getTime() &&
        dayAllocatedMinutes < (options.maxMinutesPerDay || 180)
      ) {
        const gapStart = cursor;
        const gapEnd = dayEnd.getTime();
        while (
          remaining > 0 &&
          gapEnd - gapStart >= 1000 * 60 &&
          dayAllocatedMinutes < (options.maxMinutesPerDay || 180)
        ) {
          const allowed = Math.min(
            options.blockMinutes || 60,
            remaining,
            (options.maxMinutesPerDay || 180) - dayAllocatedMinutes
          );
          const mins = Math.max(15, allowed);
          const start = gapStart;
          const end = Math.min(start + mins * 60 * 1000, gapEnd);
          if (end <= start) break;
          blocks.push({
            id: `blk-${blkCounter++}-${dayKey.replace(/\s+/g, "-")}`,
            assignmentId: a._id,
            title: a.title,
            startTime: start,
            endTime: end,
            minutes: Math.round((end - start) / 60000),
          });
          remaining -= Math.round((end - start) / 60000);
          cursor = end;
          dayAllocatedMinutes += Math.round((end - start) / 60000);
        }
      }

      if (remaining <= 0) break; // assignment fully scheduled
    }
    // if we couldn't fill all minutes, we still provide partial schedule
  }

  // sort blocks by startTime
  blocks.sort((x, y) => x.startTime - y.startTime);
  return blocks;
}
