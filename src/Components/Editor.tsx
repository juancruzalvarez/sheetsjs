// FormulaEditor.tsx - Professional code editor using Monaco Editor
import React, { useState, useEffect, useRef } from 'react';
import { useSpreadsheetStore } from '../Stores/spreadsheetStore';
import { X, Play, AlertCircle, Check, Copy, ChevronDown, ChevronRight } from 'lucide-react';

interface EditorProps {
  onClose: () => void;
}

// Load Monaco Editor from CDN
const loadMonacoEditor = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).monaco) {
      resolve((window as any).monaco);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
    script.async = true;
    script.onload = () => {
      const require = (window as any).require;
      require.config({
        paths: {
          vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
        }
      });
      require(['vs/editor/editor.main'], () => {
        resolve((window as any).monaco);
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};


export const HelperSidebar = ({ insertExample }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-t border-gray-700 bg-gray-800">
      {/* Toggle Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-300">
          Helper Functions
        </span>
        {open ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>

      {/* Collapsible Content */}
      {open && (
        <div className="max-h-64 overflow-y-auto">
          {/* Your original content goes here */}
          <div className="p-4">
            <div className="text-xs font-semibold text-gray-300 mb-3">
              Available Functions:
            </div>
            <div className="space-y-2 text-xs">

              {/* Cell Reference */}
              <div className="space-y-1">
                <div className="text-gray-500 font-semibold">Cell Reference</div>
                <button 
                  onClick={() => insertExample('=cell("A1") * 2')}
                  className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors"
                >
                  <code className="text-purple-400">cell('A1')</code>
                  <span className="text-gray-400"> - Get cell value</span>
                </button>
              </div>

              {/* Math */}
              <div className="space-y-1">
                <div className="text-gray-500 font-semibold">Math</div>
                <button 
                  onClick={() => insertExample('=sum(1, 2, 3, 4, 5)')}
                  className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors"
                >
                  <code className="text-purple-400">sum(...nums)</code>
                  <span className="text-gray-400"> - Sum numbers</span>
                </button>

                <button 
                  onClick={() => insertExample('=avg(10, 20, 30)')}
                  className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors"
                >
                  <code className="text-purple-400">avg(...nums)</code>
                  <span className="text-gray-400"> - Average</span>
                </button>

                <div className="text-gray-400 pl-1.5">
                  <code className="text-purple-400">max, min, round, floor, ceil, abs</code>
                </div>
              </div>

              {/* String */}
              <div className="space-y-1">
                <div className="text-gray-500 font-semibold">String</div>
                <button 
                  onClick={() => insertExample('=upper(cell("A1"))')}
                  className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors"
                >
                  <code className="text-purple-400">upper(str)</code>
                  <span className="text-gray-400"> - Uppercase</span>
                </button>

                <div className="text-gray-400 pl-1.5">
                  <code className="text-purple-400">lower, trim, concat</code>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <div className="text-gray-500 font-semibold">Date</div>
                <button 
                  onClick={() => insertExample('=today()')}
                  className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors"
                >
                  <code className="text-purple-400">today()</code>
                  <span className="text-gray-400"> - Current date</span>
                </button>

                <div className="text-gray-400 pl-1.5">
                  <code className="text-purple-400">now()</code>
                </div>
              </div>

            </div>
          </div>

          {/* Examples */}
          <div className="border-t border-gray-700 p-4">
            <div className="text-xs font-semibold text-gray-300 mb-3">Quick Examples:</div>
            <div className="space-y-2 text-xs">
              <button 
                onClick={() => insertExample('=2 + 2')}
                className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors text-gray-400"
              >
                <code>=2 + 2</code> - Simple math
              </button>
              <button 
                onClick={() => insertExample('=sum(range(1, 10))')}
                className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors text-gray-400"
              >
                <code>=sum(range(1, 10))</code> - Sum 1–10
              </button>
              <button 
                onClick={() => insertExample('=cell("A1") * cell("B1")')}
                className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors text-gray-400"
              >
                <code>=cell("A1") * cell("B1")</code> - Multiply cells
              </button>
              <button 
                onClick={() => insertExample('=concat("Hello, ", upper(cell("A1")))')}
                className="block w-full text-left hover:bg-gray-700 p-1.5 rounded transition-colors text-gray-400"
              >
                <code>=concat("Hello, ", upper(cell("A1")))</code>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ onClose }) => {
  const selectedCell = useSpreadsheetStore((state) => state.currentCell);
  const cells = useSpreadsheetStore((state) => state.cells);
  const setCell = useSpreadsheetStore((state) => state.setCell);
  
  const cellKey = selectedCell ? `${selectedCell.row}-${selectedCell.col}` : null;
  const cellData = cellKey ? cells.get(cellKey) : null;
  const initialValue = cellData?.value || '';

  const [code, setCode] = useState(initialValue);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [monaco, setMonaco] = useState<any>(null);
  const [editor, setEditor] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Load Monaco Editor
  useEffect(() => {
    loadMonacoEditor().then((monacoInstance) => {
      setMonaco(monacoInstance);
    }).catch((err) => {
      console.error('Failed to load Monaco Editor:', err);
      setError('Failed to load code editor');
    });
  }, []);

  // Initialize Editor
  useEffect(() => {
    if (!monaco || !editorContainerRef.current || editor) return;

    const editorInstance = monaco.editor.create(editorContainerRef.current, {
      value: initialValue,
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      cursorStyle: 'line',
      wordWrap: 'on',
      wrappingIndent: 'indent',
      padding: { top: 10, bottom: 10 },
    });

    // Listen to content changes
    editorInstance.onDidChangeModelContent(() => {
      const value = editorInstance.getValue();
      setCode(value);
      // Auto-update cell
      if (selectedCell) {
        setCell(selectedCell.row, selectedCell.col, value);
      }
    });

    setEditor(editorInstance);

    return () => {
      editorInstance?.dispose();
    };
  }, [monaco]);

  // Update editor when cell changes
  useEffect(() => {
    if (editor && initialValue !== editor.getValue()) {
      editor.setValue(initialValue);
    }
  }, [initialValue, selectedCell]);

  const getCellReference = () => {
    if (!selectedCell) return '';
    const col = String.fromCharCode(65 + selectedCell.col);
    const row = selectedCell.row + 1;
    return `${col}${row}`;
  };

  const executeFormula = () => {
    if (!selectedCell) return;

    try {
      setError('');
      
      // Remove the leading '=' if present
      const cleanCode = code.startsWith('=') ? code.slice(1) : code;
      
      // Create a safe execution context with helper functions
      const context = {
        // Helper to get cell values
        cell: (ref: string) => {
          const match = ref.match(/^([A-Z]+)(\d+)$/);
          if (!match) return null;
          
          const col = match[1].charCodeAt(0) - 65;
          const row = parseInt(match[2]) - 1;
          
          const key = `${row}-${col}`;
          return cells.get(key)?.value || '';
        },
        
        // Math helpers
        sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
        avg: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
        max: Math.max,
        min: Math.min,
        round: Math.round,
        floor: Math.floor,
        ceil: Math.ceil,
        abs: Math.abs,
        
        // String helpers
        concat: (...args: any[]) => args.join(''),
        upper: (str: string) => str.toUpperCase(),
        lower: (str: string) => str.toLowerCase(),
        trim: (str: string) => str.trim(),
        
        // Array helpers
        range: (start: number, end: number) => {
          const arr = [];
          for (let i = start; i <= end; i++) arr.push(i);
          return arr;
        },
        
        // Date helpers
        now: () => new Date(),
        today: () => new Date().toLocaleDateString(),
      };

      // Create function with context
      const func = new Function(...Object.keys(context), `return (${cleanCode})`);
      const calculatedResult = func(...Object.values(context));
      
      const resultString = String(calculatedResult);
      setResult(resultString);
      
      // Update the cell with the formula (keeping the =)
      setCell(selectedCell.row, selectedCell.col, code.startsWith('=') ? code : `=${code}`);
      
    } catch (err: any) {
      setError(err.message || 'Error executing formula');
      setResult('');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertExample = (example: string) => {
    if (editor) {
      editor.setValue(example);
    }
  };

  return (
    <div className="w-[500px] h-full bg-gray-900 border-l border-gray-700 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="font-mono font-bold text-blue-400 text-lg">
            {getCellReference()}
          </div>
          <div className="text-sm text-gray-400">Formula Editor</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Close"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="text-xs text-gray-400">
            JavaScript Formula (start with <code className="text-blue-400">=</code>)
          </div>
        </div>
        
        <div 
          ref={editorContainerRef} 
          className="flex-1"
          style={{ minHeight: '200px' }}
        />

        {/* Execute Button */}
        <div className="px-4 py-3 border-t border-gray-700 bg-gray-800">
          <button
            onClick={executeFormula}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Play size={16} />
            Execute Formula
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mx-4 mb-3 p-3 bg-green-900/30 border border-green-700 rounded-lg">
            <div className="text-xs text-green-400 font-semibold mb-1">Result:</div>
            <div className="font-mono text-sm text-green-300 break-all">{result}</div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-3 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs text-red-400 font-semibold mb-1">Error:</div>
              <div className="text-sm text-red-300 break-words">{error}</div>
            </div>
          </div>
        )}
      </div>
        <HelperSidebar insertExample={insertExample} />
      
    </div>
  );
};

export default Editor;