import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';

export class FeStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new S3Bucket(this, 'nx-cdktf-sls-fe');
  }
}
