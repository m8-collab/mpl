export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          approved: boolean
          created_at: string
          email: string | null
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          email?: string | null
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      albums: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      clubs: {
        Row: {
          crest_url: string | null
          id: string
          name: string
          venue: string | null
        }
        Insert: {
          crest_url?: string | null
          id: string
          name: string
          venue?: string | null
        }
        Update: {
          crest_url?: string | null
          id?: string
          name?: string
          venue?: string | null
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          away_id: string | null
          away_score: number | null
          date: string
          home_id: string | null
          home_score: number | null
          id: string
          kickoff: string | null
          match_no: string | null
          venue: string | null
        }
        Insert: {
          away_id?: string | null
          away_score?: number | null
          date: string
          home_id?: string | null
          home_score?: number | null
          id: string
          kickoff?: string | null
          match_no?: string | null
          venue?: string | null
        }
        Update: {
          away_id?: string | null
          away_score?: number | null
          date?: string
          home_id?: string | null
          home_score?: number | null
          id?: string
          kickoff?: string | null
          match_no?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_id_fkey"
            columns: ["away_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          album_id: number | null
          caption: string | null
          created_at: string
          id: number
          sort_order: number
          url: string
        }
        Insert: {
          album_id?: number | null
          caption?: string | null
          created_at?: string
          id?: number
          sort_order?: number
          url: string
        }
        Update: {
          album_id?: number | null
          caption?: string | null
          created_at?: string
          id?: number
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body: string | null
          created_at: string
          id: number
          tag: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: number
          tag?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: number
          tag?: string | null
          title?: string
        }
        Relationships: []
      }
      scorers: {
        Row: {
          club_id: string | null
          goals: number
          id: number
          player_name: string
        }
        Insert: {
          club_id?: string | null
          goals?: number
          id?: number
          player_name: string
        }
        Update: {
          club_id?: string | null
          goals?: number
          id?: number
          player_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          as_of_label: string | null
          id: number
          season_label: string | null
        }
        Insert: {
          as_of_label?: string | null
          id?: number
          season_label?: string | null
        }
        Update: {
          as_of_label?: string | null
          id?: number
          season_label?: string | null
        }
        Relationships: []
      }
      squads: {
        Row: {
          club_id: string | null
          id: number
          jersey_no: number | null
          photo_url: string | null
          player_name: string
        }
        Insert: {
          club_id?: string | null
          id?: number
          jersey_no?: number | null
          photo_url?: string | null
          player_name: string
        }
        Update: {
          club_id?: string | null
          id?: number
          jersey_no?: number | null
          photo_url?: string | null
          player_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      table_rows: {
        Row: {
          club_id: string
          d: number
          ga: number
          gf: number
          l: number
          p: number
          w: number
        }
        Insert: {
          club_id: string
          d?: number
          ga?: number
          gf?: number
          l?: number
          p?: number
          w?: number
        }
        Update: {
          club_id?: string
          d?: number
          ga?: number
          gf?: number
          l?: number
          p?: number
          w?: number
        }
        Relationships: [
          {
            foreignKeyName: "table_rows_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_approved_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
