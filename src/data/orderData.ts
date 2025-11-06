
// Base de datos simulada de pedidos
export const ordersDatabase = {
  "B01-00001": {
    customerName: "Sammy",
    orderCode: "B01-00001",
    totalAmount: 100,
    currentStatus: "Entregado",
    statusHistory: [
      {
        status: "Recibido",
        date: "2025-01-02",
        time: "8:30 AM",
        description: "Pedido recibido correctamente en nuestro sistema.",
        category: "processing" as const
      },
      {
        status: "Confirmado",
        date: "2025-01-02",
        time: "9:15 AM",
        description: "Confirmación del pedido y pago procesado exitosamente.",
        category: "processing" as const
      },
      {
        status: "En preparación",
        date: "2025-01-02",
        time: "10:00 AM",
        description: "Armando y empacando tu pedido con cuidado.",
        category: "processing" as const
      },
      {
        status: "Etiquetado",
        date: "2025-01-02",
        time: "11:30 AM",
        description: "Pedido ya tiene su etiqueta de envío asignada.",
        category: "processing" as const
      },
      {
        status: "Almacenado",
        date: "2025-01-02",
        time: "12:00 PM",
        description: "Producto listo y guardado para entrega.",
        category: "processing" as const
      },
      {
        status: "Listo para entrega",
        date: "2025-01-03",
        time: "8:00 AM",
        description: "Pedido preparado y esperando su ruta de entrega.",
        category: "shipping" as const
      },
      {
        status: "En ruta de entrega",
        date: "2025-01-03",
        time: "11:45 AM",
        description: "El mensajero lleva tu pedido camino a ti. ¡Ya casi llega!",
        category: "shipping" as const
      },
      {
        status: "Entregado",
        date: "2025-01-03",
        time: "12:30 PM",
        description: "¡Pedido entregado exitosamente! Recibido por el cliente. Gracias por la propina",
        category: "shipping" as const
      }
    ]
  }
};

export const findOrder = (orderCode: string) => {
  return ordersDatabase[orderCode as keyof typeof ordersDatabase] || null;
};
