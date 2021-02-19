import { Client, createClient } from '@urql/core';
import gql from 'graphql-tag';
import fetch from 'isomorphic-fetch';
import { Gauge } from 'prom-client';

const wait = async (time = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export interface Details {
  url?: string;
  healthy: boolean;
}

export interface IndexerEndpoints {
  service: Details;
  status: Details;
  channels: Details;
}

export class GraphWatchtower {
  private graph_indexer_status: Gauge<'identifier'>;
  private urqlClient: Client | null = null;
  private url: string;
  private waitTime: number;

  constructor(url: string, waitTime: number) {
    this.url = url;
    this.graph_indexer_status = new Gauge({
      name: 'graph_watchtower_service_status',
      help: 'Keeps track of the status of the graph indexer endpoints',
      labelNames: ['identifier'],
    });
    this.waitTime = waitTime;

    this.initializeUrqlClient();
  }

  private async initializeUrqlClient() {
    this.urqlClient = createClient({ url: this.url, fetch });
  }

  async run() {
    while (true) {
      const indexerEndpoints = await this.getStatus();
      await this.setGraphStatusGuage(indexerEndpoints);
      await wait(this.waitTime);
    }
  }

  private async setGraphStatusGuage(indexerEndpoints: IndexerEndpoints) {
    this.graph_indexer_status
      .labels('channels')
      .set(indexerEndpoints.channels.healthy ? 1 : 0);
    this.graph_indexer_status
      .labels('status')
      .set(indexerEndpoints.status.healthy ? 1 : 0);
    this.graph_indexer_status
      .labels('service')
      .set(indexerEndpoints.service.healthy ? 1 : 0);
  }

  private async getStatus() {
    if (this.urqlClient) {
      try {
        const {
          data,
        }: {
          data?: IndexerEndpoints;
        } = await this.urqlClient
          .query(
            gql`
              query {
                indexerEndpoints {
                  service {
                    url
                    healthy
                  }
                  status {
                    url
                    healthy
                  }
                  channels {
                    url
                    healthy
                  }
                }
              }
            `,
            {}
          )
          .toPromise();

        if (data) {
          return data;
        } else {
          const indexerEndpoints: IndexerEndpoints = {
            service: {
              healthy: false,
            },
            channels: {
              healthy: false,
            },
            status: {
              healthy: false,
            },
          };

          return indexerEndpoints;
        }
      } catch (error) {
        throw error;
      }
    } else {
      throw new Error('Urql client not initialized');
    }
  }
}
