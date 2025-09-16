/**
 * nucliaClient.js
 *
 * Minimal Nuclia client helper using axios.
 * - Uses X-NUCLIA-SERVICEACCOUNT: Bearer <token> header per docs.
 * - Keeps a persistent mapping file (./kb-mapping.json) mapping userId -> kbid.
 *
 * Env variables:
 * - NUCLIA_API_KEY      (required) service-account or API key (we normalize and put it in X-NUCLIA-SERVICEACCOUNT)
 * - NUCLIA_API_URL      (optional) base API url, default: https://nuclia.cloud/api
 * - NUCLIA_DEFAULT_KB   (optional) fallback KB id
 * - NUCLIA_INSECURE_SKIP_TLS (optional) set to "true" to skip TLS verification (dev only)
 */

const axios = require("axios");
const https = require("https");
const fs = require("fs").promises;
const path = require("path");

const NUCLIA_API_URL = process.env.NUCLIA_API_URL || "https://nuclia.cloud/api";
const NUCLIA_API_KEY = process.env.NUCLIA_API_KEY || "";
const NUCLIA_DEFAULT_KB = process.env.NUCLIA_DEFAULT_KB || "";
const NUCLIA_INSECURE_SKIP_TLS =
  (process.env.NUCLIA_INSECURE_SKIP_TLS || "false").toLowerCase() === "true";

const MAPPING_FILE = path.join(__dirname, "kb-mapping.json");

if (!NUCLIA_API_KEY) {
  console.warn("NUCLIA_API_KEY not set. Requests will likely fail.");
}

/**
 * Normalize the key and place it into X-NUCLIA-SERVICEACCOUNT as a Bearer token.
 * Accepts raw token or "Bearer <token>" or "Api-Key <token>" and normalizes to "Bearer <token>".
 */
let serviceAccountHeaderValue = "";
if (NUCLIA_API_KEY && NUCLIA_API_KEY.trim().length > 0) {
  const raw = NUCLIA_API_KEY.trim();
  const parts = raw.split(/\s+/);
  const token = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  serviceAccountHeaderValue = `Bearer ${token}`;
}

// axios instance with optional insecure TLS behavior for local testing
const axiosOptions = {
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    ...(serviceAccountHeaderValue ? { "X-NUCLIA-SERVICEACCOUNT": serviceAccountHeaderValue } : {}),
  },
};

if (NUCLIA_INSECURE_SKIP_TLS) {
  console.warn(
    "NUCLIA_INSECURE_SKIP_TLS=true: skipping TLS certificate validation (dev only)"
  );
  axiosOptions.httpsAgent = new https.Agent({ rejectUnauthorized: false });
}

const client = axios.create(axiosOptions);

// Helper to mask Authorization-style header for safe logging
function maskAuthHeader(header) {
  try {
    if (!header) return "<none>";
    const parts = header.split(/\s+/);
    if (parts.length >= 2) {
      const scheme = parts[0];
      const token = header.slice(scheme.length + 1).trim();
      const clean = token.replace(/\s+/g, "");
      if (clean.length <= 8) return `${scheme} ${clean[0]}***${clean.slice(-1)}`;
      return `${scheme} ${clean.slice(0, 4)}...${clean.slice(-4)}`;
    }
    const t = header.trim();
    if (t.length <= 8) return `${t[0]}***${t.slice(-1)}`;
    return `${t.slice(0, 4)}...${t.slice(-4)}`;
  } catch (e) {
    return "<masked>";
  }
}

// Request interceptor to log masked X-NUCLIA-SERVICEACCOUNT (or Authorization if present)
client.interceptors.request.use(
  (cfg) => {
    try {
      const headers = cfg.headers || {};
      const auth =
        headers["X-NUCLIA-SERVICEACCOUNT"] ||
        headers["x-nuclia-serviceaccount"] ||
        headers.Authorization ||
        headers.authorization ||
        "";
      const masked = maskAuthHeader(auth);
      console.debug(
        `[nucliaClient] ${((cfg.method || "") + " " + (cfg.url || "")).toUpperCase()} Authorization=${masked}`
      );
    } catch (e) {
      // ignore logging errors
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

/* ---------- Persistent mapping utilities ---------- */

// Load mapping from disk. Returns {} if file missing or invalid.
async function loadMapping() {
  try {
    const txt = await fs.readFile(MAPPING_FILE, "utf8");
    const parsed = JSON.parse(txt);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch (e) {
    // ignore - file may not exist
  }
  return {};
}

async function saveMapping(mapping) {
  try {
    await fs.writeFile(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf8");
  } catch (e) {
    console.warn("Failed to save KB mapping file:", e && e.message ? e.message : e);
  }
}

/* ---------- Utility helpers ---------- */

// Sanitize userId to a slug-friendly value (lowercase, alnum, -)
function sanitizeUserSlug(userId) {
  if (!userId) return `edubox-user-${Date.now()}`;
  const base = String(userId);
  // keep alphanum and dash, replace other chars with '-'
  const cleaned = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  // ensure non-empty
  return `edubox-user-${cleaned || Date.now()}`;
}

/* ---------- Nuclia API wrapper functions ---------- */

async function getKbBySlug(slug) {
  try {
    const url = `${NUCLIA_API_URL}/kb/s/${encodeURIComponent(slug)}`;
    const res = await client.get(url);
    return res.data; // expected { uuid, ... }
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function createKb(slug, title) {
  try {
    const url = `${NUCLIA_API_URL}/kb`;
    const payload = {
      slug,
      title: title || `EduBox ${slug}`,
      description: "Per-user knowledge box created by EduBox sync service",
    };
    const res = await client.post(url, payload);
    return res.data;
  } catch (err) {
    // If conflict or similar, return response for caller to handle
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function createResource(kbid, resourcePayload) {
  try {
    const url = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/resources`;
    const res = await client.post(url, resourcePayload);
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function patchResourceBySlug(kbid, rslug, payload) {
  try {
    const url = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/slug/${encodeURIComponent(rslug)}`;
    const res = await client.patch(url, payload);
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function patchResourceById(kbid, resourceId, payload) {
  try {
    const url = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/resources/${encodeURIComponent(resourceId)}`;
    const res = await client.patch(url, payload);
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function putTextFieldBySlug(kbid, rslug, fieldId, payload) {
  try {
    const url = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/slug/${encodeURIComponent(rslug)}/text/${encodeURIComponent(fieldId)}`;
    const res = await client.put(url, payload);
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function putTextFieldByResourceId(kbid, resourceId, fieldId, payload) {
  try {
    const url = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/resources/${encodeURIComponent(resourceId)}/text/${encodeURIComponent(fieldId)}`;
    const res = await client.put(url, payload);
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function listResources(kbid, page = 0, size = 50) {
  try {
    const url = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/resources?page=${page}&size=${size}`;
    const res = await client.get(url);
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

async function getResourceBySlug(kbid, rslug) {
  try {
    const url = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/slug/${encodeURIComponent(rslug)}`;
    const res = await client.get(url);
    return res.data;
  } catch (err) {
    if (err.response) return { error: err.response.status, data: err.response.data };
    return { error: "network_error", message: err.message };
  }
}

/* ---------- User -> KB mapping and ensure helper ---------- */

/**
 * getOrCreateKbForUser(userId)
 * - If NUCLIA_DEFAULT_KB set, always returns that (but still records mapping for reference).
 * - Otherwise uses mapping file to remember which KB UUID is associated with userId.
 * - If mapping doesn't exist, tries to create KB with deterministic slug.
 * - Verifies KB exists when mapping found; repairs mapping if needed.
 *
 * Returns: { kbid, slug, created: bool, fromDefault: bool } or throws Error on fatal problems.
 */
async function getOrCreateKbForUser(userId) {
  if (!userId) throw new Error("userId required");

  // Enforce a single default KB for all users. If NUCLIA_DEFAULT_KB is set, use it.
  // Otherwise create/look up a single KB with slug 'edubox-default' and persist
  // it in the mapping file under a reserved key '__default_kbid'.

  const mapping = await loadMapping();

  // If environment config provides a default KB id, persist and return it
  if (NUCLIA_DEFAULT_KB) {
    try {
      if (!mapping.__default_kbid) {
        mapping.__default_kbid = NUCLIA_DEFAULT_KB;
        mapping.__default_slug = null;
        await saveMapping(mapping);
      }
    } catch (e) {
      // ignore mapping persist errors
    }
    return { kbid: NUCLIA_DEFAULT_KB, slug: mapping.__default_slug || null, created: false, fromDefault: true };
  }

  // If we've previously recorded a default KB, verify and return it
  if (mapping.__default_kbid) {
    const kbid = mapping.__default_kbid;
    // Try to validate the KB exists by listing its resources (safe call)
    try {
      const tryUrl = `${NUCLIA_API_URL}/kb/${encodeURIComponent(kbid)}/resources?page=0&size=1`;
      const res = await client.get(tryUrl);
      if (res && res.status && res.status >= 200 && res.status < 300) {
        return { kbid, slug: mapping.__default_slug || null, created: false, fromDefault: true };
      }
    } catch (e) {
      // fall through to recreate
    }
    // If validation failed, clear and fall through to create
    delete mapping.__default_kbid;
    delete mapping.__default_slug;
    try { await saveMapping(mapping); } catch (e) {}
  }

  // Need to create a single default KB
  const defaultSlug = "edubox-default";
  let created = await createKb(defaultSlug, `EduBox default KB`);
  if (created && !created.error && created.uuid) {
    mapping.__default_kbid = created.uuid;
    mapping.__default_slug = defaultSlug;
    await saveMapping(mapping);
    return { kbid: created.uuid, slug: defaultSlug, created: true, fromDefault: true };
  }

  // If create failed due to conflict, try to recover by fetching by slug
  if (created && created.error) {
    const found = await getKbBySlug(defaultSlug);
    if (found && !found.error && (found.uuid || found.id)) {
      const resolved = found.uuid || found.id;
      mapping.__default_kbid = resolved;
      mapping.__default_slug = defaultSlug;
      await saveMapping(mapping);
      return { kbid: resolved, slug: defaultSlug, created: false, fromDefault: true };
    }
  }

  throw new Error(`Failed to create or find default EduBox KB: ${JSON.stringify(created || {})}`);
}

/* ---------- Exports ---------- */

module.exports = {
  // mapping helper
  getOrCreateKbForUser,

  // lower-level API wrappers
  getKbBySlug,
  createKb,
  createResource,
  patchResourceBySlug,
  putTextFieldBySlug,
  listResources,
  getResourceBySlug,
  patchResourceById,
  putTextFieldByResourceId,
};
