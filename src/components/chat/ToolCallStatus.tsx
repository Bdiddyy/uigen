"use client";

import { Loader2 } from "lucide-react";

interface ToolCallStatusProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
}

export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path.split("/").filter(Boolean).pop() ?? path;

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${filename || "file"}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename || "file"}`;
      case "view":
        return `Reading ${filename || "file"}`;
      case "undo_edit":
        return `Undoing edit${filename ? ` to ${filename}` : ""}`;
      default:
        return filename ? `Editing ${filename}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    const newPath = typeof args.new_path === "string" ? args.new_path : "";
    const newFilename = newPath.split("/").filter(Boolean).pop() ?? newPath;
    switch (args.command) {
      case "rename":
        return filename && newFilename
          ? `Renaming ${filename} → ${newFilename}`
          : "Renaming file";
      case "delete":
        return `Deleting ${filename || "file"}`;
      default:
        return filename || toolName;
    }
  }

  return toolName;
}

export function ToolCallStatus({ toolName, args, state }: ToolCallStatusProps) {
  const label = getToolLabel(toolName, args);
  const isDone = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
