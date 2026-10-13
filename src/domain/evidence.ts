import crypto from 'node:crypto';

export interface EvidenceRecord {
  id: string;
  kind: 'observation' | 'derivation' | 'inference' | 'unknown';
  source: string;
  sha256: string;
  summary: string;
  data: any;
  timestamp: string;
}

export class ProtocolEvidenceLedger {
  private records: Map<string, EvidenceRecord> = new Map();

  recordObservation(source: string, summary: string, rawBytes: Buffer, parsedData: any): EvidenceRecord {
    const sha256 = crypto.createHash('sha256').update(rawBytes).digest('hex');
    const id = `ev-proto-${this.records.size + 1}-${crypto.randomBytes(4).toString('hex')}`;

    const rec: EvidenceRecord = {
      id,
      kind: 'observation',
      source,
      sha256,
      summary,
      data: parsedData,
      timestamp: new Date().toISOString(),
    };

    this.records.set(id, rec);
    return rec;
  }

  getAllRecords(): EvidenceRecord[] {
    return Array.from(this.records.values());
  }
}
