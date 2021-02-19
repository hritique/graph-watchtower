import dotenv from 'dotenv';
import express from 'express';
import { register } from 'prom-client';
import { GraphWatchtower } from './watchtower';
dotenv.config({ path: 'config.env' });

const app = express();

const PORT = process.env.PORT || 5000;
const URL = process.env.URL as string;
const WAIT_TIME = parseInt(process.env.WAIT_TIME || '1000');

const watchtower = new GraphWatchtower(URL, WAIT_TIME);

watchtower.run();

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.get('/', (_, res) => {
  try {
    res.send('Graph Watchtower');
  } catch (error) {}
});

app.listen(PORT, () => {
  console.log('Server listening to port: ' + PORT);
});
