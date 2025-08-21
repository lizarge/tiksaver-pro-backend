import express from 'express';
import path from 'path';

import { createClient } from 'redis';

const PORT = process.env.PORT || 5000;
const server = express();

(async () => {

  const redisClient = await connectToRedis();

  console.log("redis ok", redisClient)

  express()
    .get('/',  async (req, res) => {
      res.send('Suck my dick')
    })
    .get('/songs', async (req, res) => {

      const cache = await redisClient.get('tiktok:songs');

      if (cache) {
        console.log('Cache hit');
        return res.send(JSON.parse(cache));
      } else {

          try {
            const response = await fetch('https://tiktok-trending1.p.rapidapi.com/api/music?country=US',{
              method: 'GET',
              headers: {
                'x-rapidapi-key': '50ba3beb9dmsh32e482dfd3b8de0p186df1jsnc8e1c4bf14e3',
                'x-rapidapi-host': 'tiktok-trending1.p.rapidapi.com'
              }
            }); 
            const data = await response.json();

            var output: any[] = [];

            data["data"].forEach((item: any) => {

              output.push(
                {
                  song_image_url: item["cover"],
                  artist: item["author"] + "," + item["music_name"],
                  tik_tok_url: item["link"],
                  song:"",
                  videos:""
                }
              )

            });

            res.send(output);

            // Save the response to Redis cache
            await redisClient.set('tiktok:songs', JSON.stringify(output), {
              EX: (60 * 1) * 120, // Cache for 120 minutes
            });

          } catch (error) {
            res.status(500).send('Error: ' + error);
          }

    }

    })
    .get('/hashtags', async (req, res) => {

      const cache = await redisClient.get('tiktok:hashtags');

      if (cache) {
        console.log('Cache hit');
        return res.send(JSON.parse(cache));
      } else {

          try {
            const response = await fetch('https://tiktok-trending1.p.rapidapi.com/api/videos',{
              method: 'GET',
              headers: {
                'x-rapidapi-key': '50ba3beb9dmsh32e482dfd3b8de0p186df1jsnc8e1c4bf14e3',
                'x-rapidapi-host': 'tiktok-trending1.p.rapidapi.com'
              }
            }); 
            const data = await response.json();
           
            var output: any[] = [];

            data["data"].forEach((item: any) => {
              if (getFirstHashtag(item["title"]) && getFirstHashtag(item["title"]) != "") {
                output.push(
                  {
                    tiktok_tag_url: "https://www.tiktok.com/tag/" + getFirstHashtag(item["title"]),
                    hashtag: getFirstHashtag(item["title"]) ?? "",
                    hashtag_image_url: item["thumbnail_url"],
                    description: item["title"],
                    views:"",
                    videos:""
                  }
                )
              }
            });

            res.send(output);

            // Save the response to Redis cache
            await redisClient.set('tiktok:hashtags', JSON.stringify(output), {
              EX: (60 * 1) * 120, // Cache for 120 minutes
            });

          } catch (error) {
            res.status(500).send('Error: ' + error);
          }

    }

    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

})()

async function connectToRedis() {
  const redisUrl = process.env.REDISCLOUD_URL || 'redis://default:oCOcn7NguNFjeBcXWgVeTE2RKC1QdSpj@redis-12819.c10.us-east-1-2.ec2.redns.redis-cloud.com:12819';
  const client = createClient({
    url: redisUrl,
    socket: {
      tls: false
    }
  });

  client.on('error', (err) => console.error('Redis Client Error', err));

  await client.connect();
  return client;
}

function getFirstHashtag(text:string) {
  const regex = /#(\w+)/; // Matches '#' followed by one or more word characters
  const match = text.match(regex);

  if (match && match[1]) {
    return match[1]; // Returns the captured group (the hashtag without '#')
  } else {
    return null; // No hashtag found
  }
}