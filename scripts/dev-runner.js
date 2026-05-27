const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const processes = [];

function sanitize(text) {
  return text
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/^[\u0007\s]*(?:➜|鉃\?)\s*/gm, '')
    .replace(/馃敡|馃搷|馃|馃敆/g, '')
    .replace(/\r/g, '');
}

function normalizeLine(prefix, line) {
  const cleaned = line.trimEnd();
  if (!cleaned.trim()) return '';
  if (cleaned.startsWith(`[${prefix}] `)) {
    return cleaned;
  }
  return `[${prefix}] ${cleaned}`;
}

function shouldSkipLine(prefix, line) {
  if (prefix !== 'FRONTEND') return false;
  return /VITE\s+v|Local:|Network:|press h \+ enter to show help/.test(line);
}

function pipeOutput(stream, prefix) {
  let buffer = '';
  stream.setEncoding('utf8');

  stream.on('data', (chunk) => {
    buffer += sanitize(chunk);
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (shouldSkipLine(prefix, line)) continue;
      const output = normalizeLine(prefix, line);
      if (output) {
        process.stdout.write(`${output}\n`);
      }
    }
  });

  stream.on('end', () => {
    if (!shouldSkipLine(prefix, buffer)) {
      const output = normalizeLine(prefix, buffer);
      if (output) {
        process.stdout.write(`${output}\n`);
      }
    }
  });
}

function shutdown(code = 0) {
  while (processes.length) {
    const child = processes.pop();
    if (child && !child.killed) {
      child.kill();
    }
  }
  process.exit(code);
}

function run(name, script, cwd, onStart) {
  const child = spawn('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    script,
  ], {
    cwd,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      NO_COLOR: '1',
      npm_config_color: 'false',
    },
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: false,
  });

  processes.push(child);
  pipeOutput(child.stdout, name);
  pipeOutput(child.stderr, name);

  if (onStart) {
    onStart();
  }

  child.on('exit', (code) => {
    process.stdout.write(`[${name}] exited with code ${code}\n`);
    if (code && code !== 0) {
      shutdown(code);
    }
  });

  child.on('error', (error) => {
    process.stdout.write(`[${name}] failed to start: ${error.message}\n`);
    shutdown(1);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('BACKEND', 'npm run dev', path.join(rootDir, 'server'));
run('FRONTEND', 'node ./node_modules/vite/bin/vite.js', path.join(rootDir, 'client'), () => {
  process.stdout.write('[FRONTEND] Local: http://localhost:5173/\n');
  process.stdout.write('[FRONTEND] Network: use --host to expose\n');
});
