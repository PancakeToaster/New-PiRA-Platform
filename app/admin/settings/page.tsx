'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loader2, Save, Upload, X, Video } from 'lucide-react';

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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [handsOnVideo, setHandsOnVideo] = useState('');
  const [competitionVideo, setCompetitionVideo] = useState('');
  const [ctaVideo, setCtaVideo] = useState('');
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

      // Fetch home page videos
      const [handsOnRes, competitionRes, ctaRes] = await Promise.all([
        fetch('/api/admin/settings/home_video_hands_on'),
        fetch('/api/admin/settings/home_video_competition'),
        fetch('/api/admin/settings/home_video_cta'),
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

      // Save home page videos
      const [handsOnVideoRes, competitionVideoRes, ctaVideoRes] = await Promise.all([
        fetch('/api/admin/settings/home_video_hands_on', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: handsOnVideo || '' }),
        }),
        fetch('/api/admin/settings/home_video_competition', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: competitionVideo || '' }),
        }),
        fetch('/api/admin/settings/home_video_cta', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: ctaVideo || '' }),
        }),
      ]);

      if (res.ok && handsOnVideoRes.ok && competitionVideoRes.ok && ctaVideoRes.ok) {
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

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Alternative Name
              </label>
              <input
                type="text"
                value={companyInfo.altName}
                onChange={(e) => setCompanyInfo({ ...companyInfo, altName: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={companyInfo.tagline}
              onChange={(e) => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mission Statement
            </label>
            <textarea
              rows={3}
              value={companyInfo.mission}
              onChange={(e) => setCompanyInfo({ ...companyInfo, mission: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Vision Statement
            </label>
            <textarea
              rows={2}
              value={companyInfo.vision}
              onChange={(e) => setCompanyInfo({ ...companyInfo, vision: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={companyInfo.description}
              onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Years Founded
            </label>
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={companyInfo.contact.phone}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  contact: { ...companyInfo.contact, phone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={companyInfo.contact.email}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  contact: { ...companyInfo.contact, email: e.target.value }
                })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={companyInfo.contact.address.street}
              onChange={(e) => setCompanyInfo({
                ...companyInfo,
                contact: {
                  ...companyInfo.contact,
                  address: { ...companyInfo.contact.address, street: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                City
              </label>
              <input
                type="text"
                value={companyInfo.contact.address.city}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  contact: {
                    ...companyInfo.contact,
                    address: { ...companyInfo.contact.address, city: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                State
              </label>
              <input
                type="text"
                value={companyInfo.contact.address.state}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  contact: {
                    ...companyInfo.contact,
                    address: { ...companyInfo.contact.address, state: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                value={companyInfo.contact.address.zip}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  contact: {
                    ...companyInfo.contact,
                    address: { ...companyInfo.contact.address, zip: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Hands-On Learning Video
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Video for the "Hands-On Learning" section. Recommended format: MP4, max size: 50MB
            </p>

            {handsOnVideo ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <video src={handsOnVideo} controls className="w-full max-h-96 bg-black">
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Video uploaded</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeVideo('handsOn')}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                {uploadingVideo === 'handsOn' ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading video...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM, or OGG (MAX. 50MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoUpload(e, 'handsOn')}
                  disabled={uploadingVideo === 'handsOn'}
                  className="hidden"
                />
              </label>
            )}
            <div className="mt-3">
              <label className="block text-sm font-medium text-foreground mb-1">
                Or paste video URL
              </label>
              <input
                type="url"
                value={handsOnVideo}
                onChange={(e) => setHandsOnVideo(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>

          {/* Competition Video */}
          <div className="pt-6 border-t font-medium">
            <label className="block text-sm font-medium text-foreground mb-2">
              Competition Video
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Video for the "Competing & Winning" section. Recommended format: MP4, max size: 50MB
            </p>

            {competitionVideo ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <video src={competitionVideo} controls className="w-full max-h-96 bg-black">
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Video uploaded</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeVideo('competition')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                {uploadingVideo === 'competition' ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading video...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM, or OGG (MAX. 50MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoUpload(e, 'competition')}
                  disabled={uploadingVideo === 'competition'}
                  className="hidden"
                />
              </label>
            )}
            <div className="mt-3">
              <label className="block text-sm font-medium text-foreground mb-1">
                Or paste video URL
              </label>
              <input
                type="url"
                value={competitionVideo}
                onChange={(e) => setCompetitionVideo(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>

          {/* CTA Background Video */}
          <div className="pt-6 border-t font-medium">
            <label className="block text-sm font-medium text-foreground mb-2">
              Call-to-Action Background Video
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Background video for the "Ready to Start Your Journey?" section. Recommended format: MP4, max size: 50MB
            </p>

            {ctaVideo ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <video src={ctaVideo} controls className="w-full max-h-96 bg-black">
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Video uploaded</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeVideo('cta')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                {uploadingVideo === 'cta' ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading video...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM, or OGG (MAX. 50MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoUpload(e, 'cta')}
                  disabled={uploadingVideo === 'cta'}
                  className="hidden"
                />
              </label>
            )}
            <div className="mt-3">
              <label className="block text-sm font-medium text-foreground mb-1">
                Or paste video URL
              </label>
              <input
                type="url"
                value={ctaVideo}
                onChange={(e) => setCtaVideo(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
