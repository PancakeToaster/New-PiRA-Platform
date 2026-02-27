'use client';

import { useState, useEffect } from 'react';
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Trophy, GraduationCap, Trash, Plus, Lock, Loader2, Save, Upload, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface CompanyInfo {
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

interface HomeContent {
  stats: {
    studentsTaught: string;
    yearsExperience: string;
    awardsWon: string;
    programLevels: string;
  };
  handsOn: {
    title: string;
    description: string;
  };
  competition: {
    title: string;
    description: string;
  };
  programs: {
    title: string;
    description: string;
  };
  events: {
    title: string;
    description: string;
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
  };
}

interface Award {
  date: string;
  competition: string;
  titles: string;
  image: string;
}

// ... (keep Alumnus and HistoryContent interfaces the same)

interface Alumnus {
  name: string;
  year: string;
  college: string;
  universityClass: string;
  major: string;
}

interface VideoItem {
  key: string;
  url: string;
}

interface HistoryContent {
  awards: Award[];
  alumni: Alumnus[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Video State
  const [handsOnVideo, setHandsOnVideo] = useState('');
  const [competitionVideo, setCompetitionVideo] = useState('');
  const [ctaVideo, setCtaVideo] = useState('');

  // Company Info State
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    altName: '',
    tagline: '',
    mission: '',
    vision: '',
    description: '',
    yearsFounded: '',
    contact: {
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
      },
    },
  });

  // Home Content State
  const [homeContent, setHomeContent] = useState<HomeContent>({
    stats: {
      studentsTaught: '',
      yearsExperience: '',
      awardsWon: '',
      programLevels: ''
    },
    handsOn: {
      title: '',
      description: ''
    },
    competition: {
      title: '',
      description: ''
    },
    programs: {
      title: '',
      description: ''
    },
    events: {
      title: '',
      description: ''
    },
    cta: {
      title: '',
      description: '',
      buttonText: ''
    }
  });

  const [videos, setVideos] = useState<VideoItem[]>([]);
  // History Content State
  const [historyContent, setHistoryContent] = useState<HistoryContent>({ awards: [], alumni: [] });

  // Invoice Settings State
  const [defaultInvoiceNotes, setDefaultInvoiceNotes] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings/company_info');
      if (res.ok) {
        const data = await res.json();
        setCompanyInfo(data.value);
      }

      // Fetch home page videos and content
      const [handsOnRes, competitionRes, ctaRes, homeContentRes, historyContentRes, invoiceSettingsRes] = await Promise.all([
        fetch('/api/admin/settings/home_video_hands_on'),
        fetch('/api/admin/settings/home_video_competition'),
        fetch('/api/admin/settings/home_video_cta'),
        fetch('/api/admin/settings/home_content'),
        fetch('/api/admin/settings/history_content'),
        fetch('/api/admin/settings/invoice_settings'),
      ]);

      if (handsOnRes.ok) {
        const data = await handsOnRes.json();
        setHandsOnVideo(data.value || '');
      }
      if (competitionRes.ok) {
        const data = await competitionRes.json();
        setCompetitionVideo(data.value || '');
      }
      if (ctaRes.ok) {
        const data = await ctaRes.json();
        setCtaVideo(data.value || '');
      }
      if (homeContentRes.ok) {
        const data = await homeContentRes.json();
        if (data.value) setHomeContent(prev => ({ ...prev, ...data.value }));
      }
      if (historyContentRes.ok) {
        const data = await historyContentRes.json();
        if (data.value) {
          // Migration: Ensure date field exists (fallback to year-01 if missing)
          const awardsWithDate = (data.value.awards || []).map((a: any) => ({
            ...a,
            date: a.date || (a.year ? `${a.year}-01` : '')
          }));

          const sortedAwards = awardsWithDate.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
          const sortedAlumni = (data.value.alumni || []).sort((a: any, b: any) => (b.year || '').localeCompare(a.year || ''));

          setHistoryContent(prev => ({ ...prev, awards: sortedAwards, alumni: sortedAlumni }));
        }
      }

      if (invoiceSettingsRes.ok) {
        const data = await invoiceSettingsRes.json();
        setDefaultInvoiceNotes(data.invoiceSettings?.defaultNotes || '');
      }

    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/company_info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: companyInfo }),
      });

      // Save home page videos and content
      // Sort history content before saving
      const sortedAwards = [...historyContent.awards].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const sortedAlumni = [...historyContent.alumni].sort((a, b) => b.year.localeCompare(a.year));

      const sortedHistoryContent = { ...historyContent, awards: sortedAwards, alumni: sortedAlumni };

      const [handsOnVideoRes, competitionVideoRes, ctaVideoRes, homeContentRes, historyContentRes, invoiceSettingsRes] = await Promise.all([
        fetch('/api/admin/settings/home_video_hands_on', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: handsOnVideo }),
        }),
        fetch('/api/admin/settings/home_video_competition', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: competitionVideo }),
        }),
        fetch('/api/admin/settings/home_video_cta', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: ctaVideo }),
        }),
        fetch('/api/admin/settings/home_content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: homeContent }),
        }),
        fetch('/api/admin/settings/history_content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: sortedHistoryContent }),
        }),
        fetch('/api/admin/settings/invoice_settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defaultNotes: defaultInvoiceNotes }),
        }),
      ]);

      // Update local state with sorted content
      setHistoryContent(sortedHistoryContent);

      if (res.ok && handsOnVideoRes.ok && competitionVideoRes.ok && ctaVideoRes.ok && homeContentRes.ok && historyContentRes.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>, videoType: 'handsOn' | 'competition' | 'cta') {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    setUploadingVideo(videoType);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (videoType === 'handsOn') setHandsOnVideo(data.url);
        else if (videoType === 'competition') setCompetitionVideo(data.url);
        else if (videoType === 'cta') setCtaVideo(data.url);
      } else {
        alert('Failed to upload video');
      }
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Failed to upload video');
    } finally {
      setUploadingVideo(null);
    }
  }

  function removeVideo(videoType: 'handsOn' | 'competition' | 'cta') {
    if (videoType === 'handsOn') setHandsOnVideo('');
    else if (videoType === 'competition') setCompetitionVideo('');
    else if (videoType === 'cta') setCtaVideo('');
  }

  // History Helper Functions
  function addAward() {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const newAward = { date: formattedDate, competition: '', titles: '', image: '' };

    setHistoryContent(prev => {
      const updatedAwards = [newAward, ...prev.awards];
      return { ...prev, awards: updatedAwards };
    });
  }

  function removeAward(index: number) {
    setHistoryContent(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }));
  }

  function updateAward(index: number, field: keyof Award, value: string) {
    setHistoryContent(prev => {
      const updatedAwards = prev.awards.map((award, i) =>
        i === index ? { ...award, [field]: value } : award
      );
      return { ...prev, awards: updatedAwards };
    });
  }

  function addAlumnus() {
    const newAlumnus = { name: '', year: new Date().getFullYear().toString(), college: '', universityClass: '', major: '' };

    setHistoryContent(prev => {
      const updatedAlumni = [newAlumnus, ...prev.alumni];
      return { ...prev, alumni: updatedAlumni };
    });
  }

  function removeAlumnus(index: number) {
    setHistoryContent(prev => ({
      ...prev,
      alumni: prev.alumni.filter((_, i) => i !== index)
    }));
  }

  function updateAlumnus(index: number, field: keyof Alumnus, value: string) {
    setHistoryContent(prev => {
      const updatedAlumni = prev.alumni.map((alum, i) =>
        i === index ? { ...alum, [field]: value } : alum
      );
      return { ...prev, alumni: updatedAlumni };
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Alternative Name</label>
                  <input
                    type="text"
                    value={companyInfo.altName}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, altName: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tagline</label>
                <input
                  type="text"
                  value={companyInfo.tagline}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Mission Statement</label>
                <textarea
                  rows={3}
                  value={companyInfo.mission}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, mission: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Vision Statement</label>
                <textarea
                  rows={2}
                  value={companyInfo.vision}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, vision: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={4}
                  value={companyInfo.description}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Years Founded</label>
                <input
                  type="text"
                  value={companyInfo.yearsFounded}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, yearsFounded: e.target.value })}
                  placeholder="e.g., 10+ Years of Excellence"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <input
                    type="tel"
                    value={companyInfo.contact.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, contact: { ...companyInfo.contact, phone: e.target.value } })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={companyInfo.contact.email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, contact: { ...companyInfo.contact, email: e.target.value } })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Street Address</label>
                <input
                  type="text"
                  value={companyInfo.contact.address.street}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, contact: { ...companyInfo.contact, address: { ...companyInfo.contact.address, street: e.target.value } } })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City</label>
                  <input
                    type="text"
                    value={companyInfo.contact.address.city}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, contact: { ...companyInfo.contact, address: { ...companyInfo.contact.address, city: e.target.value } } })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">State</label>
                  <input
                    type="text"
                    value={companyInfo.contact.address.state}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, contact: { ...companyInfo.contact, address: { ...companyInfo.contact.address, state: e.target.value } } })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={companyInfo.contact.address.zip}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, contact: { ...companyInfo.contact, address: { ...companyInfo.contact.address, zip: e.target.value } } })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-6">
          {/* Home Page Content */}
          <Card>
            <CardHeader>
              <CardTitle>Homepage Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Students Taught</label>
                    <input
                      type="text"
                      value={homeContent.stats.studentsTaught}
                      onChange={(e) => setHomeContent({ ...homeContent, stats: { ...homeContent.stats, studentsTaught: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Years Experience</label>
                    <input
                      type="text"
                      value={homeContent.stats.yearsExperience}
                      onChange={(e) => setHomeContent({ ...homeContent, stats: { ...homeContent.stats, yearsExperience: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Awards Won</label>
                    <input
                      type="text"
                      value={homeContent.stats.awardsWon}
                      onChange={(e) => setHomeContent({ ...homeContent, stats: { ...homeContent.stats, awardsWon: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Program Levels</label>
                    <input
                      type="text"
                      value={homeContent.stats.programLevels}
                      onChange={(e) => setHomeContent({ ...homeContent, stats: { ...homeContent.stats, programLevels: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Hands-On Learning Section</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                    <input
                      type="text"
                      value={homeContent.handsOn.title}
                      onChange={(e) => setHomeContent({ ...homeContent, handsOn: { ...homeContent.handsOn, title: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={homeContent.handsOn.description}
                      onChange={(e) => setHomeContent({ ...homeContent, handsOn: { ...homeContent.handsOn, description: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* ... Other sections (Competition, Programs, Events, CTA) omitted for brevity in replacement if possible, but actually I need to include them to keep the file valid. I'll include them. */}

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Competition Section</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                    <input
                      type="text"
                      value={homeContent.competition.title}
                      onChange={(e) => setHomeContent({ ...homeContent, competition: { ...homeContent.competition, title: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={homeContent.competition.description}
                      onChange={(e) => setHomeContent({ ...homeContent, competition: { ...homeContent.competition, description: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Programs Section</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                    <input
                      type="text"
                      value={homeContent.programs.title}
                      onChange={(e) => setHomeContent({ ...homeContent, programs: { ...homeContent.programs, title: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={homeContent.programs.description}
                      onChange={(e) => setHomeContent({ ...homeContent, programs: { ...homeContent.programs, description: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Events Section</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                    <input
                      type="text"
                      value={homeContent.events.title}
                      onChange={(e) => setHomeContent({ ...homeContent, events: { ...homeContent.events, title: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={homeContent.events.description}
                      onChange={(e) => setHomeContent({ ...homeContent, events: { ...homeContent.events, description: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Call to Action (CTA)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                    <input
                      type="text"
                      value={homeContent.cta.title}
                      onChange={(e) => setHomeContent({ ...homeContent, cta: { ...homeContent.cta, title: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={homeContent.cta.description}
                      onChange={(e) => setHomeContent({ ...homeContent, cta: { ...homeContent.cta, description: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Button Text</label>
                    <input
                      type="text"
                      value={homeContent.cta.buttonText}
                      onChange={(e) => setHomeContent({ ...homeContent, cta: { ...homeContent.cta, buttonText: e.target.value } })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Home Page Videos */}
          <Card>
            <CardHeader>
              <CardTitle>Home Page Videos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Hands-On Learning Video */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hands-On Learning Video</label>
                <p className="text-sm text-muted-foreground mb-3">Video for the "Hands-On Learning" section. Recommended format: MP4, max size: 50MB</p>
                {handsOnVideo ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <video src={handsOnVideo} controls className="w-full max-h-96 bg-black">Your browser does not support the video tag.</video>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2"><Video className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">Video uploaded</span></div>
                      <Button variant="outline" size="sm" onClick={() => removeVideo('handsOn')} className="text-destructive hover:text-destructive hover:bg-destructive/10"><X className="w-4 h-4 mr-1" />Remove</Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                    {uploadingVideo === 'handsOn' ? (
                      <div className="flex flex-col items-center"><Loader2 className="w-12 h-12 animate-spin text-primary mb-2" /><p className="text-sm text-muted-foreground">Uploading video...</p></div>
                    ) : (
                      <div className="flex flex-col items-center"><Upload className="w-12 h-12 text-muted-foreground mb-2" /><p className="text-sm font-medium text-foreground">Click to upload video</p><p className="text-xs text-muted-foreground mt-1">MP4, WebM, or OGG (MAX. 50MB)</p></div>
                    )}
                    <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'handsOn')} disabled={uploadingVideo === 'handsOn'} className="hidden" />
                  </label>
                )}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Or paste video URL</label>
                  <input type="url" value={handsOnVideo} onChange={(e) => setHandsOnVideo(e.target.value)} placeholder="https://example.com/video.mp4" className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground" />
                </div>
              </div>

              {/* Competition Video */}
              <div className="pt-6 border-t font-medium">
                <label className="block text-sm font-medium text-foreground mb-2">Competition Video</label>
                <p className="text-sm text-muted-foreground mb-3">Video for the "Competing & Winning" section. Recommended format: MP4, max size: 50MB</p>
                {competitionVideo ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <video src={competitionVideo} controls className="w-full max-h-96 bg-black">Your browser does not support the video tag.</video>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2"><Video className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">Video uploaded</span></div>
                      <Button variant="outline" size="sm" onClick={() => removeVideo('competition')} className="text-red-600 hover:text-red-700 hover:bg-red-50"><X className="w-4 h-4 mr-1" />Remove</Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                    {uploadingVideo === 'competition' ? (
                      <div className="flex flex-col items-center"><Loader2 className="w-12 h-12 animate-spin text-primary mb-2" /><p className="text-sm text-muted-foreground">Uploading video...</p></div>
                    ) : (
                      <div className="flex flex-col items-center"><Upload className="w-12 h-12 text-muted-foreground mb-2" /><p className="text-sm font-medium text-foreground">Click to upload video</p><p className="text-xs text-muted-foreground mt-1">MP4, WebM, or OGG (MAX. 50MB)</p></div>
                    )}
                    <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'competition')} disabled={uploadingVideo === 'competition'} className="hidden" />
                  </label>
                )}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Or paste video URL</label>
                  <input type="url" value={competitionVideo} onChange={(e) => setCompetitionVideo(e.target.value)} placeholder="https://example.com/video.mp4" className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground" />
                </div>
              </div>

              {/* CTA Background Video */}
              <div className="pt-6 border-t font-medium">
                <label className="block text-sm font-medium text-foreground mb-2">Call-to-Action Background Video</label>
                <p className="text-sm text-muted-foreground mb-3">Background video for the "Ready to Start Your Journey?" section. Recommended format: MP4, max size: 50MB</p>
                {ctaVideo ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <video src={ctaVideo} controls className="w-full max-h-96 bg-black">Your browser does not support the video tag.</video>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2"><Video className="w-5 h-5 text-primary" /><span className="text-sm font-medium text-foreground">Video uploaded</span></div>
                      <Button variant="outline" size="sm" onClick={() => removeVideo('cta')} className="text-red-600 hover:text-red-700 hover:bg-red-50"><X className="w-4 h-4 mr-1" />Remove</Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                    {uploadingVideo === 'cta' ? (
                      <div className="flex flex-col items-center"><Loader2 className="w-12 h-12 animate-spin text-primary mb-2" /><p className="text-sm text-muted-foreground">Uploading video...</p></div>
                    ) : (
                      <div className="flex flex-col items-center"><Upload className="w-12 h-12 text-muted-foreground mb-2" /><p className="text-sm font-medium text-foreground">Click to upload video</p><p className="text-xs text-muted-foreground mt-1">MP4, WebM, or OGG (MAX. 50MB)</p></div>
                    )}
                    <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'cta')} disabled={uploadingVideo === 'cta'} className="hidden" />
                  </label>
                )}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Or paste video URL</label>
                  <input type="url" value={ctaVideo} onChange={(e) => setCtaVideo(e.target.value)} placeholder="https://example.com/video.mp4" className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Awards Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Past Awards</CardTitle>
              <Button onClick={addAward} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Award
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {historyContent.awards.map((award, index) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg md:items-start group relative bg-card">
                  <div className="p-2 aspect-square h-fit bg-primary/10 rounded-full flex items-center justify-center text-primary mt-1">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !award.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {(() => {
                              if (!award.date) return <span>Pick a date</span>;
                              const [year, month] = award.date.split('-').map(Number);
                              const date = new Date(year, month - 1, 1);
                              return isValid(date) ? format(date, "MMMM yyyy") : <span>Invalid Date</span>;
                            })()}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={(() => {
                              if (!award.date) return undefined;
                              const [year, month] = award.date.split('-').map(Number);
                              const date = new Date(year, month - 1, 1);
                              return isValid(date) ? date : undefined;
                            })()}
                            onSelect={(date) => updateAward(index, 'date', date ? format(date, "yyyy-MM") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Competition</label>
                      <input
                        type="text"
                        value={award.competition}
                        onChange={(e) => updateAward(index, 'competition', e.target.value)}
                        className="w-full mt-1 px-2 py-1 border rounded bg-background text-sm font-semibold"
                        placeholder="e.g. VEX World Championship"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Titles</label>
                      <textarea
                        value={award.titles}
                        onChange={(e) => updateAward(index, 'titles', e.target.value)}
                        className="w-full mt-1 px-2 py-1 border rounded bg-background text-sm"
                        rows={2}
                        placeholder="e.g. Excellence Award, Tournament Champions"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAward(index)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {historyContent.awards.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No awards added yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alumni Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Alumni Success</CardTitle>
              <Button onClick={addAlumnus} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Alumnus
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {historyContent.alumni.map((alum, index) => (
                  <div key={index} className="flex gap-4 p-4 border rounded-lg items-center relative group bg-card">
                    <div className="p-2 aspect-square bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1 items-end">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
                        <input
                          value={alum.name}
                          onChange={(e) => updateAlumnus(index, 'name', e.target.value)}
                          className="w-full mt-1 px-2 py-1 border rounded bg-background text-sm font-medium bg-transparent"
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Class of</label>
                        <input
                          value={alum.year}
                          onChange={(e) => updateAlumnus(index, 'year', e.target.value)}
                          className="w-full mt-1 px-2 py-1 border rounded bg-background text-sm"
                          placeholder="Year"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">College</label>
                        <input
                          value={alum.college}
                          onChange={(e) => updateAlumnus(index, 'college', e.target.value)}
                          className="w-full mt-1 px-2 py-1 border rounded bg-background text-sm"
                          placeholder="University"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">University Class</label>
                        <input
                          value={alum.universityClass || ''}
                          onChange={(e) => updateAlumnus(index, 'universityClass', e.target.value)}
                          className="w-full mt-1 px-2 py-1 border rounded bg-background text-sm"
                          placeholder="e.g. 2025"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Major</label>
                        <input
                          value={alum.major}
                          onChange={(e) => updateAlumnus(index, 'major', e.target.value)}
                          className="w-full mt-1 px-2 py-1 border rounded bg-background text-sm"
                          placeholder="Major"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeAlumnus(index)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {historyContent.alumni.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No alumni added yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          {/* Invoice Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Default Invoice Notes</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                These notes will be automatically added to all newly created invoices. Include payment communication, payment methods, and terms & conditions.
              </p>
            </CardHeader>
            <CardContent>
              <textarea
                value={defaultInvoiceNotes}
                onChange={(e) => setDefaultInvoiceNotes(e.target.value)}
                placeholder="Example:&#10;&#10;Payment Communication:&#10;Please make payment within 30 days of invoice date.&#10;&#10;Payment Methods:&#10;- Check payable to [Company Name]&#10;- Zelle: [email]&#10;- Venmo: [username]&#10;&#10;Terms & Conditions:&#10;Late payments may incur a 5% fee."
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground font-mono text-sm"
                rows={15}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
