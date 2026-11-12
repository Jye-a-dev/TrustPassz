import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEPRECATED_CACHE_PROP_RE = /^\s*(android\.buildCacheDir|android\.enableBuildCache)(?:\s*[=:]|\s|$)/i;

/**
 * Removes deprecated AGP build cache flags (android.buildCacheDir, android.enableBuildCache)
 * from global (~/.gradle/gradle.properties, %USERPROFILE%/.gradle/gradle.properties,
 * $GRADLE_USER_HOME/gradle.properties) and optional project gradle.properties files.
 */
export function sanitizeGradleProperties(extraPaths = []) {
  const candidates = new Set();
  const addCandidate = (filePath) => {
    if (filePath) candidates.add(path.resolve(filePath));
  };

  addCandidate(path.join(os.homedir(), '.gradle', 'gradle.properties'));
  if (process.env.USERPROFILE) {
    addCandidate(path.join(process.env.USERPROFILE, '.gradle', 'gradle.properties'));
  }
  if (process.env.GRADLE_USER_HOME) {
    addCandidate(path.join(process.env.GRADLE_USER_HOME, 'gradle.properties'));
  }
  for (const p of extraPaths) {
    addCandidate(p);
  }

  const cleanedFiles = [];
  for (const propFile of candidates) {
    if (!fs.existsSync(propFile)) continue;
    try {
      const raw = fs.readFileSync(propFile, 'utf8');
      const eol = raw.includes('\r\n') ? '\r\n' : '\n';
      const hadTrailingNewline = raw.endsWith('\n');
      const lines = raw.split(/\r?\n/);
      if (hadTrailingNewline && lines[lines.length - 1] === '') {
        lines.pop();
      }

      const removed = [];
      const kept = lines.filter((line) => {
        if (DEPRECATED_CACHE_PROP_RE.test(line)) {
          removed.push(line.trim());
          return false;
        }
        return true;
      });

      if (removed.length === 0) continue;

      const updated = kept.length > 0 ? `${kept.join(eol)}${hadTrailingNewline ? eol : ''}` : '';
      fs.writeFileSync(propFile, updated, 'utf8');
      cleanedFiles.push({ file: propFile, removed });
      console.log(`  Sanitized deprecated Gradle flags in ${propFile}: ${removed.join(', ')}`);
    } catch (err) {
      console.warn(`  [Notice] Could not sanitize ${propFile}: ${err.message}`);
    }
  }

  return cleanedFiles;
}

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
