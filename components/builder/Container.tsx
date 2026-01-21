'use client';

import { useNode } from '@craftjs/core';
import { ReactNode } from 'react';

interface ContainerProps {
    children?: ReactNode;
    background?: string;
    padding?: string;
    margin?: string;
    flexDirection?: 'row' | 'column';
    gap?: string;
    borderRadius?: string;
}

export const Container = ({
    children,
    background = '#ffffff',
    padding = '20px',
    margin = '0',
    flexDirection = 'column',
    gap = '10px',
    borderRadius = '0px',
}: ContainerProps) => {
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
                background,
                padding,
                margin,
                display: 'flex',
                flexDirection,
                gap,
                borderRadius,
                border: selected ? '2px dashed #0891b2' : '2px dashed transparent',
                minHeight: '50px',
                cursor: 'move',
            }}
        >
            {children}
        </div>
    );
};

export const ContainerSettings = () => {
    const {
        actions: { setProp },
        background,
        padding,
        margin,
        flexDirection,
        gap,
        borderRadius,
    } = useNode((node) => ({
        background: node.data.props.background,
        padding: node.data.props.padding,
        margin: node.data.props.margin,
        flexDirection: node.data.props.flexDirection,
        gap: node.data.props.gap,
        borderRadius: node.data.props.borderRadius,
    }));

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background
                </label>
                <input
                    type="color"
                    value={background}
                    onChange={(e) =>
                        setProp((props: ContainerProps) => (props.background = e.target.value))
                    }
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
                    onChange={(e) => setProp((props: ContainerProps) => (props.padding = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="20px"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Margin
                </label>
                <input
                    type="text"
                    value={margin}
                    onChange={(e) => setProp((props: ContainerProps) => (props.margin = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direction
                </label>
                <select
                    value={flexDirection}
                    onChange={(e) =>
                        setProp((props: ContainerProps) => (props.flexDirection = e.target.value as any))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                    <option value="column">Vertical</option>
                    <option value="row">Horizontal</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gap
                </label>
                <input
                    type="text"
                    value={gap}
                    onChange={(e) => setProp((props: ContainerProps) => (props.gap = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="10px"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius
                </label>
                <input
                    type="text"
                    value={borderRadius}
                    onChange={(e) =>
                        setProp((props: ContainerProps) => (props.borderRadius = e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0px"
                />
            </div>
        </div>
    );
};

Container.craft = {
    props: {
        background: '#ffffff',
        padding: '20px',
        margin: '0',
        flexDirection: 'column',
        gap: '10px',
        borderRadius: '0px',
    },
    related: {
        settings: ContainerSettings,
    },
};
