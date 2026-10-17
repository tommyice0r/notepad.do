/**
 * Notepad.do - Smart Math & Excel-like Auto-Sum Engine
 * Evaluates lists of expenses, numbers, inline arithmetic, and formulas.
 */

// 1. Detect currency in text or default to $
export function detectCurrency(text) {
  const match = text.match(/(?:\$|€|£|¥|\bUSD\b|\bEUR\b|\bRD\$\b|\bMXN\b|\bCOP\b|\bARS\b|\bS\/\.)/i);
  return match ? match[0] : "$";
}

// 2. Parse numbers from a string line, respecting decimal/comma notations
function parseLineAmount(line) {
  const trimmed = line.trim();
  // Ignore empty lines
  if (!trimmed) return null;
  // Ignore lines with equations ending in '='
  if (/=\s*$/.test(trimmed)) return null;
  // Ignore lines with arithmetic operations like * or /
  if (/[\*\/]/.test(trimmed)) return null;
  // Ignore credit cards (15-16 continuous digits)
  if (/\b\d{15,16}\b/.test(trimmed)) return null;
  // Ignore IP addresses and ports
  if (/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/.test(trimmed)) return null;
  // Ignore dates like 2026-10-14, 12/28, 14/10/2026
  if (/\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/.test(trimmed)) return null;
  // Ignore hex colors like #FF9F0A
  if (/#[0-9a-fA-F]{3,8}\b/.test(trimmed)) return null;
  // Ignore bullet task brackets like [ ] or [x]
  if (/^[-*]?\s*\[[ xX]\]/.test(trimmed)) return null;

  // Search for monetary or quantity number in line
  // Matches: $45.50, 45,50, 1,250.00, 1.250,00, -20.50, 45€, 120 USD
  const amountRegex = /(?:[\$€£¥]|USD|EUR|RD\$|MXN|COP|ARS|S\/\.)?\s*([+-]?(?:\d{1,3}(?:[,\.]\d{3})+|\d+)(?:[,\.]\d{1,2})?)\s*(?:[\$€£¥]|USD|EUR|RD\$|MXN|COP|ARS|S\/\.)?/i;
  
  const match = trimmed.match(amountRegex);
  if (!match) return null;

  let rawNum = match[1];
  // Normalize commas and dots:
  // Format 1.250,50 (European/Latam)
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(rawNum)) {
    rawNum = rawNum.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(rawNum)) {
    // Format 1,250.50 (US/Standard)
    rawNum = rawNum.replace(/,/g, "");
  } else if (/^\d+,\d{1,2}$/.test(rawNum)) {
    // 45,50
    rawNum = rawNum.replace(",", ".");
  }

  const val = parseFloat(rawNum);
  if (isNaN(val) || Math.abs(val) > 1000000000) return null;
  return val;
}

// 3. Scan note content for financial/quantity numbers and calculate Excel-like sum
export function calculateExcelSum(text) {
  if (!text || !text.trim()) return null;

  const lines = text.split("\n");
  const items = [];
  const curr = detectCurrency(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip total/summary lines to avoid recursive summation
    if (/^(total|suma|sum|subtotal|resultado|promedio|────────)[\s:=]/i.test(line)) continue;

    const amount = parseLineAmount(line);
    if (amount !== null) {
      items.push({
        lineIndex: i,
        lineText: line,
        value: amount
      });
    }
  }

  // Only return calculations if at least 2 amounts are found
  if (items.length < 2) return null;

  const values = items.map(item => item.value);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    items,
    count: items.length,
    sum: Math.round(sum * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    currency: curr
  };
}

// 4. Evaluate inline math: e.g. "50 * 4 + 20 =" or "= 100 + 40"
export function evaluateInlineMath(text) {
  if (!text) return text;

  const lines = text.split("\n");
  const processed = lines.map(line => {
    // Match line ending with = (e.g. "Total: 50 * 4 + 20 =" or "15 + 25 =")
    const eqMatch = line.match(/^([\s\S]*?)([\d\.\s\+\-\*\/\(\)]+)=\s*$/);
    if (eqMatch) {
      const prefix = eqMatch[1];
      const expr = eqMatch[2].trim();
      // Ensure expression contains at least one operator (+, -, *, /) and digits
      if (/[\+\-\*\/]/.test(expr) && /^[\d\.\s\+\-\*\/\(\)]+$/.test(expr)) {
        try {
          const evaluated = Function(`"use strict"; return (${expr})`)();
          if (typeof evaluated === "number" && !isNaN(evaluated) && isFinite(evaluated)) {
            const formatted = Math.round(evaluated * 100) / 100;
            return `${prefix}${expr} = ${formatted}`;
          }
        } catch (e) {}
      }
    }

    // Match Excel style lines: "= 100 + 40"
    const excelMatch = line.match(/^=\s*([\d\.\s\+\-\*\/\(\)]+)$/);
    if (excelMatch) {
      const expr = excelMatch[1].trim();
      if (/[\+\-\*\/]/.test(expr) && /^[\d\.\s\+\-\*\/\(\)]+$/.test(expr)) {
        try {
          const evaluated = Function(`"use strict"; return (${expr})`)();
          if (typeof evaluated === "number" && !isNaN(evaluated) && isFinite(evaluated)) {
            const formatted = Math.round(evaluated * 100) / 100;
            return `= ${formatted} (${expr})`;
          }
        } catch (e) {}
      }
    }

    return line;
  });

  return processed.join("\n");
}

// 5. Append formatted total summary to note
export function appendTotalSummary(currentContent) {
  const calc = calculateExcelSum(currentContent);
  if (!calc) return currentContent;

  const curr = calc.currency;
  const formattedSum = `${curr}${calc.sum.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
  const formattedAvg = `${curr}${calc.avg.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;

  const summary = `\n\n──────────────────────────────\nTotal (${calc.count} valores): ${formattedSum}\nPromedio:          ${formattedAvg}`;

  return currentContent.trimEnd() + summary;
}
