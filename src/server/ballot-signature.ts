import crypto from 'crypto';

/**
 * Generates an unforgeable digital signature using SHA256 and the server's private key.
 */
export function generateBallotReceiptSignature(payload: {
  electionId: number;
  positionId: number;
  candidateId: number;
  timestamp: string;
}): string {
  // Convert object metrics into a single deterministic string row layout
  const normalizedDataString = `${payload.electionId}:${payload.positionId}:${payload.candidateId}:${payload.timestamp}`;

  const privateKey = process.env.VOTING_PRIVATE_KEY!.replace(/\\n/g, '\n');

  const sign = crypto.createSign('SHA256');
  sign.update(normalizedDataString);
  sign.end();

  // Returns a base64 encoded signature string token string
  return sign.sign(privateKey, 'base64');
}
