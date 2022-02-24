import { AwsProvider } from '@cdktf/provider-aws';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2';
import { Lambda } from '@nx-cdktf-sls/tf-helpers';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

interface BeStackOptions {
  env: string;
}

export class BeStack extends TerraformStack {
  endpoint: string;

  constructor(scope: Construct, name: string, { env }: BeStackOptions) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    const api = new Apigatewayv2Api(this, 'api-gw', {
      name: `sls-example-posts-${env}`,
      protocolType: 'HTTP',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['content-type'],
      },
    });

    // Create APIs for each file in the src aka file based routing
    fs.readdirSync(path.join(__dirname, '../src'))
      .filter((f) => f.endsWith('.ts'))
      .forEach((file) => {
        const name = file.replace('.ts', '');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { lambdaOptions = {} } = require(`../src/${file}`);
        new Lambda(this, file, {
          path: path.join(__dirname, `../src/${file}`),
          handler: `${name}.handler`,
          apiGw: api,
          functionName: `nx-cdktf-api-${name}`,
          env,
          ...lambdaOptions,
        });
      });

    this.endpoint = api.apiEndpoint;
  }
}
