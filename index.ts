import express from "express";

const PORT = process.env.PORT || 5000;

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

const trendingHashtags = [
  "fyp",
  "foryou",
  "trending",
  "viral",
  "love",
  "funny",
  "dance",
  "music",
  "comedy",
  "beauty",
  "fashion",
  "food",
  "travel",
  "fitness",
  "meme",
  "cat",
  "dog",
  "asmr",
  "makeup",
  "gaming",
];

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

  try {
    const results: any[] = [];

    for (const tag of trendingHashtags) {
      const item = await fetchTikTokHashtag(tag);
      if (item) {
        results.push(item);
      }
      // Small delay to avoid rate limiting
      await sleep(150);
    }

    setCache(cacheKey, results, 120 * 60); // 120 minutes
    res.send(results);
  } catch (error) {
    console.error("Error fetching hashtags:", error);
    res.status(500).send("Error: " + error);
  }
});

async function fetchTikTokHashtag(tag: string): Promise<any | null> {
  try {
    const url = `https://www.tiktok.com/api/challenge/detail/?challengeName=${encodeURIComponent(
      tag,
    )}&aid=1988`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: `https://www.tiktok.com/tag/${tag}`,
        "Sec-Ch-Ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(
        `TikTok hashtag ${tag} returned HTTP ${response.status}`,
      );
      return null;
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(
        `TikTok hashtag ${tag} returned non-JSON:`,
        text.slice(0, 200),
      );
      return null;
    }

    const challenge = data?.challengeInfo?.challenge;
    const stats = data?.challengeInfo?.statsV2;

    if (!challenge || !stats) {
      console.error(
        `TikTok hashtag ${tag} missing challenge/stats. Response keys:`,
        Object.keys(data || {}),
      );
      return null;
    }

    const title = challenge.title || tag;
    const viewCount = parseInt(stats.viewCount || "0", 10);
    const videoCount = parseInt(stats.videoCount || "0", 10);

    return {
      tiktok_tag_url: `https://www.tiktok.com/tag/${title}`,
      hashtag: title,
      hashtag_image_url:
        challenge.profileMedium ||
        challenge.coverMedium ||
        "https://via.placeholder.com/300x300/FF0050/FFFFFF?text=%23",
      description: `${title} hashtag on TikTok`,
      views: formatNumber(viewCount),
      videos: formatNumber(videoCount),
    };
  } catch (error) {
    console.error(`Error fetching hashtag ${tag}:`, error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000_000) {
    return (n / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
  }
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(n);
}

server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
