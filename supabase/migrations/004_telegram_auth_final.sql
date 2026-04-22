-- حذف الجداول القديمة (بحذر)
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.driver_details CASCADE;
DROP TABLE IF EXISTS public.customer_details CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- إنشاء جدول profiles مرتبط بـ auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'admin')) DEFAULT 'customer',
    approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    is_online BOOLEAN DEFAULT false,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating NUMERIC(3,2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تفاصيل السائق
CREATE TABLE public.driver_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    vehicle_plate TEXT,
    vehicle_color TEXT,
    license_number TEXT,
    license_image_url TEXT,
    id_card_image_url TEXT
);

-- جدول تفاصيل الزبون
CREATE TABLE public.customer_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    preferred_payment_method TEXT DEFAULT 'cash'
);

-- جدول الرحلات
CREATE TABLE public.rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) NOT NULL,
    driver_id UUID REFERENCES public.profiles(id),
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lng DOUBLE PRECISION NOT NULL,
    pickup_address TEXT,
    dropoff_address TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'picked_up', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    fare DECIMAL(10,2),
    distance_km DECIMAL(10,2),
    payment_method TEXT DEFAULT 'cash',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول إعدادات التطبيق
CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

INSERT INTO public.app_settings (key, value) VALUES ('admin_telegram_id', '""') ON CONFLICT DO NOTHING;

-- مؤشرات
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX idx_rides_customer_id ON public.rides(customer_id);
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);

-- دالة لإنشاء profile تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, username, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger بعد إنشاء مستخدم في auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- سياسات RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: المستخدم يمكنه قراءة وتحديث ملفه الشخصي
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin full access (باستخدام admin_telegram_id)
CREATE POLICY "Admin full access on profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid()))
);

-- سياسات driver_details
CREATE POLICY "Users can manage own driver_details" ON public.driver_details FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Admin full access on driver_details" ON public.driver_details FOR ALL USING (EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())));

-- سياسات customer_details
CREATE POLICY "Users can manage own customer_details" ON public.customer_details FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Admin full access on customer_details" ON public.customer_details FOR ALL USING (EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())));

-- سياسات rides
CREATE POLICY "Users view own rides" ON public.rides FOR SELECT USING (customer_id = auth.uid() OR driver_id = auth.uid());
CREATE POLICY "Drivers can view pending rides" ON public.rides FOR SELECT USING (status = 'pending' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver' AND approval_status = 'approved'));
CREATE POLICY "Customer can create ride" ON public.rides FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Driver can update ride status" ON public.rides FOR UPDATE USING (driver_id = auth.uid()) WITH CHECK (status IN ('accepted','picked_up','in_progress','completed'));
CREATE POLICY "Customer can cancel ride" ON public.rides FOR UPDATE USING (customer_id = auth.uid() AND status = 'pending') WITH CHECK (status = 'cancelled');
CREATE POLICY "Admin full access on rides" ON public.rides FOR ALL USING (EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())));

-- سياسات app_settings (Admin only)
CREATE POLICY "Admin can manage app_settings" ON public.app_settings FOR ALL USING (EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())));

-- دالة الموافقة على المستخدم (للأدمن)
CREATE OR REPLACE FUNCTION approve_user(_profile_id UUID, _status TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    UPDATE profiles SET approval_status = _status WHERE id = _profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة جلب المستخدمين المعلقين
CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, username TEXT, phone TEXT, role TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    RETURN QUERY SELECT p.id, p.first_name, p.last_name, p.username, p.phone, p.role, p.created_at FROM profiles p WHERE p.approval_status = 'pending' ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة تفاصيل السائق للأدمن
CREATE OR REPLACE FUNCTION get_driver_details_for_admin(_profile_id UUID)
RETURNS SETOF driver_details AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    RETURN QUERY SELECT * FROM driver_details WHERE profile_id = _profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة الإحصائيات
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    total_rides INT; total_revenue DECIMAL; today_rides INT; today_revenue DECIMAL;
    active_drivers INT; pending_users INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text::bigint = (SELECT (raw_user_meta_data->>'telegram_id')::bigint FROM auth.users WHERE id = auth.uid())) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    SELECT COUNT(*) INTO total_rides FROM rides;
    SELECT COALESCE(SUM(fare),0) INTO total_revenue FROM rides WHERE status='completed';
    SELECT COUNT(*) INTO today_rides FROM rides WHERE DATE(created_at)=CURRENT_DATE;
    SELECT COALESCE(SUM(fare),0) INTO today_revenue FROM rides WHERE status='completed' AND DATE(created_at)=CURRENT_DATE;
    SELECT COUNT(*) INTO active_drivers FROM profiles WHERE role='driver' AND approval_status='approved' AND is_online=true;
    SELECT COUNT(*) INTO pending_users FROM profiles WHERE approval_status='pending';
    RETURN json_build_object(
        'total_rides', total_rides, 'total_revenue', total_revenue,
        'today_rides', today_rides, 'today_revenue', today_revenue,
        'active_drivers', active_drivers, 'pending_users', pending_users
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
