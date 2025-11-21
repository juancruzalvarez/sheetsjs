import React, { useState, useRef, useEffect } from 'react';
import { useSpreadsheetStore } from '../Stores/spreadsheetStore';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Save,
  FolderOpen,
  Download,
  Undo,
  Redo,
  Type,
  Palette,
} from 'lucide-react';

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

const Toolbar: React.FC = () => {
  const selectedCell = useSpreadsheetStore((state) => state.selectedCell);
  const cells = useSpreadsheetStore((state) => state.cells);
  const setCell = useSpreadsheetStore((state) => state.setCell);
  const setCellStyle = useSpreadsheetStore((state) => state.setCellStyle);

  const cellKey = selectedCell ? `${selectedCell.row}-${selectedCell.col}` : null;
  const cellData = cellKey ? cells.get(cellKey) : null;
  const cellValue = cellData?.value || '';
  const cellStyle = cellData?.style || {};

  const [formulaBarValue, setFormulaBarValue] = useState(cellValue);

  useEffect(() => {
    setFormulaBarValue(cellValue);
  }, [cellValue, selectedCell]);

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      setCell(selectedCell.row, selectedCell.col, value);
    }
  };

  const toggleStyle = (property: string, value: string) => {
    if (!selectedCell) return;
    const currentValue = cellStyle[property as keyof typeof cellStyle];
    const newValue = currentValue === value ? 'normal' : value;
    setCellStyle(selectedCell.row, selectedCell.col, { [property]: newValue });
  };

  const setAlignment = (align: string) => {
    if (!selectedCell) return;
    setCellStyle(selectedCell.row, selectedCell.col, { textAlign: align });
  };

  const setFontSize = (size: string) => {
    if (!selectedCell) return;
    setCellStyle(selectedCell.row, selectedCell.col, { fontSize: size });
  };

  const setTextColor = (color: string) => {
    if (!selectedCell) return;
    setCellStyle(selectedCell.row, selectedCell.col, { color });
  };

  const setBackgroundColor = (color: string) => {
    if (!selectedCell) return;
    setCellStyle(selectedCell.row, selectedCell.col, { backgroundColor: color });
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
    { label: 'Number', onClick: () => console.log('Number') },
    { label: 'Currency', onClick: () => console.log('Currency') },
    { label: 'Percentage', onClick: () => console.log('Percentage') },
    { label: 'Date', onClick: () => console.log('Date') },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Clear Formatting', onClick: () => console.log('Clear') },
  ];

  const isBold = cellStyle.fontWeight === 'bold';
  const isItalic = cellStyle.fontStyle === 'italic';
  const isUnderline = cellStyle.textDecoration === 'underline';

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

        {/* Font Size */}
        <select
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          value={cellStyle.fontSize || '14px'}
          onChange={(e) => setFontSize(e.target.value)}
          disabled={!selectedCell}
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
          onClick={() => toggleStyle('fontWeight', 'bold')}
          disabled={!selectedCell}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${isItalic ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => toggleStyle('fontStyle', 'italic')}
          disabled={!selectedCell}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${isUnderline ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => toggleStyle('textDecoration', 'underline')}
          disabled={!selectedCell}
          title="Underline"
        >
          <Underline size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Color */}
        <div className="relative group">
          <button className="p-1.5 hover:bg-gray-200 rounded" disabled={!selectedCell} title="Text Color">
            <Type size={18} />
          </button>
          <input
            type="color"
            className="absolute opacity-0 w-8 h-8 cursor-pointer"
            onChange={(e) => setTextColor(e.target.value)}
            disabled={!selectedCell}
          />
        </div>

        {/* Background Color */}
        <div className="relative group">
          <button className="p-1.5 hover:bg-gray-200 rounded" disabled={!selectedCell} title="Fill Color">
            <Palette size={18} />
          </button>
          <input
            type="color"
            className="absolute opacity-0 w-8 h-8 cursor-pointer"
            onChange={(e) => setBackgroundColor(e.target.value)}
            disabled={!selectedCell}
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button
          className={`p-1.5 rounded ${cellStyle.textAlign === 'left' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setAlignment('left')}
          disabled={!selectedCell}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${cellStyle.textAlign === 'center' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setAlignment('center')}
          disabled={!selectedCell}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </button>
        <button
          className={`p-1.5 rounded ${cellStyle.textAlign === 'right' ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
          onClick={() => setAlignment('right')}
          disabled={!selectedCell}
          title="Align Right"
        >
          <AlignRight size={18} />
        </button>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="font-mono text-sm font-semibold min-w-[60px]">
          {selectedCell ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}` : ''}
        </div>
        <input
          type="text"
          value={formulaBarValue}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          placeholder="Enter value or formula"
          disabled={!selectedCell}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
        />
      </div>
    </div>
  );
};

export default Toolbar;