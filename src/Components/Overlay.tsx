import { useSpreadsheetStore } from "../Stores/spreadsheetStore";
import { kDefaultColWidth, kDefaultRowHeight, kFormulaDependencyColors } from "../constants";

interface OverlayProps {
  cumulativeRowHeights: number[];
  cumulativeColWidths: number[];
}

export const Overlay: React.FC<OverlayProps> = ({
  cumulativeRowHeights,
  cumulativeColWidths,
}) => {
  const selectedCell = useSpreadsheetStore((state) => state.currentCell);
  const columnWidths = useSpreadsheetStore((state) => state.columnWidths);
  const rowHeights = useSpreadsheetStore((state) => state.rowHeights);
  const selectionRanges = useSpreadsheetStore((state) => state.selectionRanges);
  const formulaReferences = useSpreadsheetStore((state) => state.formulaReferences);
  const clipboard = useSpreadsheetStore((state) => state.clipboard);

  return (
    <>
      {selectedCell && (
        <div
          className="absolute border-3 border-blue-400 pointer-events-none z-10"
          style={{
            pointerEvents: "none",
            left: cumulativeColWidths[selectedCell.col],
            top: cumulativeRowHeights[selectedCell.row],
            height: rowHeights.get(selectedCell.row) ?? kDefaultRowHeight,
            width: columnWidths.get(selectedCell.col) ?? kDefaultColWidth,
          }}
        >
          <div className="w-full h-full bg-blue-400 opacity-25 pointer-events-none" />
        </div>
      )}
      
      {selectionRanges.map((range, idx) => (
        <div
          key={`selection-${idx}`}
          className="absolute border-2 border-blue-400 pointer-events-none"
          style={{
            pointerEvents: "none",
            left: cumulativeColWidths[range.start.col],
            top: cumulativeRowHeights[range.start.row],
            height:
              cumulativeRowHeights[range.end.row + 1] -
              cumulativeRowHeights[range.start.row],
            width:
              cumulativeColWidths[range.end.col + 1] -
              cumulativeColWidths[range.start.col],
          }}
        >
          <div className="w-full h-full bg-blue-400 opacity-25 pointer-events-none" />
        </div>
      ))}
      
      {formulaReferences.map((range, idx) => (
        <div
          key={`formula-ref-${idx}`}
          className="absolute pointer-events-none"
          style={{
            pointerEvents: "none",
            left: cumulativeColWidths[range.start.col],
            top: cumulativeRowHeights[range.start.row],
            height:
              cumulativeRowHeights[range.end.row + 1] -
              cumulativeRowHeights[range.start.row],
            width:
              cumulativeColWidths[range.end.col + 1] -
              cumulativeColWidths[range.start.col],
            border: `3px dashed ${kFormulaDependencyColors[idx]}`,
            zIndex: 5,
          }}
        />
      ))}

      {clipboard && clipboard.sourceRange &&
        <div
          key={`clipboard-ref`}
          className="absolute pointer-events-none"
          style={{
            pointerEvents: "none",
            left: cumulativeColWidths[clipboard.sourceRange?.startCol],
            top: cumulativeRowHeights[clipboard.sourceRange?.startRow],
            height:
              cumulativeRowHeights[clipboard.sourceRange?.endRow + 1] -
              cumulativeRowHeights[clipboard.sourceRange?.startRow],
            width:
              cumulativeColWidths[clipboard.sourceRange?.endCol + 1] -
              cumulativeColWidths[clipboard.sourceRange?.startCol],
            border: clipboard.isCut ? '2px dashed red' : '2px dashed blue',
            zIndex: 30,
          }}
        />
      }
    </>
  );
};