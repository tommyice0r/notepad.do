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

// 4. Extract named numeric variables from lines like "servidor = 45" or "licencia = $120.50"
export function extractVariables(text) {
  const vars = {};
  if (!text) return vars;

  const reserved = new Set([
    "password", "contraseña", "pass", "clave", "pwd", "secret", "pin",
    "user", "usuario", "username", "login", "email", "correo", "cuenta",
    "api_key", "apikey", "token", "bearer", "total", "suma", "sum", "promedio"
  ]);

  const lines = text.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    // Match "variable_name = $120.50" (not ending in empty "=")
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]{1,24})\s*[:=]\s*[\$€£¥]?\s*([+-]?\d+(?:[.,]\d+)?)\s*(?:USD|EUR|RD\$|MXN|COP|ARS)?$/i);
    if (match) {
      const varName = match[1].toLowerCase();
      if (!reserved.has(varName)) {
        const num = parseFloat(match[2].replace(",", "."));
        if (!isNaN(num) && isFinite(num)) {
          vars[varName] = num;
        }
      }
    }
  }
  return vars;
}

// Helper to transform percentage expressions and variables into safe arithmetic
function normalizeMathExpression(rawExpr, vars = {}) {
  let expr = rawExpr.trim();

  // 1. Replace known variable names with their numeric values
  expr = expr.replace(/\b([a-zA-Z_][a-zA-Z0-9_]{1,24})\b/g, (full, name) => {
    const key = name.toLowerCase();
    return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : full;
  });

  // 2. Transform "A + B%" -> "(A * (1 + B / 100))" and "A - B%" -> "(A * (1 - B / 100))"
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)%/g, "($1 * (1 $2 ($3 / 100)))");

  // 3. Transform remaining "B%" -> "(B / 100)"
  expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1 / 100)");

  return expr;
}

// 5. Evaluate inline math: e.g. "50 * 4 + 20 =", "servidor + licencia =", "250 + 18% =" or "= 100 + 40"
export function evaluateInlineMath(text) {
  if (!text) return text;

  const vars = extractVariables(text);
  const lines = text.split("\n");

  const processed = lines.map(line => {
    // Match line ending with = (e.g. "Total: 50 * 4 + 20 =", "servidor + licencia =", "250 + 18% =")
    const eqMatch = line.match(/^([\s\S]*?)([a-zA-Z0-9_%\.\s\+\-\*\/\(\)]+)=\s*$/);
    if (eqMatch) {
      const prefix = eqMatch[1];
      const originalExpr = eqMatch[2].trim();
      const normalizedExpr = normalizeMathExpression(originalExpr, vars);

      // Ensure resolved expression contains only safe numbers/operators
      if (/[\+\-\*\/]/.test(normalizedExpr) && /^[\d\.\s\+\-\*\/\(\)]+$/.test(normalizedExpr)) {
        try {
          const evaluated = Function(`"use strict"; return (${normalizedExpr})`)();
          if (typeof evaluated === "number" && !isNaN(evaluated) && isFinite(evaluated)) {
            const formatted = Math.round(evaluated * 100) / 100;
            return `${prefix}${originalExpr} = ${formatted}`;
          }
        } catch (e) {}
      }
    }

    // Match Excel style lines: "= 100 + 40" or "= servidor * 12"
    const excelMatch = line.match(/^=\s*([a-zA-Z0-9_%\.\s\+\-\*\/\(\)]+)$/);
    if (excelMatch) {
      const originalExpr = excelMatch[1].trim();
      const normalizedExpr = normalizeMathExpression(originalExpr, vars);
      if (/[\+\-\*\/]/.test(normalizedExpr) && /^[\d\.\s\+\-\*\/\(\)]+$/.test(normalizedExpr)) {
        try {
          const evaluated = Function(`"use strict"; return (${normalizedExpr})`)();
          if (typeof evaluated === "number" && !isNaN(evaluated) && isFinite(evaluated)) {
            const formatted = Math.round(evaluated * 100) / 100;
            return `= ${formatted} (${originalExpr})`;
          }
        } catch (e) {}
      }
    }

    return line;
  });

  return processed.join("\n");
}

// 6. Append formatted total summary to note
export function appendTotalSummary(currentContent) {
  const calc = calculateExcelSum(currentContent);
  if (!calc) return currentContent;

  const curr = calc.currency;
  const formattedSum = `${curr}${calc.sum.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;
  const formattedAvg = `${curr}${calc.avg.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`;

  const summary = `\n\n──────────────────────────────\nTotal (${calc.count} valores): ${formattedSum}\nPromedio:          ${formattedAvg}`;

  return currentContent.trimEnd() + summary;
}
