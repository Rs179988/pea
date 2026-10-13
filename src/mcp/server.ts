import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs';
import { inferFramingGrammar, dissectBinaryStream } from '../domain/packetDissector.js';
import { inferProtocolStateMachine } from '../domain/stateMachineInferrer.js';
import { generateGhostNodeScript } from '../engines/ghostNodeSynthesizer.js';
import { generateEbpfSocketProbe } from '../engines/ebpfProbeGenerator.js';

export function runMcpServer() {
  const server = new Server(
    {
      name: 'pea-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'dissect_binary_packets',
          description: 'Dissects raw binary packet payloads, inferring magic bytes, opcode IDs, and framing length headers.',
          inputSchema: {
            type: 'object',
            properties: {
              packetDumpPath: { type: 'string', description: 'Path to binary/hex dump file' },
            },
            required: ['packetDumpPath'],
          },
        },
        {
          name: 'infer_protocol_state_machine',
          description: 'Reconstructs the deterministic finite automaton (DFA) state machine from packet sequences.',
          inputSchema: {
            type: 'object',
            properties: {
              packetDumpPath: { type: 'string' },
            },
            required: ['packetDumpPath'],
          },
        },
        {
          name: 'generate_ghost_node',
          description: 'Synthesizes an autonomous Node.js ghost-node peer implementing the extracted wire protocol.',
          inputSchema: {
            type: 'object',
            properties: {
              packetDumpPath: { type: 'string' },
            },
            required: ['packetDumpPath'],
          },
        },
        {
          name: 'generate_ebpf_socket_probe',
          description: 'Generates C eBPF kernel socket filter code for live tracing application network streams.',
          inputSchema: {
            type: 'object',
            properties: {
              port: { type: 'number', description: 'Target TCP port' },
            },
            required: ['port'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'generate_ebpf_socket_probe') {
      const port = (args?.port as number) || 9000;
      return { content: [{ type: 'text', text: generateEbpfSocketProbe(port) }] };
    }

    const pPath = args?.packetDumpPath as string;
    if (!pPath || !fs.existsSync(pPath)) {
      throw new Error(`Packet dump file not found: ${pPath}`);
    }

    const buf = fs.readFileSync(pPath);
    const grammar = inferFramingGrammar(buf);
    const frames = dissectBinaryStream(buf, grammar);
    const stateMachine = inferProtocolStateMachine(frames);

    switch (name) {
      case 'dissect_binary_packets':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ grammar, totalFrames: frames.length, frames: frames.slice(0, 20) }, null, 2),
            },
          ],
        };

      case 'infer_protocol_state_machine':
        return { content: [{ type: 'text', text: JSON.stringify(stateMachine, null, 2) }] };

      case 'generate_ghost_node':
        return { content: [{ type: 'text', text: generateGhostNodeScript(stateMachine, grammar) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
}
