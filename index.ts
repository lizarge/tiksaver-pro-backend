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

const fallbackSongs = [
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/8f4b6f8f0e5f3e2e1d4c5b6a7f8e9d0c~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Tyla,Water",
    tik_tok_url: "https://www.tiktok.com/music/Water-1234567890",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Doechii,Anxiety",
    tik_tok_url: "https://www.tiktok.com/music/Anxiety-0987654321",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/abcdef1234567890abcdef1234567890~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Billie Eilish,BIRDS OF A FEATHER",
    tik_tok_url: "https://www.tiktok.com/music/BIRDS-OF-A-FEATHER-111222333",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/0987654321abcdef0987654321abcdef~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Sabrina Carpenter,Espresso",
    tik_tok_url: "https://www.tiktok.com/music/Espresso-444555666",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/fedcba1234567890fedcba1234567890~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Post Malone,I Had Some Help",
    tik_tok_url: "https://www.tiktok.com/music/I-Had-Some-Help-777888999",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Chappell Roan,Good Luck Babe!",
    tik_tok_url: "https://www.tiktok.com/music/Good-Luck-Babe-000111222",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Tommy Richman,MILLION DOLLAR BABY",
    tik_tok_url: "https://www.tiktok.com/music/MILLION-DOLLAR-BABY-333444555",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Artemas,I Like The Way You Kiss Me",
    tik_tok_url: "https://www.tiktok.com/music/I-Like-The-Way-You-Kiss-Me-666777888",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Hozier,Too Sweet",
    tik_tok_url: "https://www.tiktok.com/music/Too-Sweet-999000111",
    song: "",
    videos: "",
  },
  {
    song_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0~tplv-tiktokx-cropcenter:100:100.jpeg",
    artist: "Teddy Swims,Lose Control",
    tik_tok_url: "https://www.tiktok.com/music/Lose-Control-222333444",
    song: "",
    videos: "",
  },
];

const fallbackHashtags = [
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/fyp",
    hashtag: "fyp",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/fyp~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "For You Page #fyp #foryou #viral",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/foryou",
    hashtag: "foryou",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/foryou~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "For You #foryou #fyp #trending",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/trending",
    hashtag: "trending",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/trending~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Trending now #trending #viral #fyp",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/viral",
    hashtag: "viral",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/viral~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Go viral #viral #fyp #trending",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/love",
    hashtag: "love",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/love~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Love #love #fyp #viral",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/funny",
    hashtag: "funny",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/funny~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Funny videos #funny #fyp #viral",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/dance",
    hashtag: "dance",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/dance~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Dance trends #dance #fyp #trending",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/music",
    hashtag: "music",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/music~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Music #music #fyp #viral",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/comedy",
    hashtag: "comedy",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/comedy~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Comedy #comedy #funny #fyp",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/beauty",
    hashtag: "beauty",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/beauty~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Beauty #beauty #fyp #makeup",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/fashion",
    hashtag: "fashion",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/fashion~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Fashion #fashion #fyp #style",
    views: "",
    videos: "",
  },
  {
    tiktok_tag_url: "https://www.tiktok.com/tag/food",
    hashtag: "food",
    hashtag_image_url:
      "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/food~tplv-tiktokx-cropcenter:100:100.jpeg",
    description: "Food #food #fyp #viral",
    views: "",
    videos: "",
  },
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

    if (Array.isArray(data["data"]) && data["data"].length > 0) {
      data["data"].forEach((item: any) => {
        output.push({
          song_image_url: item["cover"],
          artist: item["author"] + "," + item["music_name"],
          tik_tok_url: item["link"],
          song: "",
          videos: "",
        });
      });
    }

    const result = output.length > 0 ? output : fallbackSongs;
    setCache(cacheKey, result, 120 * 60); // 120 minutes
    res.send(result);
  } catch (error) {
    console.error("Error fetching songs, using fallback:", error);
    setCache(cacheKey, fallbackSongs, 120 * 60);
    res.send(fallbackSongs);
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

    if (Array.isArray(data["data"]) && data["data"].length > 0) {
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
    }

    const result = output.length > 0 ? output : fallbackHashtags;
    setCache(cacheKey, result, 120 * 60); // 120 minutes
    res.send(result);
  } catch (error) {
    console.error("Error fetching hashtags, using fallback:", error);
    setCache(cacheKey, fallbackHashtags, 120 * 60);
    res.send(fallbackHashtags);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on ${ PORT }`);
});

function getFirstHashtag(text: string): string | null {
  const regex = /#(\w+)/;
  const match = text.match(regex);
  return match && match[1] ? match[1] : null;
}
