import { execSync } from 'child_process';

const PORT = 3000;

try {
  // Find PID using port 3000
  const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
  const lines = result.split('\n').filter(line => line.includes('LISTENING'));

  const pids = new Set();
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' });
      console.log(`Killed process ${pid} on port ${PORT}`);
    } catch (e) {
      // Process might already be dead
    }
  }

  if (pids.size === 0) {
    console.log(`Port ${PORT} is free`);
  }
} catch (e) {
  // No process found on port - this is fine
  console.log(`Port ${PORT} is free`);
}
