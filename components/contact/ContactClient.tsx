'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageBanner from '@/components/layout/PageBanner';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

interface ContactForm {
    name: string;
    email: string;
    phone?: string;
    message: string;

}

interface ContactInfo {
    phone: string;
    email: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
}

interface ContactClientProps {
    contactInfo: ContactInfo;
}

export default function ContactClient({ contactInfo }: ContactClientProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactForm>();

    const onSubmit = async (data: ContactForm) => {
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setSubmitStatus('success');
                reset();
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />

            <main className="flex-1 pt-20">
                <PageBanner
                    title="Contact Us"
                    description="Get in touch with us for more information about our programs"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    {submitStatus === 'success' && (
                                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                            Thank you for your message! We'll get back to you soon.
                                        </div>
                                    )}

                                    {submitStatus === 'error' && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                            Something went wrong. Please try again.
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            {...register('name', { required: 'Name is required' })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Your name"
                                        />
                                        {errors.name && (
                                            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            {...register('email', { required: 'Email is required' })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                            placeholder="your@email.com"
                                        />
                                        {errors.email && (
                                            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone (optional)
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            {...register('phone')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            id="message"
                                            rows={6}
                                            {...register('message', { required: 'Message is required' })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none transition-all"
                                            placeholder="How can we help you?"
                                        />
                                        {errors.message && (
                                            <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-sky-500 text-white py-3 px-6 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center"
                                    >
                                        {isSubmitting ? (
                                            'Sending...'
                                        ) : (
                                            <>
                                                Send Message
                                                <Send className="ml-2 w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-2xl p-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-sky-500 p-3 rounded-xl">
                                        <Mail className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                                        <p className="text-gray-600">{contactInfo.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-2xl p-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-sky-500 p-3 rounded-xl">
                                        <Phone className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                                        <p className="text-gray-600">{contactInfo.phone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-2xl p-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-sky-500 p-3 rounded-xl">
                                        <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                                        <p className="text-gray-600">
                                            {contactInfo.address.street}<br />
                                            {contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.zip}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="bg-gray-900 text-white rounded-2xl p-6">
                                <h3 className="font-semibold mb-4">Office Hours</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Monday - Friday</span>
                                        <span>9:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Saturday</span>
                                        <span>10:00 AM - 4:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Sunday</span>
                                        <span>Closed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
