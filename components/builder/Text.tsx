'use client';

import { useNode } from '@craftjs/core';
import { useState } from 'react';

interface TextProps {
    text: string;
    fontSize?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    padding?: string;
}

export const Text = ({
    text = 'Edit this text',
    fontSize = '16px',
    textAlign = 'left',
    color = '#000000',
    padding = '10px',
}: TextProps) => {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((state) => ({
        selected: state.events.selected,
    }));

    return (
        <div
            ref={(ref) => ref && connect(drag(ref))}
            style={{
                fontSize,
                textAlign,
                color,
                padding,
                border: selected ? '2px solid #0891b2' : '2px solid transparent',
                cursor: 'move',
            }}
        >
            <p dangerouslySetInnerHTML={{ __html: text }} />
        </div>
    );
};

export const TextSettings = () => {
    const {
        actions: { setProp },
        text,
        fontSize,
        textAlign,
        color,
        padding,
    } = useNode((node) => ({
        text: node.data.props.text,
        fontSize: node.data.props.fontSize,
        textAlign: node.data.props.textAlign,
        color: node.data.props.color,
        padding: node.data.props.padding,
    }));

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Content
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setProp((props: TextProps) => (props.text = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size
                </label>
                <input
                    type="text"
                    value={fontSize}
                    onChange={(e) => setProp((props: TextProps) => (props.fontSize = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="16px"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Align
                </label>
                <select
                    value={textAlign}
                    onChange={(e) =>
                        setProp((props: TextProps) => (props.textAlign = e.target.value as any))
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
                    onChange={(e) => setProp((props: TextProps) => (props.color = e.target.value))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Padding
                </label>
                <input
                    type="text"
                    value={padding}
                    onChange={(e) => setProp((props: TextProps) => (props.padding = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="10px"
                />
            </div>
        </div>
    );
};

Text.craft = {
    props: {
        text: 'Edit this text',
        fontSize: '16px',
        textAlign: 'left',
        color: '#000000',
        padding: '10px',
    },
    related: {
        settings: TextSettings,
    },
};
