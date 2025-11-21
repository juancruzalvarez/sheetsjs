import Spreadsheet from "./Components/Spreadsheet"
import Toolbar from "./Components/Toolbar"

const App = () => {


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar />
      <Spreadsheet />
    </div>
  )
}

export default App
