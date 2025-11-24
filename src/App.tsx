import { useState } from "react";
import Spreadsheet from "./Components/Spreadsheet"
import Toolbar from "./Components/Toolbar"
import { useSpreadsheetStore } from "./Stores/spreadsheetStore";
import Editor from "./Components/Editor";

const App = () => {
  const [showFormulaEditor, setShowFormulaEditor] = useState(true);
  window.addEventListener('openFormulaEditor', (event) => {
    setShowFormulaEditor(true);
  });
 
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Spreadsheet />
        
        {/* Formula Editor Sidebar */}
        {showFormulaEditor && (
          <Editor onClose={() => setShowFormulaEditor(false)} />
        )}
      </div>

    </div>
  )
}

export default App
