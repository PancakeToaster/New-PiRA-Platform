'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Edge,
    Node,
    Position,
    ReactFlowProvider,
    Panel,
    ConnectionLineType,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MindmapViewProps {
    currentId?: string;
}

// Layout configuration for Mindmap (Left-to-Right)
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'LR' }); // Left-to-Right layout

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            // Shift to verify center point alignment
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

function MindmapFlow({ currentId }: MindmapViewProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/wiki/graph');
                const data = await res.json();

                if (data.nodes && data.edges) {
                    // Update edge styles for horizontal flow
                    const styledEdges = data.edges.map((edge: any) => ({
                        ...edge,
                        type: 'smoothstep', // Orthogonal lines look cleaner for mindmaps
                        animated: false,
                        style: { stroke: '#64748b', strokeWidth: 1.5 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            width: 20,
                            height: 20,
                            color: '#64748b',
                        },
                    }));

                    // Apply layout
                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                        data.nodes.map((node: any) => ({
                            ...node,
                            style: node.id === currentId
                                ? {
                                    background: '#ecfeff',
                                    border: '2px solid #0891b2',
                                    borderRadius: '8px',
                                    color: '#0e7490',
                                    fontWeight: 'bold',
                                    width: 180,
                                    padding: '10px',
                                    textAlign: 'center',
                                }
                                : {
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    width: 180,
                                    padding: '10px',
                                    textAlign: 'center',
                                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                                },
                        })),
                        styledEdges
                    );

                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
                }
            } catch (error) {
                console.error('Failed to fetch mindmap data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentId, setNodes, setEdges]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.data.slug) {
            router.push(`/wiki/${node.id}`);
        }
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
        );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-right"
            connectionLineType={ConnectionLineType.SmoothStep}
        >
            <Controls />
            <Background gap={20} size={1} color="#e2e8f0" />
            <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500">
                Mindmap View
            </Panel>
        </ReactFlow>
    );
}

export default function MindmapView({ currentId }: MindmapViewProps) {
    return (
        <ReactFlowProvider>
            <div className="h-[600px] w-full border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-slate-50">
                <MindmapFlow currentId={currentId} />
            </div>
        </ReactFlowProvider>
    );
}
