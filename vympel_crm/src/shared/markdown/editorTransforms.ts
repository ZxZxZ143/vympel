export type MarkdownEdit = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

type Selection = {
  start: number;
  end: number;
};

export function toggleInlineMarkdown(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix = prefix,
): MarkdownEdit {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  const selected = value.slice(selection.start, selection.end);
  const includesMarkers = selected.startsWith(prefix)
    && selected.endsWith(suffix)
    && selected.length >= prefix.length + suffix.length;
  const hasSurroundingMarkers = value.slice(selection.start - prefix.length, selection.start) === prefix
    && value.slice(selection.end, selection.end + suffix.length) === suffix;

  if (includesMarkers) {
    const content = selected.slice(prefix.length, selected.length - suffix.length);

    return {
      value: replaceRange(value, selection.start, selection.end, content),
      selectionStart: selection.start,
      selectionEnd: selection.start + content.length,
    };
  }

  if (hasSurroundingMarkers) {
    const replaceStart = selection.start - prefix.length;
    const replaceEnd = selection.end + suffix.length;

    return {
      value: replaceRange(value, replaceStart, replaceEnd, selected),
      selectionStart: replaceStart,
      selectionEnd: replaceStart + selected.length,
    };
  }

  const replacement = `${prefix}${selected}${suffix}`;

  return {
    value: replaceRange(value, selection.start, selection.end, replacement),
    selectionStart: selection.start + prefix.length,
    selectionEnd: selection.start + prefix.length + selected.length,
  };
}

export function toggleHeadingMarkdown(value: string, selectionStart: number, selectionEnd: number): MarkdownEdit {
  return transformSelectedLines(value, selectionStart, selectionEnd, (lines) => {
    const contentLines = lines.filter((line) => line.trim());
    const removeHeading = contentLines.length > 0
      && contentLines.every((line) => /^\s*#{1,6}\s+/.test(line));

    return lines.map((line) => {
      if (!line.trim()) {
        return line;
      }

      if (removeHeading) {
        return line.replace(/^(\s*)#{1,6}\s+/, "$1");
      }

      return line.replace(/^(\s*)(?:#{1,6}\s+)?/, "$1## ");
    });
  });
}

export function toggleUnorderedListMarkdown(value: string, selectionStart: number, selectionEnd: number): MarkdownEdit {
  return transformSelectedLines(value, selectionStart, selectionEnd, (lines) => {
    const contentLines = lines.filter((line) => line.trim());
    const removeList = contentLines.length > 0
      && contentLines.every((line) => /^\s*[-+*]\s+/.test(line));

    return lines.map((line) => {
      if (!line.trim()) {
        return line;
      }

      if (removeList) {
        return line.replace(/^(\s*)[-+*]\s+/, "$1");
      }

      return line.replace(/^(\s*)(?:(?:[-+*]|\d+[.)])\s+)?/, "$1- ");
    });
  });
}

export function toggleOrderedListMarkdown(value: string, selectionStart: number, selectionEnd: number): MarkdownEdit {
  return transformSelectedLines(value, selectionStart, selectionEnd, (lines) => {
    const contentLines = lines.filter((line) => line.trim());
    const removeList = contentLines.length > 0
      && contentLines.every((line) => /^\s*\d+[.)]\s+/.test(line));
    let itemNumber = 0;

    return lines.map((line) => {
      if (!line.trim()) {
        return line;
      }

      if (removeList) {
        return line.replace(/^(\s*)\d+[.)]\s+/, "$1");
      }

      itemNumber += 1;
      return line.replace(/^(\s*)(?:(?:[-+*]|\d+[.)])\s+)?/, `$1${itemNumber}. `);
    });
  });
}

export function toggleBlockquoteMarkdown(value: string, selectionStart: number, selectionEnd: number): MarkdownEdit {
  return transformSelectedLines(value, selectionStart, selectionEnd, (lines) => {
    const contentLines = lines.filter((line) => line.trim());
    const removeQuote = contentLines.length > 0
      && contentLines.every((line) => /^\s*>\s?/.test(line));

    return lines.map((line) => {
      if (!line.trim()) {
        return line;
      }

      if (removeQuote) {
        return line.replace(/^(\s*)>\s?/, "$1");
      }

      return line.replace(/^(\s*)/, "$1> ");
    });
  });
}

export function insertMarkdownLink(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  linkText = "link text",
): MarkdownEdit {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  const selected = value.slice(selection.start, selection.end) || linkText;
  const prefix = `[${selected}](`;
  const urlPlaceholder = "https://";
  const replacement = `${prefix}${urlPlaceholder})`;
  const urlStart = selection.start + prefix.length;

  return {
    value: replaceRange(value, selection.start, selection.end, replacement),
    selectionStart: urlStart,
    selectionEnd: urlStart + urlPlaceholder.length,
  };
}

export function continueMarkdownList(value: string, selectionStart: number, selectionEnd: number): MarkdownEdit | null {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);

  if (selection.start !== selection.end) {
    return null;
  }

  const lineStart = value.lastIndexOf("\n", Math.max(0, selection.start - 1)) + 1;
  const lineEndMatch = value.indexOf("\n", selection.start);
  const lineEnd = lineEndMatch === -1 ? value.length : lineEndMatch;
  const line = value.slice(lineStart, lineEnd);
  const emptyListItem = /^(\s*)(?:[-+*]|\d+[.)])\s*$/.exec(line);

  if (emptyListItem) {
    return {
      value: replaceRange(value, lineStart, lineEnd, emptyListItem[1]),
      selectionStart: lineStart + emptyListItem[1].length,
      selectionEnd: lineStart + emptyListItem[1].length,
    };
  }

  const beforeCursor = value.slice(lineStart, selection.start);
  const listItem = /^(\s*)(?:([-+*])|(\d+)([.)]))\s+/.exec(beforeCursor);

  if (!listItem) {
    return null;
  }

  const marker = listItem[2]
    ?? `${Number(listItem[3]) + 1}${listItem[4]}`;
  const insertion = `\n${listItem[1]}${marker} `;

  return {
    value: replaceRange(value, selection.start, selection.end, insertion),
    selectionStart: selection.start + insertion.length,
    selectionEnd: selection.start + insertion.length,
  };
}

export function isInlineMarkdownActive(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix = prefix,
) {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  const selected = value.slice(selection.start, selection.end);

  return (
    selected.startsWith(prefix)
    && selected.endsWith(suffix)
    && selected.length >= prefix.length + suffix.length
  ) || (
    value.slice(selection.start - prefix.length, selection.start) === prefix
    && value.slice(selection.end, selection.end + suffix.length) === suffix
  );
}

function transformSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  transform: (lines: string[]) => string[],
): MarkdownEdit {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  const lineStart = value.lastIndexOf("\n", Math.max(0, selection.start - 1)) + 1;
  const effectiveEnd = selection.end > selection.start && value[selection.end - 1] === "\n"
    ? selection.end - 1
    : selection.end;
  const lineEndMatch = value.indexOf("\n", effectiveEnd);
  const lineEnd = lineEndMatch === -1 ? value.length : lineEndMatch;
  const replacement = transform(value.slice(lineStart, lineEnd).split("\n")).join("\n");

  return {
    value: replaceRange(value, lineStart, lineEnd, replacement),
    selectionStart: lineStart,
    selectionEnd: lineStart + replacement.length,
  };
}

function normalizeSelection(value: string, selectionStart: number, selectionEnd: number): Selection {
  const start = Math.max(0, Math.min(value.length, Math.min(selectionStart, selectionEnd)));
  const end = Math.max(start, Math.min(value.length, Math.max(selectionStart, selectionEnd)));

  return { start, end };
}

function replaceRange(value: string, start: number, end: number, replacement: string) {
  return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
}
