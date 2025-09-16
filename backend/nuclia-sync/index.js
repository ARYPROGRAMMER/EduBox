// index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// nucliaClient should export at least:
// getOrCreateKbForUser, createResource, listResources, patchResourceBySlug, putTextFieldBySlug
const {
  getOrCreateKbForUser,
  createResource,
  listResources,
  patchResourceBySlug,
  putTextFieldBySlug,
  getResourceBySlug,
  patchResourceById,
  putTextFieldByResourceId,
} = require("./nucliaClient");


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

const PORT = process.env.PORT || 4000;

// In-memory queue for background sync tasks
const syncQueue = [];
let workerRunning = false;

function enqueueSync(task) {
  task.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  syncQueue.push(task);
  console.log("Enqueued sync", { id: task.id, userId: task.userId });
  if (!workerRunning) runWorker();
  return task.id;
}

async function runWorker() {
  if (workerRunning) return;
  workerRunning = true;
  console.log("Nuclia sync worker started");

  while (syncQueue.length > 0) {
    const task = syncQueue.shift();
    if (!task) break;
    try {
      console.log("Processing sync task", { id: task.id, userId: task.userId });
      await processSyncTask(task);
      console.log("Processed sync task", { id: task.id });
    } catch (err) {
      console.error("Sync task failed", {
        id: task.id,
        err: err && err.message ? err.message : err,
      });
      // retry logic
      task._retries = (task._retries || 0) + 1;
      if (task._retries <= 3) {
        console.log("Re-enqueueing task", { id: task.id, retries: task._retries });
        syncQueue.push(task);
        await new Promise((r) => setTimeout(r, 1000 * task._retries));
      } else {
        console.error("Dropping task after retries", { id: task.id });
      }
    }
  }

  workerRunning = false;
  console.log("Nuclia sync worker stopped");
}

/**
 * Sanitize userId into a deterministic slug.
 * Matches the sanitizer used in nucliaClient (keeps alnum, replaces others with '-').
 */
function sanitizeUserSlug(userId) {
  if (!userId) return `edubox-user-${Date.now()}`;
  const base = String(userId);
  const cleaned = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `edubox-user-${cleaned || Date.now()}`;
}

// POST /sync  (background enqueue)
app.post("/sync", async (req, res) => {
  const { userId, payload } = req.body || {};
  if (!userId || !payload) return res.status(400).json({ error: "userId and payload required" });

  try {
    const id = enqueueSync({ userId, payload });
    return res.status(202).json({ ok: true, enqueued: true, id });
  } catch (err) {
    console.error("/sync enqueue error", err);
    return res.status(500).json({ error: "enqueue_failed", details: err.message || err });
  }
});

// POST /sync/manual  (immediate/foreground sync)
app.post("/sync/manual", async (req, res) => {
  const { userId, payload } = req.body || {};
  if (!userId || !payload) return res.status(400).json({ error: "userId and payload required" });

  try {
    const task = { userId, payload };
    const result = await processSyncTask(task);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error("/sync/manual error", err);
    return res.status(500).json({ error: "sync_failed", details: err.message || err });
  }
});

// GET /kb/:userId/resources  (list resources for user's KB)
app.get("/kb/:userId/resources", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const kbInfo = await getOrCreateKbForUser(userId);
    if (!kbInfo || kbInfo.error) {
      console.warn("Failed to get KB for user", { userId, kbInfo });
      return res.status(500).json({ error: "kb_error", details: kbInfo || "unknown" });
    }

    const kbid = kbInfo.kbid;
    const fromDefault = !!kbInfo.fromDefault;

    const list = await listResources(kbid, 0, 100);
    if (!list || list.error) {
      console.error("listResources failed", { kbid, list });
      return res.json({ kbid, resources: [] });
    }

    let resources = Array.isArray(list.resources) ? list.resources : [];
    if (fromDefault) {
      resources = resources.filter(
        (r) =>
          (r.extra && r.extra.metadata && r.extra.metadata.userId) === userId ||
          (r.metadata && r.metadata.userId) === userId ||
          (r.usermetadata && r.usermetadata.userId) === userId
      );
    }

    return res.json({ kbid, resources });
  } catch (err) {
    console.error("/kb/:userId/resources", err);
    return res.status(500).json({ error: "internal", details: err.message || err });
  }
});

app.listen(PORT, () => {
  console.log(`EduBox Nuclia sync server listening on http://localhost:${PORT}`);
  if (process.env.NUCLIA_API_KEY) console.log("Nuclia API configured");
});

/**
 * processSyncTask
 * - Uses getOrCreateKbForUser(userId) to find the KB UUID (and create if needed)
 * - Uses a deterministic, sanitized resource slug per user
 * - Patches metadata or creates resource, then PUTs text field 'a'
 */
async function processSyncTask(task) {
  const { userId, payload } = task;
  if (!userId) throw new Error("userId required in task");

  const kbInfo = await getOrCreateKbForUser(userId);
  if (!kbInfo || kbInfo.error) throw new Error(JSON.stringify(kbInfo));

  const kbid = kbInfo.kbid;
  // Use a deterministic resource slug per user inside the single default KB
  const deterministicSlug = `user-${sanitizeUserSlug(userId)}`; // safe slug

  // Attach userProfile into the KB resource metadata when available so the KB
  // "knows everything about the user". Payload may include a userProfile
  // object assembled server-side in the Next.js API route.
  const userProfile = payload && payload.userProfile ? payload.userProfile : null;

  const metaPayload = {
    title: `EduBox sync ${new Date().toISOString()}`,
    summary: `Sync of Convex data for user ${userId}`,
    slug: deterministicSlug,
    metadata: { userId, userProfile },
    extra: {
      metadata: {
        syncedAt: new Date().toISOString(),
        source: "edubox-backend",
      },
    },
  };

  // Collect mappings (file-level and user-level) to persist back to the frontend/Convex
  // Declared here so user-level mapping can be pushed before per-file processing.
  const persistMappings = [];

  // Patch metadata first (idempotent). If not present, create resource.
  const patched = await patchResourceBySlug(kbid, deterministicSlug, metaPayload);
  let resourceInfo = null;
  // Try to extract uuid from several possible shapes
  const extractUuid = (obj) => {
    if (!obj) return null;
    // common shapes: { uuid }, { id }, { patched: { uuid } }, { created: { uuid } }
    if (obj.uuid) return obj.uuid;
    if (obj.id) return obj.id;
    if (obj.patched && (obj.patched.uuid || obj.patched.id)) return obj.patched.uuid || obj.patched.id;
    if (obj.created && (obj.created.uuid || obj.created.id)) return obj.created.uuid || obj.created.id;
    // Some Nuclia responses embed in { data: { id: ... } } or { created: { data: {...} } }
    if (obj.data && (obj.data.uuid || obj.data.id)) return obj.data.uuid || obj.data.id;
    if (obj.created && obj.created.data && (obj.created.data.uuid || obj.created.data.id))
      return obj.created.data.uuid || obj.created.data.id;
    return null;
  };

  let userResId = extractUuid(patched);
  if (userResId) {
    resourceInfo = { action: "patched", resource: patched };
    try {
      // Persist user-level mapping back to frontend (best-effort)
      if (userProfile && userProfile.id) {
        persistMappings.push({ clerkId: userProfile.id, nucliaResourceId: userResId });
      }
    } catch (e) {}
  } else {
    const created = await createResource(kbid, metaPayload);
    userResId = extractUuid(created);
    if (userResId) {
      resourceInfo = { action: "created", resource: created };
      try {
        if (userProfile && userProfile.id) {
          persistMappings.push({ clerkId: userProfile.id, nucliaResourceId: userResId });
        }
      } catch (e) {}
    } else if (created && created.error === 409) {
      // Conflict: resource slug exists. Fetch existing resource by slug.
      const existing = await getResourceBySlug(kbid, deterministicSlug);
      const existingUuid = extractUuid(existing) || (existing && existing.uuid) || null;
      if (existingUuid) {
        userResId = existingUuid;
        resourceInfo = { action: "exists", resource: existing };
        try {
          if (userProfile && userProfile.id) {
            persistMappings.push({ clerkId: userProfile.id, nucliaResourceId: userResId });
          }
        } catch (e) {}
      } else {
        throw new Error(`failed to resolve existing user resource after 409: ${JSON.stringify(existing)}`);
      }
      } else if (created && created.created && created.created && created.created.error === 409) {
      // older shape where create returned { created: { error: 409, data: ... } }
      const existing = await getResourceBySlug(kbid, deterministicSlug);
      const existingUuid = extractUuid(existing) || (existing && (existing.uuid || existing.id)) || null;
      if (existingUuid) {
        userResId = existingUuid;
        resourceInfo = { action: "exists", resource: existing };
        try {
          if (userProfile && userProfile.id) {
            persistMappings.push({ clerkId: userProfile.id, nucliaResourceId: userResId });
          }
        } catch (e) {}
      } else {
        throw new Error(`failed to resolve existing user resource after 409 (alt): ${JSON.stringify(existing)}`);
      }
    } else {
      throw new Error(JSON.stringify({ patched, created }));
    }
  }

  console.log("Nuclia KB result", { userId, kbid, userResId, kbCreated: kbInfo.created || false });

  // Build a human-readable, richer summary so the KB receives more of the user's
  // context. We still avoid embedding raw binary blobs, but include longer
  // extractedText snippets, more messages, assignments, courses, and events.
  const makeSummary = (p) => {
    try {
      const parts = [];
      parts.push(`User sync summary for ${userId} at ${new Date().toISOString()}`);

      // Basic profile
      try {
        if (p.user) {
          const up = [];
          if (p.user.name) up.push(`name: ${p.user.name}`);
          if (p.user.year) up.push(`year: ${p.user.year}`);
          if (p.user.major) up.push(`major: ${p.user.major}`);
          if (p.user.institution) up.push(`institution: ${p.user.institution}`);
          if (up.length) parts.push(`Profile: ${up.join(', ')}`);
        }
      } catch (e) {}

      // Assignments - include more items and dates
      if (p.assignments) {
        const overdue = Array.isArray(p.assignments.overdue) ? p.assignments.overdue : [];
        const upcoming = Array.isArray(p.assignments.upcoming) ? p.assignments.upcoming : [];
        parts.push(`Assignments: ${overdue.length} overdue, ${upcoming.length} upcoming.`);
        const allAssign = overdue.concat(upcoming).slice(0, 200);
        if (allAssign.length) {
          parts.push('Assignment details:\n' + allAssign.map(a => {
            const title = a.title || a.name || a.id || 'untitled';
            const course = a.course || a.courseId || '';
            const due = a.dueDate ? new Date(a.dueDate).toISOString() : (a.due ? String(a.due) : 'unknown');
            const st = a.status || '';
            return `- ${title}${course?` (${course})`:''} due ${due} ${st?`status:${st}`:''}`;
          }).join('\n'));
        }
      }

      // Courses
      if (p.courses && Array.isArray(p.courses) && p.courses.length) {
        parts.push('Courses:\n' + p.courses.slice(0, 50).map(c => {
          const code = c.code || c.courseCode || c.name || 'course';
          const inst = c.instructor || 'instructor unknown';
          const sem = c.semester || '';
          return `- ${code} by ${inst}${sem?` (${sem})`:''}`;
        }).join('\n'));
      }

      // Events
      if (p.events && Array.isArray(p.events) && p.events.length) {
        parts.push('Events:\n' + p.events.slice(0, 100).map(e => {
          const title = e.title || e.name || 'event';
          const when = e.startTime ? new Date(e.startTime).toISOString() : '';
          const loc = e.location ? ` at ${e.location}` : '';
          const desc = e.description ? ` - ${String(e.description).replace(/\s+/g,' ').slice(0,500)}` : '';
          return `- ${title}${when?` (${when})`:''}${loc}${desc}`;
        }).join('\n'));
      }

      // Files - include more snippets. Use a budget to avoid huge payloads.
      if (p.recentFiles && Array.isArray(p.recentFiles) && p.recentFiles.length) {
        parts.push(`Files: ${p.recentFiles.length} recent. Listing up to 50 with snippets.`);
        let budget = 16000; // total characters for snippets
        const snippets = [];
        for (const f of p.recentFiles.slice(0, 50)) {
          if (!f) continue;
          const name = f.name || f.originalName || f.storageId || 'file';
          const txt = (f.extractedText || f.text || '').replace(/\s+/g, ' ').trim();
          if (!txt) {
            snippets.push(`${name}: <no extracted text>`);
            continue;
          }
          const take = Math.min( Math.max(200, Math.floor(budget / (50 - snippets.length || 1))), 4000 );
          const slice = txt.slice(0, take);
          snippets.push(`${name}: ${slice}`);
          budget -= slice.length;
          if (budget <= 0) break;
        }
        if (snippets.length) parts.push('File snippets:\n' + snippets.join('\n\n'));
      }

      // Chat messages - include more recent messages
      try {
        const msgs = (p.chat && Array.isArray(p.chat.recentMessages) && p.chat.recentMessages.length) ? p.chat.recentMessages : (Array.isArray(p.recentMessages) ? p.recentMessages : []);
        if (msgs && msgs.length) {
          parts.push('Recent messages:\n' + msgs.slice(0, 200).map(m => {
            const role = m.role ? `${m.role}: ` : '';
            const body = (m.message || m.text || m.body || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
            return `- ${role}${body}`;
          }).join('\n'));
        }
      } catch (e) {}

      // Performance and stats
      try {
        if (p.performance) {
          const perf = [];
          if (p.performance.currentGPA) perf.push(`GPA: ${p.performance.currentGPA}`);
          if (Array.isArray(p.performance.recentGrades) && p.performance.recentGrades.length) {
            perf.push('Recent grades: ' + p.performance.recentGrades.slice(0, 20).map(g => `${g.assignment || g.title || ''}:${g.grade}`).join('; '));
          }
          if (perf.length) parts.push('Performance: ' + perf.join(' | '));
        }
      } catch (e) {}

      // Schedule summary
      try {
        if (p.schedule) {
          const sparts = [];
          if (p.schedule.today && p.schedule.today.classes) sparts.push(`today classes: ${p.schedule.today.classes.length}`);
          if (p.schedule.college) sparts.push(`college schedule items: ${p.schedule.college.length}`);
          if (sparts.length) parts.push('Schedule summary: ' + sparts.join(', '));
        }
      } catch (e) {}

      // User plan
      if (p.userSettings && p.userSettings.planType) {
        parts.push(`Plan: ${p.userSettings.planType}${p.userSettings.planExpiresAt?` (expires ${p.userSettings.planExpiresAt})`:''}`);
      }

      // Generic stats
      if (p.statistics) {
        try {
          parts.push(`Statistics: courses=${p.statistics.totalCourses||0} upcomingAssignments=${p.statistics.upcomingAssignments||0} recentFiles=${p.statistics.recentFiles||0}`);
        } catch (e) {}
      }

      return parts.join('\n\n');
    } catch (e) {
      // fallback to a larger JSON slice if summary building fails
      try {
        return typeof p === 'string' ? p : JSON.stringify(p, null, 2).slice(0, 24000);
      } catch (e2) {
        return String(p).slice(0, 10000);
      }
    }
  };

  const textBody = makeSummary(payload);
  // store raw payload into extra.rawPayload for reference (not indexed)
  metaPayload.extra.rawPayload = typeof payload === 'string' ? payload : (payload && payload.recentFiles ? { recentFilesCount: payload.recentFiles.length, _raw: null } : null);

  const putResult = await putTextFieldBySlug(kbid, deterministicSlug, "a", {
    body: textBody,
    format: "PLAIN",
    extract_strategy: null,
    split_strategy: null,
  });

  if (putResult && !putResult.error) {
    // Additionally, if the payload contains recentFiles, create/patch a resource per file
    try {
      if (payload && payload.recentFiles && Array.isArray(payload.recentFiles)) {
  // Try to get persisted mappings for these file IDs from frontend/Convex
        const FRONTEND_URL = process.env.NUCLIA_PERSIST_FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
        const fileIds = payload.recentFiles.map((f) => f.id).filter(Boolean);
        let idMap = {};
  // persistMappings is declared earlier and will collect file-level mappings as well
        if (fileIds.length) {
          try {
            const secretHeader = process.env.NUCLIA_PERSIST_SECRET || null;
            const headers = { "Content-Type": "application/json" };
            if (secretHeader) headers["x-nuclia-persist-secret"] = secretHeader;
            const resp = await fetch(`${FRONTEND_URL}/api/nuclia/sync/get-mappings`, {
              method: "POST",
              headers,
              body: JSON.stringify({ fileIds, userId }),
            });
            if (resp.ok) {
              const contentType = (resp.headers.get("content-type") || "").toLowerCase();
              if (contentType.includes("application/json")) {
                const jr = await resp.json();
                if (jr && Array.isArray(jr.mappings)) {
                  jr.mappings.forEach((m) => { if (m.fileId && m.nucliaResourceId) idMap[m.fileId] = m.nucliaResourceId; });
                }
              } else {
                console.warn("get-mappings: non-json response", { status: resp.status, contentType });
              }
            }
          } catch (e) {
            console.warn("get-mappings request failed", e && e.message ? e.message : e);
          }
        }

  let processedFiles = 0;
  for (const f of payload.recentFiles) {
          try {
            // Ensure file slugs include the user identifier to avoid collisions
            const fileSlug = `${deterministicSlug}-file-${(f.id || f.storageId || f.name || Math.random()).toString().slice(0, 32)}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");

            const fileMeta = {
              title: f.name || f.originalName || `file-${Date.now()}`,
              summary: f.description || (f.extractedText ? f.extractedText.slice(0, 200) : undefined),
              slug: fileSlug,
              metadata: {
                userId,
                storageId: f.storageId || null,
                fileId: f.id || null,
                mimeType: f.mimeType || null,
                url: f.url || null,
                category: f.category || null,
                courseId: f.courseId || null,
              },
              extra: {
                metadata: {
                  syncedAt: new Date().toISOString(),
                  source: "edubox-backend-file",
                },
                // If the client included a base64 blob for the file, store it so
                // the KB has the raw content. This keeps things simple for now.
                files: f.base64 ? [{ fileName: f.name || f.originalName, base64: f.base64 }] : undefined,
              },
            };

            // If we have a persisted Nuclia resource id for this Convex file, prefer patching by id
            const existingResourceId = (f.id && idMap[f.id]) ? idMap[f.id] : null;
            let patchedFile = null;
            if (existingResourceId) {
              patchedFile = await patchResourceById(kbid, existingResourceId, fileMeta).catch(err=>({ error: err }));
            } else {
              patchedFile = await patchResourceBySlug(kbid, fileSlug, fileMeta);
            }
            let fileResourceInfo = null;
            const extractUuidFromObj = (obj) => {
              if (!obj) return null;
              if (obj.uuid) return obj.uuid;
              if (obj.id) return obj.id;
              if (obj.patched && (obj.patched.uuid || obj.patched.id)) return obj.patched.uuid || obj.patched.id;
              if (obj.created && (obj.created.uuid || obj.created.id)) return obj.created.uuid || obj.created.id;
              if (obj.data && (obj.data.uuid || obj.data.id)) return obj.data.uuid || obj.data.id;
              if (obj.created && obj.created.data && (obj.created.data.uuid || obj.created.data.id))
                return obj.created.data.uuid || obj.created.data.id;
              return null;
            };

            let fileResId = extractUuidFromObj(patchedFile);
            if (fileResId) {
              fileResourceInfo = { action: "patched", resource: patchedFile };
              // remember mapping for persistence back to Convex
              try {
                persistMappings.push({ fileId: f.id || null, userId, nucliaResourceId: fileResId, slug: fileSlug });
              } catch (e) {
                // ignore persist mapping push errors
              }
              processedFiles++;
            } else {
              const createdFile = await createResource(kbid, fileMeta);
              fileResId = extractUuidFromObj(createdFile);
              if (fileResId) {
                fileResourceInfo = { action: "created", resource: createdFile };
                try {
                  persistMappings.push({ fileId: f.id || null, userId, nucliaResourceId: fileResId, slug: fileSlug });
                } catch (e) {}
              } else if (createdFile && createdFile.error === 409) {
                const existingF = await getResourceBySlug(kbid, fileSlug);
                const existingUuidF = extractUuidFromObj(existingF) || (existingF && existingF.uuid) || null;
                if (existingUuidF) {
                  fileResId = existingUuidF;
                  fileResourceInfo = { action: "exists", resource: existingF };
                  try { persistMappings.push({ fileId: f.id || null, userId, nucliaResourceId: fileResId, slug: fileSlug }); } catch(e) {}
                } else {
                  console.warn("failed to resolve existing file resource after 409", existingF);
                  continue; // non-fatal
                }
              } else if (createdFile && createdFile.created && createdFile.created.error === 409) {
                const existingF = await getResourceBySlug(kbid, fileSlug);
                const existingUuidF = extractUuidFromObj(existingF) || (existingF && existingF.uuid) || null;
                if (existingUuidF) {
                  fileResId = existingUuidF;
                  fileResourceInfo = { action: "exists", resource: existingF };
                  try { persistMappings.push({ fileId: f.id || null, userId, nucliaResourceId: fileResId, slug: fileSlug }); } catch(e) {}
                } else {
                  console.warn("failed to resolve existing file resource after 409 (alt)", existingF);
                  continue; // non-fatal
                }
              } else {
                console.warn("failed to create file resource", createdFile);
                continue; // non-fatal
              }
            }

            // If extractedText present, PUT into text field 'a' for that resource
            const textForFile = f.extractedText || f.text || null;
            if (textForFile) {
              try {
                if (fileResId) {
                  // prefer put by resource id when available
                  await putTextFieldByResourceId(kbid, fileResId, "a", {
                    body: typeof textForFile === "string" ? textForFile : JSON.stringify(textForFile, null, 2),
                    format: "PLAIN",
                    extract_strategy: null,
                    split_strategy: null,
                  });
                } else {
                  await putTextFieldBySlug(kbid, fileSlug, "a", {
                    body: typeof textForFile === "string" ? textForFile : JSON.stringify(textForFile, null, 2),
                    format: "PLAIN",
                    extract_strategy: null,
                    split_strategy: null,
                  });
                }
              } catch (e) {
                console.warn("putTextField for file failed", { file: f, err: e && e.message ? e.message : e });
              }
            }
          } catch (e) {
            console.warn("per-file sync failed for file", f && (f.name || f.id || f.storageId), e && e.message ? e.message : e);
          }
        }
  console.log("Nuclia per-file summary", { userId, processedFiles, totalFiles: payload.recentFiles.length, persistMappings: persistMappings.length });

  // After processing files, try to persist mappings back to frontend (best-effort)
        try {
          const persistUrl = `${FRONTEND_URL}/api/nuclia/sync/persist-mapping`;
          const secretHeader = process.env.NUCLIA_PERSIST_SECRET || null;
          const headers = { "Content-Type": "application/json" };
          if (secretHeader) headers["x-nuclia-persist-secret"] = secretHeader;
          if (persistMappings.length) {
            await fetch(persistUrl, {
              method: "POST",
              headers,
              body: JSON.stringify({ mappings: persistMappings }),
            });
          }
        } catch (e) {
          console.warn("persist-mapping POST failed", e && e.message ? e.message : e);
        }
      }
    } catch (e) {
      console.warn("per-file sync processing failed", e && e.message ? e.message : e);
    }

    return { ...resourceInfo, textField: putResult };
  }

  throw new Error(JSON.stringify({ resourceInfo, putResult }));
}
