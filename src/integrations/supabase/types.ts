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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cancelaciones_notificaciones: {
        Row: {
          activo: boolean | null
          correo: string
          created_at: string | null
          id: string
          razon: string | null
        }
        Insert: {
          activo?: boolean | null
          correo: string
          created_at?: string | null
          id?: string
          razon?: string | null
        }
        Update: {
          activo?: boolean | null
          correo?: string
          created_at?: string | null
          id?: string
          razon?: string | null
        }
        Relationships: []
      }
      chatbot_conversations: {
        Row: {
          conversation_data: Json
          created_at: string | null
          email: string
          id: string
          order_code: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_data?: Json
          created_at?: string | null
          email: string
          id?: string
          order_code?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_data?: Json
          created_at?: string | null
          email?: string
          id?: string
          order_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string | null
          email: string
          estado: string | null
          id: string
          mensaje: string | null
          origen: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          estado?: string | null
          id?: string
          mensaje?: string | null
          origen?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          estado?: string | null
          id?: string
          mensaje?: string | null
          origen?: string | null
        }
        Relationships: []
      }
      Contactos: {
        Row: {
          codigo_pedido: string | null
          correo: string
          descripcion_problema: string
          estado: string
          fecha_creacion: string | null
          id: string
          nombre_cliente: string
        }
        Insert: {
          codigo_pedido?: string | null
          correo: string
          descripcion_problema: string
          estado?: string
          fecha_creacion?: string | null
          id?: string
          nombre_cliente: string
        }
        Update: {
          codigo_pedido?: string | null
          correo?: string
          descripcion_problema?: string
          estado?: string
          fecha_creacion?: string | null
          id?: string
          nombre_cliente?: string
        }
        Relationships: []
      }
      creditos_dados: {
        Row: {
          admin_creador: string | null
          codigo_membresia: string | null
          created_at: string | null
          id: string
          monto: number
          profile_id: string | null
          razon: string | null
        }
        Insert: {
          admin_creador?: string | null
          codigo_membresia?: string | null
          created_at?: string | null
          id?: string
          monto: number
          profile_id?: string | null
          razon?: string | null
        }
        Update: {
          admin_creador?: string | null
          codigo_membresia?: string | null
          created_at?: string | null
          id?: string
          monto?: number
          profile_id?: string | null
          razon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creditos_dados_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          categoria: string
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
          "Código de pedido": string | null
          Descripcion: string | null
          Estatus_id: number | null
          Fecha: string | null
          id: number
        }
        Insert: {
          "Código de pedido"?: string | null
          Descripcion?: string | null
          Estatus_id?: number | null
          Fecha?: string | null
          id?: number
        }
        Update: {
          "Código de pedido"?: string | null
          Descripcion?: string | null
          Estatus_id?: number | null
          Fecha?: string | null
          id?: number
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
          activo: boolean | null
          categoria: string | null
          contenido: string
          created_at: string | null
          descripcion: string | null
          fecha_publicacion: string | null
          id: string
          titulo: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          contenido: string
          created_at?: string | null
          descripcion?: string | null
          fecha_publicacion?: string | null
          id?: string
          titulo: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          contenido?: string
          created_at?: string | null
          descripcion?: string | null
          fecha_publicacion?: string | null
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          codigo_membresia: string | null
          created_at: string | null
          id: string
          leido: boolean | null
          mensaje: string
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          codigo_membresia?: string | null
          created_at?: string | null
          id?: string
          leido?: boolean | null
          mensaje: string
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          codigo_membresia?: string | null
          created_at?: string | null
          id?: string
          leido?: boolean | null
          mensaje?: string
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      paquetes_digitados: {
        Row: {
          codigo_membresia: string
          created_at: string | null
          descripcion: string | null
          estado: string | null
          id: string
          peso: number | null
          tracking_number: string
          updated_at: string | null
          valor_declarado: number | null
        }
        Insert: {
          codigo_membresia: string
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          peso?: number | null
          tracking_number: string
          updated_at?: string | null
          valor_declarado?: number | null
        }
        Update: {
          codigo_membresia?: string
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          peso?: number | null
          tracking_number?: string
          updated_at?: string | null
          valor_declarado?: number | null
        }
        Relationships: []
      }
      Pedidos: {
        Row: {
          Cliente: string
          "Código de pedido": string
          created_at: string | null
          estado: string | null
          Estatus_id: number | null
          Fecha_creacion: string | null
          Fecha_estimada_entrega: string | null
          Notas: string | null
          Peso: number | null
          Precio: number | null
          Total: number | null
        }
        Insert: {
          Cliente: string
          "Código de pedido": string
          created_at?: string | null
          estado?: string | null
          Estatus_id?: number | null
          Fecha_creacion?: string | null
          Fecha_estimada_entrega?: string | null
          Notas?: string | null
          Peso?: number | null
          Precio?: number | null
          Total?: number | null
        }
        Update: {
          Cliente?: string
          "Código de pedido"?: string
          created_at?: string | null
          estado?: string | null
          Estatus_id?: number | null
          Fecha_creacion?: string | null
          Fecha_estimada_entrega?: string | null
          Notas?: string | null
          Peso?: number | null
          Precio?: number | null
          Total?: number | null
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
      pedidos_cuenta: {
        Row: {
          codigo_membresia: string
          codigo_pedido: string
          created_at: string | null
          descripcion: string | null
          estado: string | null
          id: string
          monto: number | null
          updated_at: string | null
        }
        Insert: {
          codigo_membresia: string
          codigo_pedido: string
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          monto?: number | null
          updated_at?: string | null
        }
        Update: {
          codigo_membresia?: string
          codigo_pedido?: string
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          monto?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pedidos_formulario: {
        Row: {
          apellido: string
          codigo_membresia: string | null
          correo: string
          fecha_registro: string | null
          id: string
          instagram: string | null
          nombre: string
          whatsapp: string | null
        }
        Insert: {
          apellido: string
          codigo_membresia?: string | null
          correo: string
          fecha_registro?: string | null
          id?: string
          instagram?: string | null
          nombre: string
          whatsapp?: string | null
        }
        Update: {
          apellido?: string
          codigo_membresia?: string | null
          correo?: string
          fecha_registro?: string | null
          id?: string
          instagram?: string | null
          nombre?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      pedidos_registro: {
        Row: {
          codigo_membresia: string
          codigo_pedido: string
          correo: string
          credito: number | null
          direccion: string | null
          estado_pedido: string
          fecha_registro: string | null
          id: string
          nombre_cliente: string
          password: string
          telefono: string | null
          ultima_modificacion: string | null
        }
        Insert: {
          codigo_membresia: string
          codigo_pedido: string
          correo: string
          credito?: number | null
          direccion?: string | null
          estado_pedido?: string
          fecha_registro?: string | null
          id?: string
          nombre_cliente: string
          password: string
          telefono?: string | null
          ultima_modificacion?: string | null
        }
        Update: {
          codigo_membresia?: string
          codigo_pedido?: string
          correo?: string
          credito?: number | null
          direccion?: string | null
          estado_pedido?: string
          fecha_registro?: string | null
          id?: string
          nombre_cliente?: string
          password?: string
          telefono?: string | null
          ultima_modificacion?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          codigo_membresia: string | null
          confirmado: boolean | null
          correo: string | null
          created_at: string | null
          direccion: string | null
          fecha_creacion: string | null
          id: string
          nombre_completo: string | null
          saldo: number | null
          telefono: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          codigo_membresia?: string | null
          confirmado?: boolean | null
          correo?: string | null
          created_at?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_completo?: string | null
          saldo?: number | null
          telefono?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          codigo_membresia?: string | null
          confirmado?: boolean | null
          correo?: string | null
          created_at?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_completo?: string | null
          saldo?: number | null
          telefono?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      registros_acceso: {
        Row: {
          activo: boolean | null
          codigo_membresia: string
          correo: string | null
          direccion: string | null
          fecha_creacion: string | null
          id: string
          nombre: string | null
          password: string
          telefono: string | null
          ultima_modificacion: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo_membresia: string
          correo?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre?: string | null
          password: string
          telefono?: string | null
          ultima_modificacion?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo_membresia?: string
          correo?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre?: string | null
          password?: string
          telefono?: string | null
          ultima_modificacion?: string | null
        }
        Relationships: []
      }
      respuestas_tickets: {
        Row: {
          created_at: string | null
          es_admin: boolean
          id: string
          mensaje: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          es_admin?: boolean
          id?: string
          mensaje: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          es_admin?: boolean
          id?: string
          mensaje?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ayuda"
            referencedColumns: ["id"]
          },
        ]
      }
      Solicitudes_Ayuda: {
        Row: {
          codigo_pedido: string
          correo: string
          estado: string
          fecha_creacion: string | null
          id: string
          situacion: string
        }
        Insert: {
          codigo_pedido: string
          correo: string
          estado?: string
          fecha_creacion?: string | null
          id?: string
          situacion: string
        }
        Update: {
          codigo_pedido?: string
          correo?: string
          estado?: string
          fecha_creacion?: string | null
          id?: string
          situacion?: string
        }
        Relationships: []
      }
      Solicitudes_Cambio_Direccion: {
        Row: {
          codigo_membresia: string
          codigo_pedido: string
          correo: string | null
          estado: string
          fecha_creacion: string | null
          id: string
          nueva_direccion: string
          password: string
          razon: string | null
        }
        Insert: {
          codigo_membresia: string
          codigo_pedido: string
          correo?: string | null
          estado?: string
          fecha_creacion?: string | null
          id?: string
          nueva_direccion: string
          password: string
          razon?: string | null
        }
        Update: {
          codigo_membresia?: string
          codigo_pedido?: string
          correo?: string | null
          estado?: string
          fecha_creacion?: string | null
          id?: string
          nueva_direccion?: string
          password?: string
          razon?: string | null
        }
        Relationships: []
      }
      support_agents: {
        Row: {
          activo: boolean | null
          cliente_actual: string | null
          created_at: string | null
          id: string
          nombre: string
          ocupado: boolean | null
        }
        Insert: {
          activo?: boolean | null
          cliente_actual?: string | null
          created_at?: string | null
          id?: string
          nombre: string
          ocupado?: boolean | null
        }
        Update: {
          activo?: boolean | null
          cliente_actual?: string | null
          created_at?: string | null
          id?: string
          nombre?: string
          ocupado?: boolean | null
        }
        Relationships: []
      }
      support_queue: {
        Row: {
          agente_asignado: string | null
          atendido_at: string | null
          codigo_pedido: string | null
          created_at: string | null
          email: string
          estado: string | null
          id: string
        }
        Insert: {
          agente_asignado?: string | null
          atendido_at?: string | null
          codigo_pedido?: string | null
          created_at?: string | null
          email: string
          estado?: string | null
          id?: string
        }
        Update: {
          agente_asignado?: string | null
          atendido_at?: string | null
          codigo_pedido?: string | null
          created_at?: string | null
          email?: string
          estado?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_queue_agente_asignado_fkey"
            columns: ["agente_asignado"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_ayuda: {
        Row: {
          asunto: string
          categoria: string | null
          created_at: string | null
          descripcion: string
          estado: string
          id: string
          prioridad: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          asunto: string
          categoria?: string | null
          created_at?: string | null
          descripcion: string
          estado?: string
          id?: string
          prioridad?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          asunto?: string
          categoria?: string | null
          created_at?: string | null
          descripcion?: string
          estado?: string
          id?: string
          prioridad?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { input_user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
