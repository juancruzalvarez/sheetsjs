import { useState } from "react";
import Spreadsheet from "./Components/Spreadsheet"
import Toolbar from "./Components/Toolbar"
import { useSpreadsheetStore } from "./Stores/spreadsheetStore";
import Editor from "./Components/Editor";

const App = () => {
  const [showFormulaEditor, setShowFormulaEditor] = useState(true);
  const selectedCell = useSpreadsheetStore((state) => state.currentCell);
  window.addEventListener('openFormulaEditor', (event) => {
    setShowFormulaEditor(true);
  });
  /* Open formula editor when cell starts with =
  useSpreadsheetStore.subscribe(
    (state) => {
      if (state.currentCell) {
        const key = `${state.currentCell.row}-${state.currentCell.col}`;
        const cell = state.cells.get(key);
        if (cell?.computed && cell.formula) {
          setShowFormulaEditor(true);
        }
      }
    }
  );
*/
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Spreadsheet />
        
        {/* Formula Editor Sidebar */}
        {showFormulaEditor && selectedCell && (
          <Editor onClose={() => setShowFormulaEditor(false)} />
        )}
      </div>

    </div>
  )
}

export default App
