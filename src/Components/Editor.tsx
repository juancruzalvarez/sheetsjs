import React, { useState, useEffect, useRef } from "react";
import { useSpreadsheetStore } from "../Stores/spreadsheetStore";
import {
  X,
  Play,
  AlertCircle,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { cellRefToPosition } from "../Services/utils";

import ReactCodeMirror, { EditorView } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

interface HelperSidebarProps {
  insertExample: (example: string) => void;
}

export const HelperSidebar: React.FC<HelperSidebarProps> = ({
  insertExample,
}) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-t border-gray-300 bg-gray-100">
      {/* Toggle Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-200 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-700">
          Helper Functions
        </span>
        {open ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>

      {/* Collapsible Content */}
      {open && (
        <div className="max-h-64 overflow-y-auto">
          <div className="p-4 text-xs text-gray-700">
            <div className="font-semibold mb-3">Available Functions:</div>

            {/* Cell Reference */}
            <div className="mb-3">
              <div className="text-gray-500 font-semibold">Cell Reference</div>
              <button
                onClick={() => insertExample('=cell("A1") * 2')}
                className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
              >
                <code className="text-purple-600">cell('A1')</code>
                <span className="text-gray-500"> – Get cell value</span>
              </button>
            </div>

            {/* Math */}
            <div className="mb-3">
              <div className="text-gray-500 font-semibold">Math</div>

              <button
                onClick={() => insertExample("=sum(1, 2, 3, 4, 5)")}
                className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
              >
                <code className="text-purple-600">sum(...nums)</code>
                <span className="text-gray-500"> – Sum numbers</span>
              </button>

              <button
                onClick={() => insertExample("=avg(10, 20, 30)")}
                className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
              >
                <code className="text-purple-600">avg(...nums)</code>
                <span className="text-gray-500"> – Average</span>
              </button>

              <div className="text-gray-500 pl-1.5">
                <code className="text-purple-600">
                  max, min, round, floor, ceil, abs
                </code>
              </div>
            </div>

            {/* String */}
            <div className="mb-3">
              <div className="text-gray-500 font-semibold">String</div>

              <button
                onClick={() => insertExample('=upper(cell("A1"))')}
                className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
              >
                <code className="text-purple-600">upper(str)</code>
                <span className="text-gray-500"> – Uppercase</span>
              </button>

              <div className="text-gray-500 pl-1.5">
                <code className="text-purple-600">lower, trim, concat</code>
              </div>
            </div>

            {/* Date */}
            <div className="mb-3">
              <div className="text-gray-500 font-semibold">Date</div>
              <button
                onClick={() => insertExample("=today()")}
                className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
              >
                <code className="text-purple-600">today()</code>
                <span className="text-gray-500"> – Current date</span>
              </button>
              <div className="text-gray-500 pl-1.5">
                <code className="text-purple-600">now()</code>
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="border-t border-gray-300 p-4 text-xs text-gray-600">
            <div className="font-semibold mb-3">Quick Examples:</div>

            <button
              onClick={() => insertExample("=2 + 2")}
              className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
            >
              <code>=2 + 2</code> – Simple math
            </button>

            <button
              onClick={() => insertExample("=sum(range(1, 10))")}
              className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
            >
              <code>=sum(range(1, 10))</code> – Sum 1–10
            </button>

            <button
              onClick={() => insertExample('=cell("A1") * cell("B1")')}
              className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
            >
              <code>=cell("A1") * cell("B1")</code> – Multiply cells
            </button>

            <button
              onClick={() =>
                insertExample('=concat("Hello, ", upper(cell("A1")))')
              }
              className="block w-full text-left hover:bg-gray-200 p-1.5 rounded"
            >
              <code>=concat("Hello, ", upper(cell("A1")))</code>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


interface EditorProps {
  onClose: () => void;
}

const Editor: React.FC<EditorProps> = ({ onClose }) => {
  const currentCell = useSpreadsheetStore((s) => s.currentCell);
  const cells = useSpreadsheetStore((s) => s.cells);
  const setCellFormula = useSpreadsheetStore((s) => s.setCellFormula);

  const cellKey = currentCell ? `${currentCell.row}-${currentCell.col}` : null;
  const cellData = cellKey ? cells.get(cellKey) : null;

  const initialValue =
    cellData?.formula || cellData?.rawValue?.toString() || "";

  const [code, setCode] = useState(initialValue);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editorWidth, setEditorWidth] = useState(500);

  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const viewRef = useRef<EditorView>(null);

  const setEditingState = useSpreadsheetStore((state) => state.setEditingState);
  const stopEdit = useSpreadsheetStore((state) => state.stopEditing);

  /* Handle cell switching */
  useEffect(() => {
    const newVal = cellData?.formula || cellData?.rawValue?.toString() || "";
    setCode(newVal);
  }, [cellData, currentCell]);

  /* Handle resize */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      // Calculate new width (dragging left = wider)
      const newWidth = window.innerWidth - e.clientX;

      // Clamp between 300px and 800px
      const clampedWidth = Math.max(300, Math.min(800, newWidth));
      setEditorWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

   useEffect(() => {
    function handler(e: CustomEvent) {
      const { text, cursorPos } = e.detail;
      const view = viewRef.current;
      if (!view) return;

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: text,
        },
      });

      // Set cursor
      view.dispatch({
        selection: { anchor: cursorPos },
        scrollIntoView: true,
      });

      view.focus();
    }

    window.addEventListener("insertFormulaReference", handler as EventListener);
    return () =>
      window.removeEventListener("insertFormulaReference", handler as EventListener);
  }, []);

  const getCellReference = () => {
    if (!currentCell) return "";
    const col = String.fromCharCode(65 + currentCell.col);
    const row = currentCell.row + 1;
    return `${col}${row}`;
  };


  const executeFormula = () => {
    if (!currentCell) return;

    try {
      setError("");

      const formula = code.startsWith("=") ? code : `=${code}`;
      const cleanCode = formula.slice(1);

      const context = {
        cell: (ref: string) => {
          // Normalize to uppercase
          ref = ref.toUpperCase();

          // Check if it's a range (e.g., "A1:B5")
          if (ref.includes(":")) {
            const [start, end] = ref.split(":");
            const startPos = cellRefToPosition(start);
            const endPos = cellRefToPosition(end);

            if (!startPos || !endPos) return null;

            const startRow = Math.min(startPos.row, endPos.row);
            const endRow = Math.max(startPos.row, endPos.row);
            const startCol = Math.min(startPos.col, endPos.col);
            const endCol = Math.max(startPos.col, endPos.col);

            // Check if it's a single row (1D horizontal array  )
            if (startRow === endRow) {
              const values = [];
              for (let c = startCol; c <= endCol; c++) {
                const key = `${startRow}-${c}`;
                const cell = cells.get(key);
                values.push(cell?.rawValue ?? 0);
              }
              return values;
            }

            // Check if it's a single column (1D vertical array)
            if (startCol === endCol) {
              const values = [];
              for (let r = startRow; r <= endRow; r++) {
                const key = `${r}-${startCol}`;
                const cell = cells.get(key);
                values.push(cell?.rawValue ?? 0);
              }
              return values;
            }

            // 2D array for multi-row, multi-column range
            const values = [];
            for (let r = startRow; r <= endRow; r++) {
              const row = [];
              for (let c = startCol; c <= endCol; c++) {
                const key = `${r}-${c}`;
                const cell = cells.get(key);
                row.push(cell?.rawValue ?? 0);
              }
              values.push(row);
            }
            return values;
          }

          // Single cell reference
          const pos = cellRefToPosition(ref);
          if (!pos) return null;
          const key = `${pos.row}-${pos.col}`;
          const refCell = cells.get(key);
          return refCell?.rawValue ?? "";
        },

        sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
        avg: (...args: number[]) =>
          args.reduce((a, b) => a + b, 0) / args.length,
        max: Math.max,
        min: Math.min,
        round: Math.round,
        floor: Math.floor,
        ceil: Math.ceil,
        abs: Math.abs,

        concat: (...args: any[]) => args.join(""),
        upper: (str: string) => str.toUpperCase(),
        lower: (str: string) => str.toLowerCase(),
        trim: (str: string) => str.trim(),

        range: (start: number, end: number) => {
          const arr = [];
          for (let i = start; i <= end; i++) arr.push(i);
          return arr;
        },

        now: () => new Date(),
        today: () => new Date().toLocaleDateString(),
      };

      const func = new Function(
        ...Object.keys(context),
        `return (${cleanCode})`
      );

      const value = func(...Object.values(context));

      const resultString = String(value);
      setResult(resultString);

      setCellFormula(currentCell.row, currentCell.col, formula);
    } catch (err: any) {
      setError(err.message || "Execution error");
      setResult("");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertExample = (example: string) => setCode(example);

  return (
    <div
      className="h-full bg-white border-l border-gray-300 flex shadow-xl relative"
      style={{ width: `${editorWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors group"
        style={{ zIndex: 100 }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex flex-col ml-1">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-100">
          <div className="flex items-center gap-3">
            <div className="font-mono font-bold text-blue-600 text-lg">
              {getCellReference()}
            </div>
            <div className="text-sm text-gray-500">Formula Editor</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="p-1.5 hover:bg-gray-200 rounded"
              title="Copy code"
            >
              {copied ? (
                <Check size={18} className="text-green-600" />
              ) : (
                <Copy size={18} className="text-gray-500" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded"
              title="Close"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Label */}
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-300">
          <div className="text-xs text-gray-600">
            JavaScript Formula (start with{" "}
            <code className="text-blue-600">=</code>)
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          <ReactCodeMirror
            value={code}
            height="100%"
            extensions={[javascript()]}
            onCreateEditor={(view) => {
              viewRef.current = view;   
            }}
            onChange={(value) => {
              setCode(value);
            }}
            onUpdate={(v) => {
              const view = v.view;
              const cursorPos = view.state.selection.main.head;
              const value = view.state.doc.toString();
              setEditingState(
                currentCell?.row || 0,
                currentCell?.col || 0,
                value,
                cursorPos
              );
            }}
            onFocus={() =>
              setEditingState(
                currentCell?.row || 0,
                currentCell?.col || 0,
                code, 0
              )
            }
            onBlur={() => stopEdit()}
            theme="light"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: false,
              rectangularSelection: true,
              highlightSelectionMatches: true,
            }}
          />
        </div>

        {/* Execute button */}
        <div className="px-4 py-3 border-t border-gray-300 bg-gray-100 flex gap-2">
          <button
            onClick={executeFormula}
            className="flex-5 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Play size={16} />
            Execute
          </button>
          <button
            onClick={() => {
              executeFormula();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Check size={16} />
            Done
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="mx-4 mb-3 p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="text-xs text-green-700 font-semibold mb-1">
              Result:
            </div>
            <div className="font-mono text-sm text-green-800 break-all">
              {result}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mb-3 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
            <AlertCircle
              size={16}
              className="text-red-600 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <div className="text-xs text-red-600 font-semibold mb-1">
                Error:
              </div>
              <div className="text-sm text-red-700 break-words">{error}</div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <HelperSidebar insertExample={insertExample} />
      </div>
    </div>
  );
};

export default Editor;
