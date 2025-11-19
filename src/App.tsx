import Navbar from "./Components/Navbar"
import Spreadsheet from "./Components/Spreadsheet"

const App = () => {


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />
      <Spreadsheet />
    </div>
  )
}

export default App
