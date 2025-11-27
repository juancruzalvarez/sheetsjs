import { useCallback, useMemo } from "react";
import { useSpreadsheetStore } from "../../Stores/spreadsheetStore";
import { DataType, Format } from "../../Services/types";
import { getFormatOptionsForType } from "../../Services/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Bold,
  Italic,
  Palette,
  TypeIcon,
  Underline,
} from "lucide-react";

const FormattingBar: React.FC = () => {
  const selectionRanges = useSpreadsheetStore((state) => state.selectionRanges);
  const setCellStyle = useSpreadsheetStore((state) => state.setCellStyle);
  const setCellDataType = useSpreadsheetStore((state) => state.setCellDataType);
  const setCellFormatting = useSpreadsheetStore(
    (state) => state.setCellFormatting
  );
  const cells = useSpreadsheetStore((state) => state.cells);

  const getSelectedCells = () => {
    const selectedCells: Array<{ row: number; col: number }> = [];
    selectionRanges.forEach((range) => {
      const startRow = Math.min(range.start.row, range.end.row);
      const endRow = Math.max(range.start.row, range.end.row);
      const startCol = Math.min(range.start.col, range.end.col);
      const endCol = Math.max(range.start.col, range.end.col);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          selectedCells.push({ row: r, col: c });
        }
      }
    });
    return selectedCells;
  };

  const selectedCells = getSelectedCells();
  const hasSelection = selectedCells.length > 0;

  const getCollectiveStyle = (property: string): any => {
    if (selectedCells.length === 0) return undefined;

    const firstCell = cells.get(
      `${selectedCells[0].row}-${selectedCells[0].col}`
    );
    const firstValue =
      firstCell?.style?.[property as keyof typeof firstCell.style];

    const allSame = selectedCells.every((pos) => {
      const cell = cells.get(`${pos.row}-${pos.col}`);
      const cellValue = cell?.style?.[property as keyof typeof cell.style];
      return cellValue === firstValue;
    });

    return allSame ? firstValue : null;
  };

  const getCollectiveDataType = (): DataType | null => {
    if (selectedCells.length === 0) return null;

    const firstCell = cells.get(
      `${selectedCells[0].row}-${selectedCells[0].col}`
    );
    const firstType = firstCell?.dataType || "undefined";

    const allSame = selectedCells.every((pos) => {
      const cell = cells.get(`${pos.row}-${pos.col}`);
      return (cell?.dataType || "undefined") === firstType;
    });

    return allSame ? firstType : null;
  };

  const getCollectiveFormat = (): Format | null => {
    if (selectedCells.length === 0) return null;

    const firstCell = cells.get(
      `${selectedCells[0].row}-${selectedCells[0].col}`
    );
    const firstFormat = firstCell?.formatting || "general";

    const allSame = selectedCells.every((pos) => {
      const cell = cells.get(`${pos.row}-${pos.col}`);
      return (cell?.formatting || "general") === firstFormat;
    });

    return allSame ? firstFormat : null;
  };

  const fontWeight = getCollectiveStyle("fontWeight");
  const fontStyle = getCollectiveStyle("fontStyle");
  const textDecoration = getCollectiveStyle("textDecoration");
  const textAlign = getCollectiveStyle("textAlign");
  const verticalAlign = getCollectiveStyle("verticalAlign");
  const fontSize = getCollectiveStyle("fontSize") || "14px";

  const cellDataType = getCollectiveDataType() || "undefined";
  const cellFormatting = getCollectiveFormat() || "general";

  const applyStyleToSelection = useCallback(
    (style: React.CSSProperties) => {
      selectedCells.forEach((pos) => {
        setCellStyle(pos.row, pos.col, style);
      });
    },
    [selectedCells, setCellStyle]
  );

  const toggleStyle = useCallback(
    (property: string, value: string, offValue: string = "normal") => {
      if (!hasSelection) return;
      const currentValue =
        property === "fontWeight"
          ? fontWeight
          : property === "fontStyle"
          ? fontStyle
          : textDecoration;
      const newValue = currentValue === value ? offValue : value;
      applyStyleToSelection({ [property]: newValue });
    },
    [hasSelection, fontWeight, fontStyle, textDecoration, applyStyleToSelection]
  );

  const setAlignment = useCallback(
    (align: string) => {
      if (!hasSelection) return;
      applyStyleToSelection({ justifyContent: align });
    },
    [hasSelection, applyStyleToSelection]
  );

  const setVerticalAlignment = useCallback(
    (align: string) => {
      if (!hasSelection) return;
      applyStyleToSelection({
        alignItems:
          align === "top"
            ? "flex-start"
            : align === "middle"
            ? "center"
            : "flex-end",
      });
    },
    [hasSelection, applyStyleToSelection]
  );

  const setFontSizeToSelection = useCallback(
    (size: string) => {
      if (!hasSelection) return;
      applyStyleToSelection({ fontSize: size });
    },
    [hasSelection, applyStyleToSelection]
  );

  const setTextColor = useCallback(
    (color: string) => {
      if (!hasSelection) return;
      applyStyleToSelection({ color });
    },
    [hasSelection, applyStyleToSelection]
  );

  const setBackgroundColor = useCallback(
    (color: string) => {
      if (!hasSelection) return;
      applyStyleToSelection({ backgroundColor: color });
    },
    [hasSelection, applyStyleToSelection]
  );

  const handleDataTypeChange = useCallback(
    (dataType: DataType) => {
      selectedCells.forEach((pos) => {
        setCellDataType(pos.row, pos.col, dataType);
      });
    },
    [selectedCells, setCellDataType]
  );

  const handleFormatChange = useCallback(
    (format: Format) => {
      selectedCells.forEach((pos) => {
        setCellFormatting(pos.row, pos.col, format);
      });
    },
    [selectedCells, setCellFormatting]
  );

  const isBold = fontWeight === "bold";
  const isItalic = fontStyle === "italic";
  const isUnderline = textDecoration === "underline";

  const availableFormats = useMemo(
    () => getFormatOptionsForType(cellDataType),
    [cellDataType]
  );

  const formatDisplayNames: Record<string, string> = {
    general: "General",
    integer: "Integer (0)",
    decimal2: "Decimal (0.00)",
    decimal3: "Decimal (0.000)",
    decimal4: "Decimal (0.0000)",
    decimal6: "Decimal (0.000000)",
    currency: "Currency ($1,234.56)",
    percentage: "Percentage (12.34%)",
    scientific: "Scientific (1.23E+10)",
    string: "Text",
    DDMMYYYY: "Date (DD/MM/YYYY)",
    MMDDYYYY: "Date (MM/DD/YYYY)",
    YYYYMMDD: "Date (YYYY-MM-DD)",
    DDMM: "Date (DD/MM)",
    MMDD: "Date (MM/DD)",
    time: "Time (HH:MM:SS)",
    datetime: "Date & Time",
    array: "Array",
    object: "Object",
  };

  return (
    <>
      {/* Data Type Selector */}
      <div className="flex items-center gap-1">
        <div className="text-xs text-gray-500">Type:</div>
        <select
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          value={cellDataType}
          onChange={(e) => handleDataTypeChange(e.target.value as DataType)}
          disabled={!hasSelection}
        >
          <option value="undefined">Auto</option>
          <option value="number">Number</option>
          <option value="string">String</option>
          <option value="boolean">Boolean</option>
          <option value="date">Date</option>
          <option value="array">Array</option>
          <option value="object">Object</option>
        </select>
      </div>

      {/* Format Selector */}
      <div className="flex items-center gap-1">
        <div className="text-xs text-gray-500">Format:</div>
        <select
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          value={cellFormatting}
          onChange={(e) => handleFormatChange(e.target.value as Format)}
          disabled={!hasSelection}
        >
          {availableFormats.map((format) => (
            <option key={format} value={format}>
              {formatDisplayNames[format] || format}
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Font Size */}
      <select
        className="px-2 py-1 border border-gray-300 rounded text-sm"
        value={fontSize}
        onChange={(e) => setFontSizeToSelection(e.target.value)}
        disabled={!hasSelection}
      >
        <option value="10px">10</option>
        <option value="12px">12</option>
        <option value="14px">14</option>
        <option value="16px">16</option>
        <option value="18px">18</option>
        <option value="20px">20</option>
        <option value="24px">24</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Styling */}
      <button
        className={`p-1.5 rounded ${
          isBold ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => toggleStyle("fontWeight", "bold", "normal")}
        disabled={!hasSelection}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        className={`p-1.5 rounded ${
          isItalic ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => toggleStyle("fontStyle", "italic", "normal")}
        disabled={!hasSelection}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        className={`p-1.5 rounded ${
          isUnderline ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => toggleStyle("textDecoration", "underline", "none")}
        disabled={!hasSelection}
        title="Underline"
      >
        <Underline size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Color */}
      <div className="relative">
        <label
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer flex items-center"
          title="Text Color"
        >
          <TypeIcon size={18} />
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0"
            onChange={(e) => setTextColor(e.target.value)}
            disabled={!hasSelection}
          />
        </label>
      </div>

      {/* Background Color */}
      <div className="relative">
        <label
          className="p-1.5 hover:bg-gray-200 rounded cursor-pointer flex items-center"
          title="Fill Color"
        >
          <Palette size={18} />
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0"
            onChange={(e) => setBackgroundColor(e.target.value)}
            disabled={!hasSelection}
          />
        </label>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Horizontal Alignment */}
      <button
        className={`p-1.5 rounded ${
          textAlign === "left" ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => setAlignment("left")}
        disabled={!hasSelection}
        title="Align Left"
      >
        <AlignLeft size={18} />
      </button>
      <button
        className={`p-1.5 rounded ${
          textAlign === "center" ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => setAlignment("center")}
        disabled={!hasSelection}
        title="Align Center"
      >
        <AlignCenter size={18} />
      </button>
      <button
        className={`p-1.5 rounded ${
          textAlign === "right" ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => setAlignment("right")}
        disabled={!hasSelection}
        title="Align Right"
      >
        <AlignRight size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Vertical Alignment */}
      <button
        className={`p-1.5 rounded ${
          verticalAlign === "top" ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => setVerticalAlignment("top")}
        disabled={!hasSelection}
        title="Align Top"
      >
        <AlignVerticalJustifyStart size={18} />
      </button>
      <button
        className={`p-1.5 rounded ${
          verticalAlign === "middle" ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => setVerticalAlignment("middle")}
        disabled={!hasSelection}
        title="Align Middle"
      >
        <AlignVerticalJustifyCenter size={18} />
      </button>
      <button
        className={`p-1.5 rounded ${
          verticalAlign === "bottom" ? "bg-gray-300" : "hover:bg-gray-200"
        }`}
        onClick={() => setVerticalAlignment("bottom")}
        disabled={!hasSelection}
        title="Align Bottom"
      >
        <AlignVerticalJustifyEnd size={18} />
      </button>
    </>
  );
};
export default FormattingBar;
