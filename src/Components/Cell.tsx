import React, { memo, useState, useCallback, CSSProperties } from 'react';
import { useSpreadsheetStore } from '../Stores/spreadsheetStore';

interface CellProps {
  row: number;
  col: number;
  top: number;
  left: number;
  height: number;
  width: number;
}

interface CellData {
  value: string;
  style: CSSProperties;
}

const Cell = memo<CellProps>(({ row, col, top, left, height, width }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const fallback: CellData = { value: '', style: {} };
  const cellData = useSpreadsheetStore(
    useCallback((s) => s.cells.get(`${row}-${col}`) ?? fallback, [row, col])
  );

  const value = cellData.value;
  const setCell = useSpreadsheetStore((s) => s.setCell);
  const setSelected = useSpreadsheetStore((s) => s.setSelectedCell);

  const handleChange = useCallback((newValue: string) => {
    setEditValue(newValue);
    setCell(row, col, newValue);
  }, [row, col, setCell]);

  const startEdit = useCallback(() => {
    setEditing(true);
    setEditValue(value);
  }, [value]);

  const stopEdit = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <div
      className="absolute flex items-center px-2 text-sm border border-gray-200 select-none"
      onClick={() => { setSelected(row, col); }}
      onDoubleClick={startEdit}
      style={{
        position: 'absolute',
        top,
        left,
        height: `${height}px`,
        width: `${width}px`,
        //...cellData.style, 
      }}
    >
      {editing ? (
        <input
          className="w-full h-full bg-transparent outline-none text-inherit"
          value={editValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={stopEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') stopEdit(); }}
          autoFocus
        />
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
});

Cell.displayName = 'Cell';
export default Cell;