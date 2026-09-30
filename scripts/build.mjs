import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/engine', { recursive: true });
const build = spawnSync('dotnet', ['publish', 'engine/RegexStorm.csproj', '-c', 'Release', '-o', 'artifacts/engine'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
await cp('web', 'dist', { recursive: true });
await cp('artifacts/engine/browser', 'dist/engine', { recursive: true });
