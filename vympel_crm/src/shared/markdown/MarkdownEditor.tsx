"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import {
  continueMarkdownList,
  insertMarkdownLink,
  isInlineMarkdownActive,
  toggleBlockquoteMarkdown,
  toggleHeadingMarkdown,
  toggleInlineMarkdown,
  toggleOrderedListMarkdown,
  toggleUnorderedListMarkdown,
  type MarkdownEdit,
} from "./editorTransforms";

const MarkdownContent = dynamic(
  () => import("./MarkdownContent").then((module) => module.MarkdownContent),
  { ssr: false },
);

export type MarkdownEditorLabels = {
  write: string;
  preview: string;
  toolbar: string;
  bold: string;
  italic: string;
  underline: string;
  heading: string;
  bulletList: string;
  numberedList: string;
  link: string;
  blockquote: string;
  help: string;
  previewEmpty: string;
  characterCount: string;
};

type MarkdownEditorProps = {
  id: string;
  label: string;
  value: string;
  maxLength: number;
  labels: MarkdownEditorLabels;
  onChange: (value: string) => void;
};

type EditorMode = "write" | "preview";

type ToolbarActionId =
  | "bold"
  | "italic"
  | "underline"
  | "heading"
  | "bulletList"
  | "numberedList"
  | "link"
  | "blockquote";

type ToolbarAction = {
  id: ToolbarActionId;
  label: string;
  visual: string;
  className?: string;
  active: boolean;
};

export function MarkdownEditor({ id, label, value, maxLength, labels, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<EditorMode>("write");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const writePanelId = `${id}-write-panel`;
  const previewPanelId = `${id}-preview-panel`;
  const helpId = `${id}-help`;
  const countId = `${id}-count`;
  const activeLines = useMemo(
    () => selectedLines(value, selection.start, selection.end),
    [selection.end, selection.start, value],
  );

  const applyEdit = (edit: MarkdownEdit) => {
    if (edit.value.length > maxLength) {
      return;
    }

    onChange(edit.value);
    setSelection({ start: edit.selectionStart, end: edit.selectionEnd });
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  const apply = (transform: (start: number, end: number) => MarkdownEdit) => {
    applyEdit(transform(selection.start, selection.end));
  };

  const handleListContinuation = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const edit = continueMarkdownList(value, event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
    if (!edit || edit.value.length > maxLength) {
      return;
    }

    event.preventDefault();
    applyEdit(edit);
  };

  const updateSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd });
  };

  const runToolbarAction = (action: ToolbarActionId) => {
    switch (action) {
      case "bold":
        apply((start, end) => toggleInlineMarkdown(value, start, end, "**"));
        return;
      case "italic":
        apply((start, end) => toggleInlineMarkdown(value, start, end, "_"));
        return;
      case "underline":
        apply((start, end) => toggleInlineMarkdown(value, start, end, "<u>", "</u>"));
        return;
      case "heading":
        apply((start, end) => toggleHeadingMarkdown(value, start, end));
        return;
      case "bulletList":
        apply((start, end) => toggleUnorderedListMarkdown(value, start, end));
        return;
      case "numberedList":
        apply((start, end) => toggleOrderedListMarkdown(value, start, end));
        return;
      case "link":
        apply((start, end) => insertMarkdownLink(value, start, end, labels.link));
        return;
      case "blockquote":
        apply((start, end) => toggleBlockquoteMarkdown(value, start, end));
    }
  };

  const toolbarActions: ToolbarAction[] = [
    {
      id: "bold",
      label: labels.bold,
      visual: "B",
      className: "crm-markdown-editor__format--bold",
      active: isInlineMarkdownActive(value, selection.start, selection.end, "**"),
    },
    {
      id: "italic",
      label: labels.italic,
      visual: "I",
      className: "crm-markdown-editor__format--italic",
      active: isInlineMarkdownActive(value, selection.start, selection.end, "_"),
    },
    {
      id: "underline",
      label: labels.underline,
      visual: "U",
      className: "crm-markdown-editor__format--underline",
      active: isInlineMarkdownActive(value, selection.start, selection.end, "<u>", "</u>"),
    },
    {
      id: "heading",
      label: labels.heading,
      visual: "H2",
      active: activeLines.length > 0 && activeLines.every((line) => /^\s*#{1,6}\s+/.test(line)),
    },
    {
      id: "bulletList",
      label: labels.bulletList,
      visual: `• ${labels.bulletList}`,
      active: activeLines.length > 0 && activeLines.every((line) => /^\s*[-+*]\s+/.test(line)),
    },
    {
      id: "numberedList",
      label: labels.numberedList,
      visual: `1. ${labels.numberedList}`,
      active: activeLines.length > 0 && activeLines.every((line) => /^\s*\d+[.)]\s+/.test(line)),
    },
    {
      id: "link",
      label: labels.link,
      visual: labels.link,
      active: false,
    },
    {
      id: "blockquote",
      label: labels.blockquote,
      visual: `“ ${labels.blockquote}`,
      active: activeLines.length > 0 && activeLines.every((line) => /^\s*>\s?/.test(line)),
    },
  ];

  return (
    <div className="crm-markdown-editor-field">
      <label className="crm-label" htmlFor={id}>{label}</label>
      <div className="crm-markdown-editor">
        <div className="crm-markdown-editor__header">
          <div className="crm-markdown-editor__modes" role="group" aria-label={label}>
            <button
              type="button"
              aria-controls={writePanelId}
              aria-pressed={mode === "write"}
              className="crm-markdown-editor__mode"
              data-active={mode === "write"}
              onClick={() => setMode("write")}
            >
              {labels.write}
            </button>
            <button
              type="button"
              aria-controls={previewPanelId}
              aria-pressed={mode === "preview"}
              className="crm-markdown-editor__mode"
              data-active={mode === "preview"}
              onClick={() => setMode("preview")}
            >
              {labels.preview}
            </button>
          </div>

          {mode === "write" ? (
            <div className="crm-markdown-editor__toolbar" role="toolbar" aria-label={labels.toolbar}>
              {toolbarActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={["crm-markdown-editor__format", action.className].filter(Boolean).join(" ")}
                  aria-label={action.label}
                  aria-pressed={action.active}
                  title={action.label}
                  data-active={action.active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runToolbarAction(action.id)}
                >
                  {action.visual}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {mode === "write" ? (
          <div id={writePanelId} className="crm-markdown-editor__panel">
            <textarea
              ref={textareaRef}
              id={id}
              className="crm-markdown-editor__textarea"
              value={value}
              maxLength={maxLength}
              aria-describedby={`${helpId} ${countId}`}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleListContinuation}
              onSelect={updateSelection}
              onClick={updateSelection}
              onKeyUp={updateSelection}
            />
          </div>
        ) : (
          <div id={previewPanelId} className="crm-markdown-editor__preview">
            {value.trim() ? (
              <MarkdownContent value={value} />
            ) : (
              <p className="crm-markdown-editor__empty">{labels.previewEmpty}</p>
            )}
          </div>
        )}
      </div>
      <div className="crm-markdown-editor__footer">
        <span id={helpId}>{labels.help}</span>
        <span id={countId}>{labels.characterCount}: {value.length} / {maxLength}</span>
      </div>
    </div>
  );
}

function selectedLines(value: string, selectionStart: number, selectionEnd: number) {
  const start = Math.max(0, Math.min(value.length, Math.min(selectionStart, selectionEnd)));
  const end = Math.max(start, Math.min(value.length, Math.max(selectionStart, selectionEnd)));
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEndMatch = value.indexOf("\n", end);
  const lineEnd = lineEndMatch === -1 ? value.length : lineEndMatch;

  return value.slice(lineStart, lineEnd).split("\n").filter((line) => line.trim());
}
