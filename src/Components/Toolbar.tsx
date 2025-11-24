import React, { useState, useRef, useEffect } from 'react';
import { useSpreadsheetStore } from '../Stores/spreadsheetStore';
import { DataType, Format } from '../Services/types';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ChevronDown,
  Save,
  FolderOpen,
  Download,
  Undo,
  Redo,
  Type as TypeIcon,
  Palette,
  Hash,
  Calendar,
} from 'lucide-react';
import { getFormatOptionsForType } from '../Services/utils';

interface DropdownMenuProps {
  label: string;
  items: Array<{
    label: string;
    onClick: () => void;
    divider?: boolean;
  }>;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-sm hover:bg-gray-200 rounded flex items-center gap-1"
      >
        {label}
        <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg min-w-[160px] z-50">
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.divider && <div className="border-t border-gray-200 my-1" />}
              <button
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// Format display names
const formatDisplayNames: Record<string, string> = {
  'general': 'General',
  'integer': 'Integer (0)',
  'decimal2': 'Decimal (0.00)',
  'decimal3': 'Decimal (0.000)',
  'decimal4': 'Decimal (0.0000)',
  'decimal6': 'Decimal (0.000000)',
  'currency': 'Currency ($1,234.56)',
  'percentage': 'Percentage (12.34%)',
  'scientific': 'Scientific (1.23E+10)',
  'string': 'Text',
  'DDMMYYYY': 'Date (DD/MM/YYYY)',
  'MMDDYYYY': 'Date (MM/DD/YYYY)',
  'YYYYMMDD': 'Date (YYYY-MM-DD)',
  'DDMM': 'Date (DD/MM)',
  'MMDD': 'Date (MM/DD)',
  'time': 'Time (HH:MM:SS)',
  'datetime': 'Date & Time',
  'array': 'Array',
  'object': 'Object',
};

const Toolbar: React.FC = () => {
  const currentCell = useSpreadsheetStore((state) => state.currentCell);
  const selectionRanges = useSpreadsheetStore((state) => state.selectionRanges);
  const cells = useSpreadsheetStore((state) => state.cells);
  const setCell = useSpreadsheetStore((state) => state.setCell);
  const setCellStyle = useSpreadsheetStore((state) => state.setCellStyle);
  const setCellDataType = useSpreadsheetStore((state) => state.setCellDataType);
  const setCellFormatting = useSpreadsheetStore((state) => state.setCellFormatting);

  // Get all selected cell positions
  const getSelectedCells = () => {
    const selectedCells: Array<{row: number, col: number}> = [];
    selectionRanges.forEach(range => {
      const startRow = Math.min(range.start.row, range.end.row);
      const endRow = Math.max(range.start.row, range.end.row);
      const startCol = Math.min(range.start.col, range.end.col);
      const endCol = Math.max(range.start.col, range.end.col);
      
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          selectedCells.push({row: r, col: c});
        }
      }
    });
    return selectedCells;
  };

  const selectedCells = getSelectedCells();
  const hasSelection = selectedCells.length > 0;

  // Get current cell data for formula bar
  const cellKey = currentCell ? `${currentCell.row}-${currentCell.col}` : null;
  const cellData = cellKey ? cells.get(cellKey) : null;
  const cellValue = cellData?.formula || cellData?.rawValue?.toString() || '';

  // Get collective styles (return null if mixed)
  const getCollectiveStyle = (property: string): any => {
    if (selectedCells.length === 0) return undefined;
    
    const firstCell = cells.get(`${selectedCells[0].row}-${selectedCells[0].col}`);
    const firstValue = firstCell?.style?.[property as keyof typeof firstCell.style];
    
    const allSame = selectedCells.every(pos => {
      const cell = cells.get(`${pos.row}-${pos.col}`);
      const cellValue = cell?.style?.[property as keyof typeof cell.style];
      return cellValue === firstValue;
    });
    
    return allSame ? firstValue : null;
  };

  const getCollectiveDataType = (): DataType | null => {
    if (selectedCells.length === 0) return null;
    
    const firstCell = cells.get(`${selectedCells[0].row}-${selectedCells[0].col}`);
    const firstType = firstCell?.dataType || 'undefined';
    
    const allSame = selectedCells.every(pos => {
      const cell = cells.get(`${pos.row}-${pos.col}`);
      return (cell?.dataType || 'undefined') === firstType;
    });
    
    return allSame ? firstType : null;
  };

  const getCollectiveFormat = (): Format | null => {
    if (selectedCells.length === 0) return null;
    
    const firstCell = cells.get(`${selectedCells[0].row}-${selectedCells[0].col}`);
    const firstFormat = firstCell?.formatting || 'general';
    
    const allSame = selectedCells.every(pos => {
      const cell = cells.get(`${pos.row}-${pos.col}`);
      return (cell?.formatting || 'general') === firstFormat;
    });
    
    return allSame ? firstFormat : null;
  };

  const fontWeight = getCollectiveStyle('fontWeight');
  const fontStyle = getCollectiveStyle('fontStyle');
  const textDecoration = getCollectiveStyle('textDecoration');
  const textAlign = getCollectiveStyle('textAlign');
  const verticalAlign = getCollectiveStyle('verticalAlign');
  const fontSize = getCollectiveStyle('fontSize') || '14px';
  
  const cellDataType = getCollectiveDataType() || 'undefined';
  const cellFormatting = getCollectiveFormat() || 'general';

  const [formulaBarValue, setFormulaBarValue] = useState(cellValue);
  const [isEditingFormulaBar, setIsEditingFormulaBar] = useState(false);
  const previousCellRef = useRef(currentCell);

  // Commit changes when cell selection changes
  useEffect(() => {
    if (previousCellRef.current && isEditingFormulaBar) {
      // Commit the previous cell's changes
      setCell(previousCellRef.current.row, previousCellRef.current.col, formulaBarValue);
      setIsEditingFormulaBar(false);
    }
    
    // Update to new cell
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
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentCell) {
        setCell(currentCell.row, currentCell.col, formulaBarValue);
        setIsEditingFormulaBar(false);
      }
    }
    if (e.key === 'Escape') {
      setFormulaBarValue(cellValue);
      setIsEditingFormulaBar(false);
    }
  };

  // Apply style to all selected cells
  const applyStyleToSelection = (style: React.CSSProperties) => {
    selectedCells.forEach(pos => {
      setCellStyle(pos.row, pos.col, style);
    });
  };

  const toggleStyle = (property: string, value: string, offValue: string = 'normal') => {
    if (!hasSelection) return;
    const currentValue = getCollectiveStyle(property);
    const newValue = currentValue === value ? offValue : value;
    applyStyleToSelection({ [property]: newValue });
  };

  const setAlignment = (align: string) => {
    if (!hasSelection) return;
    applyStyleToSelection({ textAlign: align });
  };

  const setVerticalAlignment = (align: string) => {
    if (!hasSelection) return;
    applyStyleToSelection({ 
      alignItems: align === 'top' ? 'flex-start' : align === 'middle' ? 'center' : 'flex-end' 
    });
  };

  const setFontSizeToSelection = (size: string) => {
    if (!hasSelection) return;
    applyStyleToSelection({ fontSize: size });
  };

  const setTextColor = (color: string) => {
    if (!hasSelection) return;
    applyStyleToSelection({ color });
  };

  const setBackgroundColor = (color: string) => {
    if (!hasSelection) return;
    applyStyleToSelection({ backgroundColor: color });
  };

  const handleDataTypeChange = (dataType: DataType) => {
    selectedCells.forEach(pos => {
      setCellDataType(pos.row, pos.col, dataType);
    });
  };

  const handleFormatChange = (format: Format) => {
    selectedCells.forEach(pos => {
      setCellFormatting(pos.row, pos.col, format);
    });
  };

  const fileMenuItems = [
    { label: 'New', onClick: () => console.log('New') },
    { label: 'Open', onClick: () => console.log('Open') },
    { label: 'Save', onClick: () => console.log('Save') },
    { label: 'Save As...', onClick: () => console.log('Save As') },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Export as CSV', onClick: () => console.log('Export CSV') },
    { label: 'Export as Excel', onClick: () => console.log('Export Excel') },
    { label: 'Export as PDF', onClick: () => console.log('Export PDF') },
  ];

  const editMenuItems = [
    { label: 'Undo', onClick: () => console.log('Undo') },
    { label: 'Redo', onClick: () => console.log('Redo') },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Cut', onClick: () => console.log('Cut') },
    { label: 'Copy', onClick: () => console.log('Copy') },
    { label: 'Paste', onClick: () => console.log('Paste') },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Find & Replace', onClick: () => console.log('Find') },
  ];

  const insertMenuItems = [
    { label: 'Insert Row Above', onClick: () => console.log('Insert Row Above') },
    { label: 'Insert Row Below', onClick: () => console.log('Insert Row Below') },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Insert Column Left', onClick: () => console.log('Insert Column Left') },
    { label: 'Insert Column Right', onClick: () => console.log('Insert Column Right') },
  ];

  const formatMenuItems = [
    { label: 'Clear Formatting', onClick: () => {
      selectedCells.forEach(pos => {
        setCellStyle(pos.row, pos.col, {});
      });
    }},
  ];

  const isBold = fontWeight === 'bold';
  const isItalic = fontStyle === 'italic';
  const isUnderline = textDecoration === 'underline';

  const availableFormats = getFormatOptionsForType(cellDataType);

  const dataTypeIcon = () => {
    switch (cellDataType) {
      case 'number': return <Hash size={14} />;
      case 'date': return <Calendar size={14} />;
      default: return <TypeIcon size={14} />;
    }
  };

  return (
    <div className="border-b border-gray-300 bg-white">
      {/* Menu Bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200">
        <DropdownMenu label="File" items={fileMenuItems} />
        <DropdownMenu label="Edit" items={editMenuItems} />
        <DropdownMenu label="Insert" items={insertMenuItems} />
        <DropdownMenu label="Format" items={formatMenuItems} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200">
        {/* Quick Actions */}
        <button className="p-1.5 hover:bg-gray-200 rounded" title="Save">
          <Save size={18} />
        </button>
        <button className="p-1.5 hover:bg-gray-200 rounded" title="Open">
          <FolderOpen size={18} />
        </button>
        <button className="p-1.5 hover:bg-gray-200 rounded" title="Download">
          <Download size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <button className="p-1.5 hover:bg-gray-200 rounded" title="Undo">
          <Undo size={18} />
        </button>
        <button className="p-1.5 hover:bg-gray-200 rounded" title="Redo">
          <Redo size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

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
            {availableFormats.map(format => (
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
          className={`p-1.5 rounded ${isBold ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => toggleStyle('fontWeight', 'bold', 'normal')}
          disabled={!hasSelection}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${isItalic ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => toggleStyle('fontStyle', 'italic', 'normal')}
          disabled={!hasSelection}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${isUnderline ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => toggleStyle('textDecoration', 'underline', 'none')}
          disabled={!hasSelection}
          title="Underline"
        >
          <Underline size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Color */}
        <div className="relative">
          <label className="p-1.5 hover:bg-gray-200 rounded cursor-pointer flex items-center" title="Text Color">
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
          <label className="p-1.5 hover:bg-gray-200 rounded cursor-pointer flex items-center" title="Fill Color">
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
          className={`p-1.5 rounded ${textAlign === 'left' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setAlignment('left')}
          disabled={!hasSelection}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${textAlign === 'center' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setAlignment('center')}
          disabled={!hasSelection}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${textAlign === 'right' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setAlignment('right')}
          disabled={!hasSelection}
          title="Align Right"
        >
          <AlignRight size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Vertical Alignment */}
        <button
          className={`p-1.5 rounded ${verticalAlign === 'top' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setVerticalAlignment('top')}
          disabled={!hasSelection}
          title="Align Top"
        >
          <AlignVerticalJustifyStart size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${verticalAlign === 'middle' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setVerticalAlignment('middle')}
          disabled={!hasSelection}
          title="Align Middle"
        >
          <AlignVerticalJustifyCenter size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${verticalAlign === 'bottom' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setVerticalAlignment('bottom')}
          disabled={!hasSelection}
          title="Align Bottom"
        >
          <AlignVerticalJustifyEnd size={18} />
        </button>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="font-mono text-sm font-semibold min-w-[60px] flex items-center gap-1">
          {dataTypeIcon()}
          {currentCell ? `${String.fromCharCode(65 + currentCell.col)}${currentCell.row + 1}` : ''}
        </div>
        <div className="flex-1 flex items-center gap-1 border border-gray-300 rounded overflow-hidden focus-within:border-blue-400">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openFormulaEditor'))}
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
            type="text"
            value={formulaBarValue}
            onChange={(e) => handleFormulaBarChange(e.target.value)}
            onBlur={handleFormulaBarBlur}
            onKeyDown={handleFormulaBarKeyDown}
            placeholder="Enter value or formula"
            disabled={!currentCell}
            className="flex-1 px-3 py-1.5 text-sm focus:outline-none"
          />
          
           
        </div>
        {cellData?.error && (
          <div className="text-xs text-red-600 max-w-xs truncate" title={cellData.error.message}>
            Error: {cellData.error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;