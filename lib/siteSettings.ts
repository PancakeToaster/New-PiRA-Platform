import { prisma } from './prisma';

export interface CompanyInfo {
    name: string;
    altName: string;
    tagline: string;
    mission: string;
    vision: string;
    description: string;
    yearsFounded: string;
    contact: {
        phone: string;
        email: string;
        address: {
            street: string;
            city: string;
            state: string;
            zip: string;
            country: string;
        };
    };
}

export interface Service {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export interface LearningStep {
    id: string;
    step: number;
    title: string;
    description: string;
    icon: string;
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
    const setting = await prisma.siteSetting.findUnique({
        where: { key: 'company_info' },
    });

    if (!setting) {
        // Fallback to default values if not seeded yet
        return {
            name: 'PLAYIDEAs',
            altName: 'PiRA',
            tagline: 'No Limits, Just Imagination',
            mission: 'Creating transformative learning experiences',
            vision: 'Play is the key to Infinite Potential',
            description: 'Robotics and STEM education',
            yearsFounded: '10+ Years',
            contact: {
                phone: '+1 917-285-5226',
                email: 'info@playideasny.com',
                address: {
                    street: '99 Jericho Turnpike, Suite 305',
                    city: 'Jericho',
                    state: 'NY',
                    zip: '11753',
                    country: 'United States',
                },
            },
        };
    }

    return JSON.parse(setting.value);
}

export async function getServices(): Promise<Service[]> {
    const setting = await prisma.siteSetting.findUnique({
        where: { key: 'services_list' },
    });

    if (!setting) return [];
    return JSON.parse(setting.value);
}

export async function getLearningProcess(): Promise<LearningStep[]> {
    const setting = await prisma.siteSetting.findUnique({
        where: { key: 'learning_process' },
    });

    if (!setting) return [];
    return JSON.parse(setting.value);
}
