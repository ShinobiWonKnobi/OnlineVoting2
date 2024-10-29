export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          is_admin: boolean
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          is_admin?: boolean
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          is_admin?: boolean
          email?: string | null
        }
      }
      polls: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          created_by: string
          ends_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          created_by: string
          ends_at: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          created_by?: string
          ends_at?: string
          is_active?: boolean
        }
      }
      options: {
        Row: {
          id: string
          poll_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          created_at: string
          poll_id: string
          option_id: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          poll_id: string
          option_id: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          poll_id?: string
          option_id?: string
          user_id?: string
        }
      }
    }
  }
}