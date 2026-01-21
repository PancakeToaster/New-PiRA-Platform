'use client';

import { useNode } from '@craftjs/core';
import { getCompanyInfo } from '@/lib/siteSettings';
import { useEffect, useState } from 'react';

// Client-side wrapper to fetch data or accept props
export const MissionSection = ({
    title = 'Our Mission',
    mission = 'Creating transformative learning experiences',
    description = 'Leader in digital business...',
}: {
    title?: string;
    mission?: string;
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
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">{mission}</p>
            <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
        </section>
    );
};

export const MissionSettings = () => {
    const { actions: { setProp }, title, mission, description } = useNode((node) => ({
        title: node.data.props.title,
        mission: node.data.props.mission,
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
                value={mission}
                onChange={(e) => setProp((props: any) => props.mission = e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Mission Statement"
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

MissionSection.craft = {
    props: {
        title: 'Our Mission',
        mission: 'Creating transformative learning experiences that inspire creativity and innovation',
        description: 'Leader in digital business, helping companies of all sizes to thrive in an ever-changing landscape.',
    },
    related: {
        settings: MissionSettings,
    },
};
