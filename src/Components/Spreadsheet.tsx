import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import Cell from './Cell';
import { HeaderCellCol, HeaderCellRow } from './Headers';
import { useSpreadsheetStore } from '../Stores/spreadsheetStore';
import { kBuffer, kDefaultColWidth, kDefaultRowHeight } from '../constants';
import { ResizeRuler } from './ResizeRuler';
import { Overlay } from './Overlay';

interface ContainerDims {
  height: number;
  width: number;
}

interface Scroll {
  top: number;
  left: number;
}

const Spreadsheet: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState<Scroll>({ top: 0, left: 0 });
  const [containerDims, setContainerDims] = useState<ContainerDims>({ 
    height: 600, 
    width: 800 
  });
  
  const columnCount = useSpreadsheetStore(state => state.columnCount);
  const rowCount = useSpreadsheetStore(state => state.rowCount);
  const columnWidths = useSpreadsheetStore(state => state.columnWidths);
  const rowHeights = useSpreadsheetStore(state => state.rowHeights);

  // Dynamic container dimensions (update on resize)
  useEffect(() => {
    const current = containerRef.current;
    if (!current) return;

    const updateDims = () => {
      setContainerDims({
        height: current.clientHeight,
        width: current.clientWidth,
      });
    };
    
    updateDims(); 
    const resizeObserver = new ResizeObserver(updateDims);
    resizeObserver.observe(current);

    return () => resizeObserver.disconnect();
  }, []);

  // Throttled scroll
  useEffect(() => {
    const current = containerRef.current;
    if (!current) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            const { scrollTop, scrollLeft } = containerRef.current;
            setScroll({ top: scrollTop, left: scrollLeft });
          }
          ticking = false;
        });
        ticking = true;
      } 
    };

    current.addEventListener('scroll', handleScroll);
    return () => {
      current.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const cumulativeRowHeights = useMemo(() => {
    const cumulative = [0];
    for (let i = 0; i < rowCount; i++) {
      cumulative[i + 1] = cumulative[i] + (rowHeights.get(i) ?? kDefaultRowHeight);
    }
    return cumulative;
  }, [rowCount, rowHeights]);

  const cumulativeColWidths = useMemo(() => {
    const cumulative = [0];
    for (let i = 0; i < columnCount; i++) {
      cumulative[i + 1] = cumulative[i] + (columnWidths.get(i) ?? kDefaultColWidth);
    }
    return cumulative;
  }, [columnCount, columnWidths]);

  const totalHeight = cumulativeRowHeights[rowCount];
  const totalWidth = cumulativeColWidths[columnCount];

  const { height: containerHeight, width: containerWidth } = containerDims;

  const visibleRowStart = useMemo(() => {
    let start = 0;
    for (let i = 0; i < rowCount; i++) {
      const cum = cumulativeRowHeights[i + 1];
      if (cum > scroll.top) {
        start = i;
        break;
      }
    }
    return Math.max(0, start - kBuffer);
  }, [scroll.top, cumulativeRowHeights, rowCount]);

  const visibleRowEnd = useMemo(() => {
    let end = rowCount;
    const target = scroll.top + containerHeight;
    for (let i = visibleRowStart; i < rowCount; i++) {
      if (cumulativeRowHeights[i + 1] > target) {
        end = i + 1;
        break;
      }
    }
    return Math.min(rowCount, end + kBuffer);
  }, [visibleRowStart, scroll.top, containerHeight, cumulativeRowHeights, rowCount]);

  const visibleColStart = useMemo(() => {
    let start = 0;
    for (let i = 0; i < columnCount; i++) {
      const cum = cumulativeColWidths[i + 1];
      if (cum > scroll.left) {
        start = i;
        break;
      }
    }
    return Math.max(0, start - kBuffer);
  }, [scroll.left, cumulativeColWidths, columnCount]);

  const visibleColEnd = useMemo(() => {
    let end = columnCount;
    const target = scroll.left + containerWidth;
    for (let i = visibleColStart; i < columnCount; i++) {
      if (cumulativeColWidths[i + 1] > target) {
        end = i + 1;
        break;
      }
    }
    return Math.min(columnCount, end + kBuffer);
  }, [visibleColStart, scroll.left, containerWidth, cumulativeColWidths, columnCount]);

  // Render visible cells
  const visibleCells = useMemo(() => {
    const cells: React.ReactElement[] = [];

    for (let r = visibleRowStart; r < visibleRowEnd; r++) {
      const top = cumulativeRowHeights[r];
      const rowHeight = rowHeights.get(r) ?? kDefaultRowHeight;

      for (let c = visibleColStart; c < visibleColEnd; c++) {
        const left = cumulativeColWidths[c];
        const colWidth = columnWidths.get(c) ?? kDefaultColWidth;

        cells.push(
          <Cell
            key={`${r}-${c}`}
            row={r}
            col={c}
            top={top}
            left={left}
            height={rowHeight}
            width={colWidth}
          />
        );
      }
    }

    return cells;
  }, [
    visibleRowStart,
    visibleRowEnd,
    visibleColStart,
    visibleColEnd,
    rowHeights,
    columnWidths,
    cumulativeRowHeights,
    cumulativeColWidths,
  ]);

  const visibleCols = useMemo(
    () => Array.from({ length: visibleColEnd - visibleColStart }, (_, i) => i + visibleColStart),
    [visibleColStart, visibleColEnd]
  );
  
  const visibleRows = useMemo(
    () => Array.from({ length: visibleRowEnd - visibleRowStart }, (_, i) => i + visibleRowStart),
    [visibleRowStart, visibleRowEnd]
  );

  const fixedWidth = columnWidths.get(0) ?? 60;
  const fixedHeight = rowHeights.get(0) ?? 40;

  return (
    <div ref={containerRef} className="relative flex-1 overflow-scroll bg-white border border-gray-200">
      <ResizeRuler size={{ x: totalWidth, y: totalHeight }} />

      {/* Scroll spacer: Enables native scrolling as if full grid exists */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        width: totalWidth, 
        height: totalHeight, 
        pointerEvents: 'none',
      }} />
      
      {visibleCells}
      
      <Overlay 
        cumulativeColWidths={cumulativeColWidths} 
        cumulativeRowHeights={cumulativeRowHeights}
      />
      
      <div 
        className="sticky  bg-white border-r border-b"
        style={{ 
          top: 0,
          left: 0,
          width: fixedWidth, 
          height: fixedHeight,
          zIndex: 50
        }}
      >
        
      </div>
      
      <div 
        className="sticky bg-white"
        style={{ 
          top: 0,
          height: fixedHeight,
          zIndex: 40,
          marginTop: -fixedHeight,
        }}
      >
        {visibleCols.map((c) => (
          <HeaderCellCol
            key={c}
            col={c}
            left={cumulativeColWidths[c]}
            width={columnWidths.get(c) ?? kDefaultColWidth}
            height={rowHeights.get(0) ?? kDefaultRowHeight}
            onResize={(col, newWidth) => {
              useSpreadsheetStore.getState().setColumnWidth(col, newWidth);
            }}
            containerRef={containerRef}
          />
        ))}
      </div>

      <div 
        className="sticky bg-white"
        style={{ 
          left: 0,
          width: fixedWidth,
          zIndex: 30,
          marginTop: -fixedHeight,
        }}
      >
        {visibleRows.map((r) => (
          <HeaderCellRow
            key={r}
            row={r}
            top={cumulativeRowHeights[r]}
            height={rowHeights.get(r) ?? kDefaultRowHeight}
            width={columnWidths.get(0) ?? kDefaultColWidth}
            onResize={(row, newHeight) => {
              useSpreadsheetStore.getState().setRowHeight(row, newHeight);
            }}
            containerRef={containerRef}
          />
        ))}
      </div>
    </div>
  );
};

export default Spreadsheet;