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


      //try get answer from redis cache 
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
            res.send(data);

            // Save the response to Redis cache
            await redisClient.set('tiktok:songs', JSON.stringify(data), {
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