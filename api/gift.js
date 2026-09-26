function escapeForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\\u2028/g, "\\u2028")
    .replace(/\\u2029/g, "\\u2029");
}

module.exports = async function handler(req, res) {
  const rawId =
    (req.query && req.query.id) ||
    (new URL(req.url, "http://localhost").searchParams.get("id")) ||
    "";

  const id = String(rawId).trim();

  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) {
    return res.status(404).send("Gift not found");
  }

  const pathname = "gifts/" + id + ".json";

  try {
    const { get, list } = await import("@vercel/blob");

    let raw = "";

    // الطريقة الأساسية: قراءة الـBlob مباشرة.
    try {
      const result = await get(pathname, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        abortSignal: AbortSignal.timeout(10000)
      });

      if (result && result.statusCode === 200 && result.stream) {
        raw = await new Response(result.stream).text();
      }
    } catch (readError) {
      console.error("gift get failed:", readError);
    }

    // احتياطياً: نبحث عن الـBlob بالـpathname ثم نقرأ رابطه العام.
    // هذا يتجاوز حالات فشل get(pathname) مع بعض إعدادات Blob.
    if (!raw) {
      const listed = await list({
        prefix: pathname,
        limit: 1,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        abortSignal: AbortSignal.timeout(10000)
      });

      const blob = listed && listed.blobs && listed.blobs.find(function (item) {
        return item && item.pathname === pathname;
      });

      if (!blob || !blob.url) {
        return res.status(404).send("Gift not found");
      }

      const blobResponse = await fetch(blob.url, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000)
      });

      if (!blobResponse.ok) {
        console.error("gift blob fetch failed:", blobResponse.status);
        return res.status(404).send("Gift not found");
      }

      raw = await blobResponse.text();
    }

    const data = JSON.parse(raw);

    const origin = new URL(req.url, "http://localhost").origin;
    const baseOrigin =
      (req.headers && (req.headers["x-forwarded-proto"] || "")) &&
      (req.headers && req.headers.host)
        ? String(req.headers["x-forwarded-proto"]).split(",")[0].trim() +
          "://" + String(req.headers.host).split(",")[0].trim()
        : origin;

    const pageResponse = await fetch(baseOrigin + "/index.html", {
      cache: "no-store"
    });

    if (!pageResponse.ok) {
      return res.status(500).send("Failed to load gift page");
    }

    let html = await pageResponse.text();
    const bootstrap =
      "<script>window.__TAHNIA_GIFT__=" +
      escapeForScript({
        n: data.n || "",
        m: data.m || "",
        g: data.g || ""
      }) +
      ";</script>";

    html = html.includes("</head>")
      ? html.replace("</head>", bootstrap + "</head>")
      : bootstrap + html;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res.status(200).send(html);
  } catch (error) {
    console.error("gift render error:", error);
    return res.status(500).send("Failed to open gift");
  }
};
