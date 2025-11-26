import { CSSProperties } from "react";

export type DataType =
  | "null"
  | "undefined"
  | "number"
  | "string"
  | "boolean"
  | "object"
  | "array"
  | "date"
  | "error";

export type Format =
  | "general"
  | "integer"
  | "decimal"
  | "decimal2"
  | "decimal3"
  | "decimal4"
  | "decimal6"
  | "currency"
  | "percentage"
  | "scientific"
  | "string"
  | "object"
  | "array"
  | "DDMMYYYY"
  | "MMDDYYYY"
  | "YYYYMMDD"
  | "DDMM"
  | "MMDD"
  | "time"
  | "datetime";

export interface Cell {
  dataType: DataType;
  dataTypeOverride: DataType | null;
  formatting: Format;
  rawValue: any;
  displayValue: string;
  computed: boolean;
  formula: string | null;
  error: {
    message: string;
    type: 'formula' | 'type-mismatch' | 'circular' | 'reference';
  } | null;
  style: CSSProperties;
}

export interface CellPos {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPos;
  end: CellPos;
}


export interface ClipboardData {
  cells: Array<Array<{
    rawValue: any;
    formula: string | null;
    style: CSSProperties;
    formatting: Format;
    dataType: DataType;
  }>>;
  rowCount: number;
  colCount: number;
  isCut: boolean;
  sourceRange: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  } | null;
}