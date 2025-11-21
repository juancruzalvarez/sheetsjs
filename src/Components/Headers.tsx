import { memo, useCallback, useRef, useEffect, RefObject } from "react";
import { kDefaultColWidth, kDefaultRowHeight } from "../constants";
import { useSpreadsheetStore } from "../Stores/spreadsheetStore";

const ColNumberToLetters = (col: number): string => {
  let result = '';
  while (col > 0) {
    col--;
    let remainder = col % 26;
    result = String.fromCharCode(65 + remainder) + result;
    col = Math.floor(col / 26);
  }
  return result;
}

const MIN_COL_WIDTH = 40;

interface HeaderCellColProps {
  col: number;
  left: number;
  width: number;
  height: number;
  onResize: (col: number, newWidth: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export const HeaderCellCol = ({ 
  col, 
  left, 
  width, 
  height, 
  onResize,
  containerRef
}: HeaderCellColProps) => {
  const setResizeRulerPos = useSpreadsheetStore((state) => state.setResizeRulerPos);
  const cellRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);
  const resizing = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const rawX = e.clientX - rect.left + scrollLeft;
      const minX = left + MIN_COL_WIDTH;
      const clampedX = Math.max(rawX, minX);

      useSpreadsheetStore.getState().setResizeRulerPos({ x: clampedX, y: null });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!resizing.current) return;
      const deltaX = e.clientX - startX.current;
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth.current + deltaX);
      onResize(col, newWidth);
      resizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      useSpreadsheetStore.getState().setResizeRulerPos({ x: null, y: null });
    };

    const handleMouseDown = (e: MouseEvent) => {
      resizing.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizer = cellRef.current?.querySelector('.resizer') as HTMLElement | null;
    resizer?.addEventListener('mousedown', handleMouseDown as EventListener);

    return () => {
      resizer?.removeEventListener('mousedown', handleMouseDown as EventListener);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [col, width, onResize, containerRef, left]);

  return (
    <div
      ref={cellRef}
      className="absolute bg-white font-medium text-center border-b border-r select-none"
      style={{
        top: 0,
        left,
        width,
        height,
        zIndex: 40,
      }}
    >
      {ColNumberToLetters(col)}
      <div className="resizer absolute top-0 right-0 w-2 h-full cursor-col-resize" />
    </div>
  );
};

const MIN_ROW_HEIGHT = 24;

interface HeaderCellRowProps {
  row: number;
  top: number;
  height: number;
  width: number;
  onResize: (row: number, newHeight: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export const HeaderCellRow = ({ 
  row, 
  top,
  height, 
  width, 
  onResize,
  containerRef 
}: HeaderCellRowProps) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);
  const resizing = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = containerRef.current.scrollTop;

      const rawY = e.clientY - rect.top + scrollTop;
      const minY = top + MIN_ROW_HEIGHT;

      const clampedY = Math.max(rawY, minY);

      useSpreadsheetStore.getState().setResizeRulerPos({ x: null, y: clampedY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!resizing.current) return;
      const deltaY = e.clientY - startY.current;
      const newHeight = Math.max(MIN_ROW_HEIGHT, startHeight.current + deltaY);
      onResize(row, newHeight);
      resizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      useSpreadsheetStore.getState().setResizeRulerPos({ x: null, y: null });
    };

    const handleMouseDown = (e: MouseEvent) => {
      resizing.current = true;
      startY.current = e.clientY;
      startHeight.current = height;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizer = cellRef.current?.querySelector('.resizer') as HTMLElement | null;
    resizer?.addEventListener('mousedown', handleMouseDown as EventListener);

    return () => {
      resizer?.removeEventListener('mousedown', handleMouseDown as EventListener);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [row, height, onResize, containerRef, top]);

  return (
    <div
      ref={cellRef}
      className="absolute font-medium bg-white  text-center border-b border-r select-none"
      style={{
        top,
        left: 0,
        width,
        height,
        zIndex: 40,
      }}
    >
      {row}
      <div className="resizer absolute bottom-0 left-0 w-full h-2 cursor-row-resize" />
    </div>
  );
};