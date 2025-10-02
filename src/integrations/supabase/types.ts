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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cancelaciones_notificaciones: {
        Row: {
          activo: boolean
          correo: string
          fecha_creacion: string
          id: string
        }
        Insert: {
          activo?: boolean
          correo: string
          fecha_creacion?: string
          id?: string
        }
        Update: {
          activo?: boolean
          correo?: string
          fecha_creacion?: string
          id?: string
        }
        Relationships: []
      }
      codigos_descuento: {
        Row: {
          admin_creador: string | null
          cliente_id: string | null
          codigo: string
          descuento_monto: number | null
          descuento_porcentaje: number | null
          fecha_creacion: string
          fecha_vencimiento: string | null
          id: string
          usado: boolean | null
        }
        Insert: {
          admin_creador?: string | null
          cliente_id?: string | null
          codigo: string
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          fecha_creacion?: string
          fecha_vencimiento?: string | null
          id?: string
          usado?: boolean | null
        }
        Update: {
          admin_creador?: string | null
          cliente_id?: string | null
          codigo?: string
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          fecha_creacion?: string
          fecha_vencimiento?: string | null
          id?: string
          usado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "codigos_descuento_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
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
      noticias: {
        Row: {
          activo: boolean
          contenido: string
          created_at: string
          fecha_publicacion: string
          id: string
          titulo: string
        }
        Insert: {
          activo?: boolean
          contenido: string
          created_at?: string
          fecha_publicacion?: string
          id?: string
          titulo: string
        }
        Update: {
          activo?: boolean
          contenido?: string
          created_at?: string
          fecha_publicacion?: string
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          admin_nombre: string | null
          admin_remitente: string | null
          fecha_creacion: string
          id: string
          leido: boolean
          mensaje: string
          titulo: string
          user_id: string
        }
        Insert: {
          admin_nombre?: string | null
          admin_remitente?: string | null
          fecha_creacion?: string
          id?: string
          leido?: boolean
          mensaje: string
          titulo: string
          user_id: string
        }
        Update: {
          admin_nombre?: string | null
          admin_remitente?: string | null
          fecha_creacion?: string
          id?: string
          leido?: boolean
          mensaje?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      Pedidos: {
        Row: {
          Cliente: string
          "Código de pedido": string
          correo_cliente: string | null
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
          correo_cliente?: string | null
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
          correo_cliente?: string | null
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
      pedidos_formulario: {
        Row: {
          correo: string
          descripcion_articulo: string
          direccion: string | null
          estado: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          nombre: string
          numero_casa: string | null
          provincia: string | null
          referencias: string | null
          sector: string | null
          telefono: string | null
          tipo_servicio: string
        }
        Insert: {
          correo: string
          descripcion_articulo: string
          direccion?: string | null
          estado?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre: string
          numero_casa?: string | null
          provincia?: string | null
          referencias?: string | null
          sector?: string | null
          telefono?: string | null
          tipo_servicio: string
        }
        Update: {
          correo?: string
          descripcion_articulo?: string
          direccion?: string | null
          estado?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre?: string
          numero_casa?: string | null
          provincia?: string | null
          referencias?: string | null
          sector?: string | null
          telefono?: string | null
          tipo_servicio?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          codigo_membresia: string | null
          confirmado: boolean | null
          correo: string
          direccion: string | null
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          nombre_completo: string
          saldo: number
          telefono: string | null
          user_id: string
        }
        Insert: {
          codigo_membresia?: string | null
          confirmado?: boolean | null
          correo: string
          direccion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre_completo: string
          saldo?: number
          telefono?: string | null
          user_id: string
        }
        Update: {
          codigo_membresia?: string | null
          confirmado?: boolean | null
          correo?: string
          direccion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre_completo?: string
          saldo?: number
          telefono?: string | null
          user_id?: string
        }
        Relationships: []
      }
      Solicitudes_Ayuda: {
        Row: {
          codigo_pedido: string
          correo: string
          estado: string
          fecha_creacion: string
          id: string
          situacion: string
        }
        Insert: {
          codigo_pedido: string
          correo: string
          estado?: string
          fecha_creacion?: string
          id?: string
          situacion: string
        }
        Update: {
          codigo_pedido?: string
          correo?: string
          estado?: string
          fecha_creacion?: string
          id?: string
          situacion?: string
        }
        Relationships: []
      }
      Solicitudes_Cambio_Direccion: {
        Row: {
          codigo_pedido: string
          correo: string
          estado: string
          fecha_creacion: string
          id: string
          nueva_direccion: string
          razon: string | null
        }
        Insert: {
          codigo_pedido: string
          correo: string
          estado?: string
          fecha_creacion?: string
          id?: string
          nueva_direccion: string
          razon?: string | null
        }
        Update: {
          codigo_pedido?: string
          correo?: string
          estado?: string
          fecha_creacion?: string
          id?: string
          nueva_direccion?: string
          razon?: string | null
        }
        Relationships: []
      }
      solicitudes_retiro: {
        Row: {
          apellido: string
          codigo_pedido: string
          correo: string
          estado: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          nombre: string
        }
        Insert: {
          apellido: string
          codigo_pedido: string
          correo: string
          estado?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre: string
        }
        Update: {
          apellido?: string
          codigo_pedido?: string
          correo?: string
          estado?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      transacciones_saldo: {
        Row: {
          admin_id: string | null
          admin_nombre: string | null
          descripcion: string
          fecha_creacion: string
          id: string
          monto: number
          tipo: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_nombre?: string | null
          descripcion: string
          fecha_creacion?: string
          id?: string
          monto: number
          tipo: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_nombre?: string | null
          descripcion?: string
          fecha_creacion?: string
          id?: string
          monto?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_saldo_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      copiar_historial_pedido: {
        Args: { codigo_destino: string; codigo_origen: string }
        Returns: undefined
      }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: string
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
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
