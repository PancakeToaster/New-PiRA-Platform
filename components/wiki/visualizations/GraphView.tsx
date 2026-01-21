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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GraphViewProps {
    currentId?: string; // ID of the currently viewed page/folder
}

// Layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

// Auto-layout function
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

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
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

function GraphFlow({ currentId }: GraphViewProps) {
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
                    // Apply layout
                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                        data.nodes.map((node: any) => ({
                            ...node,
                            // Style current node
                            style: node.id === currentId
                                ? {
                                    background: '#ecfeff',
                                    border: '2px solid #0284c7',
                                    color: '#0e7490',
                                    fontWeight: 'bold'
                                }
                                : { background: '#fff' },
                        })),
                        data.edges
                    );

                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
                }
            } catch (error) {
                console.error('Failed to fetch graph data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentId, setNodes, setEdges]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.data.slug) {
            router.push(`/wiki/${node.id}`);
        } else if (node.type === 'folder') {
            // Can't navigate to folders directly yet, but could expand/collapse
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
        >
            <Controls />
            <Background gap={12} size={1} />
            <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500">
                {nodes.length} nodes • {edges.length} links
            </Panel>
        </ReactFlow>
    );
}

export default function GraphView({ currentId }: GraphViewProps) {
    return (
        <ReactFlowProvider>
            <div className="h-[600px] w-full border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-gray-50">
                <GraphFlow currentId={currentId} />
            </div>
        </ReactFlowProvider>
    );
}
