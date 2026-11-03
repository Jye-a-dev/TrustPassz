import type { PiiRedactionResult } from '@/types/dispute-workbench';

interface PiiRule {
  name: string;
  category: string;
  pattern: RegExp;
  mask: (val: string) => string;
}

const PII_RULES: PiiRule[] = [
  {
    name: 'Private Key (0x Hex)',
    category: 'Private Key',
    pattern: /0x[a-fA-F0-9]{64}/g,
    mask: (val) => `${val.slice(0, 6)}...[REDACTED_PRIVKEY]...${val.slice(-4)}`,
  },
  {
    name: 'JWT / Bearer Token',
    category: 'Auth Token',
    pattern: /eyJh[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    mask: () => '[PROTECTED_JWT_TOKEN••••]',
  },
  {
    name: 'Generic Token / Secret assignment',
    category: 'Secret',
    pattern: /(?:token|secret|apiKey|api_key|password|passwd|auth)\s*[:=]\s*["']?([a-zA-Z0-9_.-]{8,})["']?/gi,
    mask: (val) => {
      const parts = val.split(/[:=]/);
      return `${parts[0]}: "[PROTECTED_CREDENTIAL••••]"`;
    },
  },
  {
    name: 'Bank Card Number',
    category: 'Bank Card',
    pattern: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    mask: (val) => {
      const clean = val.replace(/[\s-]/g, '');
      return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
    },
  },
  {
    name: 'CCCD (Vietnam National ID)',
    category: 'Citizen ID (CCCD)',
    pattern: /\b(0\d{11})\b/g,
    mask: (val) => `${val.slice(0, 3)}******${val.slice(-3)}`,
  },
  {
    name: '6-digit OTP Code',
    category: 'OTP Code',
    pattern: /(?:otp|code|mã xác thực|pin)\s*[:=]?\s*\b(\d{6})\b/gi,
    mask: () => 'OTP: [••••••]',
  },
];

export function redactSensitiveData(rawText: string): PiiRedactionResult {
  if (!rawText) {
    return {
      sanitizedText: '',
      detectedCount: 0,
      detectedCategories: [],
    };
  }

  let sanitizedText = rawText;
  let detectedCount = 0;
  const categoriesSet = new Set<string>();

  for (const rule of PII_RULES) {
    const matches = rawText.match(rule.pattern);
    if (matches && matches.length > 0) {
      detectedCount += matches.length;
      categoriesSet.add(rule.category);
      sanitizedText = sanitizedText.replace(rule.pattern, (matched) => rule.mask(matched));
    }
  }

  return {
    sanitizedText,
    detectedCount,
    detectedCategories: Array.from(categoriesSet),
  };
}

export function detectPiiCategories(rawText: string): string[] {
  if (!rawText) return [];
  const categories = new Set<string>();
  for (const rule of PII_RULES) {
    if (rule.pattern.test(rawText)) {
      categories.add(rule.category);
    }
    rule.pattern.lastIndex = 0;
  }
  return Array.from(categories);
}

