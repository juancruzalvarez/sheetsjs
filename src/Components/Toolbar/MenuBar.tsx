import { ChevronDown } from "lucide-react";
import React, { useCallback } from "react";
import { useEffect, useRef, useState } from "react";
import { useSpreadsheetStore } from "../../Stores/spreadsheetStore";

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

const MenuBar: React.FC = React.memo(() => {
  const setCellStyle = useSpreadsheetStore((state) => state.setCellStyle);
  const selectionRanges = useSpreadsheetStore((state) => state.selectionRanges);

  const getSelectedCells = useCallback(() => {
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
  }, [selectionRanges]);

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
      const selectedCells = getSelectedCells();
      selectedCells.forEach(pos => {
        setCellStyle(pos.row, pos.col, {});
      });
    }},
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200">
      <DropdownMenu label="File" items={fileMenuItems} />
      <DropdownMenu label="Edit" items={editMenuItems} />
      <DropdownMenu label="Insert" items={insertMenuItems} />
      <DropdownMenu label="Format" items={formatMenuItems} />
    </div>
  );
});

MenuBar.displayName = 'MenuBar';
export default MenuBar;