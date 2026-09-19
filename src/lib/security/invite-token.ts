import 'server-only';

import crypto from 'crypto';

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}
