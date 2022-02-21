import { AssetType, Resource, TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import { buildSync } from 'esbuild';
import * as path from 'path';

export interface NodejsFunctionProps {
  readonly path: string;
}

const bundle = (workingDir: string, entryPoint: string) => {
  buildSync({
    entryPoints: [entryPoint],
    platform: 'node',
    target: 'es2018',
    bundle: true,
    format: 'cjs',
    sourcemap: 'external',
    outdir: 'dist',
    absWorkingDir: workingDir,
  });

  return path.join(workingDir, 'dist');
};

export class NodejsFunction extends Resource {
  public readonly asset: TerraformAsset;
  public readonly bundledPath: string;

  constructor(scope: Construct, id: string, props: NodejsFunctionProps) {
    super(scope, id);

    const workingDirectory = path.resolve(path.dirname(props.path));
    const distPath = bundle(workingDirectory, path.basename(props.path));

    this.bundledPath = path.join(
      distPath,
      `${path.basename(props.path, '.ts')}.js`
    );

    this.asset = new TerraformAsset(this, 'lambda-asset', {
      path: distPath,
      type: AssetType.ARCHIVE,
    });
  }
}
