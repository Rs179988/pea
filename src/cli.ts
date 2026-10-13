#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';
import { inferFramingGrammar, dissectBinaryStream } from './domain/packetDissector.js';
import { inferProtocolStateMachine } from './domain/stateMachineInferrer.js';
import { generateGhostNodeScript } from './engines/ghostNodeSynthesizer.js';
import { generateEbpfSocketProbe } from './engines/ebpfProbeGenerator.js';
import { runMcpServer } from './mcp/server.js';

const program = new Command();

program
  .name('pea')
  .description('Protocol & Distributed Systems Anything: Binary packet dissection, state machine inference & ghost nodes.')
  .version('1.0.0');

program
  .command('dissect <file>')
  .description('Dissect binary wire packet frames and infer framing grammar')
  .action((file) => {
    const buf = fs.readFileSync(file);
    const grammar = inferFramingGrammar(buf);
    const frames = dissectBinaryStream(buf, grammar);

    console.log(`\n🌐 PEA Binary Packet Dissector: ${file}`);
    console.log(`===============================================`);
    console.log(`Magic Bytes:      ${grammar.magicBytes ? '0x' + grammar.magicBytes.toString(16).toUpperCase() : 'None detected'}`);
    console.log(`Header Size:      ${grammar.headerSizeBytes} bytes`);
    console.log(`Total Frames:     ${frames.length}\n`);

    for (const f of frames.slice(0, 15)) {
      console.log(`  [Frame #${f.frameIndex.toString().padStart(3, '0')}] Opcode: 0x${f.opcode.toString(16).padStart(4, '0')} | Payload: ${f.payloadLength} bytes | Direction: ${f.direction}`);
    }
    if (frames.length > 15) {
      console.log(`  ... and ${frames.length - 15} more frames`);
    }
    console.log();
  });

program
  .command('state-machine <file>')
  .description('Infer deterministic finite automaton protocol state machine')
  .action((file) => {
    const buf = fs.readFileSync(file);
    const grammar = inferFramingGrammar(buf);
    const frames = dissectBinaryStream(buf, grammar);
    const sm = inferProtocolStateMachine(frames);

    console.log(`\n⚡ PEA Protocol Automaton: ${sm.protocolName}`);
    console.log(`===============================================`);
    console.log(`States: ${sm.states.join(' ──▶ ')}\n`);

    console.log('Transitions:');
    for (const t of sm.transitions) {
      console.log(`  (${t.fromState}) ──[ ${t.triggerName} ]──▶ (${t.toState})`);
    }
    console.log();
  });

program
  .command('ghost <file>')
  .description('Synthesize an autonomous ghost-node cluster peer')
  .option('-o, --output <path>', 'Output script', 'ghostNode.mjs')
  .action((file, opts) => {
    const buf = fs.readFileSync(file);
    const grammar = inferFramingGrammar(buf);
    const frames = dissectBinaryStream(buf, grammar);
    const sm = inferProtocolStateMachine(frames);
    const script = generateGhostNodeScript(sm, grammar);

    fs.writeFileSync(opts.output, script, 'utf8');
    console.log(`✅ Autonomous Ghost-Node peer generated at: ${opts.output}`);
  });

program
  .command('ebpf')
  .description('Generate Linux eBPF kernel socket probe C program')
  .option('-p, --port <port>', 'Target port', parseInt, 9000)
  .option('-o, --output <path>', 'Output C file', 'probe.bpf.c')
  .action((opts) => {
    const code = generateEbpfSocketProbe(opts.port);
    fs.writeFileSync(opts.output, code, 'utf8');
    console.log(`✅ eBPF kernel socket probe written to: ${opts.output}`);
  });

program
  .command('mcp')
  .description('Start PEA Model Context Protocol (MCP) server over stdio')
  .action(() => {
    runMcpServer();
  });

program.parse(process.argv);
