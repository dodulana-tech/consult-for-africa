"use client";

import { useState, useCallback } from "react";
import { Plus, X, ChevronRight, Download, Trash2 } from "lucide-react";

type TreeNode = {
  id: string;
  label: string;
  children: TreeNode[];
  collapsed: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function createNode(label = ""): TreeNode {
  return { id: uid(), label, children: [], collapsed: false };
}

export default function IssueTreeTool() {
  const [root, setRoot] = useState<TreeNode>({
    id: "root",
    label: "Core Question",
    children: [
      { ...createNode("Branch 1"), children: [createNode("Sub-issue A"), createNode("Sub-issue B")] },
      { ...createNode("Branch 2"), children: [createNode("Sub-issue C")] },
      createNode("Branch 3"),
    ],
    collapsed: false,
  });

  const updateTree = useCallback((updater: (node: TreeNode) => TreeNode) => {
    setRoot((prev) => updater({ ...prev }));
  }, []);

  function findAndUpdate(node: TreeNode, targetId: string, fn: (n: TreeNode) => TreeNode): TreeNode {
    if (node.id === targetId) return fn({ ...node });
    return {
      ...node,
      children: node.children.map((c) => findAndUpdate(c, targetId, fn)),
    };
  }

  function updateLabel(id: string, label: string) {
    updateTree((r) => findAndUpdate(r, id, (n) => ({ ...n, label })));
  }

  function addChild(parentId: string) {
    updateTree((r) =>
      findAndUpdate(r, parentId, (n) => ({
        ...n,
        children: [...n.children, createNode("")],
        collapsed: false,
      }))
    );
  }

  function removeNode(parentId: string, childId: string) {
    updateTree((r) =>
      findAndUpdate(r, parentId, (n) => ({
        ...n,
        children: n.children.filter((c) => c.id !== childId),
      }))
    );
  }

  function toggleCollapse(id: string) {
    updateTree((r) => findAndUpdate(r, id, (n) => ({ ...n, collapsed: !n.collapsed })));
  }

  function exportAsText(node: TreeNode, depth = 0): string {
    const indent = "  ".repeat(depth);
    const prefix = depth === 0 ? "" : "- ";
    let text = `${indent}${prefix}${node.label || "(empty)"}\n`;
    for (const child of node.children) {
      text += exportAsText(child, depth + 1);
    }
    return text;
  }

  function handleExport() {
    const text = exportAsText(root);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issue-tree-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function NodeComponent({
    node,
    parentId,
    depth,
  }: {
    node: TreeNode;
    parentId: string | null;
    depth: number;
  }) {
    const colors = ["#0F2744", "#D97706", "#059669", "#7C3AED", "#DC2626", "#0891B2"];
    const color = colors[depth % colors.length];
    const hasChildren = node.children.length > 0;

    return (
      <div className="relative">
        <div className="flex items-center gap-1.5 group">
          {/* Collapse toggle */}
          {hasChildren && (
            <button
              onClick={() => toggleCollapse(node.id)}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
            >
              <ChevronRight
                size={12}
                className="text-gray-400 transition-transform"
                style={{ transform: node.collapsed ? "rotate(0deg)" : "rotate(90deg)" }}
              />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Node pill */}
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm min-w-0"
            style={{
              background: depth === 0 ? color : `${color}10`,
              border: `1.5px solid ${color}30`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: color }}
            />
            <input
              type="text"
              value={node.label}
              onChange={(e) => updateLabel(node.id, e.target.value)}
              placeholder={depth === 0 ? "Core question..." : "Sub-issue..."}
              className="bg-transparent border-none outline-none text-sm min-w-[120px] flex-1"
              style={{ color: depth === 0 ? "#fff" : "#1F2937" }}
            />
          </div>

          {/* Actions */}
          <button
            onClick={() => addChild(node.id)}
            className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
            title="Add child"
          >
            <Plus size={12} className="text-gray-500" />
          </button>
          {parentId && (
            <button
              onClick={() => removeNode(parentId, node.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              title="Remove"
            >
              <X size={12} className="text-red-400" />
            </button>
          )}
        </div>

        {/* Children */}
        {!node.collapsed && hasChildren && (
          <div className="ml-8 mt-1 space-y-1 relative">
            {/* Vertical line */}
            <div
              className="absolute left-[-12px] top-0 bottom-0 w-px"
              style={{ background: `${color}20` }}
            />
            {node.children.map((child) => (
              <div key={child.id} className="relative">
                {/* Horizontal line */}
                <div
                  className="absolute left-[-12px] top-[14px] w-[12px] h-px"
                  style={{ background: `${color}30` }}
                />
                <NodeComponent node={child} parentId={node.id} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl space-y-4">
        {/* Instructions */}
        <div
          className="rounded-xl p-4 text-xs text-gray-500 flex items-start gap-3"
          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
        >
          <div className="space-y-1 flex-1">
            <p className="font-medium text-gray-700">How to use</p>
            <p>Start with your core question at the top. Break it down into MECE (Mutually Exclusive, Collectively Exhaustive) branches. Hover over any node to add children or remove it. Click the arrow to collapse/expand branches.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "#0F2744" }}
            >
              <Download size={11} />
              Export
            </button>
            <button
              onClick={() =>
                setRoot({
                  id: "root",
                  label: "",
                  children: [],
                  collapsed: false,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              <Trash2 size={11} />
              Clear
            </button>
          </div>
        </div>

        {/* Tree */}
        <div
          className="rounded-xl p-6 min-h-[400px]"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <NodeComponent node={root} parentId={null} depth={0} />
        </div>

        {/* MECE check */}
        <div
          className="rounded-xl p-4 text-xs"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <p className="font-medium text-amber-700 mb-1">MECE Checklist</p>
          <div className="grid grid-cols-2 gap-2 text-amber-600">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="rounded" />
              Branches are mutually exclusive (no overlap)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="rounded" />
              Branches are collectively exhaustive (complete coverage)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="rounded" />
              Each branch is at the same level of abstraction
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="rounded" />
              Leaf nodes are actionable/testable
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
