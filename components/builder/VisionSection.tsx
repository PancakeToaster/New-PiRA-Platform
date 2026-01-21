'use client';

import { useNode } from '@craftjs/core';

export const VisionSection = ({
    title = 'Our Vision',
    vision = 'To be the world leader in robotics education...',
    description = 'With 10+ years of experience...',
}: {
    title?: string;
    vision?: string;
    description?: string;
}) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    return (
        <section
            ref={(ref) => ref && connect(drag(ref))}
            className={`mb-16 p-4 ${selected ? 'border-2 border-sky-400 rounded-lg' : ''}`}
        >
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{title}</h2>
            <p className="text-xl text-gray-700 mb-4 italic border-l-4 border-sky-500 pl-6">
                {vision}
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
                {description}
            </p>
        </section>
    );
};

export const VisionSettings = () => {
    const { actions: { setProp }, title, vision, description } = useNode((node) => ({
        title: node.data.props.title,
        vision: node.data.props.vision,
        description: node.data.props.description,
    }));

    return (
        <div className="space-y-4">
            <input
                type="text"
                value={title}
                onChange={(e) => setProp((props: any) => props.title = e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Section Title"
            />
            <textarea
                value={vision}
                onChange={(e) => setProp((props: any) => props.vision = e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Vision Statement"
                rows={3}
            />
            <textarea
                value={description}
                onChange={(e) => setProp((props: any) => props.description = e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Description"
                rows={4}
            />
        </div>
    );
};

VisionSection.craft = {
    props: {
        title: 'Our Vision',
        vision: 'A world where every student has the skills to innovate.',
        description: 'We have helped countless students develop their skills in robotics, programming, and STEM education.',
    },
    related: {
        settings: VisionSettings,
    },
};
