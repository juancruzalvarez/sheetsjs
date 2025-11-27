import { Download, FolderOpen, Redo, Save, Undo } from "lucide-react";
import React from "react";

const QuickActions: React.FC = React.memo(() => {
  return (
    <>
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

      <button className="p-1.5 hover:bg-gray-200 rounded" title="Undo">
        <Undo size={18} />
      </button>
      <button className="p-1.5 hover:bg-gray-200 rounded" title="Redo">
        <Redo size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />
    </>
  );
});

QuickActions.displayName = 'QuickActions';
export default QuickActions;