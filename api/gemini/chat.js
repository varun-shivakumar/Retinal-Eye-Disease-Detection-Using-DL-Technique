// api/gemini/chat.js (Now proxied to Groq)
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "object" && req.body ? req.body : JSON.parse(req.body || "{}");
    const messages = Array.isArray(body?.messages) ? body.messages : null;

    if (!messages) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Expected { messages: [{role, content}, ...] }",
      });
    }

    const apiKey = process.env.GROQ_API_KEY; // <--- CHANGED TO GROQ
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY not set in env" });
    }

    // Groq API Endpoint
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`, // <--- Standard Bearer Token
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // <--- High quality free model
        messages: messages,
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
        console.error("Groq API Error:", data);
        return res.status(resp.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Error in /api/gemini/chat:", err);
    return res.status(500).json({ error: "proxy error", details: String(err) });
  }
}
