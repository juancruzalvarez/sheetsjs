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
  getFormulaReferences,
  positionToCellRef,
  insertCellReference,
} from "../Services/utils";
import {
  Cell,
  CellPos,
  ClipboardData,
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
  formulaReferences: SelectionRange[];
  editingState: {
    cell: CellPos;
    value: string;
    cursorPos: number;
    insertingRange: SelectionRange | null;
    insertingRangeStart: CellPos | null;
  } | null;

  clipboard: ClipboardData | null;

  // Actions
  copySelection: () => void;
  cutSelection: () => void;
  paste: () => void;

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

  setEditingState: (
    row: number,
    col: number,
    value: string,
    cursorPos: number
  ) => void;
  stopEditing: () => void;
  isEditingFormula: () => boolean;
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

    cells: new Map<string, Cell>(),
    columnWidths,
    rowHeights,

    resizeRulerPos: { x: null, y: null },
    selectionRanges: [] as SelectionRange[],
    isSelecting: false,
    currentCell: undefined,

    dependencyGraph: new Map<string, Set<string>>(),
    formulaReferences: [] as SelectionRange[],
    editingState: null,

    isEditingFormula: () => {
      const editState = get().editingState;
      // ensure boolean always
      return !!(editState && editState.value.trimStart().startsWith("="));
    },

    setEditingState: (row, col, value, cursorPos) => {
      // compute formula references only when value starts with '='
      const refs: SelectionRange[] = value.trimStart().startsWith("=")
        ? (getFormulaReferences(value) as SelectionRange[])
        : ([] as SelectionRange[]);

      set({
        editingState: {
          cell: { row, col },
          value,
          cursorPos,
          insertingRange: get().editingState?.insertingRange || null,
          insertingRangeStart: get().editingState?.insertingRangeStart || null,
        },
        formulaReferences: refs,
      });
    },
    stopEditing: () => {
      set({ editingState: null, formulaReferences: [] as SelectionRange[] });
    },

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

        set((state) => {
          const newCells = new Map(state.cells);
          newCells.set(key, updatedCell);
          return { cells: newCells };
        });

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

        let error: Cell["error"] = null;
        if (
          existing.dataTypeOverride &&
          !validateType(value, existing.dataTypeOverride)
        ) {
          error = {
            message: `Value doesn't match expected type: ${existing.dataTypeOverride}`,
            type: "type-mismatch",
          } as NonNullable<Cell["error"]>;
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

        set((state) => {
          const newCells = new Map(state.cells);
          newCells.set(key, updatedCell);
          return { cells: newCells };
        });
      }
      get().recalculateDependents(key);
    },

    setCellFormula: (row, col, formula) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      // Parse dependencies (ensure typed)
      const dependencies: string[] = parseFormulaDependencies(formula) || [];

      // Update dependency graph
      const graph = new Map<string, Set<string>>(get().dependencyGraph);

      // Remove old dependencies (remove this key from all existing sets)
      graph.forEach((deps) => {
        deps.delete(key);
      });

      // Add new dependencies
      dependencies.forEach((depRef) => {
        const depPos = cellRefToPosition(depRef);
        if (depPos) {
          const depKey = `${depPos.row}-${depPos.col}`;
          if (!graph.has(depKey)) {
            graph.set(depKey, new Set<string>());
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

      set((state) => {
        const newCells = new Map(state.cells);
        newCells.set(key, updatedCell);
        return {
          cells: newCells,
          dependencyGraph: graph,
        };
      });

      // Recalculate the cell
      get().recalculateCell(row, col);
    },

    recalculateCell: (row, col) => {
      console.log("recalculate", "" + row + " " + col);
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

              // Check if it's a single row (1D horizontal array)
              if (startRow === endRow) {
                const values: any[] = [];
                for (let c = startCol; c <= endCol; c++) {
                  const key = `${startRow}-${c}`;
                  const cell = get().cells.get(key);
                  values.push(cell?.rawValue ?? 0);
                }
                return values;
              }

              // Check if it's a single column (1D vertical array)
              if (startCol === endCol) {
                const values: any[] = [];
                for (let r = startRow; r <= endRow; r++) {
                  const key = `${r}-${startCol}`;
                  const cell = get().cells.get(key);
                  values.push(cell?.rawValue ?? 0);
                }
                return values;
              }

              // 2D array for multi-row, multi-column range
              const values: any[] = [];
              for (let r = startRow; r <= endRow; r++) {
                const rowArr: any[] = [];
                for (let c = startCol; c <= endCol; c++) {
                  const key = `${r}-${c}`;
                  const cell = get().cells.get(key);
                  rowArr.push(cell?.rawValue ?? 0);
                }
                values.push(rowArr);
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
            const arr: number[] = [];
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

        set((state) => {
          const newCells = new Map(state.cells);
          newCells.set(key, updatedCell);
          return { cells: newCells };
        });

        // Recalculate dependents
        get().recalculateDependents(key);
      } catch (err: any) {
        const updatedCell: Cell = {
          ...cell,
          error: {
            message: err?.message ?? "Formula error",
            type: "formula",
          } as NonNullable<Cell["error"]>,
          displayValue: "#ERROR!",
        };

        set((state) => {
          const newCells = new Map(state.cells);
          newCells.set(key, updatedCell);
          return { cells: newCells };
        });
      }
    },

    recalculateDependents: (cellKey) => {
      console.log("recalculateDependants", cellKey);

      const graph = get().dependencyGraph;
      const dependents = graph.get(cellKey);

      if (!dependents) return;
      console.log("dependends:!", dependents);

      dependents.forEach((depKey) => {
        const [row, col] = depKey.split("-").map(Number);
        get().recalculateCell(row, col);
      });
    },

    setCellStyle: (row, col, style) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      set((state) => {
        const newCells = new Map(state.cells);
        const merged = { ...existing, style: { ...existing.style, ...style } };
        newCells.set(key, merged);
        return { cells: newCells };
      });
    },

    setCellDataType: (row, col, dataType) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      // Validate current value against new type
      let error: Cell["error"] = null;
      if (
        existing.rawValue !== null &&
        existing.rawValue !== undefined &&
        existing.rawValue !== ""
      ) {
        if (!validateType(existing.rawValue, dataType)) {
          error = {
            message: `Current value doesn't match type: ${dataType}`,
            type: "type-mismatch",
          } as NonNullable<Cell["error"]>;
        }
      }

      const updatedCell: Cell = {
        ...existing,
        dataType,
        dataTypeOverride: dataType,
        error,
      };

      updatedCell.displayValue = formatCellValue(updatedCell);

      set((state) => {
        const newCells = new Map(state.cells);
        newCells.set(key, updatedCell);
        return { cells: newCells };
      });
    },

    setCellFormatting: (row, col, formatting) => {
      const key = `${row}-${col}`;
      const existing = get().cells.get(key) || createDefaultCell();

      const updatedCell: Cell = {
        ...existing,
        formatting,
      };

      updatedCell.displayValue = formatCellValue(updatedCell);

      set((state) => {
        const newCells = new Map(state.cells);
        newCells.set(key, updatedCell);
        return { cells: newCells };
      });
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
        if (state.editingState && state.isEditingFormula()) {
          const range: SelectionRange = { start: cell, end: cell };
          return {
            isSelecting: true,
            editingState: {
              ...state.editingState,
              insertingRange: range,
              insertingRangeStart: range.start,
            },
          };
        }
        const range: SelectionRange = { start: cell, end: cell };
        return {
          isSelecting: true,
          currentCell: cell,
          selectionRanges: ctrlKey
            ? [...state.selectionRanges, range]
            : [range],
        };
      }),

    extendSelection: (cell) => {
      const state = get();
      if (
        state.editingState &&
        state.isEditingFormula() &&
        state.editingState.insertingRange
      ) {
        const currentCell = state.editingState.insertingRangeStart;
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
          const updatedRange: SelectionRange = { start: start, end: end };
          set({
            editingState: {
              ...state.editingState,
              insertingRange: updatedRange,
            },
          });
        }
        return;
      }
      const ranges = get().selectionRanges;
      if (!ranges.length) return;

      const currentCell = get().currentCell;
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
      const updatedLast: SelectionRange = { start: start, end: end };
      set({
        selectionRanges: [...ranges.slice(0, -1), updatedLast],
      });
    },

    endSelection: () => {
      const state = get();
      if (
        state.editingState &&
        state.isEditingFormula() &&
        state.editingState.insertingRange
      ) {
        const start = state.editingState.insertingRange.start;
        const end = state.editingState.insertingRange.end;
        const isSingle = start === end;
        let newRange =
          positionToCellRef(start.row, start.col) +( isSingle
            ? ""
            : ":" + positionToCellRef(end.row, end.col));
        console.log('new range: ', newRange)
        const res = insertCellReference(
          {
            text: state.editingState.value,
            cursorPos: state.editingState.cursorPos,
          },
          newRange
        );
        console.log('NEW TEXT!', res.text);
        window.dispatchEvent(new CustomEvent('insertFormulaReference', {
          detail: { text: res.text, cursorPos: res.cursorPos }
        }));
      }
      set({ isSelecting: false });
    },

    clearSelection: () => set({ selectionRanges: [] as SelectionRange[] }),

    isCellSelected: (row, col) => {
      return get().selectionRanges.some(({ start, end }) => {
        const top = Math.min(start.row, end.row);
        const bottom = Math.max(start.row, end.row);
        const left = Math.min(start.col, end.col);
        const right = Math.max(start.col, end.col);

        return row >= top && row <= bottom && col >= left && col <= right;
      });
    },
    clipboard: null,

    copySelection: () => {
      const { selectionRanges, cells } = get();
      if (selectionRanges.length === 0) return;

      // Get first selection range (for simplicity, ignore multi-selection)
      const range = selectionRanges[0];
      const startRow = Math.min(range.start.row, range.end.row);
      const endRow = Math.max(range.start.row, range.end.row);
      const startCol = Math.min(range.start.col, range.end.col);
      const endCol = Math.max(range.start.col, range.end.col);

      // Extract cell data
      const copiedCells: ClipboardData["cells"] = [];

      for (let r = startRow; r <= endRow; r++) {
        const rowArr: ClipboardData["cells"][number] = [];
        for (let c = startCol; c <= endCol; c++) {
          const key = `${r}-${c}`;
          const cell = cells.get(key);

          const entry: ClipboardData["cells"][number][number] = {
            rawValue: cell?.rawValue ?? null,
            formula: cell?.formula ?? null,
            style: (cell?.style ?? {}) as CSSProperties,
            formatting: (cell?.formatting ?? ("general" as Format)) as Format,
            dataType: (cell?.dataType ?? ("undefined" as DataType)) as DataType,
          };

          rowArr.push(entry);
        }
        copiedCells.push(rowArr);
      }

      set({
        clipboard: {
          cells: copiedCells,
          rowCount: endRow - startRow + 1,
          colCount: endCol - startCol + 1,
          isCut: false,
          sourceRange: { startRow, endRow, startCol, endCol },
        },
      });

      console.log(
        `Copied ${copiedCells.length}x${copiedCells[0]?.length || 0} cells`
      );
    },

    cutSelection: () => {
      const { selectionRanges } = get();
      if (selectionRanges.length === 0) return;

      // Use copySelection to populate clipboard
      get().copySelection();

      set((state) => ({
        clipboard: state.clipboard ? { ...state.clipboard, isCut: true } : null,
      }));

      console.log("Cut cells (will be cleared on paste)");
    },

    paste: () => {
      const { clipboard, currentCell } = get();
      if (!clipboard || !currentCell) return;

      const targetRow = currentCell.row;
      const targetCol = currentCell.col;

      // Paste cells
      for (let r = 0; r < clipboard.rowCount; r++) {
        for (let c = 0; c < clipboard.colCount; c++) {
          const sourceCell = clipboard.cells[r][c];
          const destRow = targetRow + r;
          const destCol = targetCol + c;

          // Check bounds
          if (destRow >= get().rowCount || destCol >= get().columnCount) {
            continue;
          }

          // Paste value or formula
          if (sourceCell.formula) {
            // TODO: adjust references on paste
            get().setCell(destRow, destCol, sourceCell.formula);
          } else {
            get().setCell(destRow, destCol, sourceCell.rawValue);
          }

          // Apply formatting and style
          const key = `${destRow}-${destCol}`;
          set((state) => {
            const existingCell = state.cells.get(key);
            if (existingCell) {
              const newCells = new Map(state.cells);
              newCells.set(key, {
                ...existingCell,
                style: { ...(sourceCell.style ?? {}) },
                formatting: sourceCell.formatting,
              });
              return { cells: newCells };
            }
            return state;
          });
        }
      }

      // If cut, clear source cells
      if (clipboard.isCut && clipboard.sourceRange) {
        const { startRow, endRow, startCol, endCol } = clipboard.sourceRange;
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            get().setCell(r, c, "");
          }
        }

        // Clear clipboard after cut+paste
        set({ clipboard: null });
      }

      console.log(`Pasted to ${targetRow},${targetCol}`);
    },
  };
});
