const crypto = require("crypto");

function makeId() {
  return crypto.randomBytes(6).toString("base64url");
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const name = clean(body.n || body.name, 120);
    const music = clean(body.m || body.music, 2000);
    const msg = clean(body.g || body.msg, 5000);

    if (!name && !music && !msg) {
      return res.status(400).json({ error: "No gift data" });
    }

    const { put } = await import("@vercel/blob");

    // محاولة واحدة واضحة أفضل من إعادة المحاولة عدة مرات وانتظار المستخدم طويلاً.
    for (let attempt = 0; attempt < 1; attempt++) {
      const id = makeId();

      try {
        // منع بقاء الطلب معلّقاً بلا نهاية إذا كانت خدمة Blob أو الاتصال بها متعثراً.
        await put(
          "gifts/" + id + ".json",
          JSON.stringify({
            v: 1,
            n: name,
            m: music,
            g: msg,
            createdAt: new Date().toISOString()
          }),
          {
            access: "public",
            addRandomSuffix: false,
            contentType: "application/json",
            cacheControlMaxAge: 31536000,
            abortSignal: AbortSignal.timeout(12000)
          }
        );

        return res.status(200).json({
          ok: true,
          id,
          url: (function () {
            const proto =
              String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() ||
              (req.socket && req.socket.encrypted ? "https" : "http");
            const host = String(req.headers.host || "").trim();
            return host ? (proto + "://" + host) : "";
          })() + "/g/" + id
        });
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  } catch (error) {
    console.error("create gift error:", error);
    return res.status(500).json({ error: "Failed to create gift link" });
  }
};
