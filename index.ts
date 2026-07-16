import express from "express";
import { TrendsMcpClient } from "tiktok-trends-api";

const PORT = process.env.PORT || 5000;
const TRENDSMCP_API_KEY = process.env.TRENDSMCP_API_KEY || "";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache: Map<string, CacheEntry<any>> = new Map();

function getCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

const server = express();

server.get("/", (req, res) => {
  res.send("TikSaver Pro API");
});

server.get("/songs", async (req, res) => {
  const cacheKey = "tiktok:songs";
  const cached = getCache<any[]>(cacheKey);

  if (cached) {
    console.log("Cache hit /songs");
    return res.send(cached);
  }

  try {
    const region = (req.query.region as string) || "us";
    const feedUrl =
      region.toLowerCase() === "us"
        ? "https://itunes.apple.com/us/rss/topsongs/limit=25/json"
        : `https://itunes.apple.com/${region.toLowerCase()}/rss/topsongs/limit=25/json`;

    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TikSaverPro/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`iTunes returned ${response.status}`);
    }

    const data = await response.json();
    const entries = data?.feed?.entry || [];

    const output: any[] = entries.map((entry: any) => {
      const images = entry["im:image"] || [];
      const image =
        images.find((img: any) => img.attributes?.height === "170")?.label ||
        images[images.length - 1]?.label ||
        "";

      const title = entry["im:name"]?.label || "";
      const artist = entry["im:artist"]?.label || "";
      const link =
        entry.link?.find((l: any) => l.attributes?.rel === "alternate")
          ?.attributes?.href ||
        entry.link?.attributes?.href ||
        "";

      return {
        song_image_url: image,
        artist: artist,
        tik_tok_url: link,
        song: title,
        videos: "",
      };
    });

    setCache(cacheKey, output, 120 * 60); // 120 minutes
    res.send(output);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).send("Error: " + error);
  }
});

server.get("/hashtags", async (req, res) => {
  const cacheKey = "tiktok:hashtags";
  const cached = getCache<any[]>(cacheKey);

  if (cached) {
    console.log("Cache hit /hashtags");
    return res.send(cached);
  }

  if (!TRENDSMCP_API_KEY) {
    console.error("TRENDSMCP_API_KEY is not configured");
    return res.status(500).send({
      error:
        "TRENDSMCP_API_KEY is not configured. Sign up at https://trendsmcp.ai to get a free API key.",
    });
  }

  try {
    const client = new TrendsMcpClient({ apiKey: TRENDSMCP_API_KEY });

    const trending = await client.getTopTrends({
      type: "TikTok Trending Hashtags",
      limit: 20,
    });

    const items = trending?.data || [];

    const output: any[] = items.map((item: any) => {
      const rank = Array.isArray(item) ? item[0] : "";
      const hashtag = Array.isArray(item) ? item[1] : item;

      return {
        tiktok_tag_url: `https://www.tiktok.com/tag/${encodeURIComponent(
          hashtag,
        )}`,
        hashtag: hashtag,
        hashtag_image_url:
          "https://via.placeholder.com/300x300/FF0050/FFFFFF?text=%23",
        description: `${hashtag} — trending hashtag on TikTok`,
        views: rank ? `#${rank}` : "",
        videos: "",
      };
    });

    setCache(cacheKey, output, 360 * 60); // Cache for 6 hours to stay within free tier
    res.send(output);
  } catch (error) {
    console.error("Error fetching hashtags from TrendsMCP:", error);
    res.status(500).send("Error: " + error);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
