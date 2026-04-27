import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolCallStatus } from "../ToolCallStatus";

afterEach(() => {
  cleanup();
});

// --- getToolLabel pure function tests ---

test("str_replace_editor create with full path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/App.tsx" })).toBe("Creating App.tsx");
});

test("str_replace_editor create with no path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/components/Button.tsx" })).toBe("Editing Button.tsx");
});

test("str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/lib/utils.ts" })).toBe("Editing utils.ts");
});

test("str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/index.ts" })).toBe("Reading index.ts");
});

test("str_replace_editor undo_edit with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/App.tsx" })).toBe("Undoing edit to App.tsx");
});

test("str_replace_editor undo_edit without path", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit" })).toBe("Undoing edit");
});

test("str_replace_editor unknown command with path falls back to Editing", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown", path: "src/App.tsx" })).toBe("Editing App.tsx");
});

test("file_manager rename with both paths", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" })).toBe("Renaming Old.tsx → New.tsx");
});

test("file_manager rename with missing new_path", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "src/Old.tsx" })).toBe("Renaming file");
});

test("file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/lib/utils.ts" })).toBe("Deleting utils.ts");
});

test("unknown tool name falls back to tool name", () => {
  expect(getToolLabel("some_other_tool", { command: "do_thing" })).toBe("some_other_tool");
});

test("partial-call with no args yet returns safe fallback", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("Editing file");
});

// --- ToolCallStatus component render tests ---

test("shows spinner when state is call", () => {
  render(<ToolCallStatus toolName="str_replace_editor" args={{ command: "create", path: "App.tsx" }} state="call" />);
  expect(document.querySelector(".animate-spin")).toBeDefined();
});

test("shows spinner when state is partial-call", () => {
  render(<ToolCallStatus toolName="str_replace_editor" args={{ command: "create" }} state="partial-call" />);
  expect(document.querySelector(".animate-spin")).toBeDefined();
});

test("shows no spinner when state is result", () => {
  render(<ToolCallStatus toolName="str_replace_editor" args={{ command: "create", path: "App.tsx" }} state="result" />);
  expect(document.querySelector(".animate-spin")).toBeNull();
});

test("shows green dot when state is result", () => {
  render(<ToolCallStatus toolName="str_replace_editor" args={{ command: "create", path: "App.tsx" }} state="result" />);
  expect(document.querySelector(".bg-emerald-500")).toBeDefined();
});

test("renders label text", () => {
  render(<ToolCallStatus toolName="str_replace_editor" args={{ command: "create", path: "src/App.tsx" }} state="call" />);
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
});

test("renders file_manager delete label", () => {
  render(<ToolCallStatus toolName="file_manager" args={{ command: "delete", path: "src/utils.ts" }} state="result" />);
  expect(screen.getByText("Deleting utils.ts")).toBeDefined();
});
