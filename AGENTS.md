# Repository Guidelines for PEA (Protocol Engineering Anything)

## Product and Authority

PEA is a local-first, low-level network protocol and distributed systems engineering engine. It deconstructs undocumented binary wire protocols, extracts deterministic finite state machines, and synthesizes autonomous ghost nodes capable of joining distributed clusters as legitimate peers.

1. **Evidence-Grounded Packet Provenance**:
   Every field boundary, opcode, sequence number, and CRC checksum must be verified from captured raw network frames:
   - **Observations**: Exact pcap frame offsets, hex payloads, and TCP/UDP sequence timestamps.
   - **Derivations**: Dissected framing (magic bytes, length headers, command opcodes).
   - **Inferences**: Hypothesized encryption seeds, inferred state transitions, sequence step counters.
   - **Unknowns**: Unidentified flags and payload padding must remain explicit unknowns.

2. **Kernel & eBPF Boundary**:
   PEA uses eBPF socket filters and userspace probes (`uprobes` on `SSL_read`/`SSL_write`) for transparent observability. It does not perform invasive traffic modification without explicit caller configuration.

3. **Deterministic Automata**:
   Protocol state machine inference uses formal automata principles (L*-inspired active learning) to separate stateful sessions (Handshake -> Established -> Authenticated -> Streaming -> Terminated).

4. **Dual CLI / MCP Interface**:
   Every capability is accessible directly via terminal commands (`pea <command>`) and over stdio via Model Context Protocol (MCP) for autonomous AI agents.
