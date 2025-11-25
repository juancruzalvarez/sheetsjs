import { Cell, DataType, Format } from "./types";

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

// Parse formula dependencies: supports cell('a1'), cell("A2:B5"), case insensitive.
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
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64); // 'A' = 65
  }
  return idx;
}

// Convert number → column letters (1=A, 2=B, 27=AA...)
function indexToCol(idx: number): string {
  let col = "";
  while (idx > 0) {
    const rem = (idx - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    idx = Math.floor((idx - 1) / 26);
  }
  return col;
}

// Convert cell reference like "A1" to {row, col}
export const cellRefToPosition = (ref: string): { row: number; col: number } | null => {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  const colLetters = match[1];
  const row = parseInt(match[2]) - 1;
  
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64);
  }
  col -= 1;
  
  return { row, col };
};

// Convert {row, col} to cell reference like "A1"
export const positionToCellRef = (row: number, col: number): string => {
  let colName = '';
  let colNum = col + 1;
  
  while (colNum > 0) {
    colNum--;
    colName = String.fromCharCode(65 + (colNum % 26)) + colName;
    colNum = Math.floor(colNum / 26);
  }
  
  return `${colName}${row + 1}`;
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