import { executeNetWasm } from './engine/netwasm.browser.mjs';

const manifestBytes = await (await fetch(new URL('./engine/deployment.json', import.meta.url))).arrayBuffer();
const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', manifestBytes))].map(b => b.toString(16).padStart(2, '0')).join('');

async function evaluate(values) {
    const chunks = [];
    let errors = '';
    const outcome = await executeNetWasm({
      request: {
        schemaVersion: 1, buildFingerprint: manifest.buildFingerprint, deploymentManifestSha256: digest,
        arguments: [values.pattern, values.input, values.replacement, String(values.options), String(values.start), String(values.limit), values.mode],
        environment: [], applicationImports: [],
        grants: { clocks: ['monotonic'], environment: [], preopens: [], network: 'denyAll', randomness: false },
      },
      signal: null,
      stdout: Object.freeze({ write: bytes => chunks.push(bytes) }),
      stderr: Object.freeze({ write: bytes => { errors += new TextDecoder().decode(bytes); } }),
    });
    if (outcome.completionKind !== 'normal' || outcome.exitCode !== 0) throw new Error(errors || outcome.primaryFailure?.message || 'The regex engine could not finish.');
    const bytes = new Uint8Array(chunks.reduce((n, chunk) => n + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(bytes));
}

// Finish the one-time download before starting the per-request watchdog.
await evaluate({ pattern: '', input: '', replacement: '', options: 0, start: 0, limit: 1, mode: 'match' });
self.postMessage({ type: 'ready' });
self.onmessage = async ({ data: { id, values } }) => {
  const started = performance.now();
  try {
    const result = await evaluate(values);
    self.postMessage({ type: 'result', id, result, elapsed: performance.now() - started });
  } catch (error) {
    self.postMessage({ type: 'result', id, result: { error: error?.message || String(error) }, elapsed: performance.now() - started });
  }
};
