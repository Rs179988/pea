export interface DissectedFrame {
  frameIndex: number;
  magicHeader?: number;
  opcode: number;
  payloadLength: number;
  payloadHex: string;
  checksumValid?: boolean;
  direction: 'INBOUND' | 'OUTBOUND';
  timestampMs: number;
}

export interface FramingGrammar {
  magicBytes?: number;
  endianness: 'BIG_ENDIAN' | 'LITTLE_ENDIAN';
  headerSizeBytes: number;
  lengthFieldOffset: number;
  lengthFieldSize: 1 | 2 | 4;
  opcodeFieldOffset: number;
  opcodeFieldSize: 1 | 2;
  hasChecksum: boolean;
}

export interface StateTransition {
  fromState: string;
  toState: string;
  triggerOpcode: number;
  triggerName: string;
  responseOpcode?: number;
  responseName?: string;
  probability: number;
}

export interface ProtocolStateMachine {
  protocolName: string;
  initialState: string;
  states: string[];
  transitions: StateTransition[];
  knownOpcodes: Record<number, string>;
}

export interface GhostNodeConfig {
  peerName: string;
  targetHost: string;
  targetPort: number;
  grammar: FramingGrammar;
  stateMachine: ProtocolStateMachine;
}
