'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre description détaillée...',
  className = '',
  minHeight = '200px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync content when value changes externally (skip while editing to preserve cursor)
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  }, [execCommand]);

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
    active = false,
  }: {
    onClick: () => void;
    icon: React.ElementType;
    title: string;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-primary/20 text-primary'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`border border-border rounded-xl overflow-hidden bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap">
        <ToolbarButton
          onClick={() => execCommand('bold')}
          icon={Bold}
          title="Gras (Ctrl+B)"
        />
        <ToolbarButton
          onClick={() => execCommand('italic')}
          icon={Italic}
          title="Italique (Ctrl+I)"
        />
        <div className="w-px h-6 bg-border mx-1" />
        <ToolbarButton
          onClick={() => execCommand('formatBlock', 'h3')}
          icon={Heading2}
          title="Sous-titre"
        />
        <ToolbarButton
          onClick={() => execCommand('insertUnorderedList')}
          icon={List}
          title="Liste à puces"
        />
        <ToolbarButton
          onClick={() => execCommand('insertOrderedList')}
          icon={ListOrdered}
          title="Liste numérotée"
        />
        <div className="w-px h-6 bg-border mx-1" />
        <ToolbarButton
          onClick={() => execCommand('undo')}
          icon={Undo}
          title="Annuler"
        />
        <ToolbarButton
          onClick={() => execCommand('redo')}
          icon={Redo}
          title="Rétablir"
        />
        <ToolbarButton
          onClick={() => execCommand('removeFormat')}
          icon={RemoveFormatting}
          title="Supprimer le formatage"
        />
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="px-4 py-3 outline-none prose prose-sm max-w-none
            [&>*]:my-2
            [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-foreground
            [&>p]:text-sm [&>p]:text-foreground
            [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:text-sm
            [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:text-sm
            [&>li]:text-foreground
            [&_strong]:font-semibold
            [&_em]:italic"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
        {!value && !isFocused && (
          <div
            className="absolute top-3 left-4 text-muted-foreground pointer-events-none text-sm"
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

// Display component for rendering rich text content
export function RichTextDisplay({
  content,
  className = '',
}: {
  content: string;
  className?: string;
}) {
  if (!content) return null;

  return (
    <div
      className={`prose prose-sm max-w-none
        [&>*]:my-2
        [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-foreground
        [&>p]:text-sm [&>p]:text-muted-foreground [&>p]:leading-relaxed
        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:text-sm [&>ul]:text-muted-foreground
        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:text-sm [&>ol]:text-muted-foreground
        [&>li]:text-muted-foreground [&>li]:leading-relaxed
        [&_strong]:font-medium [&_strong]:text-foreground
        [&_em]:italic
        ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
