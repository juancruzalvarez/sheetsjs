
import { useEffect } from 'react';

export const useKeyboard = (handlers: Record<string, () => void>, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Arrow keys - only when not in input
      if (!isInput) {
        if (e.key === 'ArrowUp' && handlers.moveUp) {
          e.preventDefault();
          handlers.moveUp();
          return;
        }
        if (e.key === 'ArrowDown' && handlers.moveDown) {
          e.preventDefault();
          handlers.moveDown();
          return;
        }
        if (e.key === 'ArrowLeft' && handlers.moveLeft) {
          e.preventDefault();
          handlers.moveLeft();
          return;
        }
        if (e.key === 'ArrowRight' && handlers.moveRight) {
          e.preventDefault();
          handlers.moveRight();
          return;
        }
        
        // Enter - start editing
        if (e.key === 'Enter' && handlers.startEdit) {
          e.preventDefault();
          handlers.startEdit();
          return;
        }
        
        // Delete/Backspace
        if ((e.key === 'Delete' || e.key === 'Backspace') && handlers.delete) {
          e.preventDefault();
          handlers.delete();
          return;
        }
      }
      
      // Global shortcuts - work everywhere
      const ctrlKey =  e.ctrlKey;
      
      if (ctrlKey && e.key === 'c' && handlers.copy) {
        e.preventDefault();
        handlers.copy();
        return;
      }
      if (ctrlKey && e.key === 'x' && handlers.cut) {
        e.preventDefault();
        handlers.cut();
        return;
      }
      if (ctrlKey && e.key === 'v' && handlers.paste) {
        e.preventDefault();
        handlers.paste();
        return;
      }
      if (ctrlKey && e.key === 'z' && !e.shiftKey && handlers.undo) {
        e.preventDefault();
        handlers.undo();
        return;
      }
      if (ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && handlers.redo) {
        e.preventDefault();
        handlers.redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
};