'use client';

import { useCallback, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Edge,
    Node,
    addEdge,
    Connection,
    ReactFlowProvider,
    Panel,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Plus, StickyNote, Image as ImageIcon, Type } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Initial nodes if canvasData is empty
const initialNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start brainstorming...' }, type: 'input' },
];

interface CanvasEditorProps {
    nodeId: string;
    initialData?: {
        nodes: Node[];
        edges: Edge[];
    };
    isAdmin: boolean;
}

function CanvasFlow({ nodeId, initialData, isAdmin }: CanvasEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);
    const [isSaving, setIsSaving] = useState(false);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
        [setEdges]
    );

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save nodes and edges to backend (implementation needed in API)
            // For now, we simulate saving or log
            console.log('Saving canvas state:', { nodes, edges });

            await fetch(`/api/wiki/nodes/${nodeId}/canvas`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ canvasData: { nodes, edges } }),
            });

        } catch (error) {
            console.error('Failed to save canvas:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const addNode = (type: string) => {
        const id = `node-${Date.now()}`;
        const newNode: Node = {
            id,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: type === 'default' ? 'New Note' : 'Text Node' },
            type: type === 'output' ? 'output' : 'default',
            style: type === 'default'
                ? { background: '#fef08a', color: '#854d0e', border: '1px solid #eab308' } // Sticky note style
                : undefined,
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <div className="h-full w-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                attributionPosition="bottom-right"
            >
                <Controls />
                <Background gap={20} size={1} />

                {isAdmin && (
                    <Panel position="top-left" className="bg-white p-2 rounded-lg shadow-md border border-gray-200 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => addNode('default')} title="Add Sticky Note">
                            <StickyNote className="w-4 h-4 mr-2" /> Note
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => addNode('output')} title="Add Text">
                            <Type className="w-4 h-4 mr-2" /> Text
                        </Button>
                        <div className="w-px bg-gray-200 mx-1" />
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className={isSaving ? 'opacity-70' : ''}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Canvas'}
                        </Button>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
}

export default function CanvasEditor(props: CanvasEditorProps) {
    return (
        <ReactFlowProvider>
            <div className="h-[600px] w-full border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-white">
                <CanvasFlow {...props} />
            </div>
        </ReactFlowProvider>
    );
}
