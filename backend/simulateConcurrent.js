const { fork } = require('child_process');
const path = require('path');

const CLIENT_COUNT = 50;
const SCRIPT_PATH = path.join(__dirname, 'simulateClient.js');

console.log(`Starting ${CLIENT_COUNT} concurrent WebSocket clients...`);

const children = [];

for (let i = 1; i <= CLIENT_COUNT; i++) {
  console.log(`Starting client ${i}`);
  const child = fork(SCRIPT_PATH, [String(i)], {
    stdio: 'inherit',
  });
  children.push(child);
}

let finished = 0;
children.forEach((child, idx) => {
  child.on('exit', () => {
    finished++;
    console.log(`Client ${idx + 1} finished (${finished}/${CLIENT_COUNT})`);
    if (finished === CLIENT_COUNT) {
      console.log('All clients finished');
      process.exit(0);
    }
  });
});
