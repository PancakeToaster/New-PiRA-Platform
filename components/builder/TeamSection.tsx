'use client';

import { useNode } from '@craftjs/core';
import { Element } from '@craftjs/core';

// Helper to render individual team member card
const TeamMemberCard = ({ name, role, bio, image }: any) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-xl transition-shadow">
        {image ? (
            <img src={image} alt={name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
        ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">
                    {name.split(' ').map((n: string) => n[0]).join('')}
                </span>
            </div>
        )}
        <h3 className="text-xl font-bold mb-1 text-gray-900">{name}</h3>
        <p className="text-sky-600 font-semibold mb-3">{role}</p>
        <p className="text-gray-600 text-sm">{bio}</p>
    </div>
);

export const TeamSection = ({
    title = 'Our Team',
    members = [
        { id: 1, name: 'John Doe', role: 'Founder', bio: 'Robotics expert with 10 years exp.' },
        { id: 2, name: 'Jane Smith', role: 'Lead Instructor', bio: 'Passionate about STEM education.' },
        { id: 3, name: 'Mike Johnson', role: 'Coach', bio: 'Former competitive robotics champion.' },
    ],
}: {
    title?: string;
    members?: any[];
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {members.map((member) => (
                    <TeamMemberCard key={member.id} {...member} />
                ))}
            </div>
        </section>
    );
};

export const TeamSettings = () => {
    const { actions: { setProp }, title, members } = useNode((node) => ({
        title: node.data.props.title,
        members: node.data.props.members || [],
    }));

    const addMember = () => {
        setProp((props: any) => {
            const newId = Math.max(...props.members.map((m: any) => m.id || 0), 0) + 1;
            props.members = [...props.members, { id: newId, name: 'New Member', role: 'Role', bio: 'Bio', image: '' }];
        });
    };

    const updateMember = (index: number, field: string, value: any) => {
        setProp((props: any) => {
            props.members[index][field] = value;
        });
    };

    const removeMember = (index: number) => {
        setProp((props: any) => {
            props.members = props.members.filter((_: any, i: number) => i !== index);
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
                    <label className="block text-sm font-medium text-gray-700">Team Members</label>
                    <button
                        onClick={addMember}
                        className="px-3 py-1 bg-sky-500 text-white rounded text-xs hover:bg-sky-600"
                    >
                        + Add Member
                    </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {members.map((member: any, index: number) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-gray-500">Member {index + 1}</span>
                                <button
                                    onClick={() => removeMember(index)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                                    placeholder="Name"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                    type="text"
                                    value={member.role}
                                    onChange={(e) => updateMember(index, 'role', e.target.value)}
                                    placeholder="Role"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <textarea
                                    value={member.bio}
                                    onChange={(e) => updateMember(index, 'bio', e.target.value)}
                                    placeholder="Bio"
                                    rows={2}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                    type="text"
                                    value={member.image || ''}
                                    onChange={(e) => updateMember(index, 'image', e.target.value)}
                                    placeholder="Image URL (optional)"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <p className="text-xs text-gray-500">Tip: Use the Image component to upload, then paste URL here</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

TeamSection.craft = {
    props: {
        title: 'Our Team',
        members: [
            { id: 1, name: 'John Doe', role: 'Founder', bio: 'Robotics expert with 10 years exp.' },
            { id: 2, name: 'Jane Smith', role: 'Lead Instructor', bio: 'Passionate about STEM education.' },
            { id: 3, name: 'Mike Johnson', role: 'Coach', bio: 'Former competitive robotics champion.' },
        ],
    },
    related: {
        settings: TeamSettings,
    },
};
