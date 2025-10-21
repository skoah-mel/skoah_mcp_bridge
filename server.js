import express from "express";

const app = express();
app.use(express.json());

const { SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION } = process.env;

app.get("/", (_req, res) => {
  res.send("MCP Bridge running for Skoah!");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/tools", (_req, res) => {
  res.json({
    tools: [
      {
        name: "search_shop_catalog",
        description: "Search Shopify products by title",
        arguments: { query: "string" },
      },
    ],
  });
});

app.post("/tools/call", async (req, res) => {
  const { name, arguments: args } = req.body;
  if (name !== "search_shop_catalog") return res.status(404).json({ error: "Unknown tool" });

  const query = args?.query || "";
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?title=${encodeURIComponent(query)}&limit=5`;

  const response = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const products = (data.products || []).map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    price: p.variants?.[0]?.price,
    image: p.image?.src || null,
  }));

  res.json({ result: { products } });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`MCP Bridge running on port ${port}`));
