/**
 * Notepad.do - Smart Pattern Detector, Live 2FA/Decoder & Auto-Formatter Engine
 */

// 1. Luhn Algorithm for mathematical sequence validation
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

// 2. Identify Network Prefix
export function getCardBrand(numberStr) {
  const digits = (numberStr || "").replace(/\D/g, "");
  if (/^4/.test(digits)) return "4XXX (V)";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "5XXX (M)";
  if (/^3[47]/.test(digits)) return "3XXX (A)";
  if (/^6(011|5)/.test(digits)) return "6XXX (D)";
  if (/^35/.test(digits)) return "JCB";
  if (/^3(0[0-5]|[68])/.test(digits)) return "DC";
  return "Serie";
}

// 3. Format Number nicely (4-4-4-4 or 4-6-5)
export function formatCardNumber(numberStr) {
  const digits = (numberStr || "").replace(/\D/g, "");
  if (digits.length === 15) {
    return digits.replace(/^(\d{4})(\d{6})(\d{5})$/, "$1 $2 $3");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

// 4. Mask Number for privacy (•••• •••• •••• 1234)
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

// Helper: Safe Base64 / Base64URL decode to UTF-8 string
function tryDecodeBase64(b64Str) {
  try {
    const normalized = b64Str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const binStr = atob(padded);
    const bytes = Uint8Array.from(binStr, (m) => m.codePointAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Ensure printable ASCII / UTF-8 text without control characters
    if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) return null;
    return decoded.trim();
  } catch {
    return null;
  }
}

// Helper: Generate live 6-digit TOTP (2FA) code using browser WebCrypto HMAC-SHA1
export async function generateTotpCode(base32Secret) {
  try {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const clean = (base32Secret || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
    if (clean.length < 12) return null;

    let bits = "";
    for (let i = 0; i < clean.length; i++) {
      const val = alphabet.indexOf(clean.charAt(i));
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, "0");
    }

    const keyBytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < keyBytes.length; i++) {
      keyBytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
    }

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);
    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, counterBytes);
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const otp = (binary % 1000000).toString().padStart(6, "0");
    return {
      code: `${otp.slice(0, 3)} ${otp.slice(3)}`,
      rawCode: otp,
      remainingSeconds: 30 - (epoch % 30),
    };
  } catch {
    return null;
  }
}

// 6. Comprehensive Pattern Extraction
export function detectAllPatterns(text) {
  const emptyResult = {
    cards: [],
    passwords: [],
    users: [],
    combos: [],
    urls: [],
    proxies: [],
    crypto: [],
    txids: [],
    keys: [],
    totpSecrets: [],
    decodedItems: [],
    phones: [],
    handles: [],
    timestamps: [],
    checklist: { total: 0, completed: 0, percent: 0, items: [] },
    duplicateLinesCount: 0,
    counts: {
      cards: 0,
      passwords: 0,
      users: 0,
      combos: 0,
      urls: 0,
      proxies: 0,
      crypto: 0,
      txids: 0,
      keys: 0,
      totpSecrets: 0,
      decodedItems: 0,
      phones: 0,
      handles: 0,
      timestamps: 0,
      checklist: 0,
      duplicates: 0,
    }
  };

  if (!text) return emptyResult;

  // --- DUPLICATE LINES & CHECKLIST DETECTION ---
  const rawLines = text.split("\n");
  const seenNormalizedLines = new Set();
  let duplicateLinesCount = 0;
  const checklistItems = [];

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.length > 2) {
      const norm = trimmed.toLowerCase();
      if (seenNormalizedLines.has(norm)) {
        duplicateLinesCount++;
      } else {
        seenNormalizedLines.add(norm);
      }
    }

    const chkMatch = line.match(/^(\s*(?:[-*•]|\d+\.)?\s*)\[([ xX✓✔])\]\s+(.+)$/);
    if (chkMatch) {
      const done = chkMatch[2].trim() !== "";
      checklistItems.push({
        lineIndex: idx,
        done,
        text: chkMatch[3].trim(),
      });
    }
  });

  const checklistCompleted = checklistItems.filter(i => i.done).length;
  const checklist = {
    total: checklistItems.length,
    completed: checklistCompleted,
    percent: checklistItems.length > 0 ? Math.round((checklistCompleted / checklistItems.length) * 100) : 0,
    items: checklistItems,
  };

  // --- NUMBER SERIES DETECTION ---
  const cards = [];
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

      const textAround = text.slice(Math.max(0, cardMatch.index - 40), Math.min(text.length, cardMatch.index + rawNumber.length + 60));
      const expMatch = textAround.match(/(?:exp|vence|valida|fecha|valid)?[:\s/|]*\b(0[1-9]|1[0-2])[\/\-|](20\d{2}|\d{2})\b/i);
      const exp = expMatch ? `${expMatch[1]}/${expMatch[2]}` : null;

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
  const seenUserValues = new Set();
  let userMatch;
  while ((userMatch = userRegex.exec(text)) !== null) {
    seenUserValues.add(userMatch[1]);
    users.push({
      full: userMatch[0],
      value: userMatch[1]
    });
  }
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g;
  let emailMatch;
  while ((emailMatch = emailRegex.exec(text)) !== null) {
    if (!seenUserValues.has(emailMatch[0])) {
      seenUserValues.add(emailMatch[0]);
      users.push({
        full: emailMatch[0],
        value: emailMatch[0]
      });
    }
  }

  // --- COMBOS (email:pass / user:pass) DETECTION ---
  const combos = [];
  const seenCombos = new Set();
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed || /^https?:\/\//i.test(trimmed)) continue;

    // Direct email:pass or user:pass
    const directCombo = trimmed.match(/^([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}|[A-Za-z0-9_.-]{3,32})\s*[:;|]\s*([^\s:;|]{4,64})$/);
    if (directCombo && !/^\d+\.\d+\.\d+\.\d+$/.test(directCombo[1])) {
      const clean = `${directCombo[1]}:${directCombo[2]}`;
      if (!seenCombos.has(clean)) {
        seenCombos.add(clean);
        combos.push({ user: directCombo[1], pass: directCombo[2], clean });
      }
      continue;
    }

    // Labeled combo on the same line: "user: X ... pass: Y"
    const uMatch = trimmed.match(/(?:user|usuario|username|login|email|correo|cuenta)[:=]\s*([^\s,;|]+)/i);
    const pMatch = trimmed.match(/(?:password|contrase[ñn]a|pass|clave|pwd)[:=]\s*([^\s,;|]+)/i);
    if (uMatch && pMatch) {
      const clean = `${uMatch[1]}:${pMatch[1]}`;
      if (!seenCombos.has(clean)) {
        seenCombos.add(clean);
        combos.push({ user: uMatch[1], pass: pMatch[1], clean });
      }
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

  // --- NODES / PROXIES DETECTION (ip:port:user:pass AND http/socks5://user:pass@ip:port) ---
  const proxies = [];
  const seenProxies = new Set();
  const proxyRegex = /\b((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})(?::([^\s:\n]+):([^\s:\n]+))?\b/g;
  let proxyMatch;
  while ((proxyMatch = proxyRegex.exec(text)) !== null) {
    if (!seenProxies.has(proxyMatch[0])) {
      seenProxies.add(proxyMatch[0]);
      const ip = proxyMatch[1];
      const port = proxyMatch[2];
      const user = proxyMatch[3] || null;
      const pass = proxyMatch[4] || null;
      proxies.push({
        raw: proxyMatch[0],
        ip,
        port,
        user,
        pass,
        uri: user && pass ? `http://${user}:${pass}@${ip}:${port}` : `http://${ip}:${port}`,
      });
    }
  }

  const uriProxyRegex = /\b(?:https?|socks5):\/\/(?:([^\s:@\n]+):([^\s:@\n]+)@)?((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})\b/gi;
  let uriMatch;
  while ((uriMatch = uriProxyRegex.exec(text)) !== null) {
    if (!seenProxies.has(uriMatch[0])) {
      seenProxies.add(uriMatch[0]);
      const user = uriMatch[1] || null;
      const pass = uriMatch[2] || null;
      const ip = uriMatch[3];
      const port = uriMatch[4];
      proxies.push({
        raw: user && pass ? `${ip}:${port}:${user}:${pass}` : `${ip}:${port}`,
        ip,
        port,
        user,
        pass,
        uri: uriMatch[0],
      });
    }
  }

  // --- CRYPTO WALLETS & TXID DETECTION ---
  const crypto = [];
  const seenCrypto = new Set();
  const addCrypto = (network, address, badge) => {
    if (!seenCrypto.has(address)) {
      seenCrypto.add(address);
      crypto.push({ network, address, badge });
    }
  };

  // BTC
  const btcRegex = /\b(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g;
  let m;
  while ((m = btcRegex.exec(text)) !== null) addCrypto("Bitcoin", m[0], "BTC");

  // ETH / BNB / EVM
  const ethRegex = /\b(0x[a-fA-F0-9]{40})\b/g;
  while ((m = ethRegex.exec(text)) !== null) addCrypto("EVM (ETH/BNB)", m[0], "EVM");

  // Tron (USDT-TRC20)
  const tronRegex = /\b(T[1-9A-HJ-NP-za-km-z]{33})\b/g;
  while ((m = tronRegex.exec(text)) !== null) addCrypto("Tron (TRC20)", m[0], "USDT");

  // Litecoin (ltc1 or L/M address)
  const ltcRegex = /\b(ltc1[a-zA-HJ-NP-Z0-9]{25,62}|[LM][a-km-zA-HJ-NP-Z1-9]{26,33})\b/g;
  while ((m = ltcRegex.exec(text)) !== null) addCrypto("Litecoin", m[0], "LTC");

  // Solana (Base58 43-44 chars)
  const solRegex = /\b([1-9A-HJ-NP-Za-km-z]{43,44})\b/g;
  while ((m = solRegex.exec(text)) !== null) {
    if (!seenCrypto.has(m[0]) && !/^[A-Za-z0-9+/=]+$/.test(m[0])) {
      addCrypto("Solana", m[0], "SOL");
    }
  }

  // Transaction Hashes (TXID 64 hex chars)
  const txids = [];
  const seenTx = new Set();
  const txRegex = /\b(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})\b/g;
  while ((m = txRegex.exec(text)) !== null) {
    if (!seenTx.has(m[0])) {
      seenTx.add(m[0]);
      const isEvm = m[0].startsWith("0x");
      txids.push({
        hash: m[0],
        explorerUrl: isEvm
          ? `https://etherscan.io/tx/${m[0]}`
          : `https://blockchair.com/search?q=${m[0]}`,
      });
    }
  }

  // --- 2FA / TOTP SECRETS DETECTION ---
  const totpSecrets = [];
  const seenTotp = new Set();
  // 1. otpauth://totp/Label?secret=BASE32
  const otpUriRegex = /otpauth:\/\/totp\/([^?\s]+)\?[^\s]*secret=([A-Z2-7]{16,64})/gi;
  while ((m = otpUriRegex.exec(text)) !== null) {
    const secret = m[2].toUpperCase();
    if (!seenTotp.has(secret)) {
      seenTotp.add(secret);
      totpSecrets.push({
        label: decodeURIComponent(m[1]),
        secret,
      });
    }
  }
  // 2. Labeled 2fa/totp seed: "2fa: JBSWY3DPEHPK3PXP"
  const labeledTotpRegex = /(?:2fa|totp|otp|autenticador|semilla)[:=]\s*([A-Z2-7 ]{16,40})/gi;
  while ((m = labeledTotpRegex.exec(text)) !== null) {
    const secret = m[1].replace(/\s+/g, "").toUpperCase();
    if (/^[A-Z2-7]{16,32}$/.test(secret) && !seenTotp.has(secret)) {
      seenTotp.add(secret);
      totpSecrets.push({
        label: "2FA TOTP",
        secret,
      });
    }
  }

  // --- JWT & BASE64 DECODER DETECTION ---
  const decodedItems = [];
  const seenDecoded = new Set();
  // JWT tokens
  const jwtRegex = /\b(eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+)\b/g;
  while ((m = jwtRegex.exec(text)) !== null) {
    const token = m[1];
    if (!seenDecoded.has(token)) {
      seenDecoded.add(token);
      const parts = token.split(".");
      const payload = tryDecodeBase64(parts[1]);
      if (payload) {
        decodedItems.push({
          type: "JWT",
          raw: token,
          decoded: payload,
        });
      }
    }
  }
  // Base64 strings (min 16 chars ending in = or labeled base64:)
  const b64Regex = /\b([A-Za-z0-9+/]{16,}={1,2})\b/g;
  while ((m = b64Regex.exec(text)) !== null) {
    const rawB64 = m[1];
    if (!seenDecoded.has(rawB64)) {
      const dec = tryDecodeBase64(rawB64);
      if (dec && dec.length >= 4 && /[a-zA-Z0-9]/.test(dec)) {
        seenDecoded.add(rawB64);
        decodedItems.push({
          type: "Base64",
          raw: rawB64,
          decoded: dec,
        });
      }
    }
  }

  // --- PHONES, @HANDLES & UNIX TIMESTAMPS ---
  const phones = [];
  const seenPhones = new Set();
  const phoneRegex = /(?:\+\d{1,3}[\s.-]?)?\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}\b|\+\d{1,3}[\s.-]\d{2,4}[\s.-]\d{3,4}[\s.-]\d{3,4}\b/g;
  while ((m = phoneRegex.exec(text)) !== null) {
    const cleanPhone = m[0].replace(/[^\d+]/g, "");
    if (cleanPhone.length >= 10 && cleanPhone.length <= 15 && !seenPhones.has(cleanPhone)) {
      seenPhones.add(cleanPhone);
      phones.push({ raw: m[0], clean: cleanPhone });
    }
  }

  const handles = [];
  const seenHandles = new Set();
  const handleRegex = /(?:^|\s)@([a-zA-Z0-9_]{4,32})\b/g;
  while ((m = handleRegex.exec(text)) !== null) {
    const h = m[1];
    if (!seenHandles.has(h.toLowerCase())) {
      seenHandles.add(h.toLowerCase());
      handles.push({ handle: `@${h}`, username: h, url: `https://t.me/${h}` });
    }
  }

  const timestamps = [];
  const seenTs = new Set();
  const tsRegex = /\b(1[6-9]\d{8}|20\d{8})\b/g;
  while ((m = tsRegex.exec(text)) !== null) {
    const sec = parseInt(m[1], 10);
    if (!seenTs.has(sec) && !seenCardDigits.has(m[1])) {
      seenTs.add(sec);
      const dateStr = new Date(sec * 1000).toLocaleString("es-ES");
      timestamps.push({ raw: m[1], formatted: dateStr });
    }
  }

  // --- API KEYS & TOKENS DETECTION ---
  const keys = [];
  const oaiRegex = /\b(sk-[a-zA-Z0-9_\-]{20,})\b/g;
  while ((m = oaiRegex.exec(text)) !== null) {
    keys.push({ type: "OpenAI Key", key: m[0] });
  }
  const ghRegex = /\b((?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,})\b/g;
  while ((m = ghRegex.exec(text)) !== null) {
    keys.push({ type: "GitHub Token", key: m[0] });
  }
  const keyLabelRegex = /(?:api[_-]?key|token|bearer|access[_-]?token)[:=]\s*([^\s\n\r,;|]+)/gi;
  while ((m = keyLabelRegex.exec(text)) !== null) {
    keys.push({ type: "API Token", key: m[1] });
  }

  return {
    cards,
    passwords,
    users,
    combos,
    urls,
    proxies,
    crypto,
    txids,
    keys,
    totpSecrets,
    decodedItems,
    phones,
    handles,
    timestamps,
    checklist,
    duplicateLinesCount,
    counts: {
      cards: cards.length,
      passwords: passwords.length,
      users: users.length,
      combos: combos.length,
      urls: urls.length,
      proxies: proxies.length,
      crypto: crypto.length,
      txids: txids.length,
      keys: keys.length,
      totpSecrets: totpSecrets.length,
      decodedItems: decodedItems.length,
      phones: phones.length,
      handles: handles.length,
      timestamps: timestamps.length,
      checklist: checklist.total,
      duplicates: duplicateLinesCount,
    }
  };
}

// 7. Smart Auto-Formatter Engine
export function autoFormatNotepadContent(content) {
  if (!content || !content.trim()) return content;

  try {
    const parsed = JSON.parse(content.trim());
    return JSON.stringify(parsed, null, 2);
  } catch (e) {}

  let text = content.replace(/\r\n/g, "\n");

  // Clean tracking parameters from URLs in the text
  text = text.replace(/\bhttps?:\/\/[^\s\n\r<>"'{}|\\^`]+/gi, (url) => {
    return cleanUrl(url);
  });

  // Format Pipe-Lines: "4532123456789012|12|28|382"
  text = text.replace(/\b(\d{15,16})[|/](0[1-9]|1[0-2])[|/](20\d{2}|\d{2})[|/](\d{3,4})\b/g, (match, num, mm, yy, cvv) => {
    const formattedNum = formatCardNumber(num);
    const brand = getCardBrand(num);
    return `${formattedNum} | ${mm}/${yy} | ${cvv} | ${brand}`;
  });

  // Format standalone labeled 15-16 digit series
  text = text.replace(/(?:serie|id|cc)[:\s]*(\d{15,16})\b/gi, (match, num) => {
    return `${formatCardNumber(num)} (${getCardBrand(num)})`;
  });

  // Separate squished inline credentials into neat lines
  text = text.replace(/\s+(password:|contrase[ñn]a:|pass:|clave:|pwd:|user:|usuario:|username:|email:|correo:|api[_-]?key:|token:|secret:|pin:)/gi, "\n$1");

  // Normalize proxy lines: "ip:port:user:pass"
  text = text.replace(/\s+((?:\d{1,3}\.){3}\d{1,3}:\d{2,5}(?::[^\s:]+:[^\s:]+)?)/g, "\n$1");

  const lines = text.split("\n").map(line => line.trimEnd());
  text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

// 8. Non-Intrusive One-Click Regex Text Enrichment Utilities
export function removeDuplicateLines(content) {
  if (!content) return content;
  const seen = new Set();
  return content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

export function normalizeCombosInText(content) {
  if (!content) return content;
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      const uMatch = trimmed.match(/(?:user|usuario|username|login|email|correo|cuenta)[:=]\s*([^\s,;|]+)/i);
      const pMatch = trimmed.match(/(?:password|contrase[ñn]a|pass|clave|pwd)[:=]\s*([^\s,;|]+)/i);
      if (uMatch && pMatch) {
        return `${uMatch[1]}:${pMatch[1]}`;
      }
      const semiMatch = trimmed.match(/^([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7})\s*[;|,]\s*([^\s;|,]+)$/);
      if (semiMatch) {
        return `${semiMatch[1]}:${semiMatch[2]}`;
      }
      return line;
    })
    .join("\n");
}

export function toggleNodeFormat(content) {
  if (!content) return content;
  return content
    .split("\n")
    .map((line) => {
      // ip:port:user:pass -> http://user:pass@ip:port
      const rawMatch = line.trim().match(/^((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5}):([^\s:]+):([^\s:]+)$/);
      if (rawMatch) {
        return `http://${rawMatch[3]}:${rawMatch[4]}@${rawMatch[1]}:${rawMatch[2]}`;
      }
      // http://user:pass@ip:port -> ip:port:user:pass
      const uriMatch = line.trim().match(/^(?:https?|socks5):\/\/([^\s:@]+):([^\s:@]+)@((?:\d{1,3}\.){3}\d{1,3}):(\d{2,5})$/i);
      if (uriMatch) {
        return `${uriMatch[3]}:${uriMatch[4]}:${uriMatch[1]}:${uriMatch[2]}`;
      }
      return line;
    })
    .join("\n");
}

export function alignColumnsInText(content) {
  if (!content) return content;
  const lines = content.split("\n");
  const delimiter = content.includes("|") ? "|" : content.includes("\t") ? "\t" : content.includes(";") ? ";" : null;
  if (!delimiter) return content;

  const rows = lines.map((l) => (l.includes(delimiter) ? l.split(delimiter).map((c) => c.trim()) : [l]));
  const maxCols = Math.max(...rows.map((r) => r.length));
  if (maxCols < 2) return content;

  const colWidths = Array(maxCols).fill(0);
  rows.forEach((r) => {
    if (r.length > 1) {
      r.forEach((cell, i) => {
        colWidths[i] = Math.max(colWidths[i], cell.length);
      });
    }
  });

  return rows
    .map((r) => {
      if (r.length <= 1) return r[0];
      return r.map((cell, i) => cell.padEnd(colWidths[i], " ")).join("  |  ").trimEnd();
    })
    .join("\n");
}

export function sortLinesInText(content, reverse = false) {
  if (!content) return content;
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  lines.sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }));
  if (reverse) lines.reverse();
  return lines.join("\n");
}

export function toggleNumberedLines(content) {
  if (!content) return content;
  const lines = content.split("\n");
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  const alreadyNumbered = nonEmpty.length > 0 && nonEmpty.every((l) => /^\s*\d+\.\s+/.test(l));

  let counter = 1;
  return lines
    .map((line) => {
      if (!line.trim()) return line;
      if (alreadyNumbered) {
        return line.replace(/^\s*\d+\.\s+/, "");
      }
      return `${counter++}. ${line.trimStart()}`;
    })
    .join("\n");
}

export function redactSensitiveText(content) {
  if (!content) return "";
  let redacted = content;
  // Mask passwords/secrets
  redacted = redacted.replace(/((?:password|contrase[ñn]a|pass|clave|pwd|secret|pin|api[_-]?key|token|2fa|totp)[:=]\s*)([^\s\n\r,;|]+)/gi, "$1********");
  // Mask 15-16 digit series keeping last 4
  redacted = redacted.replace(/\b(?:\d{4}[ -]?){3}(\d{4})\b/g, "•••• •••• •••• $1");
  // Mask OpenAI / GitHub tokens
  redacted = redacted.replace(/\b(sk-[a-zA-Z0-9_\-]{6})[a-zA-Z0-9_\-]{14,}\b/g, "$1********");
  redacted = redacted.replace(/\b((?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{4})[a-zA-Z0-9]{30,}\b/g, "$1********");
  return redacted;
}

export function transformTextCase(content, mode = "upper") {
  if (!content) return content;
  switch (mode) {
    case "upper":
      return content.toLocaleUpperCase("es-ES");
    case "lower":
      return content.toLocaleLowerCase("es-ES");
    case "title":
      return content
        .toLocaleLowerCase("es-ES")
        .replace(/(^|[\s\-_/([{"'])(\p{L})/gu, (match, sep, char) => `${sep}${char.toLocaleUpperCase("es-ES")}`);
    case "sentence":
      return content
        .toLocaleLowerCase("es-ES")
        .replace(/(^\s*|[.!?¡¿\n]\s*)(\p{L})/gu, (match, sep, char) => `${sep}${char.toLocaleUpperCase("es-ES")}`);
    default:
      return content;
  }
}

// 9. Generate safe, pixel-perfect overlay HTML without ANY layout shift
export function generateSafeOverlayHtml(content) {
  if (!content) return "";

  let safe = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight 15-16 digit series
  safe = safe.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b|\b3[47]\d{2}[ -]?\d{6}[ -]?\d{5}\b/g, (match) => {
    return `<span class="hl-card">${match}</span>`;
  });

  // Highlight Passwords & Secrets
  safe = safe.replace(/(?:password|contrase[ñn]a|pass|clave|pwd|secret|pin|2fa|totp)[:=]\s*([^\s\n\r,;|]+)/gi, (match) => {
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

  // Highlight Nodes
  safe = safe.replace(/\b(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}(?::[^\s:\n]+:[^\s:\n]+)?\b/g, (match) => {
    return `<span class="hl-proxy">${match}</span>`;
  });

  return safe + "\n";
}

