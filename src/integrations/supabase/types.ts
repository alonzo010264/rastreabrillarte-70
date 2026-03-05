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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aceptaciones_politicas: {
        Row: {
          accion: string
          created_at: string | null
          id: string
          ip_address: string | null
          tipo_politica: string
          user_id: string
        }
        Insert: {
          accion: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          tipo_politica: string
          user_id: string
        }
        Update: {
          accion?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          tipo_politica?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_forms: {
        Row: {
          agente_id: string
          cliente_email: string | null
          created_at: string | null
          datos: Json
          id: string
          session_id: string
          tipo_formulario: string
        }
        Insert: {
          agente_id: string
          cliente_email?: string | null
          created_at?: string | null
          datos: Json
          id?: string
          session_id: string
          tipo_formulario: string
        }
        Update: {
          agente_id?: string
          cliente_email?: string | null
          created_at?: string | null
          datos?: Json
          id?: string
          session_id?: string
          tipo_formulario?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_forms_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_forms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_notifications: {
        Row: {
          agente_id: string | null
          created_at: string | null
          id: string
          leido: boolean | null
          mensaje: string | null
          session_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          agente_id?: string | null
          created_at?: string | null
          id?: string
          leido?: boolean | null
          mensaje?: string | null
          session_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          agente_id?: string | null
          created_at?: string | null
          id?: string
          leido?: boolean | null
          mensaje?: string | null
          session_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_notifications_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_profiles: {
        Row: {
          activo: boolean | null
          apellido: string
          avatar_inicial: string
          calificacion_promedio: number | null
          chats_atendidos: number | null
          created_at: string | null
          email: string
          en_linea: boolean | null
          es_ia: boolean | null
          id: string
          nombre: string
          telefono: string | null
          tipo_agente: string | null
          ultimo_acceso: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          avatar_inicial: string
          calificacion_promedio?: number | null
          chats_atendidos?: number | null
          created_at?: string | null
          email: string
          en_linea?: boolean | null
          es_ia?: boolean | null
          id?: string
          nombre: string
          telefono?: string | null
          tipo_agente?: string | null
          ultimo_acceso?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          avatar_inicial?: string
          calificacion_promedio?: number | null
          chats_atendidos?: number | null
          created_at?: string | null
          email?: string
          en_linea?: boolean | null
          es_ia?: boolean | null
          id?: string
          nombre?: string
          telefono?: string | null
          tipo_agente?: string | null
          ultimo_acceso?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      apelaciones_baneo: {
        Row: {
          admin_revisor: string | null
          created_at: string | null
          estado: string | null
          id: string
          notas_admin: string | null
          razon_apelacion: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_revisor?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          notas_admin?: string | null
          razon_apelacion: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_revisor?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          notas_admin?: string | null
          razon_apelacion?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      carrito: {
        Row: {
          cantidad: number
          color: string | null
          created_at: string | null
          id: string
          producto_id: string
          talla: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cantidad?: number
          color?: string | null
          created_at?: string | null
          id?: string
          producto_id: string
          talla?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cantidad?: number
          color?: string | null
          created_at?: string | null
          id?: string
          producto_id?: string
          talla?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrito_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          archivo_nombre: string | null
          archivo_tipo: string | null
          archivo_url: string | null
          contenido: string
          created_at: string | null
          id: string
          leido: boolean | null
          metadata: Json | null
          sender_id: string | null
          sender_nombre: string | null
          sender_type: string
          session_id: string
          tipo: string | null
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_tipo?: string | null
          archivo_url?: string | null
          contenido: string
          created_at?: string | null
          id?: string
          leido?: boolean | null
          metadata?: Json | null
          sender_id?: string | null
          sender_nombre?: string | null
          sender_type: string
          session_id: string
          tipo?: string | null
        }
        Update: {
          archivo_nombre?: string | null
          archivo_tipo?: string | null
          archivo_url?: string | null
          contenido?: string
          created_at?: string | null
          id?: string
          leido?: boolean | null
          metadata?: Json | null
          sender_id?: string | null
          sender_nombre?: string | null
          sender_type?: string
          session_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_ratings: {
        Row: {
          agente_id: string | null
          calificacion: number
          cliente_email: string | null
          created_at: string
          id: string
          mensaje: string | null
          session_id: string
        }
        Insert: {
          agente_id?: string | null
          calificacion: number
          cliente_email?: string | null
          created_at?: string
          id?: string
          mensaje?: string | null
          session_id: string
        }
        Update: {
          agente_id?: string | null
          calificacion?: number
          cliente_email?: string | null
          created_at?: string
          id?: string
          mensaje?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_ratings_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agente_id: string | null
          atendido_por: string | null
          cliente_email: string
          cliente_nombre: string | null
          created_at: string | null
          estado: string | null
          id: string
          inactividad_notificada: boolean | null
          metadata: Json | null
          ultima_actividad: string | null
          updated_at: string | null
        }
        Insert: {
          agente_id?: string | null
          atendido_por?: string | null
          cliente_email: string
          cliente_nombre?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          inactividad_notificada?: boolean | null
          metadata?: Json | null
          ultima_actividad?: string | null
          updated_at?: string | null
        }
        Update: {
          agente_id?: string | null
          atendido_por?: string | null
          cliente_email?: string
          cliente_nombre?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          inactividad_notificada?: boolean | null
          metadata?: Json | null
          ultima_actividad?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      codigos_descuento: {
        Row: {
          activo: boolean | null
          admin_creador: string | null
          cliente_id: string | null
          codigo: string
          created_at: string | null
          descripcion: string | null
          descuento_monto: number | null
          descuento_porcentaje: number | null
          fecha_expiracion: string | null
          fecha_inicio: string | null
          id: string
          porcentaje_descuento: number | null
          updated_at: string | null
          usado: boolean | null
          usos_actuales: number | null
          usos_maximos: number | null
        }
        Insert: {
          activo?: boolean | null
          admin_creador?: string | null
          cliente_id?: string | null
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          fecha_expiracion?: string | null
          fecha_inicio?: string | null
          id?: string
          porcentaje_descuento?: number | null
          updated_at?: string | null
          usado?: boolean | null
          usos_actuales?: number | null
          usos_maximos?: number | null
        }
        Update: {
          activo?: boolean | null
          admin_creador?: string | null
          cliente_id?: string | null
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          fecha_expiracion?: string | null
          fecha_inicio?: string | null
          id?: string
          porcentaje_descuento?: number | null
          updated_at?: string | null
          usado?: boolean | null
          usos_actuales?: number | null
          usos_maximos?: number | null
        }
        Relationships: []
      }
      codigos_pago: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          pedido_id: string | null
          usado: boolean | null
          usado_at: string | null
          usado_por: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          pedido_id?: string | null
          usado?: boolean | null
          usado_at?: string | null
          usado_por?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          pedido_id?: string | null
          usado?: boolean | null
          usado_at?: string | null
          usado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codigos_pago_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_online"
            referencedColumns: ["id"]
          },
        ]
      }
      codigos_referido: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      config_ceo: {
        Row: {
          ceo_nombre: string | null
          ceo_user_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          ceo_nombre?: string | null
          ceo_user_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          ceo_nombre?: string | null
          ceo_user_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      config_pagos_saldo: {
        Row: {
          activado: boolean
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          activado?: boolean
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          activado?: boolean
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_queue: {
        Row: {
          agente_asignado: string | null
          atendido: boolean | null
          created_at: string
          email: string
          id: string
          nombre: string | null
          preguntas_ia: Json | null
          problema: string
          updated_at: string
        }
        Insert: {
          agente_asignado?: string | null
          atendido?: boolean | null
          created_at?: string
          email: string
          id?: string
          nombre?: string | null
          preguntas_ia?: Json | null
          problema: string
          updated_at?: string
        }
        Update: {
          agente_asignado?: string | null
          atendido?: boolean | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
          preguntas_ia?: Json | null
          problema?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_queue_agente_asignado_fkey"
            columns: ["agente_asignado"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          estado: string | null
          ia_activa: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          ia_activa?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          ia_activa?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      creditos_dados: {
        Row: {
          admin_creador: string | null
          admin_id: string | null
          admin_nombre: string | null
          codigo_membresia: string | null
          correo: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          monto: number
          nombre: string | null
          profile_id: string | null
          razon: string | null
        }
        Insert: {
          admin_creador?: string | null
          admin_id?: string | null
          admin_nombre?: string | null
          codigo_membresia?: string | null
          correo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monto: number
          nombre?: string | null
          profile_id?: string | null
          razon?: string | null
        }
        Update: {
          admin_creador?: string | null
          admin_id?: string | null
          admin_nombre?: string | null
          codigo_membresia?: string | null
          correo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monto?: number
          nombre?: string | null
          profile_id?: string | null
          razon?: string | null
        }
        Relationships: []
      }
      cupones_canjeados: {
        Row: {
          created_at: string | null
          id: string
          tarjeta_id: string
          tipo: string
          usado: boolean | null
          usado_at: string | null
          user_id: string
          valor_obtenido: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          tarjeta_id: string
          tipo?: string
          usado?: boolean | null
          usado_at?: string | null
          user_id: string
          valor_obtenido?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          tarjeta_id?: string
          tipo?: string
          usado?: boolean | null
          usado_at?: string | null
          user_id?: string
          valor_obtenido?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupones_canjeados_tarjeta_id_fkey"
            columns: ["tarjeta_id"]
            isOneToOne: false
            referencedRelation: "tarjetas_regalo"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          asunto: string
          contenido: string
          created_at: string | null
          destinatario: string
          estado: string | null
          id: string
          tipo: string
        }
        Insert: {
          asunto: string
          contenido: string
          created_at?: string | null
          destinatario: string
          estado?: string | null
          id?: string
          tipo: string
        }
        Update: {
          asunto?: string
          contenido?: string
          created_at?: string | null
          destinatario?: string
          estado?: string | null
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      email_registration_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      empresas_envio: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: string
          logo_url: string | null
          monto_minimo: number | null
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          monto_minimo?: number | null
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          monto_minimo?: number | null
          nombre?: string
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
      favoritos: {
        Row: {
          created_at: string | null
          id: string
          producto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          producto_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          producto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      Historial_Estatus: {
        Row: {
          "Código de pedido": string | null
          Descripcion: string | null
          Estatus_id: number | null
          Fecha: string | null
          id: string
          Usuario: string | null
        }
        Insert: {
          "Código de pedido"?: string | null
          Descripcion?: string | null
          Estatus_id?: number | null
          Fecha?: string | null
          id?: string
          Usuario?: string | null
        }
        Update: {
          "Código de pedido"?: string | null
          Descripcion?: string | null
          Estatus_id?: number | null
          Fecha?: string | null
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
      likes_comunidad: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_comunidad_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_comunidad"
            referencedColumns: ["id"]
          },
        ]
      }
      likes_respuestas_comunidad: {
        Row: {
          created_at: string
          id: string
          respuesta_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          respuesta_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          respuesta_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_respuestas_comunidad_respuesta_id_fkey"
            columns: ["respuesta_id"]
            isOneToOne: false
            referencedRelation: "respuestas_comunidad"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          read_by: string[] | null
          sender_id: string
          tipo: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          read_by?: string[] | null
          sender_id: string
          tipo?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          read_by?: string[] | null
          sender_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          activo: boolean | null
          autor_id: string | null
          autor_nombre: string | null
          categoria: string | null
          contenido: string
          created_at: string | null
          descripcion: string | null
          fecha_publicacion: string | null
          id: string
          imagen_url: string | null
          titulo: string
        }
        Insert: {
          activo?: boolean | null
          autor_id?: string | null
          autor_nombre?: string | null
          categoria?: string | null
          contenido: string
          created_at?: string | null
          descripcion?: string | null
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          titulo: string
        }
        Update: {
          activo?: boolean | null
          autor_id?: string | null
          autor_nombre?: string | null
          categoria?: string | null
          contenido?: string
          created_at?: string | null
          descripcion?: string | null
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          titulo?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          accion_url: string | null
          codigo_membresia: string | null
          created_at: string | null
          id: string
          imagen_url: string | null
          leido: boolean | null
          mensaje: string
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          accion_url?: string | null
          codigo_membresia?: string | null
          created_at?: string | null
          id?: string
          imagen_url?: string | null
          leido?: boolean | null
          mensaje: string
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          accion_url?: string | null
          codigo_membresia?: string | null
          created_at?: string | null
          id?: string
          imagen_url?: string | null
          leido?: boolean | null
          mensaje?: string
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      palabras_prohibidas: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: string
          palabra: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          palabra: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          palabra?: string
        }
        Relationships: []
      }
      paquetes_digitados: {
        Row: {
          admin_creador: string | null
          admin_nombre: string | null
          cliente: string | null
          codigo_membresia: string
          codigo_pedido: string | null
          correo_cliente: string | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          estatus_id: number | null
          fecha_estimada_entrega: string | null
          id: string
          notas: string | null
          peso: number | null
          precio: number | null
          total: number | null
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
          valor_declarado: number | null
        }
        Insert: {
          admin_creador?: string | null
          admin_nombre?: string | null
          cliente?: string | null
          codigo_membresia: string
          codigo_pedido?: string | null
          correo_cliente?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          estatus_id?: number | null
          fecha_estimada_entrega?: string | null
          id?: string
          notas?: string | null
          peso?: number | null
          precio?: number | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_declarado?: number | null
        }
        Update: {
          admin_creador?: string | null
          admin_nombre?: string | null
          cliente?: string | null
          codigo_membresia?: string
          codigo_pedido?: string | null
          correo_cliente?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          estatus_id?: number | null
          fecha_estimada_entrega?: string | null
          id?: string
          notas?: string | null
          peso?: number | null
          precio?: number | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_declarado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paquetes_digitados_estatus_id_fkey"
            columns: ["estatus_id"]
            isOneToOne: false
            referencedRelation: "Estatus"
            referencedColumns: ["id"]
          },
        ]
      }
      participaciones_promociones: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string
          menciones: string[] | null
          promocion_id: string
          user_email: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          menciones?: string[] | null
          promocion_id: string
          user_email: string
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          menciones?: string[] | null
          promocion_id?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "participaciones_promociones_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
        ]
      }
      Pedidos: {
        Row: {
          Cliente: string
          "Código de pedido": string
          correo_cliente: string | null
          Correo_cliente: string | null
          created_at: string | null
          es_envio: boolean | null
          estado: string | null
          Estatus_id: number | null
          factura_url: string | null
          Fecha_actualizacion: string | null
          Fecha_creacion: string | null
          Fecha_estimada_entrega: string | null
          mostrar_ayuda: boolean | null
          mostrar_cambio_direccion: boolean | null
          mostrar_notificaciones: boolean | null
          Notas: string | null
          Peso: number | null
          Precio: number | null
          Total: number | null
        }
        Insert: {
          Cliente: string
          "Código de pedido": string
          correo_cliente?: string | null
          Correo_cliente?: string | null
          created_at?: string | null
          es_envio?: boolean | null
          estado?: string | null
          Estatus_id?: number | null
          factura_url?: string | null
          Fecha_actualizacion?: string | null
          Fecha_creacion?: string | null
          Fecha_estimada_entrega?: string | null
          mostrar_ayuda?: boolean | null
          mostrar_cambio_direccion?: boolean | null
          mostrar_notificaciones?: boolean | null
          Notas?: string | null
          Peso?: number | null
          Precio?: number | null
          Total?: number | null
        }
        Update: {
          Cliente?: string
          "Código de pedido"?: string
          correo_cliente?: string | null
          Correo_cliente?: string | null
          created_at?: string | null
          es_envio?: boolean | null
          estado?: string | null
          Estatus_id?: number | null
          factura_url?: string | null
          Fecha_actualizacion?: string | null
          Fecha_creacion?: string | null
          Fecha_estimada_entrega?: string | null
          mostrar_ayuda?: boolean | null
          mostrar_cambio_direccion?: boolean | null
          mostrar_notificaciones?: boolean | null
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
          detalles: Json | null
          estado: string | null
          fecha_asignacion: string | null
          id: string
          imagen_url: string | null
          monto: number | null
          nombre_producto: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          codigo_membresia: string
          codigo_pedido: string
          created_at?: string | null
          descripcion?: string | null
          detalles?: Json | null
          estado?: string | null
          fecha_asignacion?: string | null
          id?: string
          imagen_url?: string | null
          monto?: number | null
          nombre_producto?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          codigo_membresia?: string
          codigo_pedido?: string
          created_at?: string | null
          descripcion?: string | null
          detalles?: Json | null
          estado?: string | null
          fecha_asignacion?: string | null
          id?: string
          imagen_url?: string | null
          monto?: number | null
          nombre_producto?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pedidos_formulario: {
        Row: {
          apellido: string | null
          codigo_membresia: string | null
          correo: string
          descripcion_articulo: string | null
          direccion: string | null
          estado: string
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          fecha_registro: string | null
          id: string
          instagram: string | null
          nombre: string
          numero_casa: string | null
          provincia: string | null
          referencias: string | null
          sector: string | null
          telefono: string | null
          tipo_servicio: string | null
          whatsapp: string | null
        }
        Insert: {
          apellido?: string | null
          codigo_membresia?: string | null
          correo: string
          descripcion_articulo?: string | null
          direccion?: string | null
          estado?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_registro?: string | null
          id?: string
          instagram?: string | null
          nombre: string
          numero_casa?: string | null
          provincia?: string | null
          referencias?: string | null
          sector?: string | null
          telefono?: string | null
          tipo_servicio?: string | null
          whatsapp?: string | null
        }
        Update: {
          apellido?: string | null
          codigo_membresia?: string | null
          correo?: string
          descripcion_articulo?: string | null
          direccion?: string | null
          estado?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_registro?: string | null
          id?: string
          instagram?: string | null
          nombre?: string
          numero_casa?: string | null
          provincia?: string | null
          referencias?: string | null
          sector?: string | null
          telefono?: string | null
          tipo_servicio?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      pedidos_online: {
        Row: {
          codigo_pedido: string
          created_at: string | null
          descuento: number | null
          direccion_envio: string
          empresa_envio_id: string | null
          estado: string
          estado_detallado: string | null
          factura_url: string | null
          fecha_envio: string | null
          historial_estados: Json | null
          id: string
          items: Json
          subtotal: number
          total: number
          tracking_envio: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          codigo_pedido: string
          created_at?: string | null
          descuento?: number | null
          direccion_envio: string
          empresa_envio_id?: string | null
          estado?: string
          estado_detallado?: string | null
          factura_url?: string | null
          fecha_envio?: string | null
          historial_estados?: Json | null
          id?: string
          items: Json
          subtotal: number
          total: number
          tracking_envio?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          codigo_pedido?: string
          created_at?: string | null
          descuento?: number | null
          direccion_envio?: string
          empresa_envio_id?: string | null
          estado?: string
          estado_detallado?: string | null
          factura_url?: string | null
          fecha_envio?: string | null
          historial_estados?: Json | null
          id?: string
          items?: Json
          subtotal?: number
          total?: number
          tracking_envio?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_online_empresa_envio_fk"
            columns: ["empresa_envio_id"]
            isOneToOne: false
            referencedRelation: "empresas_envio"
            referencedColumns: ["id"]
          },
        ]
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
      posts_comunidad: {
        Row: {
          contenido: string
          created_at: string
          es_pregunta: boolean | null
          id: string
          respondido_por_ia: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          es_pregunta?: boolean | null
          id?: string
          respondido_por_ia?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          es_pregunta?: boolean | null
          id?: string
          respondido_por_ia?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean | null
          cantidad_mayoreo: number | null
          categoria: string | null
          codigo_oferta: string | null
          colores: string[] | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          disponible: boolean | null
          en_oferta: boolean | null
          fecha_lanzamiento: string | null
          id: string
          imagenes: string[] | null
          nombre: string
          oferta_fin: string | null
          oferta_inicio: string | null
          porcentaje_descuento: number | null
          precio: number
          precio_mayoreo: number | null
          precio_original: number | null
          stock: number | null
          tallas: string[] | null
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          activo?: boolean | null
          cantidad_mayoreo?: number | null
          categoria?: string | null
          codigo_oferta?: string | null
          colores?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean | null
          en_oferta?: boolean | null
          fecha_lanzamiento?: string | null
          id?: string
          imagenes?: string[] | null
          nombre: string
          oferta_fin?: string | null
          oferta_inicio?: string | null
          porcentaje_descuento?: number | null
          precio: number
          precio_mayoreo?: number | null
          precio_original?: number | null
          stock?: number | null
          tallas?: string[] | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          activo?: boolean | null
          cantidad_mayoreo?: number | null
          categoria?: string | null
          codigo_oferta?: string | null
          colores?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean | null
          en_oferta?: boolean | null
          fecha_lanzamiento?: string | null
          id?: string
          imagenes?: string[] | null
          nombre?: string
          oferta_fin?: string | null
          oferta_inicio?: string | null
          porcentaje_descuento?: number | null
          precio?: number
          precio_mayoreo?: number | null
          precio_original?: number | null
          stock?: number | null
          tallas?: string[] | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          codigo_membresia: string | null
          codigo_referido: string | null
          confirmado: boolean | null
          correo: string
          created_at: string | null
          direccion: string | null
          fecha_creacion: string | null
          id: string
          identificador: string | null
          nombre_completo: string
          puntos_referidos: number | null
          saldo: number | null
          telefono: string | null
          updated_at: string | null
          user_id: string
          verificado: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          codigo_membresia?: string | null
          codigo_referido?: string | null
          confirmado?: boolean | null
          correo: string
          created_at?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          identificador?: string | null
          nombre_completo: string
          puntos_referidos?: number | null
          saldo?: number | null
          telefono?: string | null
          updated_at?: string | null
          user_id: string
          verificado?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          codigo_membresia?: string | null
          codigo_referido?: string | null
          confirmado?: boolean | null
          correo?: string
          created_at?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          identificador?: string | null
          nombre_completo?: string
          puntos_referidos?: number | null
          saldo?: number | null
          telefono?: string | null
          updated_at?: string | null
          user_id?: string
          verificado?: boolean | null
        }
        Relationships: []
      }
      promociones: {
        Row: {
          activa: boolean | null
          created_at: string | null
          descripcion: string
          fecha_inicio: string | null
          fecha_limite: string
          id: string
          imagen_url: string | null
          instrucciones: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          descripcion: string
          fecha_inicio?: string | null
          fecha_limite: string
          id?: string
          imagen_url?: string | null
          instrucciones?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          descripcion?: string
          fecha_inicio?: string | null
          fecha_limite?: string
          id?: string
          imagen_url?: string | null
          instrucciones?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      puntos_referidos: {
        Row: {
          admin_id: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          puntos: number
          referido_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          puntos: number
          referido_id?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          puntos?: number
          referido_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      referidos: {
        Row: {
          admin_revisor: string | null
          aprobado: boolean | null
          codigo_referido: string
          created_at: string | null
          dispositivo_info: Json | null
          estado: string | null
          fecha_revision: string | null
          id: string
          ip_aproximada: string | null
          notas_admin: string | null
          puntos_otorgados: number | null
          rechazado: boolean | null
          recompensa_otorgada: boolean | null
          recompensa_tipo: string | null
          recompensa_valor: number | null
          referido_id: string
          referidor_id: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_revisor?: string | null
          aprobado?: boolean | null
          codigo_referido: string
          created_at?: string | null
          dispositivo_info?: Json | null
          estado?: string | null
          fecha_revision?: string | null
          id?: string
          ip_aproximada?: string | null
          notas_admin?: string | null
          puntos_otorgados?: number | null
          rechazado?: boolean | null
          recompensa_otorgada?: boolean | null
          recompensa_tipo?: string | null
          recompensa_valor?: number | null
          referido_id: string
          referidor_id: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_revisor?: string | null
          aprobado?: boolean | null
          codigo_referido?: string
          created_at?: string | null
          dispositivo_info?: Json | null
          estado?: string | null
          fecha_revision?: string | null
          id?: string
          ip_aproximada?: string | null
          notas_admin?: string | null
          puntos_otorgados?: number | null
          rechazado?: boolean | null
          recompensa_otorgada?: boolean | null
          recompensa_tipo?: string | null
          recompensa_valor?: number | null
          referido_id?: string
          referidor_id?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      referidos_perfiles: {
        Row: {
          admin_revisor: string | null
          codigo_amigo: string | null
          como_conocio: string
          created_at: string
          estado: string
          fecha_revision: string | null
          id: string
          razon_rechazo: string | null
          tema_preferido: string
          terminos_aceptados: boolean
          terminos_aceptados_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_revisor?: string | null
          codigo_amigo?: string | null
          como_conocio?: string
          created_at?: string
          estado?: string
          fecha_revision?: string | null
          id?: string
          razon_rechazo?: string | null
          tema_preferido?: string
          terminos_aceptados?: boolean
          terminos_aceptados_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_revisor?: string | null
          codigo_amigo?: string | null
          como_conocio?: string
          created_at?: string
          estado?: string
          fecha_revision?: string | null
          id?: string
          razon_rechazo?: string | null
          tema_preferido?: string
          terminos_aceptados?: boolean
          terminos_aceptados_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registros_acceso: {
        Row: {
          activo: boolean | null
          apellido: string | null
          codigo_membresia: string
          correo: string | null
          direccion: string | null
          email_enviado: boolean | null
          fecha_creacion: string | null
          id: string
          metadata: Json | null
          nombre: string | null
          password: string | null
          password_temporal_mascarado: string | null
          telefono: string | null
          ultima_modificacion: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido?: string | null
          codigo_membresia: string
          correo?: string | null
          direccion?: string | null
          email_enviado?: boolean | null
          fecha_creacion?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string | null
          password?: string | null
          password_temporal_mascarado?: string | null
          telefono?: string | null
          ultima_modificacion?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string | null
          codigo_membresia?: string
          correo?: string | null
          direccion?: string | null
          email_enviado?: boolean | null
          fecha_creacion?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string | null
          password?: string | null
          password_temporal_mascarado?: string | null
          telefono?: string | null
          ultima_modificacion?: string | null
        }
        Relationships: []
      }
      respuestas_comunidad: {
        Row: {
          contenido: string
          created_at: string
          es_ia: boolean | null
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          contenido: string
          created_at?: string
          es_ia?: boolean | null
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          contenido?: string
          created_at?: string
          es_ia?: boolean | null
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_comunidad_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_comunidad"
            referencedColumns: ["id"]
          },
        ]
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
      solicitudes_canje_referidos: {
        Row: {
          admin_revisor: string | null
          created_at: string
          estado: string
          fecha_revision: string | null
          id: string
          notas_admin: string | null
          notas_usuario: string | null
          puntos_canjeados: number
          user_id: string
        }
        Insert: {
          admin_revisor?: string | null
          created_at?: string
          estado?: string
          fecha_revision?: string | null
          id?: string
          notas_admin?: string | null
          notas_usuario?: string | null
          puntos_canjeados?: number
          user_id: string
        }
        Update: {
          admin_revisor?: string | null
          created_at?: string
          estado?: string
          fecha_revision?: string | null
          id?: string
          notas_admin?: string | null
          notas_usuario?: string | null
          puntos_canjeados?: number
          user_id?: string
        }
        Relationships: []
      }
      solicitudes_ia: {
        Row: {
          admin_revisor: string | null
          created_at: string | null
          descripcion: string
          estado: string
          id: string
          monto: number | null
          notas_admin: string | null
          ticket_id: string | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_revisor?: string | null
          created_at?: string | null
          descripcion: string
          estado?: string
          id?: string
          monto?: number | null
          notas_admin?: string | null
          ticket_id?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_revisor?: string | null
          created_at?: string | null
          descripcion?: string
          estado?: string
          id?: string
          monto?: number | null
          notas_admin?: string | null
          ticket_id?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_ia_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_ayuda"
            referencedColumns: ["id"]
          },
        ]
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
      solicitudes_verificacion: {
        Row: {
          admin_revisor: string | null
          created_at: string
          descripcion: string | null
          estado: string
          id: string
          instagram: string | null
          motivo: string
          nombre_negocio: string | null
          notas_admin: string | null
          sitio_web: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          admin_revisor?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          instagram?: string | null
          motivo: string
          nombre_negocio?: string | null
          notas_admin?: string | null
          sitio_web?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          admin_revisor?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          instagram?: string | null
          motivo?: string
          nombre_negocio?: string | null
          notas_admin?: string | null
          sitio_web?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
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
      suscripciones_pedidos: {
        Row: {
          activo: boolean | null
          codigo_pedido: string
          correo: string
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          codigo_pedido: string
          correo: string
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          codigo_pedido?: string
          correo?: string
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      suscriptores_newsletter: {
        Row: {
          activo: boolean
          correo: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean
          correo: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean
          correo?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tarjetas_brillarte: {
        Row: {
          activa: boolean
          bloqueada: boolean
          created_at: string
          cvv: string
          fecha_expiracion: string
          id: string
          motivo_bloqueo: string | null
          nombre_titular: string
          numero_tarjeta: string
          saldo: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          bloqueada?: boolean
          created_at?: string
          cvv: string
          fecha_expiracion: string
          id?: string
          motivo_bloqueo?: string | null
          nombre_titular: string
          numero_tarjeta: string
          saldo?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activa?: boolean
          bloqueada?: boolean
          created_at?: string
          cvv?: string
          fecha_expiracion?: string
          id?: string
          motivo_bloqueo?: string | null
          nombre_titular?: string
          numero_tarjeta?: string
          saldo?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tarjetas_regalo: {
        Row: {
          activo: boolean | null
          codigo: string
          color_primario: string | null
          color_secundario: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          diseno: Json | null
          fecha_canje: string | null
          fecha_expiracion: string | null
          id: string
          imagen_url: string | null
          monto: number
          porcentaje_descuento: number | null
          texto_frontal: string | null
          texto_trasero: string | null
          tipo: string | null
          titulo: string | null
          usado: boolean | null
          user_id_canjeado: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          diseno?: Json | null
          fecha_canje?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          monto: number
          porcentaje_descuento?: number | null
          texto_frontal?: string | null
          texto_trasero?: string | null
          tipo?: string | null
          titulo?: string | null
          usado?: boolean | null
          user_id_canjeado?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          diseno?: Json | null
          fecha_canje?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          monto?: number
          porcentaje_descuento?: number | null
          texto_frontal?: string | null
          texto_trasero?: string | null
          tipo?: string | null
          titulo?: string | null
          usado?: boolean | null
          user_id_canjeado?: string | null
        }
        Relationships: []
      }
      ticket_agents: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: string
          identificador: string | null
          nombre: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          identificador?: string | null
          nombre: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          identificador?: string | null
          nombre?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tickets_ayuda: {
        Row: {
          admin_asignado: string | null
          admin_nombre: string | null
          agente_asignado_id: string | null
          asunto: string
          categoria: string | null
          codigo_membresia: string | null
          created_at: string | null
          descripcion: string
          estado: string
          id: string
          prioridad: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_asignado?: string | null
          admin_nombre?: string | null
          agente_asignado_id?: string | null
          asunto: string
          categoria?: string | null
          codigo_membresia?: string | null
          created_at?: string | null
          descripcion: string
          estado?: string
          id?: string
          prioridad?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_asignado?: string | null
          admin_nombre?: string | null
          agente_asignado_id?: string | null
          asunto?: string
          categoria?: string | null
          codigo_membresia?: string | null
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
      transacciones_creditos: {
        Row: {
          admin_id: string | null
          concepto: string
          created_at: string | null
          id: string
          monto: number
          saldo_anterior: number
          saldo_nuevo: number
          tipo: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          concepto: string
          created_at?: string | null
          id?: string
          monto: number
          saldo_anterior: number
          saldo_nuevo: number
          tipo: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          concepto?: string
          created_at?: string | null
          id?: string
          monto?: number
          saldo_anterior?: number
          saldo_nuevo?: number
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      transacciones_tarjetas_brillarte: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          monto: number
          pedido_id: string | null
          saldo_anterior: number
          saldo_nuevo: number
          tarjeta_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          monto: number
          pedido_id?: string | null
          saldo_anterior: number
          saldo_nuevo: number
          tarjeta_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          monto?: number
          pedido_id?: string | null
          saldo_anterior?: number
          saldo_nuevo?: number
          tarjeta_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_tarjetas_brillarte_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_online"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_tarjetas_brillarte_tarjeta_id_fkey"
            columns: ["tarjeta_id"]
            isOneToOne: false
            referencedRelation: "tarjetas_brillarte"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_status: {
        Row: {
          id: string
          is_typing: boolean | null
          session_id: string
          updated_at: string | null
          user_id: string | null
          user_type: string
        }
        Insert: {
          id?: string
          is_typing?: boolean | null
          session_id: string
          updated_at?: string | null
          user_id?: string | null
          user_type: string
        }
        Update: {
          id?: string
          is_typing?: boolean | null
          session_id?: string
          updated_at?: string | null
          user_id?: string | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          activo: boolean | null
          admin_id: string | null
          automatico: boolean | null
          created_at: string | null
          duracion_horas: number | null
          duracion_tipo: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          palabra_detectada: string | null
          razon: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          admin_id?: string | null
          automatico?: boolean | null
          created_at?: string | null
          duracion_horas?: number | null
          duracion_tipo: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          palabra_detectada?: string | null
          razon: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          admin_id?: string | null
          automatico?: boolean | null
          created_at?: string | null
          duracion_horas?: number | null
          duracion_tipo?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          palabra_detectada?: string | null
          razon?: string
          user_id?: string
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
      verificaciones_envio: {
        Row: {
          agente_id: string
          agente_nombre: string | null
          conversation_id: string
          created_at: string | null
          datos: Json
          estado: string
          firmado_nombre: string | null
          firmado_por: string | null
          id: string
          notas_ceo: string | null
          target_user_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          agente_id: string
          agente_nombre?: string | null
          conversation_id: string
          created_at?: string | null
          datos?: Json
          estado?: string
          firmado_nombre?: string | null
          firmado_por?: string | null
          id?: string
          notas_ceo?: string | null
          target_user_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          agente_id?: string
          agente_nombre?: string | null
          conversation_id?: string
          created_at?: string | null
          datos?: Json
          estado?: string
          firmado_nombre?: string | null
          firmado_por?: string | null
          id?: string
          notas_ceo?: string | null
          target_user_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_verification_codes: { Args: never; Returns: undefined }
      create_conversation_with_participants: {
        Args: { other_user_id: string }
        Returns: string
      }
      generate_order_code: { Args: never; Returns: string }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      get_user_conversation_ids: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_user_role: {
        Args: { input_user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_uuid?: string }; Returns: boolean }
      is_agent: { Args: { _user_id: string }; Returns: boolean }
      is_user_banned: { Args: { check_user_id: string }; Returns: boolean }
      update_user_balance: {
        Args: {
          p_admin_id?: string
          p_concepto: string
          p_monto: number
          p_tipo: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "agent"
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
      app_role: ["admin", "moderator", "user", "agent"],
    },
  },
} as const
