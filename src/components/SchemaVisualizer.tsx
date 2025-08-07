"use client";

import { useState, useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import { Database, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SchemaVisualizer() {
  const { activeConnection, schemas } = useStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Generate nodes and edges from schema
  const generateSchemaGraph = useCallback(() => {
    if (!activeConnection || !schemas[activeConnection.id]) return;

    const schema = schemas[activeConnection.id];
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let nodeId = 0;

    if (schema.tables) {
      // PostgreSQL tables
      schema.tables.forEach((table, index) => {
        const isExpanded = expandedNodes.has(table.name);
        const node: Node = {
          id: table.name,
          type: "tableNode",
          position: { x: index * 300, y: index * 200 },
          data: {
            label: table.name,
            columns: table.columns,
            isExpanded,
            onToggle: () => toggleNodeExpansion(table.name),
          },
          style: {
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "12px",
            minWidth: "200px",
          },
        };
        newNodes.push(node);
      });
    } else if (schema.collections) {
      // MongoDB collections
      schema.collections.forEach((collection, index) => {
        const isExpanded = expandedNodes.has(collection.name);
        const node: Node = {
          id: collection.name,
          type: "collectionNode",
          position: { x: index * 300, y: index * 200 },
          data: {
            label: collection.name,
            fields: collection.fields,
            isExpanded,
            onToggle: () => toggleNodeExpansion(collection.name),
          },
          style: {
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "12px",
            minWidth: "200px",
          },
        };
        newNodes.push(node);
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    activeConnection,
    schemas,
    expandedNodes,
    toggleNodeExpansion,
    setNodes,
    setEdges,
  ]);

  // Custom node components
  const TableNode = ({ data }: { data: any }) => (
    <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
        <button onClick={data.onToggle} className="p-1 hover:bg-accent rounded">
          {data.isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {data.isExpanded && (
        <div className="space-y-1">
          {data.columns.slice(0, 10).map((column: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <span className="font-mono">{column.name}</span>
              <span className="text-muted-foreground">{column.type}</span>
            </div>
          ))}
          {data.columns.length > 10 && (
            <div className="text-xs text-muted-foreground mt-2">
              +{data.columns.length - 10} more columns
            </div>
          )}
        </div>
      )}
    </div>
  );

  const CollectionNode = ({ data }: { data: any }) => (
    <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4" />
          <span className="font-medium">{data.label}</span>
        </div>
        <button onClick={data.onToggle} className="p-1 hover:bg-accent rounded">
          {data.isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {data.isExpanded && (
        <div className="space-y-1">
          {data.fields.slice(0, 10).map((field: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <span className="font-mono">{field.name}</span>
              <span className="text-muted-foreground">{field.type}</span>
            </div>
          ))}
          {data.fields.length > 10 && (
            <div className="text-xs text-muted-foreground mt-2">
              +{data.fields.length - 10} more fields
            </div>
          )}
        </div>
      )}
    </div>
  );

  const nodeTypes = {
    tableNode: TableNode,
    collectionNode: CollectionNode,
  };

  // Generate graph when component mounts or dependencies change
  useEffect(() => {
    generateSchemaGraph();
  }, [generateSchemaGraph]);

  if (!activeConnection) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Database Selected</h2>
          <p className="text-muted-foreground">
            Please select a database connection to view its schema
          </p>
        </div>
      </div>
    );
  }

  const schema = schemas[activeConnection.id];
  if (!schema) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Schema Available</h2>
          <p className="text-muted-foreground">
            Connect to a database to view its schema
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5" />
          <div>
            <h2 className="font-semibold">Schema Visualizer</h2>
            <p className="text-sm text-muted-foreground">
              {activeConnection.name} • {activeConnection.type}
            </p>
          </div>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="h-[calc(100%-80px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
