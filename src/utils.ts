import { createClient } from '@urql/core';
import fetch from 'isomorphic-fetch';
import gql from 'graphql-tag';

const createIndexerManagementClient = async ({ url }: { url: string }) => {
  return createClient({ url, fetch });
};

const checkStatus = async (url: string) => {
  const client = await createIndexerManagementClient({ url });

  // Query status information
  let result: any | undefined;
  try {
    result = await client
      .query(
        gql`
          query {
            indexerRegistration {
              url
              address
              registered
              location {
                latitude
                longitude
              }
            }
            indexerEndpoints {
              service {
                url
                healthy
                tests {
                  test
                  error
                  possibleActions
                }
              }
              status {
                url
                healthy
                tests {
                  test
                  error
                  possibleActions
                }
              }
              channels {
                url
                healthy
                tests {
                  test
                  error
                  possibleActions
                }
              }
            }
            indexingRules(merged: true) {
              deployment
              allocationAmount
              parallelAllocations
              maxAllocationPercentage
              minSignal
              maxSignal
              minStake
              minAverageQueryFees
              custom
              decisionBasis
            }
          }
        `,
        {}
      )
      .toPromise();

    console.log(result);
  } catch (error) {
    console.error(`Failed to fetch status information: ${error}`);
  }
};

checkStatus('');
