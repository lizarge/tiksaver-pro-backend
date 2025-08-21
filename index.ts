import express from 'express';
import path from 'path';

const PORT = process.env.PORT || 5000;
const server = express();

express()
  .use(express.static(path.join(__dirname, '../public')))
  .set('views', path.join(__dirname, '../views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/songs', async (req, res) => {

    try {
      const response = await fetch('https://tiktok-scraper7.p.rapidapi.com/feed/list?region=us&count=19',{
        method: 'GET',
        headers: {
          'x-rapidapi-key': '50ba3beb9dmsh32e482dfd3b8de0p186df1jsnc8e1c4bf14e3',
          'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
        }
      }); 
      const data = await response.json();
      res.send(data);
    } catch (error) {
      res.status(500).send('Error: ' + error);
    }

  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


