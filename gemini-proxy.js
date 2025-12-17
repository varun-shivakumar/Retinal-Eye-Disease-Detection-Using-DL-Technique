// gemini-proxy.js
// Smart proxy: selects payload shape based on the provided GEMINI_API_URL
import express from "express";
const router = express.Router();

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(data || null));
    req.on("error", err => reject(err));
  });
}

function buildGenerateMessagePayload(messages) {
  return {
    messages: messages.map(m => ({
      author: m.role === "system" ? "system" : (m.role === "assistant" ? "assistant" : "user"),
      content: [{ type: "text", text: String(m.content) }]
    }))
  };
}

function buildGenerateContentPayload(messages) {
  const combined = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  return { contents: [{ parts: [{ text: combined }] }] };
}

async function doFetchStringBody(url, headers, bodyString, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: bodyString,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await resp.text().catch(() => "");
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (_) { /* not JSON */ }
    return { resp, text, parsed };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

router.post("/chat", async (req, res) => {
  try {
    // Read incoming JSON (defensive)
    let body = req.body;
    if (!body || Object.keys(body).length === 0) {
      const raw = await readRawBody(req);
      if (raw) {
        try { body = JSON.parse(raw); } catch (e) { /* ignore */ }
      }
    }

    console.log("== /api/gemini/chat called ==");
    console.log("Received body keys:", body ? Object.keys(body) : "(none)");

    const messages = Array.isArray(body?.messages) ? body.messages : undefined;
    if (!messages) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Expected { messages: [{role, content}, ...] }",
        receivedBody: body || null
      });
    }

    const providedUrl = (process.env.GEMINI_API_URL || "").trim();
    const apiKey = process.env.GEMINI_API_KEY || null;

    const defaultGenerateMessage = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateMessage";
    const defaultGenerateContent = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

    const headersBase = { "Content-Type": "application/json" };
    if (apiKey) headersBase["x-goog-api-key"] = apiKey;

    // Prepare payload strings
    const genMsgPayload = buildGenerateMessagePayload(messages);
    const genContentPayload = buildGenerateContentPayload(messages);
    const genMsgBody = JSON.stringify(genMsgPayload);
    const genContentBody = JSON.stringify(genContentPayload);

    // Helper to attempt a given url with given body string
    async function attempt(url, bodyString, label) {
      console.log(`Attempting ${label} -> ${url}`);
      try {
        const { resp, text, parsed } = await doFetchStringBody(url, headersBase, bodyString);
        console.log(`${label} returned status:`, resp.status, resp.statusText);
        return { ok: true, status: resp.status, parsed, text };
      } catch (err) {
        console.error(`${label} fetch error:`, String(err));
        return { ok: false, error: String(err) };
      }
    }

    // If user explicitly provided GEMINI_API_URL, use it with matching payload style
    if (providedUrl) {
      const lower = providedUrl.toLowerCase();
      if (lower.includes(":generatecontent")) {
        const r = await attempt(providedUrl, genContentBody, "provided-URL(generateContent)");
        if (r.ok) {
          return res.status(r.status).send(r.parsed ?? r.text);
        } else {
          return res.status(502).json({ error: "Provided URL fetch failed", details: r.error });
        }
      }
      if (lower.includes(":generatemessage")) {
        const r = await attempt(providedUrl, genMsgBody, "provided-URL(generateMessage)");
        if (r.ok) {
          return res.status(r.status).send(r.parsed ?? r.text);
        } else {
          return res.status(502).json({ error: "Provided URL fetch failed", details: r.error });
        }
      }
      // If providedUrl doesn't specify method, try both sensibly:
      const tryMsg = await attempt(providedUrl, genMsgBody, "provided-URL(try-message)");
      if (tryMsg.ok && tryMsg.status >= 200 && tryMsg.status < 300) return res.status(tryMsg.status).send(tryMsg.parsed ?? tryMsg.text);
      // try content form on same URL
      const tryContent = await attempt(providedUrl, genContentBody, "provided-URL(try-content)");
      if (tryContent.ok && tryContent.status >= 200 && tryContent.status < 300) return res.status(tryContent.status).send(tryContent.parsed ?? tryContent.text);
      // otherwise surface last non-network response (if any)
      if (tryMsg.ok) return res.status(tryMsg.status).send(tryMsg.parsed ?? tryMsg.text);
      if (tryContent.ok) return res.status(tryContent.status).send(tryContent.parsed ?? tryContent.text);
      // network errors -> return failure
      return res.status(502).json({ error: "Provided URL attempts failed", details: { tryMsg, tryContent } });
    }

    // No provided URL: try generateMessage first, then fallback to generateContent
    const msgTry = await attempt(defaultGenerateMessage, genMsgBody, "generateMessage(default)");
    if (msgTry.ok && msgTry.status >= 200 && msgTry.status < 300) return res.status(msgTry.status).send(msgTry.parsed ?? msgTry.text);
    // if message returned non-2xx, forward that to client (useful debug)
    if (msgTry.ok) return res.status(msgTry.status).send(msgTry.parsed ?? msgTry.text);

    const contentTry = await attempt(defaultGenerateContent, genContentBody, "generateContent(default)");
    if (contentTry.ok && contentTry.status >= 200 && contentTry.status < 300) return res.status(contentTry.status).send(contentTry.parsed ?? contentTry.text);
    if (contentTry.ok) return res.status(contentTry.status).send(contentTry.parsed ?? contentTry.text);

    return res.status(502).json({ error: "All attempts failed", details: { msgTry, contentTry } });
  } catch (err) {
    console.error("gemini-proxy unexpected error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "proxy error", details: String(err) });
  }
});

export default router;
