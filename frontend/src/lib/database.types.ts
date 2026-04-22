export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; telegram_id: number; first_name: string | null; last_name: string | null; username: string | null; phone: string | null; avatar_url: string | null; role: 'customer' | 'driver' | 'admin'; approval_status: 'pending' | 'approved' | 'rejected'; is_online: boolean | null; latitude: number | null; longitude: number | null; rating: number | null; created_at: string; updated_at: string }
        Insert: any; Update: any
      }
      driver_details: {
        Row: { id: string; profile_id: string; vehicle_make: string | null; vehicle_model: string | null; vehicle_year: number | null; vehicle_plate: string | null; vehicle_color: string | null; license_number: string | null; license_image_url: string | null; id_card_image_url: string | null }
        Insert: any; Update: any
      }
      rides: {
        Row: { id: string; customer_id: string; driver_id: string | null; pickup_lat: number; pickup_lng: number; dropoff_lat: number; dropoff_lng: number; pickup_address: string | null; dropoff_address: string | null; status: 'pending' | 'accepted' | 'picked_up' | 'in_progress' | 'completed' | 'cancelled'; fare: number | null; distance_km: number | null; payment_method: string | null; rating: number | null; review: string | null; cancellation_reason: string | null; created_at: string; updated_at: string }
        Insert: any; Update: any
      }
      app_settings: { Row: { key: string; value: Json }; Insert: any; Update: any }
    }
    Functions: {
      get_my_profile: { Args: { _telegram_id: number }; Returns: any[] }
      register_user: { Args: any; Returns: string }
      approve_user: { Args: any; Returns: void }
      get_pending_users: { Args: any; Returns: any[] }
      get_driver_details_for_admin: { Args: any; Returns: any[] }
      get_admin_stats: { Args: any; Returns: Json }
    }
  }
}
