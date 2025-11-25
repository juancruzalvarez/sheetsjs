import { create } from "zustand";
import {
  kStartColCount,
  kStartRowCount,
  kDefaultColWidth,
  kDefaultRowHeight,
} from "../constants";
import { CSSProperties } from "react";
import {
  createDefaultCell,
  detectDataType,
  validateType,
  formatCellValue,
  parseFormulaDependencies,
  cellRefToPosition,
  positionToCellRef,
} from "../Services/utils";
import {
  Cell,
  CellPos,
  DataType,
  Format,
  SelectionRange,
} from "../Services/types";

export interface SpreadsheetStore {
  rowCount: number;
  columnCount: number;

  cells: Map<string, Cell>;
  columnWidths: Map<number, number>;
  rowHeights: Map<number, number>;

  resizeRulerPos: { x: number | null; y: number | null };

  // Selection
  selectionRanges: SelectionRange[];
  isSelecting?: boolean;
  currentCell?: CellPos;

  // Dependency graph
  dependencyGraph: Map<string, Set<string>>;

  // Actions
  setCell: (row: number, col: number, value: any) => void;
  setCellFormula: (row: number, col: number, formula: string) => void;
  setCellStyle: (row: number, col: number, style: CSSProperties) => void;
  setCellDataType: (row: number, col: number, dataType: DataType) => void;
  setCellFormatting: (row: number, col: number, formatting: Format) => void;
  recalculateCell: (row: number, col: number) => void;
  recalculateDependents: (cellKey: string) => void;

  setColumnWidth: (index: number, width: number) => void;
  setRowHeight: (index: number, height: number) => void;
  setResizeRulerPos: (pos: { x: number | null; y: number | null }) => void;

  startSelection: (cell: CellPos, ctrlKey?: boolean) => void;
  extendSelection: (cell: CellPos) => void;
  endSelection: () => void;
  clearSelection: () => void;
  isCellSelected: (row: number, col: number) => boolean;
}

export const useSpreadsheetStore = create<SpreadsheetStore>((set, get) => {
  const rowCount = kStartRowCount;
  const columnCount = kStartColCount;

  const columnWidths = new Map<number, number>();
  const rowHeights = new Map<number, number>();

  // Dynamic first column width based on row count digit count
  const firstColWidth = Math.max(30, String(rowCount).length * 12 + 16);
  columnWidths.set(0, firstColWidth);
  rowHeights.set(0, 30);

  return {
    rowCount,
    columnCount,

    cells: new Map(),
    columnWidths,
    rowHeights,

    resizeRulerPos: { x: null, y: null },
    selectionRanges: [],
    isSelecting: false,
    currentCell: undefined,

    dependencyGraph: new Map(),

    setCell: (row, col, value) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      // Handle empty
      if (value === "" || value === null || value === undefined) {
        const updatedCell: Cell = {
          ...existing,
          rawValue: "",
          displayValue: "",
          dataType: "undefined",
          computed: false,
          formula: null,
          error: null,
        };

        set((state) => ({
          cells: new Map(state.cells).set(key, updatedCell),
        }));

        // IMPORTANT: Recalculate dependents!
        get().recalculateDependents(key);
        return;
      }

      // Check if it's a formula
      const isFormula = typeof value === "string" && value.startsWith("=");

      if (isFormula) {
        get().setCellFormula(row, col, value);
      } else {
        // Regular value
        const detectedType = detectDataType(value);
        const finalType = existing.dataTypeOverride || detectedType;

        let error = null;
        if (
          existing.dataTypeOverride &&
          !validateType(value, existing.dataTypeOverride)
        ) {
          error = {
            message: `Value doesn't match expected type: ${existing.dataTypeOverride}`,
            type: "type-mismatch" as const,
          };
        }

        const updatedCell: Cell = {
          ...existing,
          rawValue: value,
          dataType: finalType,
          computed: false,
          formula: null,
          error,
        };

        updatedCell.displayValue = formatCellValue(updatedCell);

        set((state) => ({
          cells: new Map(state.cells).set(key, updatedCell),
        }));

        // IMPORTANT: Recalculate dependents!
        get().recalculateDependents(key);
      }
    },

    setCellFormula: (row, col, formula) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      // Parse dependencies
      const dependencies = parseFormulaDependencies(formula);

      // Update dependency graph
      const graph = new Map(get().dependencyGraph);

      // Remove old dependencies
      graph.forEach((deps, depKey) => {
        deps.delete(key);
      });

      // Add new dependencies
      dependencies.forEach((depRef) => {
        const depPos = cellRefToPosition(depRef);
        if (depPos) {
          const depKey = `${depPos.row}-${depPos.col}`;
          if (!graph.has(depKey)) {
            graph.set(depKey, new Set());
          }
          graph.get(depKey)!.add(key);
        }
      });

      const updatedCell: Cell = {
        ...existing,
        formula,
        computed: true,
        error: null,
      };

      set((state) => ({
        cells: new Map(state.cells).set(key, updatedCell),
        dependencyGraph: graph,
      }));

      // Recalculate the cell
      get().recalculateCell(row, col);
    },

    recalculateCell: (row, col) => {
      const key = `${row}-${col}`;
      const cell = get().cells.get(key);

      if (!cell || !cell.computed || !cell.formula) return;

      try {
        const cleanCode = cell.formula.startsWith("=")
          ? cell.formula.slice(1)
          : cell.formula;

        // Create execution context
        const context = {
          cell: (ref: string) => {
            // Normalize to uppercase
            ref = ref.toUpperCase();

            // Check if it's a range (e.g., "A1:B5")
            if (ref.includes(":")) {
              const [start, end] = ref.split(":");
              const startPos = cellRefToPosition(start);
              const endPos = cellRefToPosition(end);

              if (!startPos || !endPos) return null;

              const startRow = Math.min(startPos.row, endPos.row);
              const endRow = Math.max(startPos.row, endPos.row);
              const startCol = Math.min(startPos.col, endPos.col);
              const endCol = Math.max(startPos.col, endPos.col);

              // Check if it's a single row (1D horizontal array  )
              if (startRow === endRow) {
                const values = [];
                for (let c = startCol; c <= endCol; c++) {
                  const key = `${startRow}-${c}`;
                  const cell = get().cells.get(key);
                  values.push(cell?.rawValue ?? 0);
                }
                return values;
              }

              // Check if it's a single column (1D vertical array)
              if (startCol === endCol) {
                const values = [];
                for (let r = startRow; r <= endRow; r++) {
                  const key = `${r}-${startCol}`;
                  const cell = get().cells.get(key);
                  values.push(cell?.rawValue ?? 0);
                }
                return values;
              }

              // 2D array for multi-row, multi-column range
              const values = [];
              for (let r = startRow; r <= endRow; r++) {
                const row = [];
                for (let c = startCol; c <= endCol; c++) {
                  const key = `${r}-${c}`;
                  const cell = get().cells.get(key);
                  row.push(cell?.rawValue ?? 0);
                }
                values.push(row);
              }
              return values;
            }

            // Single cell reference
            const pos = cellRefToPosition(ref);
            if (!pos) return null;
            const key = `${pos.row}-${pos.col}`;
            const refCell = get().cells.get(key);
            return refCell?.rawValue ?? "";
          },

          sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
          avg: (...args: number[]) =>
            args.reduce((a, b) => a + b, 0) / args.length,
          max: Math.max,
          min: Math.min,
          round: Math.round,
          floor: Math.floor,
          ceil: Math.ceil,
          abs: Math.abs,

          concat: (...args: any[]) => args.join(""),
          upper: (str: string) => str.toUpperCase(),
          lower: (str: string) => str.toLowerCase(),
          trim: (str: string) => str.trim(),

          range: (start: number, end: number) => {
            const arr = [];
            for (let i = start; i <= end; i++) arr.push(i);
            return arr;
          },

          now: () => new Date(),
          today: () => new Date().toLocaleDateString(),
        };

        const func = new Function(
          ...Object.keys(context),
          `return (${cleanCode})`
        );
        const result = func(...Object.values(context));

        const detectedType = detectDataType(result);
        const finalType = cell.dataTypeOverride || detectedType;

        const updatedCell: Cell = {
          ...cell,
          rawValue: result,
          dataType: finalType,
          error: null,
        };

        updatedCell.displayValue = formatCellValue(updatedCell);

        set((state) => ({
          cells: new Map(state.cells).set(key, updatedCell),
        }));

        // Recalculate dependents
        get().recalculateDependents(key);
      } catch (err: any) {
        const updatedCell: Cell = {
          ...cell,
          error: {
            message: err.message || "Formula error",
            type: "formula",
          },
          displayValue: "#ERROR!",
        };

        set((state) => ({
          cells: new Map(state.cells).set(key, updatedCell),
        }));
      }
    },

    recalculateDependents: (cellKey) => {
      const graph = get().dependencyGraph;
      const dependents = graph.get(cellKey);

      if (!dependents) return;

      dependents.forEach((depKey) => {
        const [row, col] = depKey.split("-").map(Number);
        get().recalculateCell(row, col);
      });
    },

    setCellStyle: (row, col, style) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      set((state) => ({
        cells: new Map(state.cells).set(key, {
          ...existing,
          style: { ...existing.style, ...style },
        }),
      }));
    },

    setCellDataType: (row, col, dataType) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      // Validate current value against new type
      let error = null;
      if (
        existing.rawValue !== null &&
        existing.rawValue !== undefined &&
        existing.rawValue !== ""
      ) {
        if (!validateType(existing.rawValue, dataType)) {
          error = {
            message: `Current value doesn't match type: ${dataType}`,
            type: "type-mismatch" as const,
          };
        }
      }

      const updatedCell: Cell = {
        ...existing,
        dataType,
        dataTypeOverride: dataType,
        error,
      };

      updatedCell.displayValue = formatCellValue(updatedCell);

      set((state) => ({
        cells: new Map(state.cells).set(key, updatedCell),
      }));
    },

    setCellFormatting: (row, col, formatting) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      const updatedCell: Cell = {
        ...existing,
        formatting,
      };

      updatedCell.displayValue = formatCellValue(updatedCell);

      set((state) => ({
        cells: new Map(state.cells).set(key, updatedCell),
      }));
    },

    setColumnWidth: (index, width) => {
      const newWidths = new Map(get().columnWidths);
      newWidths.set(index, width);
      set({ columnWidths: newWidths });
    },

    setRowHeight: (index, height) => {
      const newHeights = new Map(get().rowHeights);
      newHeights.set(index, height);
      set({ rowHeights: newHeights });
    },

    setResizeRulerPos: (pos) => set({ resizeRulerPos: pos }),

    startSelection: (cell, ctrlKey = false) =>
      set((state) => {
            // Normal selection
        const range: SelectionRange = { start: cell, end: cell };
        return {
          isSelecting: true,
          currentCell: cell,
          selectionRanges: ctrlKey
            ? [...state.selectionRanges, range]
            : [range],
        };
      }),

    // UPDATE extendSelection for ranges
    extendSelection: (cell) => {
      const state = get();
      // Normal extend behavior
      const ranges = state.selectionRanges;
      if (!ranges.length) return;

      const currentCell = state.currentCell;
      let start = { col: 0, row: 0 };
      let end = { col: 0, row: 0 };
      if (currentCell) {
        start = {
          col: Math.min(currentCell.col, cell.col),
          row: Math.min(currentCell.row, cell.row),
        };
        end = {
          col: Math.max(currentCell.col, cell.col),
          row: Math.max(currentCell.row, cell.row),
        };
      }
      const updatedLast = { start: start, end: end };
      set({
        selectionRanges: [...ranges.slice(0, -1), updatedLast],
      });
    },

    endSelection: () => set({ isSelecting: false }),

    clearSelection: () => set({ selectionRanges: [] }),

    isCellSelected: (row, col) => {
      return get().selectionRanges.some(({ start, end }) => {
        const top = Math.min(start.row, end.row);
        const bottom = Math.max(start.row, end.row);
        const left = Math.min(start.col, end.col);
        const right = Math.max(start.col, end.col);

        return row >= top && row <= bottom && col >= left && col <= right;
      });
    },
  };
});
