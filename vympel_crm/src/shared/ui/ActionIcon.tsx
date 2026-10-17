type ActionIconName = "save" | "clear" | "edit" | "archive" | "trash" | "chevron";
const paths: Record<ActionIconName, string> = {
  save: "m5 12 4 4L19 6",
  clear: "m6 6 12 12M6 18 18 6",
  edit: "m14 5 5 5M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z",
  archive: "M4 8h16v12H4V8ZM3 4h18v4H3V4Zm6 8h6",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  chevron: "m6 9 6 6 6-6",
};

export function ActionIcon({name}: {name: ActionIconName}) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}
