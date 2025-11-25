import { useSpreadsheetStore } from "../Stores/spreadsheetStore";

interface ResizeRulerProps {
  size: {
    x: number;
    y: number;
  };
}

export const ResizeRuler: React.FC<ResizeRulerProps> = ({ size }) => {
  const pos = useSpreadsheetStore((state) => state.resizeRulerPos);
  
  return (
    <>
      {pos.x != null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 border-l border-blue-500 border-dashed z-[9999] pointer-events-none"
          style={{ left: pos.x, height: size.y }}
        />
      )}
      {pos.y != null && (
        <div
          className="absolute left-0 right-0 h-0.5 border-t border-blue-500 border-dashed z-[9999] pointer-events-none"
          style={{ top: pos.y, width: size.x }}
        />
      )}
    </>
  );
};