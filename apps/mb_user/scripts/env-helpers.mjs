import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads GOOGLE_WEB_CLIENT_ID (or compatible client ID aliases) from apps/mb_user/.env
 * and process.env so dev scripts can inject --dart-define=GOOGLE_WEB_CLIENT_ID=...
 */
export function resolveGoogleWebClientId(mbUserDir) {
  const envFilePath = path.join(mbUserDir, '.env');
  const fileVars = {};
  if (fs.existsSync(envFilePath)) {
    const content = fs.readFileSync(envFilePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1).trim();
      }
      fileVars[key] = val;
    }
  }

  const candidate =
    process.env.GOOGLE_WEB_CLIENT_ID ||
    fileVars.GOOGLE_WEB_CLIENT_ID ||
    fileVars.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    fileVars.VITE_GOOGLE_CLIENT_ID ||
    '';

  if (!candidate || candidate.includes('your-google-web-client-id')) {
    return '';
  }
  return candidate;
}
