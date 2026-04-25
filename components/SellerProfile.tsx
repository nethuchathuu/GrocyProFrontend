import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Camera,
  User,
  Phone,
  MapPin,
  CreditCard,
  CalendarDays,
  Users,
} from 'lucide-react';
import { Seller } from '../types';
import { getSeller, updateSeller } from '../src/api/sellerApi';

interface SellerProfileProps {
  onBack: () => void;
  onProfileUpdated?: () => void;
}

const EMPTY_FORM = {
  name: '',
  mobile_number: '',
  address: '',
  nic_number: '',
  date_of_birth: '',
  gender: 'Male' as 'Male' | 'Female',
};

const formatSellerId = (id: number) => `Grocy#${String(id).padStart(4, '0')}`;

const SellerProfile: React.FC<SellerProfileProps> = ({ onBack, onProfileUpdated }) => {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSeller()
      .then(data => {
        setSeller(data);
        if (data) {
          setForm({
            name: data.name,
            mobile_number: data.mobile_number,
            address: data.address ?? '',
            nic_number: data.nic_number ?? '',
            date_of_birth: data.date_of_birth ?? '',
            gender: data.gender,
          });
        }
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPictureFile(file);
    setPicturePreview(URL.createObjectURL(file));
  };

  const handleEdit = () => {
    if (seller) {
      setForm({
        name: seller.name,
        mobile_number: seller.mobile_number,
        address: seller.address ?? '',
        nic_number: seller.nic_number ?? '',
        date_of_birth: seller.date_of_birth ?? '',
        gender: seller.gender,
      });
    }
    setEditing(true);
  };

  const handleCancel = () => {
    setPictureFile(null);
    setPicturePreview(null);
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.mobile_number.trim() || !form.gender) {
      setError('Name, Mobile Number, and Gender are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSeller(form, pictureFile);
      const updated = await getSeller();
      setSeller(updated);
      setPictureFile(null);
      setPicturePreview(null);
      setEditing(false);
      onProfileUpdated?.();
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = picturePreview ?? (seller?.profile_picture ?? null);

  const field = (
    label: string,
    icon: React.ReactNode,
    key: keyof typeof form,
    type: string = 'text',
    editable: boolean = true
  ) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {icon}
        {label}
      </label>
      {editing && editable ? (
        type === 'textarea' ? (
          <textarea
            rows={3}
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white/80"
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          />
        ) : (
          <input
            type={type}
            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/80"
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          />
        )
      ) : (
        <p className={`text-sm font-medium px-4 py-2.5 rounded-2xl ${editable ? 'text-gray-800 bg-gray-50' : 'text-gray-500 bg-gray-50/50'}`}>
          {(key === 'date_of_birth' && form[key])
            ? new Date(form[key]).toLocaleDateString()
            : form[key] || <span className="text-gray-400 italic">Not set</span>
          }
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Seller Profile</h2>
          <p className="text-sm text-gray-500">View and manage your personal details</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Profile Banner */}
            <div className="h-24 bg-linear-to-r from-primary to-primary-400 relative" />

            {/* Avatar + Actions */}
            <div className="px-8 pb-8">
              <div className="flex items-end justify-between -mt-12 mb-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-primary-100 overflow-hidden flex items-center justify-center">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary-400" />
                    )}
                  </div>
                  {editing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-14">
                  {editing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary-700 transition-colors shadow shadow-primary-200 disabled:opacity-60"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary-700 transition-colors shadow shadow-primary-200"
                    >
                      <Pencil className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Name & ID quick-view */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-700">{seller?.name || 'New Seller'}</h3>
                {seller?.seller_id && (
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    Seller ID: <span className="text-primary font-bold">{formatSellerId(seller.seller_id)}</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
                  {error}
                </div>
              )}

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Seller ID — read-only */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Seller ID
                  </label>
                  <p className="text-sm font-medium px-4 py-2.5 rounded-2xl text-gray-500 bg-gray-50/50">
                    {seller?.seller_id ? formatSellerId(seller.seller_id) : <span className="text-gray-400 italic">Auto-assigned</span>}
                  </p>
                </div>

                {field('Full Name', <User className="w-3.5 h-3.5" />, 'name')}
                {field('Mobile Number', <Phone className="w-3.5 h-3.5" />, 'mobile_number', 'tel')}
                {field('NIC Number', <CreditCard className="w-3.5 h-3.5" />, 'nic_number')}
                {field('Date of Birth', <CalendarDays className="w-3.5 h-3.5" />, 'date_of_birth', 'date')}

                {/* Gender */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    <Users className="w-3.5 h-3.5" /> Gender
                  </label>
                  {editing ? (
                    <div className="flex gap-4 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white/80">
                      {(['Male', 'Female'] as const).map(g => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={form.gender === g}
                            onChange={() => setForm(f => ({ ...f, gender: g }))}
                            className="accent-primary"
                          />
                          <span className="text-sm text-gray-700 font-medium">{g}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium px-4 py-2.5 rounded-2xl text-gray-800 bg-gray-50">
                      {form.gender || <span className="text-gray-400 italic">Not set</span>}
                    </p>
                  )}
                </div>

                {/* Address — full width */}
                <div className="sm:col-span-2">
                  {field('Address', <MapPin className="w-3.5 h-3.5" />, 'address', 'textarea')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProfile;
