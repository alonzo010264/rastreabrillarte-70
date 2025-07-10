export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      Contactos: {
        Row: {
          codigo_pedido: string | null
          correo: string
          descripcion_problema: string
          estado: string | null
          fecha_creacion: string | null
          id: string
          nombre_cliente: string
        }
        Insert: {
          codigo_pedido?: string | null
          correo: string
          descripcion_problema: string
          estado?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_cliente: string
        }
        Update: {
          codigo_pedido?: string | null
          correo?: string
          descripcion_problema?: string
          estado?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_cliente?: string
        }
        Relationships: []
      }
      Estatus: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      Historial_Estatus: {
        Row: {
          "Código de pedido": string
          Descripcion: string | null
          Estatus_id: number
          Fecha: string
          id: string
          Usuario: string | null
        }
        Insert: {
          "Código de pedido": string
          Descripcion?: string | null
          Estatus_id: number
          Fecha?: string
          id?: string
          Usuario?: string | null
        }
        Update: {
          "Código de pedido"?: string
          Descripcion?: string | null
          Estatus_id?: number
          Fecha?: string
          id?: string
          Usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Historial_Estatus_Código de pedido_fkey"
            columns: ["Código de pedido"]
            isOneToOne: false
            referencedRelation: "Pedidos"
            referencedColumns: ["Código de pedido"]
          },
          {
            foreignKeyName: "Historial_Estatus_Estatus_id_fkey"
            columns: ["Estatus_id"]
            isOneToOne: false
            referencedRelation: "Estatus"
            referencedColumns: ["id"]
          },
        ]
      }
      Pedidos: {
        Row: {
          Cliente: string
          "Código de pedido": string
          Estatus_id: number
          Fecha_actualizacion: string
          Fecha_creacion: string
          Fecha_estimada_entrega: string
          Notas: string | null
          Peso: number
          Precio: number
          Total: number
        }
        Insert: {
          Cliente: string
          "Código de pedido": string
          Estatus_id: number
          Fecha_actualizacion?: string
          Fecha_creacion?: string
          Fecha_estimada_entrega: string
          Notas?: string | null
          Peso: number
          Precio: number
          Total: number
        }
        Update: {
          Cliente?: string
          "Código de pedido"?: string
          Estatus_id?: number
          Fecha_actualizacion?: string
          Fecha_creacion?: string
          Fecha_estimada_entrega?: string
          Notas?: string | null
          Peso?: number
          Precio?: number
          Total?: number
        }
        Relationships: [
          {
            foreignKeyName: "Pedidos_Estatus_id_fkey"
            columns: ["Estatus_id"]
            isOneToOne: false
            referencedRelation: "Estatus"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      copiar_historial_pedido: {
        Args: { codigo_origen: string; codigo_destino: string }
        Returns: undefined
      }
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
