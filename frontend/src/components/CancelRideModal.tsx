import { useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface CancelRideModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
}

const reasons = [
    'driver_took_too_long',
    'wrong_pickup',
    'change_plans',
    'other'
]

export default function CancelRideModal({ isOpen, onClose, onConfirm }: CancelRideModalProps) {
    const { t } = useLanguage()
    const [selectedReason, setSelectedReason] = useState('')
    const [otherReason, setOtherReason] = useState('')

    if (!isOpen) return null

    const handleSubmit = () => {
        let finalReason = selectedReason
        if (selectedReason === 'other' && otherReason) {
            finalReason = otherReason
        }
        if (finalReason) {
            onConfirm(finalReason)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl p-6 animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold dark:text-white">إلغاء الرحلة</h3>
                    <button onClick={onClose} className="p-1"><X className="w-5 h-5 dark:text-white" /></button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">يرجى اختيار سبب الإلغاء</p>
                <div className="space-y-2">
                    {reasons.map(reason => (
                        <label key={reason} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                            <input
                                type="radio"
                                name="cancel_reason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-4 h-4 text-brand-600"
                            />
                            <span className="dark:text-white">{t(`cancel.${reason}`)}</span>
                        </label>
                    ))}
                </div>
                {selectedReason === 'other' && (
                    <textarea
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        placeholder="اكتب السبب..."
                        className="w-full mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 resize-none dark:text-white"
                        rows={2}
                    />
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || (selectedReason === 'other' && !otherReason)}
                    className="w-full mt-4 bg-red-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                    تأكيد الإلغاء
                </button>
            </div>
        </div>
    )
}
