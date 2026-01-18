
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    MarkerType,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from '@dagrejs/dagre';
import { Loader2, RefreshCw, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Dagre Layouting Force
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 60; // Approximate

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

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We shift the dagre node position (anchor=center center) to the top left
        // so it matches React Flow's anchor point
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

interface MindMapTabProps {
    entities: any[];
    transcript: string;
    apiKey: string;
}

export default function MindMapTab({ entities, transcript, apiKey }: MindMapTabProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Initial Entity Nodes (Disconneted)
    const initialNodes = entities.map((e, i) => ({
        id: e.text,
        data: { label: e.text },
        position: { x: 0, y: 0 }, // Will be layouted
        style: {
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            width: 150,
            textAlign: 'center'
        },
        type: 'default' // or custom
    }));


    const handleGenerate = async () => {
        if (!apiKey) {
            alert("No API Key provided");
            return;
        }
        setIsGenerating(true);

        try {
            // 1. Get Edges from AI
            const res = await fetch('/api/generate-mindmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entities: entities.slice(0, 30), // Limit to top 30 to avoid chaos
                    context: transcript,
                    apiKey
                })
            });

            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            const aiEdges = data.edges || [];

            // 2. Map to ReactFlow Edges
            const newEdges: Edge[] = aiEdges.map((e: any, i: number) => ({
                id: `e-${i}`,
                source: e.source,
                target: e.target,
                label: e.label,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6' }, // Blue
                labelStyle: { fill: '#6b7280', fontSize: 10 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            }));

            // 3. Filter Nodes that have connections (Optional? No, let's keep all provided entities or just connected ones?)
            // Let's keep all entities passed in, but layout them.
            // Actually, if we only show connected nodes it might be cleaner.
            // Let's stick to ALL entities for now so we don't lose data.

            // 4. Compute Layout
            const layout = getLayoutedElements(
                // Use fresh initial nodes to reset positions
                JSON.parse(JSON.stringify(initialNodes)), // Deep copy 
                newEdges
            );

            setNodes(layout.nodes);
            setEdges(layout.edges);
            setHasGenerated(true);

        } catch (err) {
            console.error(err);
            alert("Failed to generate mind map");
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-generate on first load if we have data? Maybe not, costly. 
    // Let user click "Generate Graph".

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {hasGenerated ? "Regenerate Graph" : "Generate Graph"}
                </button>
            </div>

            {!hasGenerated && !isGenerating && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-gray-400">
                    <Share2 className="w-12 h-12 mb-2 opacity-20" />
                    <p>Click "Generate Graph" to visualize connections</p>
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                className="bg-slate-50"
            >
                <Background color="#ccc" gap={20} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
