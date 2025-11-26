import React, { memo, useState, useCallback, useEffect } from 'react';
import { useSpreadsheetStore } from '../Stores/spreadsheetStore';

interface CellProps {
  row: number;
  col: number;
  top: number;
  left: number;
  height: number;
  width: number;
}

const Cell = memo<CellProps>(({ row, col, top, left, height, width }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const cells = useSpreadsheetStore((state) => state.cells);
  const setCell = useSpreadsheetStore((state) => state.setCell);
  const extendSelection = useSpreadsheetStore((state) => state.extendSelection);
  const startSelection = useSpreadsheetStore((state) => state.startSelection);
  const endSelection = useSpreadsheetStore((state) => state.endSelection);
  const isSelecting = useSpreadsheetStore((state) => state.isSelecting);

  const key = `${row}-${col}`;
  const cellData = cells.get(key);

  // ALWAYS show displayValue (the formatted/calculated result)
  const displayValue = cellData?.displayValue || '';
  const hasError = cellData?.error !== null && cellData?.error !== undefined;

  const handleChange = useCallback((newValue: string) => {
    setEditValue(newValue);
  }, []);

  const handleCommit = useCallback(() => {
    // Send to store - it will handle formula vs value
    setCell(row, col, editValue);
    setEditing(false);
  }, [row, col, editValue, setCell]);

  const startEdit = useCallback(() => {
    setEditing(true);
    // EDIT THE SOURCE: formula if exists, otherwise rawValue
    const sourceValue = cellData?.formula || cellData?.rawValue?.toString() || '';
    setEditValue(sourceValue);
  }, [cellData]);

  const stopEdit = useCallback(() => {
    handleCommit();
  }, [handleCommit]);

  useEffect(() => {
    const handleStartEdit = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.row === row && customEvent.detail.col === col) {
        startEdit();
      }
    };

    window.addEventListener('startCellEdit', handleStartEdit);
    return () => window.removeEventListener('startCellEdit', handleStartEdit);
  }, [row, col, startEdit]);

  const onMouseDown = (e: React.MouseEvent) => {
    console.log(cellData)
    if (editing) return;
    
    const cell = { row: row, col: col };
    if (e.shiftKey) {
      extendSelection(cell);
    } else {
      startSelection(cell, e.ctrlKey);
    }
  };

  const onMouseEnter = () => {
    if (isSelecting) {
      const cell = { row: row, col: col };
      extendSelection(cell);
    }
  };

  const onMouseUp = () => {
    if (isSelecting) {
      endSelection();
    }
  };

  const errorStyle = hasError ? {
    backgroundColor: '#fee',
    color: '#c00',
  } : {};

  return (
    <div
      className={`absolute flex items-center px-2 text-sm border border-gray-200 select-none ${
        hasError ? 'border-red-400' : ''
      }`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onDoubleClick={startEdit}
      style={{
        position: 'absolute',
        top,
        left,
        height: `${height}px`,
        width: `${width}px`,
        ...cellData?.style,
        ...errorStyle,
      }}
      title={hasError ? cellData?.error?.message : undefined}
    >
      {editing ? (
        <input
          className="w-full h-full bg-transparent outline-none text-inherit"
          value={editValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={stopEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              stopEdit();
            }
            if (e.key === 'Escape') {
              setEditValue(cellData?.formula || cellData?.rawValue?.toString() || '');
              setEditing(false);
            }
            // Don't open editor on = anymore, that's confusing
          }}
          autoFocus
        />
      ) : (
        <span className="truncate">{displayValue}</span>
      )}
    </div>
  );
});

Cell.displayName = 'Cell';
export default Cell;