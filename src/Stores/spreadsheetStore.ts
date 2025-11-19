import { create } from "zustand";
import {
  kStartColCount,
  kStartRowCount,
  kDefaultColWidth,
  kDefaultRowHeight,
} from "../constants";



export interface Cell {
  value: any;
}

export interface CellPos {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPos;
  end: CellPos;
}

export interface SpreadsheetStore {
  rowCount: number;
  columnCount: number;

  cells: Map<string, Cell>;
  columnWidths: Map<number, number>;
  rowHeights: Map<number, number>;

  resizeRulerPos: { x: number | null; y: number | null };

  selectedCell: CellPos | null;

  // Selection
  selectionRanges: SelectionRange[];
  isSelecting?: boolean;
  currentCell?: CellPos;

  // Actions
  setCell: (row: number, col: number, value: any) => void;
  setSelectedCell: (row: number, col: number) => void;

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
  const firstColWidth = Math.max(
    30,
    String(rowCount).length * 12 + 16,
  );
  columnWidths.set(0, firstColWidth);
  rowHeights.set(0, 30);

  return {
    rowCount,
    columnCount,

    cells: new Map(),
    columnWidths,
    rowHeights,

    resizeRulerPos: { x: null, y: null },
    selectedCell: null,

    selectionRanges: [],

    setCell: (row, col, value) => {
      const key = `${row}-${col}`;
      const cells = new Map(get().cells);
      const existing = cells.get(key);
      if (existing?.value === value) return;

      cells.set(key, { value });
      set({ cells });
    },

    setSelectedCell: (row, col) => {
      set({ selectedCell: { row, col } });
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
      const ranges = get().selectionRanges;
      if (!ranges.length) return;

      const last = ranges[ranges.length - 1];
      const updatedLast = { ...last, end: cell };

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

        return (
          row >= top &&
          row <= bottom &&
          col >= left &&
          col <= right
        );
      });
    },
  };
});