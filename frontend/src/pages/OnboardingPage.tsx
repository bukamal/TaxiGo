import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Car, MapPin, CreditCard } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface OnboardingPageProps {
  onFinish?: () => void
}

export default function OnboardingPage({ onFinish }: OnboardingPageProps) {
    const { t, dir } = useLanguage()
    const [currentSlide, setCurrentSlide] = useState(0)
    const navigate = useNavigate()

    const slides = [
        { titleKey: 'onboarding.slide1_title', descKey: 'onboarding.slide1_desc', icon: Car, color: 'bg-brand-600' },
        { titleKey: 'onboarding.slide2_title', descKey: 'onboarding.slide2_desc', icon: MapPin, color: 'bg-green-600' },
        { titleKey: 'onboarding.slide3_title', descKey: 'onboarding.slide3_desc', icon: CreditCard, color: 'bg-blue-600' },
    ]

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            if (onFinish) onFinish()
            navigate('/choose-role')
        }
    }

    const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(currentSlide - 1) }
    const slide = slides[currentSlide]
    const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className={`w-24 h-24 ${slide.color} rounded-3xl flex items-center justify-center mb-8`}>
                    <slide.icon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-center mb-4 dark:text-white">{t(slide.titleKey)}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-center text-lg">{t(slide.descKey)}</p>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-brand-600' : 'w-2 bg-gray-300'}`} />
                    ))}
                </div>
                <div className="flex gap-3">
                    {currentSlide > 0 && (
                        <button onClick={prevSlide} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 dark:text-white">
                            <PrevIcon className="w-5 h-5" /> {t('onboarding.back')}
                        </button>
                    )}
                    <button onClick={nextSlide} className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                        {currentSlide === slides.length - 1 ? t('onboarding.get_started') : t('onboarding.next')} <ChevronIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
