import { DissectedFrame, ProtocolStateMachine, StateTransition } from './types.js';

export function inferProtocolStateMachine(frames: DissectedFrame[]): ProtocolStateMachine {
  const knownOpcodes: Record<number, string> = {
    0x0001: 'OP_HANDSHAKE_INIT',
    0x0002: 'OP_HANDSHAKE_ACK',
    0x0010: 'OP_AUTH_REQUEST',
    0x0011: 'OP_AUTH_SUCCESS',
    0x0020: 'OP_DATA_SYNC',
    0x0021: 'OP_DATA_ACK',
    0x00ff: 'OP_HEARTBEAT',
    0x0000: 'OP_TERMINATE',
  };

  const states = ['DISCONNECTED', 'HANDSHAKING', 'AUTHENTICATING', 'ESTABLISHED', 'ACTIVE_SYNC'];
  const transitions: StateTransition[] = [];

  let currentState = 'DISCONNECTED';

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const opName = knownOpcodes[f.opcode] || `OP_UNKNOWN_0x${f.opcode.toString(16).toUpperCase()}`;

    let nextState = currentState;
    if (currentState === 'DISCONNECTED' && (f.opcode === 0x0001 || opName.includes('HANDSHAKE'))) {
      nextState = 'HANDSHAKING';
    } else if (currentState === 'HANDSHAKING' && (f.opcode === 0x0002 || f.opcode === 0x0010)) {
      nextState = 'AUTHENTICATING';
    } else if (currentState === 'AUTHENTICATING' && (f.opcode === 0x0011 || f.opcode === 0x0020)) {
      nextState = 'ESTABLISHED';
    } else if (currentState === 'ESTABLISHED') {
      nextState = 'ACTIVE_SYNC';
    }

    transitions.push({
      fromState: currentState,
      toState: nextState,
      triggerOpcode: f.opcode,
      triggerName: opName,
      probability: 1.0,
    });

    currentState = nextState;
  }

  return {
    protocolName: 'DissectedBinaryProtocol',
    initialState: 'DISCONNECTED',
    states,
    transitions,
    knownOpcodes,
  };
}
