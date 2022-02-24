import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2';
import { IamRole, IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam';
import { LambdaFunction, LambdaFunctionConfig, LambdaPermission } from '@cdktf/provider-aws/lib/lambdafunction';
import { Resource } from 'cdktf';
import { Construct } from 'constructs';

import { NodejsFunction } from '..';

type DefaultLambdaFunctionConfig = Partial<
  Pick<LambdaFunctionConfig, 'functionName'>
> &
  Omit<LambdaFunctionConfig, 'functionName' | 'role'>;

interface LambdaProps extends DefaultLambdaFunctionConfig {
  readonly path: string;
  readonly env: string;
  readonly apiGw: Apigatewayv2Api;
}

/**
 * Options that can be used to configure the Lambda function
 */
export type LambdaOptions = Partial<LambdaProps>;

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

export class Lambda extends Resource {
  constructor(
    scope: Construct,
    name: string,
    { env, path, apiGw, ...lambdaOptions }: LambdaProps
  ) {
    super(scope, name);

    const code = new NodejsFunction(this, `code-${name}`, {
      path,
    });

    const role = new IamRole(this, 'lambda-exec', {
      name: `nx-cdktf-sls-lambda-${name}-exec-${env}`,
      assumeRolePolicy: JSON.stringify(lambdaPolicyRole),
    });

    new IamRolePolicyAttachment(this, `lambda-managed-policy-${name}-${env}`, {
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      role: role.name,
    });

    const lambda = new LambdaFunction(this, name, {
      ...lambdaOptions,
      environment: {
        variables: {
          // Add other defaults here
          NODE_ENV: env,
          ...lambdaOptions.environment?.variables,
        },
      },
      functionName: `nx-cdktf-sls-api-${name}-${env}`,
      runtime: 'nodejs14.x',
      role: role.arn,
      filename: code.asset.path,
      sourceCodeHash: code.asset.assetHash,
    });

    new LambdaPermission(this, `apigw-lambda-${name}-${env}`, {
      functionName: lambda.functionName,
      action: 'lambda:InvokeFunction',
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${apiGw.executionArn}/*/*`,
    });
  }
}
