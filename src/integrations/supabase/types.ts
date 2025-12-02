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
          codigo: string
          created_at: string | null
          descripcion: string | null
          fecha_expiracion: string | null
          fecha_inicio: string | null
          id: string
          porcentaje_descuento: number
          updated_at: string | null
          usos_actuales: number | null
          usos_maximos: number | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          fecha_expiracion?: string | null
          fecha_inicio?: string | null
          id?: string
          porcentaje_descuento: number
          updated_at?: string | null
          usos_actuales?: number | null
          usos_maximos?: number | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          fecha_expiracion?: string | null
          fecha_inicio?: string | null
          id?: string
          porcentaje_descuento?: number
          updated_at?: string | null
          usos_actuales?: number | null
          usos_maximos?: number | null
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
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
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
          Correo_cliente: string | null
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
          Correo_cliente?: string | null
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
          Correo_cliente?: string | null
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
      pedidos_online: {
        Row: {
          codigo_pedido: string
          created_at: string | null
          descuento: number | null
          direccion_envio: string
          estado: string
          factura_url: string | null
          id: string
          items: Json
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          codigo_pedido: string
          created_at?: string | null
          descuento?: number | null
          direccion_envio: string
          estado?: string
          factura_url?: string | null
          id?: string
          items: Json
          subtotal: number
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          codigo_pedido?: string
          created_at?: string | null
          descuento?: number | null
          direccion_envio?: string
          estado?: string
          factura_url?: string | null
          id?: string
          items?: Json
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string
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
          colores: string[] | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          disponible: boolean | null
          fecha_lanzamiento: string | null
          id: string
          imagenes: string[] | null
          nombre: string
          precio: number
          precio_mayoreo: number | null
          stock: number | null
          tallas: string[] | null
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          activo?: boolean | null
          cantidad_mayoreo?: number | null
          categoria?: string | null
          colores?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean | null
          fecha_lanzamiento?: string | null
          id?: string
          imagenes?: string[] | null
          nombre: string
          precio: number
          precio_mayoreo?: number | null
          stock?: number | null
          tallas?: string[] | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          activo?: boolean | null
          cantidad_mayoreo?: number | null
          categoria?: string | null
          colores?: string[] | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean | null
          fecha_lanzamiento?: string | null
          id?: string
          imagenes?: string[] | null
          nombre?: string
          precio?: number
          precio_mayoreo?: number | null
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
          confirmado: boolean | null
          correo: string
          created_at: string | null
          direccion: string | null
          fecha_creacion: string | null
          id: string
          nombre_completo: string
          saldo: number | null
          telefono: string | null
          updated_at: string | null
          user_id: string
          verificado: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          codigo_membresia?: string | null
          confirmado?: boolean | null
          correo: string
          created_at?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_completo: string
          saldo?: number | null
          telefono?: string | null
          updated_at?: string | null
          user_id: string
          verificado?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          codigo_membresia?: string | null
          confirmado?: boolean | null
          correo?: string
          created_at?: string | null
          direccion?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_completo?: string
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
      tarjetas_regalo: {
        Row: {
          codigo: string
          created_at: string | null
          diseno: Json
          fecha_canje: string | null
          id: string
          imagen_url: string | null
          monto: number
          usado: boolean | null
          user_id_canjeado: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          diseno: Json
          fecha_canje?: string | null
          id?: string
          imagen_url?: string | null
          monto: number
          usado?: boolean | null
          user_id_canjeado?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          diseno?: Json
          fecha_canje?: string | null
          id?: string
          imagen_url?: string | null
          monto?: number
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
      user_bans: {
        Row: {
          activo: boolean | null
          admin_id: string | null
          created_at: string | null
          duracion_horas: number | null
          duracion_tipo: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          razon: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          admin_id?: string | null
          created_at?: string | null
          duracion_horas?: number | null
          duracion_tipo: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          razon: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          admin_id?: string | null
          created_at?: string | null
          duracion_horas?: number | null
          duracion_tipo?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_code: { Args: never; Returns: string }
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
