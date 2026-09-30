const $ = id => document.getElementById(id);
const fields = ['pattern', 'input', 'replacement', 'start', 'limit'];
let mode = 'match', worker, ready = false, busy = false, pending = true, sequence = 0, active = 0, timer, debounce;
let source = '';

function values() {
  const options = [...document.querySelectorAll('.options input:checked')].reduce((n, input) => n | Number(input.value), 0);
  return {
    pattern: $('pattern').value, input: $('input').value, replacement: $('replacement').value,
    start: $('start').value === '' ? (options & 64 ? $('input').value.length : 0) : Number($('start').value),
    limit: Number($('limit').value), options, mode,
  };
}

function showError(message) {
  $('error').textContent = message;
  $('error').hidden = false;
  $('results').replaceChildren();
  $('status').textContent = 'Could not evaluate';
}

function startWorker() {
  ready = false;
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'ready') { ready = true; if (pending) run(); return; }
    if (data.id !== active) return;
    clearTimeout(timer); busy = false; $('run').disabled = false; $('run').textContent = 'Test regex →';
    if (pending) { run(); return; }
    render(data.result, data.elapsed);
  };
  worker.onerror = event => {
    clearTimeout(timer); busy = false; ready = false; pending = false;
    $('run').disabled = false; $('run').textContent = 'Retry →';
    showError(event.message || 'The regex engine could not load. Check your connection and try again.');
    worker.terminate(); worker = null;
  };
}

function run() {
  clearTimeout(debounce);
  pending = true;
  if (!worker) { $('status').textContent = 'Loading .NET regex engine…'; startWorker(); return; }
  if (!ready || busy) return;
  const request = values();
  pending = false;
  if (!Number.isInteger(request.start) || request.start < 0 || request.start > request.input.length) { showError('Start position must be between 0 and the length of your text.'); return; }
  if (!Number.isInteger(request.limit) || request.limit < 1 || request.limit > 1000) { showError('Result limit must be between 1 and 1000.'); return; }
  if ([request.pattern, request.input, request.replacement].some(value => value.includes('\0'))) { showError('Literal NUL characters cannot be passed to this tester. Use \\0 in your pattern instead.'); return; }
  source = request.input;
  busy = true; active = ++sequence;
  $('error').hidden = true; $('status').textContent = 'Testing…';
  $('run').disabled = true; $('run').textContent = 'Testing…';
  worker.postMessage({ id: active, values: request });
  timer = setTimeout(() => {
    worker.terminate(); worker = null; busy = false; ready = false; pending = false;
    $('run').disabled = false; $('run').textContent = 'Test regex →';
    showError('The worker exceeded its 5 second limit and was stopped. Simplify the pattern or shorten the input, then try again.');
  }, 5000);
}

function schedule() {
  $('characters').textContent = `${$('input').value.length.toLocaleString()} characters`;
  pending = true;
  clearTimeout(debounce);
  debounce = setTimeout(run, 250);
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function render(result, elapsed) {
  if (result.error) { showError(result.error); return; }
  $('error').hidden = true;
  $('status').textContent = `${result.matches.length}${result.truncated ? '+' : ''} ${result.matches.length === 1 ? 'match' : 'matches'} · ${elapsed.toFixed(1)} ms`;
  const container = $('results'); container.replaceChildren();
  if (mode === 'replace') container.append(element('pre', result.replacement, 'text-result'));
  else if (mode === 'split') {
    result.split.forEach((part, i) => { const item = element('pre', part === '' ? '(empty string)' : part, 'text-result'); item.setAttribute('aria-label', `Part ${i + 1}`); container.append(item); });
  } else {
    const preview = element('div', undefined, 'highlighted');
    let position = 0;
    for (const match of [...result.matches].sort((a, b) => a.index - b.index)) {
      preview.append(document.createTextNode(source.slice(position, match.index)));
      const mark = element('mark', match.value, match.length === 0 ? 'zero-match' : undefined);
      mark.title = `Position ${match.index}, length ${match.length}`;
      preview.append(mark); position = match.index + match.length;
    }
    preview.append(document.createTextNode(source.slice(position))); container.append(preview);
  }
  if (result.matches.length === 0) container.append(element('p', 'No matches. Try another pattern or change the options.', 'muted'));
  const matches = element('div', undefined, 'matches');
  result.matches.forEach((match, i) => {
    const detail = element('details');
    const summary = element('summary', `Match ${i + 1} · position ${match.index} · length ${match.length}   `);
    summary.append(element('code', match.length === 0 ? '(empty)' : match.value)); detail.append(summary);
    const table = element('table');
    const head = element('thead'); const heading = element('tr');
    ['Group', 'Capture', 'Position', 'Length', 'Value'].forEach(label => heading.append(element('th', label)));
    head.append(heading); table.append(head);
    const body = element('tbody');
    match.groups.forEach(group => {
      if (!group.success) { const row = element('tr'); [group.name, 'No capture', '', '', ''].forEach(text => row.append(element('td', text))); body.append(row); }
      group.captures.forEach((capture, c) => {
        const row = element('tr'); [group.name, String(c + 1), String(capture.index), String(capture.length)].forEach(text => row.append(element('td', text)));
        const value = element('td'); value.append(element('code', capture.value === '' ? '(empty)' : capture.value)); row.append(value); body.append(row);
      });
    });
    table.append(body); const scroll = element('div', undefined, 'table-scroll'); scroll.append(table); detail.append(scroll); matches.append(detail);
  });
  container.append(matches);
  if (result.truncated) container.append(element('p', 'Result limit reached. Increase it to see more matches.', 'muted'));
}

function setMode(next, update = true) {
  mode = next;
  document.querySelectorAll('[data-mode]').forEach(button => { button.setAttribute('aria-selected', String(button.dataset.mode === mode)); button.tabIndex = button.dataset.mode === mode ? 0 : -1; });
  $('replacement-field').hidden = mode !== 'replace';
  if (update) schedule();
}

function restore() {
  if (!location.hash.startsWith('#regex=')) return;
  try {
    const state = JSON.parse(decodeURIComponent(location.hash.slice(7)));
    for (const field of fields) if (typeof state[field] === 'string') $(field).value = state[field];
    if (typeof state.options === 'number') document.querySelectorAll('.options input').forEach(input => { input.checked = (state.options & Number(input.value)) !== 0; });
    if (['match', 'replace', 'split'].includes(state.mode)) setMode(state.mode, false);
  } catch { showError('This share link could not be read. You can still enter a new expression.'); }
}

fields.forEach(field => $(field).addEventListener('input', schedule));
document.querySelectorAll('.options input').forEach(input => input.addEventListener('change', schedule));
document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); const modes = ['match', 'replace', 'split']; const index = modes.indexOf(mode);
    const next = modes[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3]; setMode(next); $(next + '-tab').focus();
  });
});
$('run').addEventListener('click', run);
$('example').addEventListener('click', () => {
  $('pattern').value = '(?<item>\\w+)(?:,\\s*(?<item>\\w+))*';
  $('input').value = 'apples, pears, oranges\ncoffee, tea'; $('start').value = ''; $('limit').value = '100';
  document.querySelectorAll('.options input').forEach(input => { input.checked = false; }); setMode('match');
});
$('share').addEventListener('click', async () => {
  const state = { ...values(), start: $('start').value, limit: $('limit').value };
  const link = new URL(location.href); link.hash = 'regex=' + encodeURIComponent(JSON.stringify(state));
  history.replaceState(null, '', link);
  try { await navigator.clipboard.writeText(link.href); $('share').textContent = 'Link copied ✓'; }
  catch { $('share').textContent = 'Share the address bar link'; }
  setTimeout(() => { $('share').textContent = 'Copy share link'; }, 2500);
});
window.addEventListener('hashchange', () => { restore(); schedule(); });
restore(); schedule(); startWorker();
