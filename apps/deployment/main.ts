import { BeStack } from '@nx-cdktf-sls/api/infrastructure';
import { FeStack } from '@nx-cdktf-sls/fe/infrastructure';
import { App } from 'cdktf';

const app = new App();

new BeStack(app, 'api-dev', {
  env: 'dev',
});
new FeStack(app, 'fe-dev');

app.synth();
