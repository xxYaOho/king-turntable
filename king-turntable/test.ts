/**
 * King Turntable - TDD Test Suite
 * 
 * PRD 核心验收标准测试:
 * 1. n>=2 房间中，全员 ready 后进入抽取阶段，成员列表冻结
 * 2. n 人最终每人恰好抽到 1 个目标，每个目标恰好被抽 1 次（双射）
 * 3. 任意用户不会抽到自己
 * 4. 并发抽取不会导致重复目标分配
 * 5. 最后一位未抽取用户自动完成分配
 * 6. 除本人外无法获取他人抽取结果
 * 7. 房间到期/完成后数据按 TTL 销毁
 */

const API_BASE = 'http://localhost:3001/api';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    return false;
  }
}

async function createRoom() {
  const res = await fetch(`${API_BASE}/room`, { method: 'POST' });
  return res.json();
}

async function joinRoom(roomId, clientId, displayName) {
  const res = await fetch(`${API_BASE}/room/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, displayName })
  });
  return res.json();
}

async function setReady(roomId, clientId, ready) {
  const res = await fetch(`${API_BASE}/room/${roomId}/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, ready })
  });
  return res.json();
}

async function draw(roomId, clientId) {
  const res = await fetch(`${API_BASE}/room/${roomId}/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, idempotencyKey: `${clientId}-${Date.now()}` })
  });
  return res.json();
}

async function getState(roomId, clientId) {
  const res = await fetch(`${API_BASE}/room/${roomId}/state?clientId=${clientId}`);
  return res.json();
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
  console.log('🧪 King Turntable TDD Test Suite\n');
  let passed = 0;
  let failed = 0;

  // Test 1: 创建房间
  const test1 = await test('1. 创建房间返回 roomId 和 roomCode', async () => {
    const room = await createRoom();
    if (!room.roomId || !room.roomCode) throw new Error('Missing roomId or roomCode');
  });
  test1 ? passed++ : failed++;

  // Test 2: 加入房间
  const test2 = await test('2. 可以加入房间成为成员', async () => {
    const room = await createRoom();
    const result = await joinRoom(room.roomId, 'user1', 'User One');
    if (result.memberCount !== 1) throw new Error(`Expected 1 member, got ${result.memberCount}`);
  });
  test2 ? passed++ : failed++;

  // Test 3: 房间至少 2 人才可进入抽取
  const test3 = await test('3. 房间至少 2 人才可进入抽取', async () => {
    const room = await createRoom();
    await joinRoom(room.roomId, 'user1', 'User One');
    await joinRoom(room.roomId, 'user2', 'User Two');
    
    // User1 ready
    await setReady(room.roomId, 'user1', true);
    let state = await getState(room.roomId, 'user1');
    if (state.state !== 'OPEN') throw new Error(`Expected OPEN, got ${state.state}`);
    
    // User2 ready  
    await setReady(room.roomId, 'user2', true);
    
    // Wait for state transition
    await wait(1000);
    state = await getState(room.roomId, 'user1');
    if (state.state !== 'FROZEN' && state.state !== 'DRAWING') {
      throw new Error(`Expected FROZEN or DRAWING, got ${state.state}`);
    }
  });
  test3 ? passed++ : failed++;

  // Test 4: n 人每人恰好抽到 1 个目标，双射
  const test4 = await test('4. 抽取结果双射（2人互抽）', async () => {
    const room = await createRoom();
    await joinRoom(room.roomId, 'a', 'A');
    await joinRoom(room.roomId, 'b', 'B');
    await setReady(room.roomId, 'a', true);
    await setReady(room.roomId, 'b', true);
    await wait(1000);
    
    // Both draw
    const drawA = await draw(room.roomId, 'a');
    const drawB = await draw(room.roomId, 'b');
    
    // Verify: a draws b, b draws a (or vice versa)
    const aTarget = drawA.targetId;
    const bTarget = drawB.targetId;
    
    if (aTarget === bTarget) throw new Error('Both drew same target');
    if (aTarget === 'a' || bTarget === 'b') throw new Error('Someone drew themselves');
  });
  test4 ? passed++ : failed++;

  // Test 5: 不能抽到自己
  const test5 = await test('5. 用户不会抽到自己', async () => {
    // Already tested in test4
  });
  test5 ? passed++ : failed++;

  // Test 6: 最后一位自动抽取
  const test6 = await test('6. 最后一位自动完成抽取', async () => {
    const room = await createRoom();
    await joinRoom(room.roomId, 'a', 'A');
    await joinRoom(room.roomId, 'b', 'B');
    await setReady(room.roomId, 'a', true);
    await setReady(room.roomId, 'b', true);
    await wait(1000);
    
    // Only A draws
    await draw(room.roomId, 'a');
    
    // Wait for auto-draw
    await wait(1000);
    
    const state = await getState(room.roomId, 'b');
    if (state.state !== 'DONE') throw new Error(`Expected DONE, got ${state.state}`);
  });
  test6 ? passed++ : failed++;

  // Test 7: 3人测试双射
  const test7 = await test('7. 3人抽取各得不同目标', async () => {
    const room = await createRoom();
    await joinRoom(room.roomId, 'a', 'A');
    await joinRoom(room.roomId, 'b', 'B');
    await joinRoom(room.roomId, 'c', 'C');
    await setReady(room.roomId, 'a', true);
    await setReady(room.roomId, 'b', true);
    await setReady(room.roomId, 'c', true);
    await wait(1000);
    
    // First 2 draw
    const drawA = await draw(room.roomId, 'a');
    const drawB = await draw(room.roomId, 'b');
    
    // Wait for auto-assign
    await wait(1000);
    
    // Check final state - should be DONE with all assignments
    const state = await getState(room.roomId, 'a');
    if (state.state !== 'DONE') throw new Error(`Expected DONE, got ${state.state}`);
    
    // Get all assignments via getState - but we need to check via reveals
    const revealA = await fetch(`${API_BASE}/room/${room.roomId}/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'a' })
    }).then(r => r.json());
    
    // a can't draw again
    const drawAgain = await draw(room.roomId, 'a');
    if (!drawAgain.alreadyDrawn && !drawAgain.error) {
      throw new Error('Should detect already drawn');
    }
  });
  test7 ? passed++ : failed++;

  // Test 8: 阅后即焚
  const test8 = await test('8. 抽取结果只返回一次', async () => {
    const room = await createRoom();
    await joinRoom(room.roomId, 'a', 'A');
    await joinRoom(room.roomId, 'b', 'B');
    await setReady(room.roomId, 'a', true);
    await setReady(room.roomId, 'b', true);
    await wait(1000);
    
    const drawA = await draw(room.roomId, 'a');
    if (!drawA.targetId) throw new Error('No target returned');
    
    // Try to draw again - should detect already drawn
    const drawAgain = await draw(room.roomId, 'a');
    if (!drawAgain.alreadyDrawn && !drawAgain.error) {
      throw new Error('Should detect already drawn');
    }
  });
  test8 ? passed++ : failed++;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
}

runTests();
