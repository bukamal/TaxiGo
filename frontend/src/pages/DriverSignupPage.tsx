import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../context/TelegramContext'
import { createSupabaseClient } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { User, Phone, FileText, Camera, ArrowLeft, Loader2, X } from 'lucide-react'

export default function DriverSignupPage() {
    const { user: tgUser } = useTelegram()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState<'license' | 'id' | null>(null)
    const [formData, setFormData] = useState({
        firstName: tgUser?.first_name || '',
        lastName: tgUser?.last_name || '',
        phone: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehiclePlate: '',
        vehicleColor: '',
        licenseNumber: '',
        licenseImageUrl: '',
        idCardImageUrl: '',
    })
    const [previewImages, setPreviewImages] = useState<{ license: string | null; idCard: string | null }>({
        license: null,
        idCard: null,
    })
    const licenseInputRef = useRef<HTMLInputElement>(null)
    const idCardInputRef = useRef<HTMLInputElement>(null)

    const uploadImage = async (file: File, type: 'license' | 'id'): Promise<string | null> => {
        if (!tgUser) return null
        const supabase = createSupabaseClient(tgUser.id)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${tgUser.id}/${type}/${fileName}`

        setUploading(type)
        const { error } = await supabase.storage
            .from('documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            alert('Upload failed: ' + error.message)
            setUploading(null)
            return null
        }

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)
        setUploading(null)
        return urlData.publicUrl
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'id') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            setPreviewImages(prev => ({ ...prev, [type]: event.target?.result as string }))
        }
        reader.readAsDataURL(file)

        const publicUrl = await uploadImage(file, type)
        if (publicUrl) {
            setFormData(prev => ({
                ...prev,
                [type === 'license' ? 'licenseImageUrl' : 'idCardImageUrl']: publicUrl
            }))
        }
    }

    const clearImage = (type: 'license' | 'id') => {
        setPreviewImages(prev => ({ ...prev, [type]: null }))
        setFormData(prev => ({
            ...prev,
            [type === 'license' ? 'licenseImageUrl' : 'idCardImageUrl']: ''
        }))
        if (type === 'license' && licenseInputRef.current) licenseInputRef.current.value = ''
        if (type === 'id' && idCardInputRef.current) idCardInputRef.current.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tgUser) return

        setLoading(true)
        const supabase = createSupabaseClient(tgUser.id)

        const { error } = await supabase.rpc('register_user', {
            _telegram_id: tgUser.id,
            _first_name: formData.firstName,
            _last_name: formData.lastName,
            _username: tgUser.username || null,
            _phone: formData.phone,
            _role: 'driver',
            _vehicle_make: formData.vehicleMake,
            _vehicle_model: formData.vehicleModel,
            _vehicle_year: parseInt(formData.vehicleYear) || null,
            _vehicle_plate: formData.vehiclePlate,
            _vehicle_color: formData.vehicleColor,
            _license_number: formData.licenseNumber,
            _license_image_url: formData.licenseImageUrl,
            _id_card_image_url: formData.idCardImageUrl,
        })

        setLoading(false)
        if (error) {
            alert('Error registering: ' + error.message)
        } else {
            navigate('/pending')
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
            <button onClick={() => navigate('/choose-role')} className="mb-6 p-2 -ml-2">
                <ArrowLeft className="w-6 h-6 dark:text-white" />
            </button>

            <h1 className="text-2xl font-bold mb-6 dark:text-white">{t('signup.driver_title')}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-300">{t('signup.personal_info')}</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.first_name')}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.last_name')}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.phone')}</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                    </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-300">{t('signup.vehicle_info')}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.vehicle_make')}</label>
                            <input type="text" value={formData.vehicleMake} onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.vehicle_model')}</label>
                            <input type="text" value={formData.vehicleModel} onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.vehicle_year')}</label>
                            <input type="number" value={formData.vehicleYear} onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.vehicle_color')}</label>
                            <input type="text" value={formData.vehicleColor} onChange={(e) => setFormData({...formData, vehicleColor: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.vehicle_plate')}</label>
                        <input type="text" value={formData.vehiclePlate} onChange={(e) => setFormData({...formData, vehiclePlate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                    </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-300">{t('signup.documents')}</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.license_number')}</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.license_photo')}</label>
                        {previewImages.license ? (
                            <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                                <img src={previewImages.license} alt="License preview" className="w-full h-full object-contain" />
                                <button type="button" onClick={() => clearImage('license')} className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-700 rounded-full shadow">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => licenseInputRef.current?.click()}
                                className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 transition-colors"
                            >
                                {uploading === 'license' ? (
                                    <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                                ) : (
                                    <>
                                        <Camera className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('signup.upload_hint')}</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input type="file" ref={licenseInputRef} accept="image/*" onChange={(e) => handleFileChange(e, 'license')} className="hidden" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('signup.id_photo')}</label>
                        {previewImages.idCard ? (
                            <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                                <img src={previewImages.idCard} alt="ID preview" className="w-full h-full object-contain" />
                                <button type="button" onClick={() => clearImage('id')} className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-700 rounded-full shadow">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => idCardInputRef.current?.click()}
                                className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 transition-colors"
                            >
                                {uploading === 'id' ? (
                                    <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                                ) : (
                                    <>
                                        <Camera className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('signup.upload_hint')}</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input type="file" ref={idCardInputRef} accept="image/*" onChange={(e) => handleFileChange(e, 'id')} className="hidden" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || uploading !== null}
                    className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {t('signup.submit')}
                </button>
            </form>
        </div>
    )
}
