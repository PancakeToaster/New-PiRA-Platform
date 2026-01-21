'use client';

import { useNode } from '@craftjs/core';

export const ValuesSection = ({
    title = 'Our Values',
    values = [
        { title: 'Innovation', description: 'Creative thinking.', color: 'sky' },
        { title: 'Excellence', description: 'Striving for best.', color: 'sky' },
        { title: 'Inclusivity', description: 'For everyone.', color: 'sky' },
        { title: 'Collaboration', description: 'Working together.', color: 'sky' },
    ]
}: {
    title?: string;
    values?: any[];
}) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    return (
        <section
            ref={(ref) => ref && connect(drag(ref))}
            className={`mb-16 p-4 ${selected ? 'border-2 border-sky-400 rounded-lg' : ''}`}
        >
            <h2 className="text-3xl font-bold mb-8 text-gray-900">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {values.map((value: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-2xl border border-sky-100">
                        <h3 className="text-xl font-bold mb-2 text-sky-600">{value.title}</h3>
                        <p className="text-gray-600">
                            {value.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const ValuesSettings = () => {
    const { actions: { setProp }, title, values } = useNode((node) => ({
        title: node.data.props.title,
        values: node.data.props.values || [],
    }));

    const addValue = () => {
        setProp((props: any) => {
            props.values = [...props.values, { title: 'New Value', description: 'Description' }];
        });
    };

    const updateValue = (index: number, field: string, value: string) => {
        setProp((props: any) => {
            props.values[index][field] = value;
        });
    };

    const removeValue = (index: number) => {
        setProp((props: any) => {
            props.values = props.values.filter((_: any, i: number) => i !== index);
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

            <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Values</label>
                    <button
                        onClick={addValue}
                        className="px-3 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600"
                    >
                        + Add Value
                    </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {values.map((value: any, index: number) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-gray-500">Value {index + 1}</span>
                                <button
                                    onClick={() => removeValue(index)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={value.title}
                                    onChange={(e) => updateValue(index, 'title', e.target.value)}
                                    placeholder="Title"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <textarea
                                    value={value.description}
                                    onChange={(e) => updateValue(index, 'description', e.target.value)}
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

ValuesSection.craft = {
    props: {
        title: 'Our Values',
        values: [
            { title: 'Innovation', description: 'We encourage creative thinking and innovative solutions to real-world problems.' },
            { title: 'Excellence', description: 'We strive for excellence in everything we do, from curriculum design to student support.' },
            { title: 'Inclusivity', description: 'We believe robotics education should be accessible to all students.' },
            { title: 'Collaboration', description: 'We foster a collaborative learning environment where students learn from each other.' },
        ],
    },
    related: {
        settings: ValuesSettings,
    }
}
