'use client';

import { useNode } from '@craftjs/core';

interface ButtonProps {
    text: string;
    href?: string;
    background?: string;
    color?: string;
    padding?: string;
    borderRadius?: string;
    fontSize?: string;
}

export const ButtonComponent = ({
    text = 'Click me',
    href = '#',
    background = '#0891b2',
    color = '#ffffff',
    padding = '12px 24px',
    borderRadius = '6px',
    fontSize = '16px',
}: ButtonProps) => {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((state) => ({
        selected: state.events.selected,
    }));

    return (
        <a
            ref={(ref) => ref && connect(drag(ref))}
            href={href}
            style={{
                display: 'inline-block',
                background,
                color,
                padding,
                borderRadius,
                fontSize,
                textDecoration: 'none',
                fontWeight: '600',
                border: selected ? '2px solid #0891b2' : 'none',
                cursor: 'move',
                boxShadow: selected ? '0 0 0 2px #0891b2' : 'none',
            }}
        >
            {text}
        </a>
    );
};

export const ButtonSettings = () => {
    const {
        actions: { setProp },
        text,
        href,
        background,
        color,
        padding,
        borderRadius,
        fontSize,
    } = useNode((node) => ({
        text: node.data.props.text,
        href: node.data.props.href,
        background: node.data.props.background,
        color: node.data.props.color,
        padding: node.data.props.padding,
        borderRadius: node.data.props.borderRadius,
        fontSize: node.data.props.fontSize,
    }));

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Text
                </label>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setProp((props: ButtonProps) => (props.text = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL
                </label>
                <input
                    type="text"
                    value={href}
                    onChange={(e) => setProp((props: ButtonProps) => (props.href = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="#"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                </label>
                <input
                    type="color"
                    value={background}
                    onChange={(e) => setProp((props: ButtonProps) => (props.background = e.target.value))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                </label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setProp((props: ButtonProps) => (props.color = e.target.value))}
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
                    onChange={(e) => setProp((props: ButtonProps) => (props.padding = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="12px 24px"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius
                </label>
                <input
                    type="text"
                    value={borderRadius}
                    onChange={(e) => setProp((props: ButtonProps) => (props.borderRadius = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="6px"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size
                </label>
                <input
                    type="text"
                    value={fontSize}
                    onChange={(e) => setProp((props: ButtonProps) => (props.fontSize = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="16px"
                />
            </div>
        </div>
    );
};

ButtonComponent.craft = {
    props: {
        text: 'Click me',
        href: '#',
        background: '#0891b2',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '6px',
        fontSize: '16px',
    },
    related: {
        settings: ButtonSettings,
    },
};
