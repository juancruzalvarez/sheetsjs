import { useSpreadsheetStore } from "../Stores/spreadsheetStore";
import { kDefaultColWidth, kDefaultRowHeight } from "../constants";

interface OverlayProps {
  cumulativeRowHeights: number[];
  cumulativeColWidths: number[];
}

export const Overlay: React.FC<OverlayProps> = ({ 
  cumulativeRowHeights, 
  cumulativeColWidths 
}) => {
  const selectedCell = useSpreadsheetStore((state) => state.selectedCell);
  const columnWidths = useSpreadsheetStore((state) => state.columnWidths);
  const rowHeights = useSpreadsheetStore((state) => state.rowHeights);
  
  console.log('SELECTED:', selectedCell);
  
  return selectedCell ? (
    <div 
      className="absolute border-2 border-blue-400 pointer-events-none"
      style={{
        pointerEvents: 'none',
        left: cumulativeColWidths[selectedCell.col],
        top: cumulativeRowHeights[selectedCell.row],
        height: rowHeights.get(selectedCell.row) ?? kDefaultRowHeight,
        width: columnWidths.get(selectedCell.col) ?? kDefaultColWidth,
      }}
    >
      <div className="w-full h-full bg-blue-400 opacity-25 pointer-events-none" />
    </div>
  ) : null;
};