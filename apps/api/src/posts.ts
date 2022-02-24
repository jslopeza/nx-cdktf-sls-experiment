import { LambdaOptions } from '@nx-cdktf-sls/tf-helpers';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const lambdaOptions: LambdaOptions = {
  handler: 'posts.handler',
  environment: {
    variables: {
      TEST_VAR: 'test',
    },
  },
};

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Posts Lambda',
    }),
  };
};
