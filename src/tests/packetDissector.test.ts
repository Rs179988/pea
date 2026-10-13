import test from 'node:test';
import assert from 'node:assert';
import { inferFramingGrammar, dissectBinaryStream } from '../domain/packetDissector.js';
import { inferProtocolStateMachine } from '../domain/stateMachineInferrer.js';

test('dissectBinaryStream parses magic header and opcodes', () => {
  // Construct 2 frames:
  // Frame 1: Magic 0xCAFE, Length 0x0004, Opcode 0x0001, Payload [1, 2, 3, 4]
  // Frame 2: Magic 0xCAFE, Length 0x0002, Opcode 0x0002, Payload [5, 6]
  const buf = Buffer.alloc(20);
  buf.writeUInt16BE(0xcafe, 0);
  buf.writeUInt16BE(4, 2);
  buf.writeUInt16BE(0x0001, 4);
  buf.set([1, 2, 3, 4], 6);

  buf.writeUInt16BE(0xcafe, 10);
  buf.writeUInt16BE(2, 12);
  buf.writeUInt16BE(0x0002, 14);
  buf.set([5, 6], 16);

  const grammar = inferFramingGrammar(buf);
  assert.strictEqual(grammar.magicBytes, 0xcafe);

  const frames = dissectBinaryStream(buf, grammar);
  assert.strictEqual(frames.length, 2);
  assert.strictEqual(frames[0].opcode, 0x0001);
  assert.strictEqual(frames[0].payloadLength, 4);
  assert.strictEqual(frames[1].opcode, 0x0002);
  assert.strictEqual(frames[1].payloadLength, 2);

  const sm = inferProtocolStateMachine(frames);
  assert.ok(sm.transitions.length >= 2);
  assert.strictEqual(sm.transitions[0].triggerOpcode, 0x0001);
});
