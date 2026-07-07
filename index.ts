import express from "express";

const PORT = process.env.PORT || 5000;
const RAPIDAPI_KEY =
  process.env.RAPIDAPI_KEY ||
  "50ba3beb9dmsh32e482dfd3b8de0p186df1jsnc8e1c4bf14e3";
const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST || "tiktok-trending1.p.rapidapi.com";

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
    const response = await fetch(
      "https://" + RAPIDAPI_HOST + "/api/music?country=US",
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`RapidAPI returned ${response.status}`);
    }

    const data = await response.json();
    const output: any[] = [];

    data["data"].forEach((item: any) => {
      output.push({
        song_image_url: item["cover"],
        artist: item["author"] + "," + item["music_name"],
        tik_tok_url: item["link"],
        song: "",
        videos: "",
      });
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
    const response = await fetch("https://" + RAPIDAPI_HOST + "/api/videos", {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI returned ${response.status}`);
    }

    const data = await response.json();
    const output: any[] = [];

    data["data"].forEach((item: any) => {
      const firstHashtag = getFirstHashtag(item["title"]);
      if (firstHashtag) {
        output.push({
          tiktok_tag_url: "https://www.tiktok.com/tag/" + firstHashtag,
          hashtag: firstHashtag,
          hashtag_image_url: item["thumbnail_url"],
          description: item["title"],
          views: "",
          videos: "",
        });
      }
    });

    setCache(cacheKey, output, 120 * 60); // 120 minutes
    res.send(output);
  } catch (error) {
    console.error("Error fetching hashtags:", error);
    res.status(500).send("Error: " + error);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

function getFirstHashtag(text: string): string | null {
  const regex = /#(\w+)/;
  const match = text.match(regex);
  return match && match[1] ? match[1] : null;
}
