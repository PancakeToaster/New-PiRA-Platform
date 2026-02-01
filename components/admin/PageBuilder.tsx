'use client';

import React from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { useState } from 'react';
import { Toolbox } from '../builder/Toolbox';
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
import { Button } from '../ui/Button';
import { Save, X, Settings as SettingsIcon } from 'lucide-react';

interface PageBuilderProps {
    initialData?: string;
    id: string;
    apiEndpoint: string;
    onSave?: () => void;
}

const SettingsPanel = () => {
    const { selected, actions } = useEditor((state, query) => {
        const [currentNodeId] = state.events.selected;
        let selected;

        if (currentNodeId) {
            selected = {
                id: currentNodeId,
                name: state.nodes[currentNodeId].data.name,
                settings:
                    state.nodes[currentNodeId].related &&
                    state.nodes[currentNodeId].related.settings,
                isDeletable: query.node(currentNodeId).isDeletable(),
            };
        }

        return {
            selected,
        };
    });

    return (
        <div className="bg-card border-l border-border w-80 p-4 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Settings
            </h3>
            {selected ? (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                            {selected.name}
                        </h4>
                        {selected.isDeletable && (
                            <button
                                onClick={() => {
                                    if (confirm('Delete this component?')) {
                                        actions.delete(selected.id);
                                    }
                                }}
                                className="px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 rounded transition-colors font-medium text-xs"
                                title="Delete component"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                    {selected.settings && React.createElement(selected.settings)}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Select a component to edit its properties
                </p>
            )}
        </div>
    );
};

const EditorToolbar = ({
    onSave,
    onCancel,
    isSaving,
}: {
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
}) => {
    return (
        <div className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
            <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                        Page Builder Mode
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={onSave} variant="primary" size="sm" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={onCancel} variant="secondary" size="sm" disabled={isSaving}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function PageBuilder({
    initialData,
    id,
    apiEndpoint,
    onSave: onSaveCallback,
}: PageBuilderProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSave = async (query: any) => {
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const json = query.serialize();
            const response = await fetch(`${apiEndpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    builderData: json,
                    editorType: 'builder',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save');
            }

            setSaveStatus('success');
            onSaveCallback?.();

            // Navigate back to view mode after successful save
            setTimeout(() => {
                window.location.href = window.location.pathname;
            }, 500);
        } catch (error) {
            console.error('Error saving:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        console.log('Cancel button clicked');
        if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
            console.log('User confirmed cancel, navigating to:', window.location.pathname);
            window.location.href = window.location.pathname;
        } else {
            console.log('User cancelled the cancel');
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
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
            >
                <EditorContent
                    initialData={initialData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                />
            </Editor>
        </div>
    );
}

function EditorContent({
    initialData,
    onSave,
    onCancel,
    isSaving,
    saveStatus,
}: {
    initialData?: string;
    onSave: (query: any) => void;
    onCancel: () => void;
    isSaving: boolean;
    saveStatus: 'idle' | 'success' | 'error';
}) {
    const { query } = useEditor();

    return (
        <>
            <EditorToolbar
                onSave={() => onSave(query)}
                onCancel={onCancel}
                isSaving={isSaving}
            />

            {saveStatus === 'success' && (
                <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 text-sm text-green-600">
                    ✓ Saved successfully! Reloading...
                </div>
            )}
            {saveStatus === 'error' && (
                <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm text-destructive">
                    ✗ Failed to save. Please try again.
                </div>
            )}

            <div className="flex h-[calc(100vh-140px)]">
                <Toolbox />

                <div className="flex-1 overflow-y-auto p-8 bg-muted/50">
                    <div className="max-w-4xl mx-auto bg-card shadow-lg rounded-lg p-8 min-h-[600px]">
                        <Frame data={initialData}>
                            <Element
                                is={Container}
                                canvas
                                background="#ffffff"
                                padding="40px"
                            >
                                <Heading text="Welcome to Page Builder" level="h2" />
                                <Text text="Drag components from the left sidebar to build your page. Click on any component to edit its properties in the right panel." />
                            </Element>
                        </Frame>
                    </div>
                </div>

                <SettingsPanel />
            </div>
        </>
    );
}
