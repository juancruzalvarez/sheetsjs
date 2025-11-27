import FormattingBar from "./FormattingBar";
import FormulaBar from "./FormulaBar";
import MenuBar from "./MenuBar";
import QuickActions from "./QuickActions";

const Toolbar: React.FC = () => {
  return (
    <div className="border-b border-gray-300 bg-white">
      <MenuBar />
      
      <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200">
        <QuickActions />
       {<FormattingBar /> } 
      </div>

      <FormulaBar />
    </div>
  );
};

export default Toolbar;