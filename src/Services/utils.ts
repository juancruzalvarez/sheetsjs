import { Cell, CellPos, DataType, Format, SelectionRange } from "./types";

export const createDefaultCell = (): Cell => ({
  dataType: "undefined",
  dataTypeOverride: null,
  formatting: "general",
  rawValue: null,
  displayValue: "",
  computed: false,
  formula: null,
  error: null,
  style: {},
});
// Auto-detect data type from raw value
export const detectDataType = (value: any): DataType => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  
  const type = typeof value;
  
  if (type === "number") return "number";
  if (type === "string") return "string";
  if (type === "boolean") return "boolean";
  
  if (value instanceof Date) return "date";
  if (Array.isArray(value)) return "array";
  if (type === "object") return "object";
  
  return "undefined";
};
// Validate if value matches expected type
export const validateType = (value: any, expectedType: DataType): boolean => {
  const actualType = detectDataType(value);
  
  // Allow some type coercion
  if (expectedType === "number") {
    return actualType === "number" || (actualType === "string" && !isNaN(Number(value)));
  }
  
  if (expectedType === "string") {
    return true; // Everything can be converted to string
  }
  
  if (expectedType === "date") {
    return actualType === "date" || (actualType === "string" && !isNaN(Date.parse(value)));
  }
  
  return actualType === expectedType;
};
// Format value based on data type and format
export const formatCellValue = (cell: Cell): string => {
  const { rawValue, dataType, formatting } = cell;
  
  if (rawValue === null || rawValue === undefined) return "";
  
  try {
    switch (dataType) {
      case "number":
        return formatNumber(rawValue, formatting);
      
      case "date":
        return formatDate(rawValue, formatting);
      
      case "boolean":
        return rawValue ? "TRUE" : "FALSE";
      
      case "array":
        return JSON.stringify(rawValue);
      
      case "object":
        return JSON.stringify(rawValue);
      
      case "string":
      default:
        return String(rawValue);
    }
  } catch (err) {
    return String(rawValue);
  }
};
// Format number based on format type
const formatNumber = (value: number, format: Format): string => {
  switch (format) {
    case "integer":
      return Math.round(value).toString();
    
    case "decimal":
      return value.toFixed(1);
    
    case "decimal2":
      return value.toFixed(2);
    
    case "decimal3":
      return value.toFixed(3);
    
    case "decimal4":
      return value.toFixed(4);
    
    case "decimal6":
      return value.toFixed(6);
    
    case "currency":
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    
    case "percentage":
      return `${(value * 100).toFixed(2)}%`;
    
    case "scientific":
      return value.toExponential(2);
    
    default:
      return value.toString();
  }
};
// Format date based on format type
const formatDate = (value: Date | string, format: Format): string => {
  const date = value instanceof Date ? value : new Date(value);
  
  if (isNaN(date.getTime())) return String(value);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case "DDMMYYYY":
      return `${day}/${month}/${year}`;
    
    case "MMDDYYYY":
      return `${month}/${day}/${year}`;
    
    case "YYYYMMDD":
      return `${year}-${month}-${day}`;
    
    case "DDMM":
      return `${day}/${month}`;
    
    case "MMDD":
      return `${month}/${day}`;
    
    case "time":
      return `${hours}:${minutes}:${seconds}`;
    
    case "datetime":
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    
    default:
      return date.toLocaleDateString();
  }
};

export const parseFormulaDependencies = (formula: string): string[] => {
  const deps: string[] = [];

  // Match cell(...) with content like A1 or A1:B5, any case
  const pattern = /cell\s*\(\s*['"]([a-z]+\d+(?::[a-z]+\d+)?)['"]\s*\)/gi;

  let match;
  while ((match = pattern.exec(formula)) !== null) {
    const ref = match[1].toUpperCase(); // normalize

    if (ref.includes(":")) {
      // This is a range: A1:B5
      const [start, end] = ref.split(":");

      const startCol = colToIndex(start.replace(/\d+/g, ""));
      const startRow = parseInt(start.replace(/\D+/g, ""), 10);

      const endCol = colToIndex(end.replace(/\d+/g, ""));
      const endRow = parseInt(end.replace(/\D+/g, ""), 10);

      for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
          deps.push(indexToCol(c) + r);
        }
      }
    } else {
      // Single cell
      deps.push(ref);
    }
  }

  return deps;
};
// Convert column letters → number (A=1, B=2, Z=26, AA=27, AB=28...)
function colToIndex(col: string): number {
  let idx = 0;
  const s = col.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    idx = idx * 26 + (s.charCodeAt(i) - 64); // 'A' = 65
  }
  return idx; // 1-based
}

// Convert number → column letters (1=A, 2=B, 27=AA...)
function indexToCol(idx: number): string {
  if (idx <= 0) throw new Error("indexToCol: index must be >= 1");
  let col = "";
  let n = idx;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

// Convert cell reference like "A1" to { row: number; col: number } (both 1-based)
export const cellRefToPosition = (ref: string): { row: number; col: number } | null => {
  if (!ref) return null;
  const clean = ref.trim().toUpperCase();
  const match = clean.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const colLetters = match[1];
  const rowNumber = parseInt(match[2], 10);

  if (rowNumber <= 0) return null;

  const col = colToIndex(colLetters); // 1-based
  const row = rowNumber; // 1-based

  return { row, col };
};

// Convert { row: number; col: number } (both 1-based) to cell reference like "A1"
export const positionToCellRef = (row: number, col: number): string => {
  if (row <= 0 || col <= 0) throw new Error("positionToCellRef: row and col must be >= 1");
  const colName = indexToCol(col);
  return `${colName}${row}`;
};


// Get available format options for a data type
export const getFormatOptionsForType = (dataType: DataType): Format[] => {
  switch (dataType) {
    case "number":
      return [
        "general",
        "integer",
        "decimal2",
        "decimal3",
        "decimal4",
        "decimal6",
        "currency",
        "percentage",
        "scientific"
      ];
    
    case "date":
      return [
        "general",
        "DDMMYYYY",
        "MMDDYYYY",
        "YYYYMMDD",
        "DDMM",
        "MMDD",
        "time",
        "datetime"
      ];
    
    case "string":
      return ["general", "string"];
    
    case "array":
      return ["general", "array"];
    
    case "object":
      return ["general", "object"];
    
    default:
      return ["general"];
  }
};

// Function to extract all cell references from a formula
export const getFormulaReferences = (formula: string): SelectionRange[] => {
  if (!formula || !formula.startsWith('=')) return [];
  
  const ranges: SelectionRange[] = [];
  
  // Match patterns: cell("A1"), cell("A1:B5"), or raw A1, B2:C3
  // Pattern 1: cell("A1") or cell("A1:B5")
  const cellFuncPattern = /cell\s*\(\s*["']([A-Z]+\d+(?::[A-Z]+\d+)?)["']\s*\)/gi;
  
  // Pattern 2: Raw cell references (after operators or at start, not inside words)
  const rawCellPattern = /(?:^|[^\w])([A-Z]+\d+(?::[A-Z]+\d+)?)(?=[^\w]|$)/gi;
  
  const matches = new Set<string>();
  
  // Find all cell function matches
  let match;
  while ((match = cellFuncPattern.exec(formula)) !== null) {
    matches.add(match[1].toUpperCase());
  }
  
  // Find all raw cell references
  while ((match = rawCellPattern.exec(formula)) !== null) {
    matches.add(match[1].toUpperCase());
  }
  
  // Convert to SelectionRange objects
  matches.forEach(ref => {
    if (ref.includes(':')) {
      // Range like "A1:B5"
      const [start, end] = ref.split(':');
      const startPos = cellRefToPosition(start);
      const endPos = cellRefToPosition(end);
      
      if (startPos && endPos) {
        ranges.push({
          start: startPos,
          end: endPos
        });
      }
    } else {
      // Single cell like "A1"
      const pos = cellRefToPosition(ref);
      if (pos) {
        ranges.push({
          start: pos,
          end: pos
        });
      }
    }
  });
  
  return ranges;
};

export function insertCellReference(
  edit: {text: string, cursorPos: number},
  newRange: string
): {text: string, cursorPos: number} {
  const { text, cursorPos } = edit;
  const insertText = `cell("${newRange}")`;

  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);

  // Regex: match cell('A1'), cell("A1:A3"), case-insensitive
  const cellRefRegex = /cell\(\s*(['"])([A-Za-z0-9:]+)\1\s*\)$/i;

  // --- 1. Check if cursor is *just after* a cell() reference ---
  const beforeMatch = before.match(cellRefRegex);

  if (beforeMatch) {
    // Replace the matched part entirely with new ref
    const startOfMatch = before.lastIndexOf(beforeMatch[0]);
    const newBefore =
      before.slice(0, startOfMatch) + insertText;

    const newText = newBefore + after;
    const newCursor = newBefore.length;

    return { text: newText, cursorPos: newCursor };
  }

  // --- 2. Cursor is NOT after a reference → insert normally ---
  const newText = before + insertText + after;
  const newCursor = before.length + insertText.length;

  return { text: newText, cursorPos: newCursor };
}