'use client';

import { useNode } from '@craftjs/core';

export const ServicesSection = ({
    title = 'What We Offer',
    services = [
        { title: 'Robotics Classes', description: 'Hands-on learning with VEX and LEGO.', icon: '🤖' },
        { title: 'Coding Camps', description: 'Python, Java, and block-based coding.', icon: '💻' },
        { title: 'Competitions', description: 'Join our award-winning teams.', icon: '🏆' },
        { title: 'Private Tutoring', description: 'One-on-one personalized instruction.', icon: '📚' },
    ]
}: {
    title?: string;
    services?: any[];
}) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    return (
        <section
            ref={(ref) => { if (ref) connect(drag(ref)); }}
            className={`mb-16 p-4 ${selected ? 'border-2 border-sky-400 rounded-lg' : ''}`}
        >
            <h2 className="text-3xl font-bold mb-8 text-gray-900">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service, idx) => (
                    <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-4">{service.icon}</div>
                        <h3 className="text-xl font-bold mb-2 text-sky-600">{service.title}</h3>
                        <p className="text-gray-600">{service.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const ServicesSettings = () => {
    const { actions: { setProp }, title, services } = useNode((node) => ({
        title: node.data.props.title,
        services: node.data.props.services || [],
    }));

    const addService = () => {
        setProp((props: any) => {
            props.services = [...props.services, { title: 'New Service', description: 'Description', icon: '⭐' }];
        });
    };

    const updateService = (index: number, field: string, value: string) => {
        setProp((props: any) => {
            props.services[index][field] = value;
        });
    };

    const removeService = (index: number) => {
        setProp((props: any) => {
            props.services = props.services.filter((_: any, i: number) => i !== index);
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
                    <label className="block text-sm font-medium text-gray-700">Services</label>
                    <button
                        onClick={addService}
                        className="px-3 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600"
                    >
                        + Add Service
                    </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {services.map((service: any, index: number) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-gray-500">Service {index + 1}</span>
                                <button
                                    onClick={() => removeService(index)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={service.icon}
                                    onChange={(e) => updateService(index, 'icon', e.target.value)}
                                    placeholder="Icon (emoji)"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                    type="text"
                                    value={service.title}
                                    onChange={(e) => updateService(index, 'title', e.target.value)}
                                    placeholder="Title"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <textarea
                                    value={service.description}
                                    onChange={(e) => updateService(index, 'description', e.target.value)}
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

ServicesSection.craft = {
    props: {
        title: 'What We Offer',
        services: [
            { title: 'Robotics Classes', description: 'Hands-on learning with VEX and LEGO.', icon: '🤖' },
            { title: 'Coding Camps', description: 'Python, Java, and block-based coding.', icon: '💻' },
            { title: 'Competitions', description: 'Join our award-winning teams.', icon: '🏆' },
            { title: 'Private Tutoring', description: 'One-on-one personalized instruction.', icon: '📚' },
        ],
    },
    related: {
        settings: ServicesSettings,
    }
}
