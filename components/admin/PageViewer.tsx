'use client';

import { Editor, Frame } from '@craftjs/core';
import { Text } from '../builder/Text';
import { Heading } from '../builder/Heading';
import { Container } from '../builder/Container';
import { ButtonComponent } from '../builder/Button';
import { MissionSection } from '../builder/MissionSection';
import { TeamSection } from '../builder/TeamSection';
import { ServicesSection } from '../builder/ServicesSection';
import { VisionSection } from '../builder/VisionSection';
import { ProcessSection } from '../builder/ProcessSection';
import { ValuesSection } from '../builder/ValuesSection';
import { Image } from '../builder/Image';

interface PageViewerProps {
    data: string;
}

export default function PageViewer({ data }: PageViewerProps) {
    return (
        <Editor
            resolver={{
                Text,
                Heading,
                Container,
                ButtonComponent,
                Image,
                MissionSection,
                VisionSection,
                ServicesSection,
                ProcessSection,
                ValuesSection,
                TeamSection,
            }}
            enabled={false} // Disable editing
        >
            <Frame data={data}>
                <div>Content will render here</div>
            </Frame>
        </Editor>
    );
}
