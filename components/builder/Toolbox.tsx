'use client';

import { useEditor, Element } from '@craftjs/core';
import { Text } from './Text';
import { Heading } from './Heading';
import { Container } from './Container';
import { ButtonComponent } from './Button';
import { MissionSection } from './MissionSection';
import { TeamSection } from './TeamSection';
import { ServicesSection } from './ServicesSection';
import { VisionSection } from './VisionSection';
import { ProcessSection } from './ProcessSection';
import { ValuesSection } from './ValuesSection';
import { Image } from './Image';

export const Toolbox = () => {
    const { connectors } = useEditor();

    return (
        <div className="bg-white border-r border-gray-200 w-64 p-4 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Components</h3>
            <div className="space-y-2">
                <button
                    ref={(ref) => {
                        if (ref) connectors.create(ref, <Element is={Container} canvas />);
                    }}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                    <div className="font-semibold text-gray-900">Container</div>
                    <div className="text-xs text-gray-600">Layout wrapper</div>
                </button>

                <button
                    ref={(ref) => { if (ref) connectors.create(ref, <Heading text="Heading" level="h2" />); }}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                    <div className="font-semibold text-gray-900">Heading</div>
                    <div className="text-xs text-gray-600">H1, H2, H3</div>
                </button>

                <button
                    ref={(ref) => { if (ref) connectors.create(ref, <Text text="Edit this text" />); }}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                    <div className="font-semibold text-gray-900">Text</div>
                    <div className="text-xs text-gray-600">Paragraph text</div>
                </button>

                <button
                    ref={(ref) => { if (ref) connectors.create(ref, <ButtonComponent text="Click me" />); }}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                    <div className="font-semibold text-gray-900">Button</div>
                    <div className="text-xs text-gray-600">Call to action</div>
                </button>

                <button
                    ref={(ref) => { if (ref) connectors.create(ref, <Image />); }}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                    <div className="font-semibold text-gray-900">Image</div>
                    <div className="text-xs text-gray-600">Add an image</div>
                </button>

                <div className="border-t border-gray-200 my-4 pt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sections</h4>

                    <button
                        ref={(ref) => { if (ref) connectors.create(ref, <MissionSection />); }}
                        className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors mb-2"
                    >
                        <div className="font-semibold text-indigo-900">Mission Section</div>
                        <div className="text-xs text-indigo-600">Title & Description</div>
                    </button>

                    <button
                        ref={(ref) => { if (ref) connectors.create(ref, <VisionSection />); }}
                        className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors mb-2"
                    >
                        <div className="font-semibold text-indigo-900">Vision Section</div>
                        <div className="text-xs text-indigo-600">Quote & Description</div>
                    </button>

                    <button
                        ref={(ref) => { if (ref) connectors.create(ref, <ServicesSection />); }}
                        className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors mb-2"
                    >
                        <div className="font-semibold text-indigo-900">Services Grid</div>
                        <div className="text-xs text-indigo-600">4-column grid</div>
                    </button>

                    <button
                        ref={(ref) => { if (ref) connectors.create(ref, <ProcessSection />); }}
                        className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors mb-2"
                    >
                        <div className="font-semibold text-indigo-900">Process Steps</div>
                        <div className="text-xs text-indigo-600">Step-by-step</div>
                    </button>

                    <button
                        ref={(ref) => { if (ref) connectors.create(ref, <ValuesSection />); }}
                        className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors mb-2"
                    >
                        <div className="font-semibold text-indigo-900">Values Grid</div>
                        <div className="text-xs text-indigo-600">2-column grid</div>
                    </button>

                    <button
                        ref={(ref) => { if (ref) connectors.create(ref, <TeamSection />); }}
                        className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                    >
                        <div className="font-semibold text-indigo-900">Team Section</div>
                        <div className="text-xs text-indigo-600">Member cards</div>
                    </button>
                </div>
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                    <strong>Tip:</strong> Drag components onto the canvas to add them. Click to select and edit properties.
                </p>
            </div>
        </div>
    );
};
