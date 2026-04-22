export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          telegram_id: number
          first_name: string | null
          last_name: string | null
          username: string | null
          phone: string | null
          avatar_url: string | null
          role: 'customer' | 'driver' | 'admin'
          approval_status: 'pending' | 'approved' | 'rejected'
          is_online: boolean | null
          latitude: number | null
          longitude: number | null
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'driver' | 'admin'
          approval_status?: 'pending' | 'approved' | 'rejected'
          is_online?: boolean | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'driver' | 'admin'
          approval_status?: 'pending' | 'approved' | 'rejected'
          is_online?: boolean | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      driver_details: {
        Row: {
          id: string
          profile_id: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vehicle_plate: string | null
          vehicle_color: string | null
          license_number: string | null
          license_image_url: string | null
          id_card_image_url: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vehicle_plate?: string | null
          vehicle_color?: string | null
          license_number?: string | null
          license_image_url?: string | null
          id_card_image_url?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vehicle_plate?: string | null
          vehicle_color?: string | null
          license_number?: string | null
          license_image_url?: string | null
          id_card_image_url?: string | null
        }
      }
      customer_details: {
        Row: {
          id: string
          profile_id: string
          preferred_payment_method: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          preferred_payment_method?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          preferred_payment_method?: string | null
        }
      }
      rides: {
        Row: {
          id: string
          customer_id: string
          driver_id: string | null
          pickup_lat: number
          pickup_lng: number
          dropoff_lat: number
          dropoff_lng: number
          pickup_address: string | null
          dropoff_address: string | null
          status: 'pending' | 'accepted' | 'picked_up' | 'in_progress' | 'completed' | 'cancelled'
          fare: number | null
          distance_km: number | null
          payment_method: string | null
          rating: number | null
          review: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          driver_id?: string | null
          pickup_lat: number
          pickup_lng: number
          dropoff_lat: number
          dropoff_lng: number
          pickup_address?: string | null
          dropoff_address?: string | null
          status?: 'pending' | 'accepted' | 'picked_up' | 'in_progress' | 'completed' | 'cancelled'
          fare?: number | null
          distance_km?: number | null
          payment_method?: string | null
          rating?: number | null
          review?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          driver_id?: string | null
          pickup_lat?: number
          pickup_lng?: number
          dropoff_lat?: number
          dropoff_lng?: number
          pickup_address?: string | null
          dropoff_address?: string | null
          status?: 'pending' | 'accepted' | 'picked_up' | 'in_progress' | 'completed' | 'cancelled'
          fare?: number | null
          distance_km?: number | null
          payment_method?: string | null
          rating?: number | null
          review?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      app_settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
      }
    }
    Functions: {
      get_my_profile: {
        Args: { _telegram_id: number }
        Returns: {
          id: string
          telegram_id: number
          first_name: string | null
          last_name: string | null
          username: string | null
          phone: string | null
          avatar_url: string | null
          role: string
          approval_status: string
          is_online: boolean | null
          latitude: number | null
          longitude: number | null
          rating: number | null
          created_at: string
          updated_at: string
        }[]
      }
      register_user: {
        Args: {
          _telegram_id: number
          _first_name: string
          _last_name: string
          _username: string | null
          _phone: string
          _role: string
          _vehicle_make?: string
          _vehicle_model?: string
          _vehicle_year?: number
          _vehicle_plate?: string
          _vehicle_color?: string
          _license_number?: string
          _license_image_url?: string
          _id_card_image_url?: string
        }
        Returns: string
      }
      approve_user: {
        Args: { _admin_telegram_id: number; _user_telegram_id: number; _status: string }
        Returns: void
      }
      get_pending_users: {
        Args: { _admin_telegram_id: number }
        Returns: {
          id: string
          telegram_id: number
          first_name: string
          last_name: string
          username: string
          phone: string
          role: string
          created_at: string
        }[]
      }
      get_driver_details_for_admin: {
        Args: { _admin_telegram_id: number; _profile_id: string }
        Returns: {
          id: string
          profile_id: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vehicle_plate: string | null
          vehicle_color: string | null
          license_number: string | null
          license_image_url: string | null
          id_card_image_url: string | null
        }[]
      }
      get_admin_stats: {
        Args: { _admin_telegram_id: number }
        Returns: Json
      }
    }
  }
}
