import { App } from 'cdktf';
import { BeStack } from '@nx-cdktf-sls/api/infrastructure';
import { FeStack } from '@nx-cdktf-sls/fe/infrastructure';

const app = new App();

const api = new BeStack(app, 'api-dev', {
  env: 'dev',
});
const fe = new FeStack(app, 'fe-dev');

app.synth();
