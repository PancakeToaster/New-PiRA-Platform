'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

type UserType = 'student' | 'parent' | null;

export default function JoinForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<UserType>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        // Student fields
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        dateOfBirth: '',
        grade: '',
        school: '',
        // Parent fields
        childFirstName: '',
        childLastName: '',
        childAge: '',
        childDateOfBirth: '',
        childEmail: '', // Added for completeness if needed based on previous steps
        interests: [] as string[],
        referralSource: '',
        noChildEmail: false, // For parent registration flow
        childUsername: '', // For display
    });

    const referralSourceOptions = [
        { value: 'friend', label: 'Friend or Family' },
        { value: 'student', label: 'Current/Former Student' },
        { value: 'social_media', label: 'Social Media' },
        { value: 'search', label: 'Google/Search Engine' },
        { value: 'school', label: 'School/Teacher' },
        { value: 'event', label: 'Event/Competition' },
        { value: 'other', label: 'Other' },
    ];

    const interestOptions = [
        'Robotics',
        'Programming',
        'Electronics',
        'Competition Teams',
        'Summer Camps',
        'After School Programs',
    ];

    const handleInterestToggle = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userType,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Store child username if present for display (mostly for parent flow)
                if (data.child && data.child.username) {
                    setFormData(prev => ({ ...prev, childUsername: data.child.username }));
                }

                setSuccess(true);
                // Delay redirect to let them read message
                setTimeout(() => {
                    router.push('/login?registered=true');
                }, userType === 'student' ? 8000 : 5000);
            } else {
                const data = await response.json();
                setError(data.error || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
                        {userType === 'student' ? (
                            <>
                                <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-sky-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Approval Needed</h2>
                                <p className="text-muted-foreground mb-6">
                                    We have sent an email to <strong>{formData.parentEmail}</strong>.
                                    <br className="mb-2" />
                                    Your parent must approve your account before you can fully access the platform.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-sky-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Registration Complete!</h2>
                                <p className="text-muted-foreground mb-6">
                                    Your account has been created and is currently <strong>pending approval</strong>.
                                    <br className="mb-2" />
                                    You will receive an email notification once an administrator has approved your account.
                                </p>
                                {formData.childUsername && (
                                    <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-lg mb-6 text-left">
                                        <h4 className="font-bold text-sky-700 dark:text-sky-400 mb-1">Child Login Information</h4>
                                        <p className="text-sm text-sky-600 dark:text-sky-300 mb-2">Please save this username for your child:</p>
                                        <div className="bg-background p-3 rounded border border-sky-500/20 font-mono text-center text-lg font-bold text-sky-600 dark:text-sky-400 select-all">
                                            {formData.childUsername}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <p className="text-sm text-muted-foreground mb-4">Redirecting you to sign in...</p>
                        <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-16 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-3">Join Our Robotics Family</h1>
                    <p className="text-lg text-muted-foreground">
                        Start your journey into the exciting world of robotics and technology
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-sky-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                        1
                    </div>
                    <div className={`w-16 h-1 ${step >= 2 ? 'bg-sky-500' : 'bg-muted'}`} />
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-sky-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                        2
                    </div>
                    <div className={`w-16 h-1 ${step >= 3 ? 'bg-sky-500' : 'bg-muted'}`} />
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 3 ? 'bg-sky-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                        3
                    </div>
                </div>

                <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
                    {/* Step 1: Choose User Type */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Who are you?</h2>
                            <p className="text-muted-foreground mb-6">Select the option that best describes you</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setUserType('student')}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${userType === 'student'
                                        ? 'border-sky-500 bg-sky-500/10'
                                        : 'border-border hover:border-muted-foreground/50'
                                        }`}
                                >
                                    <div className="text-4xl mb-3">🎓</div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">I'm a Student</h3>
                                    <p className="text-sm text-muted-foreground">
                                        I want to learn robotics and join programs
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setUserType('parent')}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${userType === 'parent'
                                        ? 'border-sky-500 bg-sky-500/10'
                                        : 'border-border hover:border-muted-foreground/50'
                                        }`}
                                >
                                    <div className="text-4xl mb-3">👨‍👩‍👧</div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">I'm a Parent</h3>
                                    <p className="text-sm text-muted-foreground">
                                        I want to enroll my child in programs
                                    </p>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => userType && setStep(2)}
                                disabled={!userType}
                                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center ${userType
                                    ? 'bg-sky-500 text-white hover:bg-sky-600'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                                    }`}
                            >
                                Continue
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Basic Information */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Your Information</h2>
                            <p className="text-muted-foreground mb-6">Tell us about yourself</p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                        placeholder="At least 8 characters"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setStep(1)}
                                    type="button"
                                    className="flex-1 py-3 rounded-lg font-semibold border border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (formData.firstName && formData.lastName && formData.email && formData.password) {
                                            setStep(3);
                                        }
                                    }}
                                    disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.password}
                                    className="flex-1 py-3 rounded-lg font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    Continue
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Additional Details */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                {userType === 'student' ? 'Student Details' : 'Child Information'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {userType === 'student'
                                    ? 'Tell us more about yourself and your parent/guardian'
                                    : 'Tell us about your child'}
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {userType === 'student' ? (
                                    <>
                                        {/* Student: Parent Contact */}
                                        <div>
                                            <h3 className="font-semibold text-foreground mb-3 border-b border-border pb-2">Parent/Guardian Contact</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">Parent's Name *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.parentName}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                                        placeholder="Guardian Name"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-foreground mb-1">Parent's Email *</label>
                                                        <input
                                                            type="email"
                                                            required
                                                            value={formData.parentEmail}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                                                            className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                                            placeholder="parent@example.com"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-foreground mb-1">Parent's Phone *</label>
                                                        <input
                                                            type="tel"
                                                            required
                                                            value={formData.parentPhone}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                                                            className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                                            placeholder="(555) 123-4567"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    We will send an email to your parent to approve your account.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Student: Own Details */}
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <h3 className="font-semibold text-foreground mb-3">Your Details</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">Date of Birth</label>
                                                    <input
                                                        type="date"
                                                        value={formData.dateOfBirth}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-foreground mb-1">Grade</label>
                                                        <input
                                                            type="text"
                                                            value={formData.grade}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                                            className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                                            placeholder="e.g., 5th Grade"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-foreground mb-1">School</label>
                                                        <input
                                                            type="text"
                                                            value={formData.school}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                                                            className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                                            placeholder="School name"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Parent: Child Details */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Child's First Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.childFirstName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, childFirstName: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Child's Last Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.childLastName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, childLastName: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground"
                                                />
                                            </div>
                                        </div>

                                        {/* Age & Email Logic */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">Child's Date of Birth</label>
                                                    <input
                                                        type="date"
                                                        value={formData.childDateOfBirth}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, childDateOfBirth: e.target.value }))}
                                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground"
                                                    />
                                                </div>
                                            </div>

                                            {/* Email or Username Info */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-sm font-medium text-foreground">Child's Email</label>
                                                    {parseInt(formData.childAge || '0') < 13 && (
                                                        <label className="flex items-center text-xs text-sky-600 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.noChildEmail}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, noChildEmail: e.target.checked, childEmail: e.target.checked ? '' : prev.childEmail }))}
                                                                className="mr-1 rounded text-sky-500 focus:ring-sky-400 bg-background border-input"
                                                            />
                                                            Child does not have email
                                                        </label>
                                                    )}
                                                </div>

                                                {formData.noChildEmail ? (
                                                    <div className="p-3 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
                                                        <span className="font-semibold text-foreground">No email needed.</span> We will generate a username for your child to log in (e.g., <strong>firstname.lastname</strong>). You will see it after registration.
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="email"
                                                        value={formData.childEmail}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, childEmail: e.target.value }))}
                                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                                        placeholder="child@example.com (for login)"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        How did you hear about us?
                                    </label>
                                    <select
                                        value={formData.referralSource}
                                        onChange={(e) => setFormData(prev => ({ ...prev, referralSource: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent text-foreground"
                                    >
                                        <option value="">Select one (optional)</option>
                                        {referralSourceOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        What are you interested in? (Select all that apply)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {interestOptions.map((interest) => (
                                            <button
                                                key={interest}
                                                type="button"
                                                onClick={() => handleInterestToggle(interest)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.interests.includes(interest)
                                                    ? 'bg-sky-500 text-white'
                                                    : 'bg-muted text-foreground hover:bg-accent'
                                                    }`}
                                            >
                                                {interest}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 rounded-lg font-semibold border border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-lg font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            Complete Registration
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Already have an account */}
                <p className="text-center mt-6 text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-sky-500 hover:text-sky-600 font-medium">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
