/**
 * Notepad.do - Smart Pattern Detector & Auto-Formatter Engine
 * Deep pattern matching for Credit Cards, Passwords, URLs, Proxies, Crypto, and Developer Keys.
 */

// 1. Luhn Algorithm for credit card mathematical validation
export function isValidLuhn(numberStr) {
  if (!numberStr) return false;
  const digits = numberStr.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// 2. Identify Card Network Brand
export function getCardBrand(numberStr) {
  const digits = (numberStr || "").replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^6(011|5)/.test(digits)) return "Discover";
  if (/^35/.test(digits)) return "JCB";
  if (/^3(0[0-5]|[68])/.test(digits)) return "Diners Club";
  return "Tarjeta";
}

// 3. Format Card Number nicely (4-4-4-4 or 4-6-5 for Amex)
export function formatCardNumber(numberStr) {
  const digits = (numberStr || "").replace(/\D/g, "");
  if (digits.length === 15) {
    return digits.replace(/^(\d{4})(\d{6})(\d{5})$/, "$1 $2 $3");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

// 4. Mask Card Number for privacy (•••• •••• •••• 1234)
export function maskCardNumber(numberStr) {
  const digits = (numberStr || "").replace(/\D/g, "");
  if (digits.length < 8) return digits;
  const last4 = digits.slice(-4);
  const first4 = digits.slice(0, 4);
  if (digits.length === 15) {
    return `${first4} •••••• •${last4}`;
  }
  return `${first4} •••• •••• ${last4}`;
}

// 5. Clean URLs: remove tracking parameters (utm, fbclid, etc.)
export function cleanUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "msclkid", "mc_eid", "_ga", "ref", "ref_src"
    ];
    trackingParams.forEach(param => url.searchParams.delete(param));
    return url.toString().replace(/\/$/, "");
  } catch (e) {
    return urlStr;
  }
}

// 6. Comprehensive Pattern Extraction
export function detectAllPatterns(text) {
  if (!text) {
    return {
      cards: [],
      passwords: [],
      users: [],
      urls: [],
      proxies: [],
      crypto: [],
      keys: [],
      counts: { cards: 0, passwords: 0, users: 0, urls: 0, proxies: 0, crypto: 0, keys: 0 }
    };
  }

  // --- CARDS DETECTION ---
  const cards = [];
  // Match standard 15-16 digit cards (continuous, spaced, dashed, or pipe separated)
  const cardRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|2[2-7][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:\d{4}[ -]){3}\d{4}|3[47]\d{2}[ -]\d{6}[ -]\d{5}|\d{15,16})\b/g;
  
  let cardMatch;
  const seenCardDigits = new Set();
  while ((cardMatch = cardRegex.exec(text)) !== null) {
    const rawNumber = cardMatch[0];
    const digits = rawNumber.replace(/\D/g, "");
    if ((digits.length === 15 || digits.length === 16) && !seenCardDigits.has(digits)) {
      seenCardDigits.add(digits);
      const brand = getCardBrand(digits);
      const isValid = isValidLuhn(digits);
      const formatted = formatCardNumber(digits);

      // Search nearby text for expiration and CVV
      const textAround = text.slice(Math.max(0, cardMatch.index - 40), Math.min(text.length, cardMatch.index + rawNumber.length + 60));
      
      // Expiration date (MM/YY or MM/YYYY)
      const expMatch = textAround.match(/(?:exp|vence|valida|fecha|valid)?[:\s/|]*\b(0[1-9]|1[0-2])[\/\-|](20\d{2}|\d{2})\b/i);
      const exp = expMatch ? `${expMatch[1]}/${expMatch[2]}` : null;

      // CVV (3 or 4 digits)
      const cvvMatch = textAround.match(/(?:cvv|cvc|cid|seguridad|pin|cvv2)?[:\s/|]*\b([0-9]{3,4})\b/i);
      const cvv = cvvMatch && cvvMatch[1] !== expMatch?.[1] && cvvMatch[1] !== expMatch?.[2] ? cvvMatch[1] : null;

      cards.push({
        raw: rawNumber,
        digits,
        brand,
        formatted,
        masked: maskCardNumber(digits),
        isValid,
        exp,
        cvv
      });
    }
  }

  // --- PASSWORDS DETECTION ---
  const passwords = [];
  const pwdRegex = /(?:password|contrase[ñn]a|pass|clave|pwd|secret|pin)[:=]\s*([^\s\n\r,;|]+)/gi;
  let pwdMatch;
  while ((pwdMatch = pwdRegex.exec(text)) !== null) {
    passwords.push({
      full: pwdMatch[0],
      value: pwdMatch[1]
    });
  }

  // --- USERS / EMAILS DETECTION ---
  const users = [];
  const userRegex = /(?:user|usuario|username|login|email|correo|cuenta)[:=]\s*([^\s\n\r,;|]+)/gi;
  let userMatch;
  while ((userMatch = userRegex.exec(text)) !== null) {
    users.push({
      full: userMatch[0],
      value: userMatch[1]
    });
  }
  // Standalone emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  let emailMatch;
  while ((emailMatch = emailRegex.exec(text)) !== null) {
    if (!users.some(u => u.value === emailMatch[0])) {
      users.push({
        full: emailMatch[0],
        value: emailMatch[0]
      });
    }
  }

  // --- URLS DETECTION ---
  const urls = [];
  const urlRegex = /\b(https?:\/\/[^\s\n\r<>"'{}|\\^`]+)/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const rawUrl = urlMatch[0];
    const cleaned = cleanUrl(rawUrl);
    let host = "";
    try { host = new URL(rawUrl).hostname; } catch (e) { host = rawUrl; }
    urls.push({
      raw: rawUrl,
      clean: cleaned,
      host
    });
  }

  // --- PROXIES DETECTION ---
  const proxies = [];
  // IP:PORT:USER:PASS or IP:PORT
  const proxyRegex = /\b((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})(?::([^\s:\n]+):([^\s:\n]+))?\b/g;
  let proxyMatch;
  while ((proxyMatch = proxyRegex.exec(text)) !== null) {
    proxies.push({
      raw: proxyMatch[0],
      ip: proxyMatch[1],
      port: proxyMatch[2],
      user: proxyMatch[3] || null,
      pass: proxyMatch[4] || null
    });
  }

  // --- CRYPTO WALLETS DETECTION ---
  const crypto = [];
  // BTC Bech32 & Legacy
  const btcRegex = /\b(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g;
  let btcMatch;
  while ((btcMatch = btcRegex.exec(text)) !== null) {
    crypto.push({ network: "Bitcoin", address: btcMatch[0], badge: "BTC" });
  }
  // ETH / EVM
  const ethRegex = /\b(0x[a-fA-F0-9]{40})\b/g;
  let ethMatch;
  while ((ethMatch = ethRegex.exec(text)) !== null) {
    crypto.push({ network: "Ethereum/EVM", address: ethMatch[0], badge: "ETH" });
  }
  // Tron (USDT-TRC20)
  const tronRegex = /\b(T[1-9A-HJ-NP-za-km-z]{33})\b/g;
  let tronMatch;
  while ((tronMatch = tronRegex.exec(text)) !== null) {
    crypto.push({ network: "Tron (TRC20)", address: tronMatch[0], badge: "USDT" });
  }

  // --- API KEYS & TOKENS DETECTION ---
  const keys = [];
  // OpenAI
  const oaiRegex = /\b(sk-[a-zA-Z0-9_\-]{20,})\b/g;
  let oaiMatch;
  while ((oaiMatch = oaiRegex.exec(text)) !== null) {
    keys.push({ type: "OpenAI API Key", key: oaiMatch[0] });
  }
  // GitHub
  const ghRegex = /\b((?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,})\b/g;
  let ghMatch;
  while ((ghMatch = ghRegex.exec(text)) !== null) {
    keys.push({ type: "GitHub Token", key: ghMatch[0] });
  }
  // Generic token / api_key labels
  const keyLabelRegex = /(?:api[_-]?key|token|bearer|access[_-]?token)[:=]\s*([^\s\n\r,;|]+)/gi;
  let keyLabelMatch;
  while ((keyLabelMatch = keyLabelRegex.exec(text)) !== null) {
    keys.push({ type: "API Key / Token", key: keyLabelMatch[1] });
  }

  return {
    cards,
    passwords,
    users,
    urls,
    proxies,
    crypto,
    keys,
    counts: {
      cards: cards.length,
      passwords: passwords.length,
      users: users.length,
      urls: urls.length,
      proxies: proxies.length,
      crypto: crypto.length,
      keys: keys.length
    }
  };
}

// 7. Smart Auto-Formatter Engine
export function autoFormatNotepadContent(content) {
  if (!content || !content.trim()) return content;

  // Rule 0: If valid JSON, pretty print it
  try {
    const parsed = JSON.parse(content.trim());
    return JSON.stringify(parsed, null, 2);
  } catch (e) {}

  let text = content;

  // Rule 1: Clean trailing spaces and normalize newlines
  text = text.replace(/\r\n/g, "\n");

  // Rule 2: Clean tracking parameters from URLs in the text
  text = text.replace(/\bhttps?:\/\/[^\s\n\r<>"'{}|\\^`]+/gi, (url) => {
    return cleanUrl(url);
  });

  // Rule 3: Format Card Pipe-Lines:
  // e.g. "4532123456789012|12|28|382" or "4532123456789012|12/28|382"
  text = text.replace(/\b(\d{15,16})[|/](0[1-9]|1[0-2])[|/](20\d{2}|\d{2})[|/](\d{3,4})\b/g, (match, num, mm, yy, cvv) => {
    const formattedNum = formatCardNumber(num);
    const brand = getCardBrand(num);
    return `tarjeta: ${formattedNum} | exp: ${mm}/${yy} | cvv: ${cvv} | ${brand}`;
  });

  // Rule 4: Format raw 16-digit cards that are standalone on lines or preceded by card: / tarjeta:
  text = text.replace(/(?:tarjeta|card|cc)[:\s]*(\d{15,16})\b/gi, (match, num) => {
    return `tarjeta: ${formatCardNumber(num)} (${getCardBrand(num)})`;
  });

  // Rule 5: Separate squished inline credentials into neat lines
  // e.g. "user: admin pass: secret123 email: test@domain.com"
  text = text.replace(/\s+(password:|contrase[ñn]a:|pass:|clave:|pwd:|user:|usuario:|username:|email:|correo:|api[_-]?key:|token:|secret:|pin:|tarjeta:|card:)/gi, "\n$1");

  // Rule 6: Normalize proxy lines: "ip:port:user:pass"
  text = text.replace(/\s+((?:\d{1,3}\.){3}\d{1,3}:\d{2,5}(?::[^\s:]+:[^\s:]+)?)/g, "\n$1");

  // Rule 7: Trim lines and collapse excessive blank lines (> 2 into 1)
  const lines = text.split("\n").map(line => line.trimEnd());
  text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

// 8. Generate safe, pixel-perfect overlay HTML without ANY layout shift
// IMPORTANT: Text must be transparent, spans must have padding:0 and margin:0 to avoid ghosting!
export function generateSafeOverlayHtml(content) {
  if (!content) return "";

  // HTML escape
  let safe = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight Cards: 15-16 digit numbers
  safe = safe.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b|\b3[47]\d{2}[ -]?\d{6}[ -]?\d{5}\b/g, (match) => {
    return `<span class="hl-card">${match}</span>`;
  });

  // Highlight Passwords & Secrets
  safe = safe.replace(/(?:password|contrase[ñn]a|pass|clave|pwd|secret|pin)[:=]\s*([^\s\n\r,;|]+)/gi, (match) => {
    return `<span class="hl-pwd">${match}</span>`;
  });

  // Highlight Users & Emails
  safe = safe.replace(/(?:user|usuario|username|login|email|correo|cuenta)[:=]\s*([^\s\n\r,;|]+)/gi, (match) => {
    return `<span class="hl-user">${match}</span>`;
  });

  // Highlight URLs
  safe = safe.replace(/\bhttps?:\/\/[^\s\n\r<>"']+/gi, (match) => {
    return `<span class="hl-url">${match}</span>`;
  });

  // Highlight Proxies
  safe = safe.replace(/\b(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}(?::[^\s:\n]+:[^\s:\n]+)?\b/g, (match) => {
    return `<span class="hl-proxy">${match}</span>`;
  });

  return safe + "\n";
}
