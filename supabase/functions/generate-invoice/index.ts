import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  pedido: {
    codigo_pedido: string;
    cliente: string;
    correo: string;
    telefono?: string;
    direccion: string;
    items: Array<{
      nombre: string;
      cantidad: number;
      precio: number;
      subtotal: number;
    }>;
    subtotal: number;
    descuento: number;
    total: number;
    codigo_descuento?: string;
    fecha: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pedido }: InvoiceRequest = await req.json();
    
    console.log('Generating invoice for order:', pedido.codigo_pedido);

    // Generar HTML de la factura
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #000;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
    }
    .info-label {
      width: 150px;
      font-weight: bold;
    }
    .info-value {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #000;
      color: #fff;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 30px;
      float: right;
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .total-label {
      font-weight: bold;
    }
    .total-value {
      text-align: right;
    }
    .grand-total {
      border-top: 2px solid #000;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 18px;
      font-weight: bold;
    }
    .footer {
      clear: both;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
    }
    .contact-info {
      margin-top: 40px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">BRILLARTE</div>
    <div class="invoice-title">FACTURA</div>
  </div>

  <div class="section">
    <div class="section-title">Información del Pedido</div>
    <div class="info-row">
      <div class="info-label">Código de Pedido:</div>
      <div class="info-value"><strong>${pedido.codigo_pedido}</strong></div>
    </div>
    <div class="info-row">
      <div class="info-label">Fecha:</div>
      <div class="info-value">${new Date(pedido.fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Información del Cliente</div>
    <div class="info-row">
      <div class="info-label">Nombre:</div>
      <div class="info-value">${pedido.cliente}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Correo:</div>
      <div class="info-value">${pedido.correo}</div>
    </div>
    ${pedido.telefono ? `
    <div class="info-row">
      <div class="info-label">Teléfono:</div>
      <div class="info-value">${pedido.telefono}</div>
    </div>
    ` : ''}
    <div class="info-row">
      <div class="info-label">Dirección de Envío:</div>
      <div class="info-value">${pedido.direccion}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Productos</div>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${pedido.items.map(item => `
        <tr>
          <td>${item.nombre}</td>
          <td class="text-right">${item.cantidad}</td>
          <td class="text-right">$${item.precio.toFixed(2)}</td>
          <td class="text-right">$${item.subtotal.toFixed(2)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row">
      <div class="total-label">Subtotal:</div>
      <div class="total-value">$${pedido.subtotal.toFixed(2)}</div>
    </div>
    ${pedido.descuento > 0 ? `
    <div class="total-row" style="color: green;">
      <div class="total-label">Descuento${pedido.codigo_descuento ? ` (${pedido.codigo_descuento})` : ''}:</div>
      <div class="total-value">-$${pedido.descuento.toFixed(2)}</div>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <div class="total-label">TOTAL:</div>
      <div class="total-value">$${pedido.total.toFixed(2)}</div>
    </div>
  </div>

  <div class="contact-info">
    <div class="section-title">Información de Contacto - BRILLARTE</div>
    <p style="margin: 10px 0;">Email: oficial@brillarte.lat</p>
    <p style="margin: 10px 0;">Web: www.brillarte.lat</p>
    <p style="margin: 10px 0;">Direccion: Santiago de los Caballeros, Republica Dominicana</p>
    <p style="margin: 10px 0;">WhatsApp: 849-425-2220</p>
  </div>

  <div class="footer">
    <p>Gracias por tu compra en BRILLARTE</p>
    <p>Este documento es una factura válida</p>
  </div>
</body>
</html>
    `;

    console.log('Invoice HTML generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        html: invoiceHTML,
        message: 'Factura generada exitosamente' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error al generar factura' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
