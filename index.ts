import express from 'express';
import path from 'path';

const PORT = process.env.PORT || 5000;
const server = express();

express()
  .use(express.static(path.join(__dirname, '../public')))
  .set('views', path.join(__dirname, '../views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/songs', (req, res) => {
    scrapTrending((data) => {
      res.send(data);
    });
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

function scrapTrending(completion: (data: string) => void) {
  const data = null;

  const xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  xhr.addEventListener('readystatechange', function () {
    if (this.readyState === this.DONE) {
      console.log(this.responseText);
      completion(this.responseText);
    }
  });

  xhr.open('GET', 'https://tiktok-scraper7.p.rapidapi.com/feed/list?region=us&count=10');
  xhr.setRequestHeader('x-rapidapi-key', '50ba3beb9dmsh32e482dfd3b8de0p186df1jsnc8e1c4bf14e3');
  xhr.setRequestHeader('x-rapidapi-host', 'tiktok-scraper7.p.rapidapi.com');

  xhr.send(data);
}
