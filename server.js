import express from "express";
import scrapeLinkedIn from "./index.js"; // Make sure index.js exports the function
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.get("/scrape", async (req, res) => {
  const postUrl = req.query.url;
  if (!postUrl) return res.status(400).send("❌ Missing LinkedIn post URL.");

  try {
    await scrapeLinkedIn(postUrl);
    res.send("✅ Scraping completed! Check your Google Sheet.");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to scrape the post.");
  }
});

app.get("/", (req, res) => {
  res.send(`
    <form action="/scrape" method="get">
      <input type="text" name="url" placeholder="Paste LinkedIn post URL" style="width: 400px;" />
      <button type="submit">Scrape</button>
    </form>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
