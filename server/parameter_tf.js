// Website/server/parameter_tf.js
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
console.log('✅ WS‑Server: listen ws://localhost:8080');

const state = {
  base: 0, shoulder: 0, elbow: 0, wrist1: 0, wrist2: 0, wrist3: 0,
  x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0,
  movementSpeed: 50,
};
const valid = Object.keys(state);

wss.on('connection', (ws) => {
  console.log('✅ WS‑Server: client connected');
  ws.send(JSON.stringify(state));              // ส่งค่าเริ่มต้น

  ws.on('message', (raw) => {
    try {
      const incoming = JSON.parse(raw);
      let changed = false;

      valid.forEach((k) => {
        if (incoming[k] !== undefined && incoming[k] !== state[k]) {
          state[k] = incoming[k];
          changed = true;
        }
      });

      if (changed) broadcast(JSON.stringify(state));
    } catch {
      console.warn('⚠️  ไม่ใช่ JSON:', raw.toString());
    }
  });

  ws.on('close', () => console.log('❌ WS‑Server: client disconnected'));
});

function broadcast(json) {
  wss.clients.forEach((c) => c.readyState === c.OPEN && c.send(json));
}
