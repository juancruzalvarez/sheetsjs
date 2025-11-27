import { Calendar, Hash, TypeIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpreadsheetStore } from "../../Stores/spreadsheetStore";

const FormulaBar: React.FC = () => {
  const currentCell = useSpreadsheetStore((state) => state.currentCell);
  const setCell = useSpreadsheetStore((state) => state.setCell);
  const setEditingState = useSpreadsheetStore((state) => state.setEditingState);
  const stopEdit = useSpreadsheetStore((state) => state.stopEditing);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Only get the specific cell we need
  const cellData = useSpreadsheetStore(
    useCallback(
      (state) =>
        currentCell
          ? state.cells.get(`${currentCell.row}-${currentCell.col}`)
          : null,
      [currentCell]
    )
  );

  const cellValue = cellData?.formula || cellData?.rawValue?.toString() || "";

  const [formulaBarValue, setFormulaBarValue] = useState(cellValue);
  const [isEditingFormulaBar, setIsEditingFormulaBar] = useState(false);
  const previousCellRef = useRef(currentCell);

  useEffect(() => {
    if (previousCellRef.current && isEditingFormulaBar) {
      setCell(
        previousCellRef.current.row,
        previousCellRef.current.col,
        formulaBarValue
      );
      setIsEditingFormulaBar(false);
    }

    previousCellRef.current = currentCell;
    if (!isEditingFormulaBar) {
      setFormulaBarValue(cellValue);
    }
  }, [currentCell, cellValue]);

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    setIsEditingFormulaBar(true);
  };

  const handleFormulaBarBlur = () => {
    if (currentCell && isEditingFormulaBar) {
      setCell(currentCell.row, currentCell.col, formulaBarValue);
      setIsEditingFormulaBar(false);
    }
  };

  const handleFormulaBarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentCell) {
        setCell(currentCell.row, currentCell.col, formulaBarValue);
        setIsEditingFormulaBar(false);
      }
    }
    if (e.key === "Escape") {
      setFormulaBarValue(cellValue);
      setIsEditingFormulaBar(false);
    }
  };

  const updateEditingState = (value: string) => {
    if (!currentCell || !inputRef.current) return;
    const pos = inputRef.current.selectionStart ?? value.length;
    setEditingState(currentCell.row, currentCell.col, value, pos);
  };

  const dataTypeIcon = () => {
    switch (cellData?.dataType) {
      case "number":
        return <Hash size={14} />;
      case "date":
        return <Calendar size={14} />;
      default:
        return <TypeIcon size={14} />;
    }
  };

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <div className="font-mono text-sm font-semibold min-w-[60px] flex items-center gap-1">
        {dataTypeIcon()}
        {currentCell
          ? `${String.fromCharCode(65 + currentCell.col)}${currentCell.row + 1}`
          : ""}
      </div>
      <div className="flex-1 flex items-center gap-1 border border-gray-300 rounded overflow-hidden focus-within:border-blue-400">
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("openFormulaEditor"))
          }
          disabled={!currentCell}
          className="px-2 py-1.5 bg-blue-400 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-300"
          title="Open Code Editor (F2)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={formulaBarValue}
          onChange={(e) => {
            handleFormulaBarChange(e.target.value);
            updateEditingState(e.target.value);
          }}
           onSelect={() => {
                if (!currentCell) return;
                const input = inputRef.current;
                if (!input) return;

                const cursorPos = input.selectionStart ?? 0;
                setEditingState(currentCell.row, currentCell.col, formulaBarValue, cursorPos);
            }}
          onFocus={() => {
            if (currentCell) {
              const pos =
                inputRef.current?.selectionStart ?? formulaBarValue.length;
              setEditingState(
                currentCell.row,
                currentCell.col,
                formulaBarValue,
                pos
              );
            }
          }}
          onBlur={() => {
            handleFormulaBarBlur();
            stopEdit();
          }}
          onKeyDown={handleFormulaBarKeyDown}
          placeholder="Enter value or formula"
          disabled={!currentCell}
          className="flex-1 px-3 py-1.5 text-sm focus:outline-none"
        />
      </div>
      {cellData?.error && (
        <div
          className="text-xs text-red-600 max-w-xs truncate"
          title={cellData.error.message}
        >
          Error: {cellData.error.message}
        </div>
      )}
    </div>
  );
};

export default FormulaBar;
