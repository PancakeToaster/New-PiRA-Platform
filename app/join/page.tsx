import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JoinForm from '@/components/auth/JoinForm';

export const metadata: Metadata = {
  title: 'Join Us',
  description: 'Create your PiRA account and start your robotics education journey. Sign up as a student or parent.',
  openGraph: {
    title: 'Join Us',
    description: 'Create your PiRA account and start your robotics education journey.',
  },
};

export default function JoinPage() {
  return (
    <>
      <Navbar />
      <JoinForm />
      <Footer />
    </>
  );
}
