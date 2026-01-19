import { prisma } from '@/lib/prisma';
import ContactClient from '@/components/contact/ContactClient';

export const revalidate = 3600; // Revalidate every hour

async function getContactInfo() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'company_info' },
  });

  if (!setting || !setting.value) {
    return {
      phone: '+1 917-285-5226',
      email: 'info@playideasny.com',
      address: {
        street: '99 Jericho Turnpike, Suite 305',
        city: 'Jericho',
        state: 'NY',
        zip: '11753',
        country: 'United States',
      },
    };
  }

  try {
    const data = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    return data.contact;
  } catch (e) {
    console.error('Failed to parse company_info for contact', e);
    return {
      phone: '+1 917-285-5226',
      email: 'info@playideasny.com',
      address: {
        street: '99 Jericho Turnpike, Suite 305',
        city: 'Jericho',
        state: 'NY',
        zip: '11753',
        country: 'United States',
      },
    };
  }
}

export default async function ContactPage() {
  const contactInfo = await getContactInfo();

  return <ContactClient contactInfo={contactInfo} />;
}
