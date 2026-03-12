'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface ChurchSettingsPanelProps {
  token: string
}

export default function ChurchSettingsPanel({ token }: ChurchSettingsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const sermonBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1').replace(/\/api\/v1\/?$/, '')
  const [form, setForm] = useState({
    churchName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    website: '',
    logoUrl: '',
    defaultTimezone: '',
  })

  const normalizeForm = (data: any) => ({
    churchName: data?.churchName ?? '',
    addressLine1: data?.addressLine1 ?? '',
    addressLine2: data?.addressLine2 ?? '',
    city: data?.city ?? '',
    state: data?.state ?? '',
    postalCode: data?.postalCode ?? '',
    country: data?.country ?? '',
    phone: data?.phone ?? '',
    website: data?.website ?? '',
    logoUrl: data?.logoUrl ?? '',
    defaultTimezone: data?.defaultTimezone ?? '',
  })

  const absoluteLogoUrl = (logoUrl: string) => {
    if (!logoUrl) return ''
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl
    return `${sermonBaseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await slidesApi.getChurchSettings(token)
        if (!mounted || !data) return
        setForm(normalizeForm(data))
      } catch (error) {
        console.error('Failed to load church settings:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [token])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await slidesApi.updateChurchSettings(form, token)
      setForm(normalizeForm(updated))
    } catch (error) {
      console.error('Failed to save church settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async () => {
    if (!logoFile) return
    setUploadingLogo(true)
    try {
      const updated = await slidesApi.uploadChurchLogo(logoFile, token)
      setForm(normalizeForm(updated))
      setLogoFile(null)
    } catch (error) {
      console.error('Failed to upload church logo:', error)
    } finally {
      setUploadingLogo(false)
    }
  }

  const fieldClass =
    'w-full h-12 bg-black/40 border border-white/10 rounded-xl px-3 text-base'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Church Settings</h3>
          <p className="text-xs text-gray-400 mt-1">One-time church identity defaults for branded social media generation.</p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading}
          className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="cyber-panel rounded-2xl p-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-3 rounded bg-white/10 animate-pulse w-3/5" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-2/5" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-4/5" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                className={fieldClass}
                placeholder="Church name"
                value={form.churchName}
                onChange={(e) => setForm((p) => ({ ...p, churchName: e.target.value }))}
              />
              <input
                className={fieldClass}
                placeholder="Default timezone"
                value={form.defaultTimezone}
                onChange={(e) => setForm((p) => ({ ...p, defaultTimezone: e.target.value }))}
              />
            </div>

            <div className="border border-white/10 rounded-xl p-4 bg-black/20">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="cyber-button text-xs px-4 py-2 rounded-full whitespace-nowrap"
                  disabled={uploadingLogo || loading}
                >
                  Choose Logo File
                </button>
                <div className="text-sm text-gray-300 truncate flex-1">
                  {logoFile?.name || 'No file selected'}
                </div>
                <button
                  onClick={uploadLogo}
                  disabled={!logoFile || uploadingLogo || loading}
                  className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60 whitespace-nowrap"
                >
                  {uploadingLogo ? 'Uploading logo...' : 'Upload Logo'}
                </button>
                <div className="h-14 w-14 shrink-0 rounded-md border border-white/20 bg-black/30 overflow-hidden flex items-center justify-center">
                  {form.logoUrl ? (
                    <img
                      src={absoluteLogoUrl(form.logoUrl)}
                      alt="Church logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-500">No logo</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <input className={fieldClass} placeholder="Address line 1" value={form.addressLine1} onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))} />
              <input className={fieldClass} placeholder="Address line 2" value={form.addressLine2} onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))} />
              <input className={fieldClass} placeholder="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              <input className={fieldClass} placeholder="State" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
              <input className={fieldClass} placeholder="Postal Code" value={form.postalCode} onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))} />
              <input className={fieldClass} placeholder="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
              <input className={fieldClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className={fieldClass} placeholder="Website" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
