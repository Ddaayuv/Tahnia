function escapeForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\\u2028/g, "\\u2028")
    .replace(/\\u2029/g, "\\u2029");
}

module.exports = async function handler(req, res) {
  const id = String((req.query && req.query.id) || "").trim();

  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) {
    return res.status(404).send("Gift not found");
  }

  try {
    const { get } = await import("@vercel/blob");
    const result = await get("gifts/" + id + ".json", { access: "public" });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return res.status(404).send("Gift not found");
    }

    const raw = await new Response(result.stream).text();
    const data = JSON.parse(raw);

    const origin = new URL(req.url).origin;
    const pageResponse = await fetch(origin + "/index.html", { cache: "no-store" });

    if (!pageResponse.ok) {
      return res.status(500).send("Failed to load gift page");
    }

    let html = await pageResponse.text();
    const bootstrap = "<script>window.__TAHNIA_GIFT__=" +
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
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.status(200).send(html);
  } catch (error) {
    console.error("gift render error:", error);
    return res.status(404).send("Gift not found");
  }
};
