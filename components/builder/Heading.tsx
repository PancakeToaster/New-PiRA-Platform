'use client';

import { useNode } from '@craftjs/core';

interface HeadingProps {
    text: string;
    level: 'h1' | 'h2' | 'h3';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    margin?: string;
}

export const Heading = ({
    text = 'Heading',
    level = 'h2',
    color = '#000000',
    textAlign = 'left',
    margin = '20px 0',
}: HeadingProps) => {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const Tag = level;

    return (
        <Tag
            ref={(ref) => ref && connect(drag(ref))}
            style={{
                color,
                textAlign,
                margin,
                border: selected ? '2px solid #0891b2' : '2px solid transparent',
                cursor: 'move',
                fontWeight: 'bold',
            }}
        >
            {text}
        </Tag>
    );
};

export const HeadingSettings = () => {
    const {
        actions: { setProp },
        text,
        level,
        color,
        textAlign,
        margin,
    } = useNode((node) => ({
        text: node.data.props.text,
        level: node.data.props.level,
        color: node.data.props.color,
        textAlign: node.data.props.textAlign,
        margin: node.data.props.margin,
    }));

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text
                </label>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setProp((props: HeadingProps) => (props.text = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                </label>
                <select
                    value={level}
                    onChange={(e) =>
                        setProp((props: HeadingProps) => (props.level = e.target.value as any))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Align
                </label>
                <select
                    value={textAlign}
                    onChange={(e) =>
                        setProp((props: HeadingProps) => (props.textAlign = e.target.value as any))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                </label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setProp((props: HeadingProps) => (props.color = e.target.value))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Margin
                </label>
                <input
                    type="text"
                    value={margin}
                    onChange={(e) => setProp((props: HeadingProps) => (props.margin = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="20px 0"
                />
            </div>
        </div>
    );
};

Heading.craft = {
    props: {
        text: 'Heading',
        level: 'h2',
        color: '#000000',
        textAlign: 'left',
        margin: '20px 0',
    },
    related: {
        settings: HeadingSettings,
    },
};
