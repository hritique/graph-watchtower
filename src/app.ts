import express from 'express';
import { readFile } from 'fs/promises';
import { register, Gauge } from 'prom-client';
import indexerJson from '../status.json';

const app = express();

const PORT = 5000;

const graph_indexer_status = new Gauge({
  name: 'graph_watchtower_service_status',
  help: 'Keeps track of the status of the graph indexer endpoints',
  labelNames: ['name'],
});

const wait = async (time = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const checkServiceStatus = async (statusJson = indexerJson) => {
  try {
    const { endpoints } = statusJson;

    const statuses: any = [];

    endpoints.forEach((endpoint) => {
      statuses.push({ key: endpoint.name, status: 'up' });
    });

    return statuses;
  } catch (error) {
    console.log(error);
  }
};

const updateServiceStatus = async () => {
  try {
    while (true) {
      const status = await checkServiceStatus();

      status.forEach((service: any) => {
        graph_indexer_status.labels(service.key).set(Math.round(Math.random()));
      });

      await wait(5000);

      console.log('wait over');
    }
  } catch (error) {}
};

app.post('/add-metric', (_, res) => {
  updateServiceStatus();
  res.send('Done');
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.get('/', (_, res) => {
  res.send(indexerJson);
});

app.listen(PORT, () => {
  console.log('Server listening to port: ' + PORT);
});
