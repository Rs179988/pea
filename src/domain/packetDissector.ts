import { DissectedFrame, FramingGrammar } from './types.js';

export function inferFramingGrammar(buffer: Buffer): FramingGrammar {
  // Check for common 2-byte magic headers: 0xCAFE, 0x55AA, 0xAA55, 0x1234
  let magic: number | undefined = undefined;
  if (buffer.length >= 2) {
    const firstTwo = buffer.readUInt16BE(0);
    if ([0xcafe, 0x55aa, 0xaa55, 0x1234, 0x4242].includes(firstTwo)) {
      magic = firstTwo;
    }
  }

  return {
    magicBytes: magic,
    endianness: 'BIG_ENDIAN',
    headerSizeBytes: magic ? 6 : 4,
    lengthFieldOffset: magic ? 2 : 0,
    lengthFieldSize: 2,
    opcodeFieldOffset: magic ? 4 : 2,
    opcodeFieldSize: 2,
    hasChecksum: false,
  };
}

export function dissectBinaryStream(buffer: Buffer, grammar: FramingGrammar): DissectedFrame[] {
  const frames: DissectedFrame[] = [];
  let offset = 0;
  let frameIdx = 0;

  while (offset + grammar.headerSizeBytes <= buffer.length) {
    // Verify magic if present
    if (grammar.magicBytes !== undefined) {
      const readMagic = buffer.readUInt16BE(offset);
      if (readMagic !== grammar.magicBytes) {
        offset++;
        continue;
      }
    }

    const payloadLen = grammar.endianness === 'BIG_ENDIAN'
      ? buffer.readUInt16BE(offset + grammar.lengthFieldOffset)
      : buffer.readUInt16LE(offset + grammar.lengthFieldOffset);

    const opcode = grammar.endianness === 'BIG_ENDIAN'
      ? buffer.readUInt16BE(offset + grammar.opcodeFieldOffset)
      : buffer.readUInt16LE(offset + grammar.opcodeFieldOffset);

    const totalFrameSize = grammar.headerSizeBytes + payloadLen;
    if (offset + totalFrameSize > buffer.length) {
      break; // Incomplete trailing frame
    }

    const payloadSlice = buffer.subarray(offset + grammar.headerSizeBytes, offset + totalFrameSize);

    frames.push({
      frameIndex: ++frameIdx,
      magicHeader: grammar.magicBytes,
      opcode,
      payloadLength: payloadLen,
      payloadHex: payloadSlice.toString('hex'),
      direction: frameIdx % 2 === 1 ? 'OUTBOUND' : 'INBOUND',
      timestampMs: frameIdx * 50,
    });

    offset += totalFrameSize;
  }

  return frames;
}
