import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';
import { NodejsFunction } from '@nx-cdktf-sls/tf-helpers';
import * as path from 'path';
import {
  IamPolicyAttachment,
  IamRole,
  IamRolePolicyAttachment,
} from '@cdktf/provider-aws/lib/iam';
import {
  LambdaFunction,
  LambdaPermission,
} from '@cdktf/provider-aws/lib/lambdafunction';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2';

const lambdaPolicyRole = {
  Version: '2012-10-17',
  Statement: [
    {
      Action: 'sts:AssumeRole',
      Principal: {
        Service: 'lambda.amazonaws.com',
      },
      Effect: 'Allow',
      Sid: '',
    },
  ],
};

interface BeStackOptions {
  env: string;
}

export class BeStack extends TerraformStack {
  endpoint: string;

  constructor(scope: Construct, name: string, { env }: BeStackOptions) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    const code = new NodejsFunction(this, 'code', {
      path: path.join(__dirname, '../api/main.js'),
    });

    const role = new IamRole(this, 'lambda-exec', {
      name: `nx-cdktf-sls-lambda-exec-${env}`,
      assumeRolePolicy: JSON.stringify(lambdaPolicyRole),
    });

    new IamRolePolicyAttachment(this, 'lambda-managed-policy', {
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      role: role.name,
    });

    const lambda = new LambdaFunction(this, 'api', {
      functionName: `nx-cdktf-sls-api-${env}`,
      handler: 'main.hello',
      runtime: 'nodejs14.x',
      role: role.arn,
      filename: code.asset.path,
      sourceCodeHash: code.asset.assetHash,
    });

    const api = new Apigatewayv2Api(this, 'api-gw', {
      name: `sls-example-posts-${env}`,
      protocolType: 'HTTP',
      target: lambda.arn,
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['content-type'],
      },
    });

    new LambdaPermission(this, 'apigw-lambda', {
      functionName: lambda.functionName,
      action: 'lambda:InvokeFunction',
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    this.endpoint = api.apiEndpoint;
  }
}
