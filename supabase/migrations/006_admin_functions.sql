-- دوال RPC للأدمن (تُضاف إلى المخطط الحالي)

-- دالة الموافقة على المستخدم
CREATE OR REPLACE FUNCTION approve_user(_admin_telegram_id TEXT, _user_telegram_id TEXT, _status TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text = _admin_telegram_id) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    UPDATE profiles SET approval_status = _status WHERE telegram_id = _user_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة جلب المستخدمين المعلقين
CREATE OR REPLACE FUNCTION get_pending_users(_admin_telegram_id TEXT)
RETURNS TABLE (id UUID, telegram_id TEXT, first_name TEXT, last_name TEXT, username TEXT, phone TEXT, role TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text = _admin_telegram_id) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    RETURN QUERY SELECT p.id, p.telegram_id, p.first_name, p.last_name, p.username, p.phone, p.role, p.created_at
                 FROM profiles p WHERE p.approval_status = 'pending' ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة تفاصيل السائق للأدمن
CREATE OR REPLACE FUNCTION get_driver_details_for_admin(_admin_telegram_id TEXT, _profile_id UUID)
RETURNS SETOF driver_details AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text = _admin_telegram_id) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    RETURN QUERY SELECT * FROM driver_details WHERE profile_id = _profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة الإحصائيات
CREATE OR REPLACE FUNCTION get_admin_stats(_admin_telegram_id TEXT)
RETURNS JSON AS $$
DECLARE
    total_rides INT; total_revenue DECIMAL; today_rides INT; today_revenue DECIMAL;
    active_drivers INT; pending_users INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'admin_telegram_id' AND value::text = _admin_telegram_id) THEN
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
