'use client';

import { useNode } from '@craftjs/core';

export const ProcessSection = ({
    title = 'Our Learning Process',
    description = 'We follow a proven approach...',
    steps = [
        { step: 1, title: 'Learn', description: 'Master the basics.', icon: '📚' },
        { step: 2, title: 'Build', description: 'Assemble robots.', icon: '🛠️' },
        { step: 3, title: 'Code', description: 'Program logic.', icon: '💻' },
        { step: 4, title: 'Compete', description: 'Test skills.', icon: '🏆' },
    ]
}: {
    title?: string;
    description?: string;
    steps?: any[];
}) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    return (
        <section
            ref={(ref) => { if (ref) connect(drag(ref)); }}
            className={`mb-16 p-4 ${selected ? 'border-2 border-sky-400 rounded-lg' : ''}`}
        >
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{title}</h2>
            <p className="text-lg text-gray-600 mb-8">{description}</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((step) => (
                    <div key={step.step} className="text-center">
                        <div className="text-5xl mb-4">{step.icon}</div>
                        <div className="inline-block px-3 py-1 bg-sky-100 text-sky-600 text-sm font-semibold rounded-full mb-2">
                            Step {step.step}
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-gray-900">{step.title}</h3>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const ProcessSettings = () => {
    const { actions: { setProp }, title, description, steps } = useNode((node) => ({
        title: node.data.props.title,
        description: node.data.props.description,
        steps: node.data.props.steps || [],
    }));

    const addStep = () => {
        setProp((props: any) => {
            const newStep = props.steps.length + 1;
            props.steps = [...props.steps, { step: newStep, title: 'New Step', description: 'Description', icon: '⭐' }];
        });
    };

    const updateStep = (index: number, field: string, value: any) => {
        setProp((props: any) => {
            props.steps[index][field] = value;
        });
    };

    const removeStep = (index: number) => {
        setProp((props: any) => {
            props.steps = props.steps.filter((_: any, i: number) => i !== index);
            // Renumber steps
            props.steps.forEach((step: any, i: number) => step.step = i + 1);
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setProp((props: any) => props.title = e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setProp((props: any) => props.description = e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                />
            </div>

            <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Steps</label>
                    <button
                        onClick={addStep}
                        className="px-3 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600"
                    >
                        + Add Step
                    </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {steps.map((step: any, index: number) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-gray-500">Step {step.step}</span>
                                <button
                                    onClick={() => removeStep(index)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={step.icon}
                                    onChange={(e) => updateStep(index, 'icon', e.target.value)}
                                    placeholder="Icon (emoji)"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                                    placeholder="Title"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <textarea
                                    value={step.description}
                                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                                    placeholder="Description"
                                    rows={2}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

ProcessSection.craft = {
    props: {
        title: 'Our Learning Process',
        description: 'We follow a proven four-step approach to robotics education:',
        steps: [
            { step: 1, title: 'Discover', description: 'Learn the fundamentals of mechanics.', icon: '🔍' },
            { step: 2, title: 'Design', description: 'Create your own robot solutions.', icon: '✏️' },
            { step: 3, title: 'Build', description: 'Assemble and wire your creation.', icon: '🔧' },
            { step: 4, title: 'Code', description: 'Bring your robot to life.', icon: '💻' },
        ],
    },
    related: {
        settings: ProcessSettings,
    }
}
