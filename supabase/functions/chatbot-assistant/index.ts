import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const stripEmojis = (text: string) =>
  text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '').trim();

const extractAssistantMessage = (payload: any): string => {
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return '';
  return typeof content === 'string' ? content : JSON.stringify(content);
};

const normalizeText = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();

// ==========================================
// BASE DE CONOCIMIENTO COMPLETA DE BRILLARTE
// ==========================================

const BRILLARTE_KNOWLEDGE = {
  empresa: {
    nombre: 'BRILLARTE',
    slogan: 'El Arte de Brillar',
    tipo: 'Tienda 100% virtual de accesorios artesanales',
    ubicacion: 'Santiago de los Caballeros, Republica Dominicana',
    punto_retiro: 'Cerro Alto, Barrio Las Mercedes, Calle Primera',
    tienda_fisica: false,
    descripcion: 'Empresa dedicada a ofrecer productos de calidad excepcional. Nos especializamos en pulseras elegantes, aretes unicos, monederos funcionales y otros accesorios artesanales.',
    mision: 'Brindar productos de calidad excepcional que reflejen la personalidad unica de nuestros clientes, ofreciendo un servicio personalizado y confiable.',
    vision: 'Convertirnos en la marca de referencia en accesorios de calidad, reconocidos por innovacion, diseno unico y compromiso con la satisfaccion del cliente.',
    valores: 'Calidad, honestidad, compromiso con el cliente, innovacion constante y respeto por el arte.',
  },
  contacto: {
    whatsapp: '849-425-2220',
    email: 'brillarte.oficial.ventas@gmail.com',
    instagram: '@brillarte.do.oficial',
    web: 'https://www.brillarte.lat',
  },
  horarios: {
    lunes_viernes: '9:00 AM a 6:00 PM',
    sabados: '10:00 AM a 4:00 PM',
    domingos: 'Cerrado',
  },
  envios: {
    empresas: ['Vimenpaq', 'Domex'],
    costo_minimo: 'desde RD$200 (sujeto a variaciones segun ubicacion)',
    cobertura: 'Toda la Republica Dominicana',
    tiempo_stock: '1 a 3 dias habiles',
    tiempo_personalizado: '5 a 7 dias habiles',
    retiro: 'Gratis en punto de entrega (Cerro Alto, Santiago)',
    seguimiento: 'Codigo de pedido formato B01-XXXXX para rastreo en tiempo real',
    opciones: ['Retiro en punto de entrega', 'Entrega a domicilio via Vimenpaq o Domex', 'Pago contra entrega (disponible en algunos casos)'],
  },
  reembolso: {
    plazo_reclamacion: '48 horas (2 dias) desde recepcion del pedido',
    factura: 'OBLIGATORIA - Sin factura no hay reclamacion bajo ninguna circunstancia',
    personalizados: 'NO tienen devolucion. Solo aplica cambio si hay defecto comprobable de fabrica.',
    garantia_cubre: ['Defectos de fabrica', 'Danos durante el envio', 'Producto incorrecto', 'Falta de piezas o componentes'],
    no_cubre: ['Danos por mal uso', 'Desgaste normal', 'Productos sin empaque original', 'Reclamaciones fuera de las 48 horas'],
    metodos_reembolso: ['Credito en cuenta BRILLARTE (inmediato, recomendado)', 'Devolucion al metodo de pago original (3-5 dias habiles)'],
    proceso: '1. Contactar soporte con codigo de pedido y fotos. 2. Evaluacion en 24-48h. 3. Aprobacion. 4. Cambio, credito o reembolso.',
    envio_devolucion: 'Si es error nuestro, cubrimos el envio. Si es cambio de opinion, el cliente paga el envio.',
    productos_oferta: 'Pueden tener condiciones diferentes. Consulta los terminos de cada promocion.',
  },
  productos: {
    categorias: ['Pulseras', 'Aretes', 'Anillos', 'Flores de crochet', 'Bouquets artesanales', 'Monederos'],
    destacados: [
      'Pulsera Margarita - Elegante pulsera de perlas con diseno floral',
      'Aretes de Flores - Hermoso set de aretes con flores coloridas',
      'Pulseras Mariposas - Coleccion de pulseras tejidas con mariposas',
      'Flores Crochet Rojas - Hermosas flores tejidas a crochet en rojo intenso',
      'Bouquet Crochet Colores - Ramo de flores multicolor tejido a mano',
      'Aretes Margaritas Colores - Set de aretes de margaritas en colores vibrantes',
      'Anillo Flores Azul - Delicado anillo de flores en tonos azules',
      'Pulseras Corazones - Set de pulseras con corazones en colores pastel',
      'Pulseras Love You - Pulseras personalizadas con mensajes de amor',
      'Pulsera Personalizada con Iniciales - Pulsera tejida a mano, personalizada (RD$75)',
      'Pulseras Cristal Multicolor',
      'Pulseras Brillantes Elegantes',
      'Pulsera Girasol Dorada',
      'Pulsera Macrame Girasoles',
      'Pulseras Trebol Tejidas',
      'Pulseras de Pareja o Amistad',
      'Pulseras Iniciales Personalizadas',
      'Pulseras Corazones Arcoiris',
    ],
    caracteristicas: 'Hechos a mano, artesanales, de alta calidad, disenos unicos y exclusivos',
    personalizacion: 'Si, aceptamos pedidos personalizados (nombres, colores, disenos unicos). Los personalizados tardan 5-7 dias y NO tienen devolucion.',
  },
  pagos: {
    metodos: ['Transferencia bancaria', 'Pago contra entrega (en algunos casos)', 'Saldo BRILLARTE (credito en cuenta)'],
    cuotas: 'Si, ofrecemos planes de pago flexibles. Puedes depositar la mitad ahora y la otra despues. Dependiendo del monto, podemos acordar 5 cuotas o mas.',
  },
  pedidos: {
    como_pedir: 'A traves de la web en /productos o /pedir, o contactandonos por WhatsApp al 849-425-2220.',
    modificar: 'Si, puedes solicitar cambios mientras el pedido este en proceso de preparacion.',
    rastrear: 'En la seccion "Rastrear Pedido" de la web con tu codigo de pedido, o preguntame aqui con tu codigo.',
    estados: ['Recibido', 'Confirmado', 'En preparacion', 'Etiquetado', 'Almacenado', 'Listo para entrega', 'En ruta de entrega', 'Entregado'],
    notificaciones: 'Recibes correos con cada cambio de estado y alertas cuando esta listo.',
    codigo_formato: 'Los codigos tienen formato como BRI-XXXXX o B01-XXXXX',
    no_compartir_codigo: 'Recomendamos NO compartir tu codigo de pedido. BRILLARTE no es responsable si alguien mas retira usando tu codigo.',
  },
  cuenta: {
    saldo: 'Puedes tener saldo/credito en tu cuenta BRILLARTE para compras futuras.',
    verificacion: 'Puedes solicitar verificacion de cuenta desde tu perfil.',
    referidos: 'Programa de referidos disponible para ganar beneficios invitando amigos.',
  },
};

// ==========================================
// SISTEMA INTELIGENTE DE MATCHING
// ==========================================

interface KnowledgeEntry {
  patterns: RegExp[];
  keywords: string[];
  response: string;
  priority: number;
}

const knowledgeBase: KnowledgeEntry[] = [
  // SALUDOS Y CONVERSACION CASUAL
  {
    patterns: [/^(hola|hey|buenas|buenos dias|buenas tardes|buenas noches|saludos|que tal|como estas|hi|hello)/],
    keywords: ['hola', 'hey', 'buenas', 'saludos', 'que tal', 'como estas'],
    response: 'Hola, que gusto saludarte. Soy Noah, tu asistente de BRILLARTE. Dime en que te puedo ayudar hoy: pedidos, envios, productos, reembolsos o cualquier duda sobre la tienda.',
    priority: 1,
  },
  {
    patterns: [/^(gracias|muchas gracias|te agradezco|genial|perfecto|excelente|ok|vale|listo|entendido)/],
    keywords: ['gracias', 'agradezco', 'genial', 'perfecto', 'excelente'],
    response: 'Con gusto, para eso estoy. Si tienes otra pregunta o necesitas algo mas, aqui me tienes.',
    priority: 1,
  },
  {
    patterns: [/^(adios|bye|chao|hasta luego|nos vemos|me voy)/],
    keywords: ['adios', 'bye', 'chao', 'hasta luego', 'nos vemos'],
    response: 'Fue un placer ayudarte. Recuerda que estoy disponible de lunes a viernes de 9AM a 6PM y sabados de 10AM a 4PM. Cuidate mucho.',
    priority: 1,
  },
  {
    patterns: [/quien (eres|sos)|como te llamas|que eres|eres (un bot|humano|real|ia)/],
    keywords: ['quien eres', 'como te llamas', 'que eres', 'eres bot', 'eres humano', 'eres ia'],
    response: 'Me llamo Noah y soy el asistente virtual de BRILLARTE. Estoy aqui para ayudarte con todo lo relacionado a la tienda: pedidos, envios, productos, politicas y mas. Si necesitas hablar con una persona, te puedo conectar por WhatsApp al 849-425-2220.',
    priority: 2,
  },

  // ENVIOS
  {
    patterns: [/envio|entrega|llega|tarda|demora|cuanto.*tiempo|cuando.*llega|dias.*habiles|despacho/],
    keywords: ['envio', 'entrega', 'llega', 'tarda', 'demora', 'cuanto tiempo', 'dias habiles', 'delivery', 'despacho'],
    response: 'Hacemos envios a toda Republica Dominicana con Vimenpaq y Domex, desde RD$200 (puede variar segun tu zona). Si el producto esta en stock, llega en 1 a 3 dias habiles. Los personalizados tardan de 5 a 7 dias habiles. Tambien puedes retirar gratis en nuestro punto en Cerro Alto, Santiago.',
    priority: 3,
  },
  {
    patterns: [/vimenpaq|domex|empresa.*envio|mensajeria|paqueteria/],
    keywords: ['vimenpaq', 'domex', 'mensajeria', 'paqueteria'],
    response: 'Trabajamos con Vimenpaq y Domex para los envios a nivel nacional. El costo parte desde RD$200 y puede variar segun la ubicacion. Ambas empresas ofrecen rastreo del paquete.',
    priority: 3,
  },
  {
    patterns: [/costo.*envio|precio.*envio|cuanto.*cuesta.*envio|tarifa/],
    keywords: ['costo envio', 'precio envio', 'tarifa'],
    response: 'El envio parte desde RD$200, pero el monto exacto depende de tu ubicacion y el peso del paquete. Al confirmar tu pedido te damos el costo final. Si prefieres, puedes retirar gratis en nuestro punto de Cerro Alto, Santiago.',
    priority: 4,
  },
  {
    patterns: [/retiro|recoger|pickup|buscar.*pedido|punto.*entrega/],
    keywords: ['retiro', 'recoger', 'pickup', 'buscar pedido', 'punto entrega'],
    response: 'Puedes retirar tu pedido gratis en nuestro punto de entrega: Cerro Alto, Barrio Las Mercedes, Calle Primera, Santiago. Necesitas presentar tu codigo de pedido y un documento de identidad. Te avisamos cuando este listo.',
    priority: 3,
  },
  {
    patterns: [/cambiar.*direccion|modificar.*direccion|direccion.*diferente|otra.*direccion/],
    keywords: ['cambiar direccion', 'modificar direccion'],
    response: 'Si, puedes cambiar la direccion de envio siempre que el pedido no haya sido despachado todavia. Usa el formulario de cambio de direccion en la web o escribenos al WhatsApp 849-425-2220 con tu codigo de pedido.',
    priority: 3,
  },

  // REEMBOLSOS Y DEVOLUCIONES
  {
    patterns: [/reembolso|devolucion|devolver|garantia|cambio|defecto|reclam|roto|danado|mal estado/],
    keywords: ['reembolso', 'devolucion', 'devolver', 'garantia', 'cambio', 'defecto', 'reclamo', 'roto', 'danado'],
    response: 'Tienes un plazo maximo de 48 horas (2 dias) desde que recibes tu pedido para hacer cualquier reclamacion. Es obligatorio conservar la factura original, sin ella no podemos procesar nada. La garantia cubre defectos de fabrica, danos de envio y productos incorrectos. Los productos personalizados NO tienen devolucion. Para iniciar, envianos un correo a brillarte.oficial.ventas@gmail.com con tu codigo de pedido y fotos del problema.',
    priority: 4,
  },
  {
    patterns: [/factura|comprobante|recibo/],
    keywords: ['factura', 'comprobante', 'recibo'],
    response: 'La factura es obligatoria para cualquier tipo de reclamacion. Sin factura no se procesa ningun reclamo, devolucion ni reembolso. Te recomendamos guardarla en un lugar seguro desde el momento que la recibes.',
    priority: 3,
  },
  {
    patterns: [/personalizado.*devol|devol.*personalizado|cambiar.*personalizado/],
    keywords: ['personalizado devolucion'],
    response: 'Los productos personalizados (con nombres, colores especificos o disenos unicos) NO tienen devolucion bajo ninguna circunstancia, ya que son creados especificamente para ti. Solo aplica cambio si hay un defecto comprobable de fabrica.',
    priority: 5,
  },
  {
    patterns: [/como.*reembolso|proceso.*devolucion|pasos.*devolver|quiero.*devolver/],
    keywords: ['como reembolso', 'proceso devolucion', 'quiero devolver'],
    response: 'El proceso es: 1) Envia un correo a brillarte.oficial.ventas@gmail.com con tu codigo de pedido, descripcion del problema y fotos. 2) Evaluamos tu caso en 24-48 horas. 3) Si se aprueba, te damos instrucciones. 4) Resolucion: cambio de producto, credito en cuenta (inmediato) o reembolso al metodo original (3-5 dias). Recuerda que tienes maximo 48 horas desde que recibiste el pedido.',
    priority: 4,
  },

  // PRODUCTOS
  {
    patterns: [/producto|catalogo|que venden|que tienen|que ofrecen|articulo|accesorio/],
    keywords: ['producto', 'catalogo', 'que venden', 'que tienen', 'articulo', 'accesorio'],
    response: 'Ofrecemos accesorios artesanales hechos a mano: pulseras (margarita, mariposas, corazones, cristal, girasol, personalizadas con iniciales), aretes de flores y margaritas, anillos florales, flores de crochet y bouquets artesanales. Puedes ver todo actualizado en la seccion /productos de la web o escribenos al WhatsApp 849-425-2220 para que te guiemos.',
    priority: 3,
  },
  {
    patterns: [/pulsera|brazalete|manilla/],
    keywords: ['pulsera', 'brazalete', 'manilla'],
    response: 'Tenemos varias lineas de pulseras: Margarita (perlas con diseno floral), Mariposas (tejidas), Corazones (colores pastel), Love You (mensajes personalizados), Cristal Multicolor, Girasol Dorada, Macrame, Trebol Tejidas, Pareja/Amistad e Iniciales Personalizadas (desde RD$75). Revisa el catalogo completo en /productos.',
    priority: 3,
  },
  {
    patterns: [/arete|pendiente|zarcillo/],
    keywords: ['arete', 'pendiente', 'zarcillo'],
    response: 'Tenemos aretes de flores en colores vibrantes y aretes de margaritas en varios colores. Son piezas artesanales unicas. Puedes verlos en detalle en /productos o escribenos al WhatsApp para fotos actualizadas.',
    priority: 3,
  },
  {
    patterns: [/anillo|sortija/],
    keywords: ['anillo', 'sortija'],
    response: 'Tenemos el Anillo Flores Azul, un delicado anillo con diseno floral en tonos azules. Es una pieza artesanal unica. Revisa la seccion /productos para ver mas detalles o escribenos al WhatsApp.',
    priority: 3,
  },
  {
    patterns: [/flor|crochet|bouquet|ramo|tejid/],
    keywords: ['flor', 'crochet', 'bouquet', 'ramo', 'tejida'],
    response: 'Tenemos flores de crochet rojas (tejidas en rojo intenso), bouquets multicolor (ramos tejidos a mano) y flores artesanales. Son piezas unicas perfectas para regalo o decoracion. Consulta disponibilidad en /productos o por WhatsApp.',
    priority: 3,
  },
  {
    patterns: [/precio|cuanto.*cuesta|cuanto.*vale|costo|valor/],
    keywords: ['precio', 'cuanto cuesta', 'cuanto vale', 'costo', 'valor'],
    response: 'Los precios varian segun el producto. Por ejemplo, las pulseras personalizadas con iniciales estan desde RD$75. Para ver precios actualizados de todo el catalogo, visita /productos en la web o escribenos al WhatsApp 849-425-2220 y te cotizamos lo que te interese.',
    priority: 3,
  },
  {
    patterns: [/personaliz|a medida|nombre.*pulsera|inicial|custom/],
    keywords: ['personalizado', 'a medida', 'iniciales', 'custom'],
    response: 'Si, hacemos productos personalizados con nombres, iniciales, colores especificos o disenos unicos. Los personalizados tardan de 5 a 7 dias habiles y tienen un detalle importante: NO aceptan devolucion, ya que son creados exclusivamente para ti. Contactanos por WhatsApp al 849-425-2220 para cotizar tu idea.',
    priority: 4,
  },

  // PEDIDOS
  {
    patterns: [/como.*pedir|como.*comprar|como.*ordenar|quiero.*pedir|hacer.*pedido|realizar.*pedido/],
    keywords: ['como pedir', 'como comprar', 'como ordenar', 'hacer pedido'],
    response: 'Puedes hacer tu pedido de varias formas: 1) En la web, ve a /productos, elige lo que te gusta y agrega al carrito. 2) Usa el formulario de pedido en /pedir. 3) Escribenos directamente al WhatsApp 849-425-2220 y te guiamos paso a paso. Al confirmar, recibiras un codigo de pedido para darle seguimiento.',
    priority: 3,
  },
  {
    patterns: [/rastr|track|seguimiento|donde.*va.*pedido|estado.*pedido|codigo.*pedido/],
    keywords: ['rastrear', 'tracking', 'seguimiento', 'donde va', 'estado pedido', 'codigo pedido'],
    response: 'Para rastrear tu pedido, ve a la seccion "Rastrear Pedido" en la web e ingresa tu codigo (formato B01-XXXXX o BRI-XXXXX). Tambien puedes darme tu codigo de pedido aqui mismo y te digo el estado al instante.',
    priority: 3,
  },
  {
    patterns: [/modific|cambiar.*pedido|editar.*pedido|agregar.*pedido|quitar/],
    keywords: ['modificar pedido', 'cambiar pedido', 'editar pedido'],
    response: 'Si, puedes hacer cambios en tu pedido siempre que todavia este en proceso de preparacion (no despachado). Usa el sistema de rastreo en la web para solicitar modificaciones o contactanos al WhatsApp 849-425-2220 con tu codigo de pedido.',
    priority: 3,
  },

  // PAGOS
  {
    patterns: [/pago|pagar|metodo.*pago|transferencia|contra.*entrega|como.*pago/],
    keywords: ['pago', 'pagar', 'metodo pago', 'transferencia', 'contra entrega'],
    response: 'Aceptamos transferencia bancaria y pago contra entrega en algunos casos. Tambien puedes usar tu saldo/credito BRILLARTE si tienes disponible. Si necesitas los datos para transferencia, escribenos al WhatsApp 849-425-2220.',
    priority: 3,
  },
  {
    patterns: [/cuota|financ|plan.*pago|pagar.*parte|mitad/],
    keywords: ['cuota', 'financiamiento', 'plan pago', 'pagar parte', 'mitad'],
    response: 'Si, ofrecemos planes de pago flexibles. Puedes depositar la mitad del monto ahora y la otra mitad despues. Dependiendo del total, podemos acordar hasta 5 cuotas o mas. Contactanos por WhatsApp al 849-425-2220 para coordinar.',
    priority: 3,
  },

  // UBICACION Y CONTACTO
  {
    patterns: [/ubicacion|direccion|donde.*estan|tienda.*fisica|donde.*quedan|local|sucursal/],
    keywords: ['ubicacion', 'direccion', 'donde estan', 'tienda fisica', 'local', 'sucursal'],
    response: 'Somos una tienda 100% virtual ubicada en Santiago de los Caballeros, Republica Dominicana. No tenemos tienda fisica abierta al publico. Para retiros, el punto de entrega es en Cerro Alto, Barrio Las Mercedes, Calle Primera. Te atendemos por la web y WhatsApp al 849-425-2220.',
    priority: 3,
  },
  {
    patterns: [/contacto|contactar|comunicar|hablar|llamar|telefono|whatsapp|instagram|correo|email/],
    keywords: ['contacto', 'contactar', 'comunicar', 'hablar', 'llamar', 'telefono', 'whatsapp', 'instagram', 'correo', 'email'],
    response: 'Puedes contactarnos por WhatsApp al 849-425-2220, por Instagram en @brillarte.do.oficial o por correo a brillarte.oficial.ventas@gmail.com. Nuestro horario es lunes a viernes de 9AM a 6PM y sabados de 10AM a 4PM.',
    priority: 3,
  },
  {
    patterns: [/horario|atencion|abren|cierran|disponible|hora/],
    keywords: ['horario', 'atencion', 'abren', 'cierran', 'disponible', 'hora'],
    response: 'Nuestro horario de atencion es: lunes a viernes de 9:00 AM a 6:00 PM, sabados de 10:00 AM a 4:00 PM. Los domingos estamos cerrados. Fuera de horario puedes dejarnos mensaje por WhatsApp al 849-425-2220 y te respondemos al dia siguiente.',
    priority: 3,
  },

  // SOBRE LA EMPRESA
  {
    patterns: [/quienes.*son|sobre.*ustedes|sobre.*brillarte|que.*es.*brillarte|informacion.*empresa|acerca/],
    keywords: ['quienes son', 'sobre ustedes', 'que es brillarte', 'informacion empresa'],
    response: 'BRILLARTE es una empresa virtual de accesorios artesanales en Santiago de los Caballeros, RD. Nuestro lema es "El Arte de Brillar". Nos especializamos en pulseras, aretes, anillos y flores de crochet, todo hecho a mano con calidad excepcional. Nuestra mision es ofrecer productos que reflejen tu personalidad unica.',
    priority: 3,
  },

  // CUENTA Y SALDO
  {
    patterns: [/saldo|credito|cuenta|mi.*dinero|balance/],
    keywords: ['saldo', 'credito', 'cuenta', 'balance'],
    response: 'Tu saldo BRILLARTE es como un monedero virtual dentro de la tienda. Puedes usarlo para pagar total o parcialmente tus compras. Se acumula cuando recibes reembolsos, creditos por referidos o promociones. Puedes ver tu saldo en tu perfil de la web.',
    priority: 3,
  },
  {
    patterns: [/referido|invitar|recomendar|programa.*referido/],
    keywords: ['referido', 'invitar', 'recomendar'],
    response: 'Tenemos un programa de referidos donde puedes ganar beneficios invitando amigos a BRILLARTE. Genera tu codigo de referido desde la seccion de Referidos en la web y compartelo. Cuando tus invitados hagan compras, ambos ganan.',
    priority: 3,
  },
  {
    patterns: [/verificacion|verificar.*cuenta|cuenta.*verificada/],
    keywords: ['verificacion', 'verificar cuenta', 'verificada'],
    response: 'Puedes solicitar la verificacion de tu cuenta desde tu perfil en la web. Una cuenta verificada te da acceso a beneficios adicionales y mayor confianza en la plataforma.',
    priority: 3,
  },

  // REGISTRO Y LOGIN
  {
    patterns: [/registr|crear.*cuenta|abrir.*cuenta|inscri|como.*registro/],
    keywords: ['registrar', 'crear cuenta', 'abrir cuenta'],
    response: 'Puedes crear tu cuenta en la web entrando a /registro. Solo necesitas tu correo electronico, nombre y una contrasena. Una vez registrado podras hacer pedidos, rastrear envios, acumular saldo y mas.',
    priority: 3,
  },
  {
    patterns: [/contrasena|password|no.*puedo.*entrar|olvide.*clave|acceso|iniciar.*sesion/],
    keywords: ['contrasena', 'password', 'no puedo entrar', 'olvide clave', 'acceso'],
    response: 'Si olvidaste tu contrasena, ve a la pagina de inicio de sesion y dale click en "Olvide mi contrasena". Te enviaremos un enlace a tu correo para restablecerla. Si sigues con problemas, escribenos al WhatsApp 849-425-2220.',
    priority: 3,
  },

  // PROBLEMAS Y SOPORTE
  {
    patterns: [/problema|ayuda|soporte|error|no.*funciona|falla|queja|insatisf/],
    keywords: ['problema', 'ayuda', 'soporte', 'error', 'no funciona', 'falla', 'queja'],
    response: 'Lamento que tengas un inconveniente. Cuentame con mas detalle que sucede y te ayudo a resolverlo. Si tienes un codigo de pedido, compartelo conmigo para revisar tu caso. Tambien puedes contactar directamente a soporte por correo a brillarte.oficial.ventas@gmail.com o WhatsApp al 849-425-2220.',
    priority: 3,
  },

  // PROMOCIONES Y OFERTAS
  {
    patterns: [/promocion|oferta|descuento|cupon|codigo.*descuento|rebaja/],
    keywords: ['promocion', 'oferta', 'descuento', 'cupon', 'rebaja'],
    response: 'Las promociones y descuentos se publican en la seccion de Promociones de la web y en nuestro Instagram @brillarte.do.oficial. Si tienes un codigo de descuento, puedes aplicarlo al momento de hacer tu pedido. Siguenos para no perderte ninguna oferta.',
    priority: 3,
  },

  // EVENTOS Y REGALOS
  {
    patterns: [/regalo|cumpleano|aniversario|sorpresa|evento|boda|fiesta/],
    keywords: ['regalo', 'cumpleanos', 'aniversario', 'sorpresa', 'evento', 'boda'],
    response: 'Nuestros productos son perfectos para regalos. Las pulseras personalizadas con iniciales, los bouquets de flores de crochet y las pulseras de pareja son los mas populares para ocasiones especiales. Tambien ofrecemos tarjetas de regalo. Escribenos al WhatsApp 849-425-2220 y te ayudamos a elegir el regalo ideal.',
    priority: 3,
  },

  // TARJETAS DE REGALO
  {
    patterns: [/tarjeta.*regalo|gift.*card|regalar.*saldo/],
    keywords: ['tarjeta regalo', 'gift card'],
    response: 'Tenemos tarjetas de regalo disponibles que puedes comprar para obsequiar a alguien especial. El destinatario recibe saldo en su cuenta BRILLARTE para elegir lo que mas le guste. Consulta las opciones en la seccion Tarjetas de Regalo de la web.',
    priority: 3,
  },

  // EMPRENDIMIENTO
  {
    patterns: [/emprende|revender|negocio|mayoreo|distribuidor|vender.*producto/],
    keywords: ['emprender', 'revender', 'negocio', 'mayoreo', 'distribuidor'],
    response: 'Tenemos el programa "Emprende con BRILLARTE" donde puedes aplicar para revender nuestros productos. Visita la seccion Emprende en la web para conocer los beneficios y aplicar. Tambien puedes escribirnos al WhatsApp 849-425-2220 para mas informacion.',
    priority: 3,
  },
];

function findBestMatch(userMessage: string): string | null {
  const normalized = normalizeText(userMessage);
  
  // Skip very short generic messages that should get the welcome response
  if (normalized.length < 3) return null;

  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;

    // Check regex patterns
    for (const pattern of entry.patterns) {
      if (pattern.test(normalized)) {
        score += entry.priority * 2;
        break;
      }
    }

    // Check keywords
    let keywordMatches = 0;
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        keywordMatches++;
        score += entry.priority;
      }
    }

    // Bonus for multiple keyword matches
    if (keywordMatches > 1) score += keywordMatches * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch && bestScore >= 2 ? bestMatch.response : null;
}

function buildHumanFallbackResponse(lastUserMessage: string, orderInfo: string): string {
  const normalized = normalizeText(lastUserMessage || '');

  // Order tracking has top priority
  if (orderInfo && /(pedido|codigo|rastreo|tracking|estado|donde va|bri|b01)/.test(normalized)) {
    return stripEmojis(`Aqui tienes la informacion de tu pedido. ${orderInfo.replace(/^\n/, '')}. Si necesitas algo mas, aqui estoy.`);
  }

  // Try intelligent matching
  const matched = findBestMatch(lastUserMessage);
  if (matched) {
    return stripEmojis(matched);
  }

  // For unrecognized queries, give a helpful contextual response
  const wordCount = normalized.split(/\s+/).length;
  
  if (wordCount <= 2) {
    return stripEmojis('Claro, cuentame un poco mas sobre lo que necesitas. Te puedo ayudar con pedidos, envios, productos, reembolsos, tu cuenta o cualquier otra duda sobre BRILLARTE.');
  }

  return stripEmojis('Entiendo tu consulta. Aunque no tengo la respuesta exacta en este momento, te recomiendo contactarnos por WhatsApp al 849-425-2220 donde nuestro equipo te atendera de inmediato. Tambien puedo ayudarte con informacion de pedidos, envios, productos o politicas de la tienda.');
}

// ==========================================
// SISTEMA PROMPT PARA IA
// ==========================================

function buildSystemPrompt(userInfo: string, orderInfo: string): string {
  return `Eres Noah, asistente virtual oficial de BRILLARTE, una tienda de accesorios artesanales en Republica Dominicana.

IDENTIDAD Y PERSONALIDAD:
- Te llamas Noah. Eres amable, cercano, natural y profesional.
- Hablas en espanol dominicano casual pero respetuoso. Como un amigo que trabaja en la tienda.
- Responde de forma directa y util. Nada generico ni robotico.
- Maximo 4 oraciones por respuesta. Ve al punto.
- Sin emojis ni simbolos decorativos.
- Si no sabes algo con certeza, dilo honestamente y ofrece alternativas.
- Nunca inventes datos de pedidos, precios o politicas.

CONOCIMIENTO COMPLETO DE BRILLARTE:

EMPRESA:
- Tienda 100% virtual en Santiago de los Caballeros, RD. Sin tienda fisica al publico.
- Lema: "El Arte de Brillar"
- Accesorios artesanales hechos a mano de alta calidad.
- Punto de retiro: Cerro Alto, Barrio Las Mercedes, Calle Primera, Santiago.

PRODUCTOS:
- Pulseras: Margarita (perlas florales), Mariposas (tejidas), Corazones (pastel), Love You (personalizadas), Cristal Multicolor, Girasol Dorada, Macrame, Trebol, Pareja/Amistad, Iniciales Personalizadas (desde RD$75), Corazones Arcoiris, Brillantes Elegantes.
- Aretes: Flores coloridas, Margaritas multicolor.
- Anillos: Flores Azul.
- Flores de crochet: Rojas, Bouquets multicolor.
- Personalizados: Aceptamos pedidos a medida (tardan 5-7 dias, NO tienen devolucion).

CONTACTO:
- WhatsApp: 849-425-2220
- Email: brillarte.oficial.ventas@gmail.com
- Instagram: @brillarte.do.oficial
- Web: brillarte.lat

HORARIO:
- Lunes a Viernes: 9:00 AM - 6:00 PM
- Sabados: 10:00 AM - 4:00 PM
- Domingos: Cerrado

ENVIOS:
- Via Vimenpaq y Domex a toda RD.
- Desde RD$200 (varia por zona y peso).
- En stock: 1-3 dias habiles. Personalizados: 5-7 dias.
- Retiro gratis en Cerro Alto, Santiago.
- Seguimiento con codigo formato B01-XXXXX.
- Cambio de direccion posible si no se ha despachado.

POLITICA DE REEMBOLSO:
- Plazo: maximo 48 horas desde recepcion.
- Factura OBLIGATORIA. Sin factura = sin reclamacion.
- Garantia cubre: defectos de fabrica, danos de envio, producto incorrecto, piezas faltantes.
- NO cubre: mal uso, desgaste, sin empaque original, fuera de plazo.
- Personalizados NO tienen devolucion (solo cambio por defecto de fabrica).
- Metodos: credito en cuenta (inmediato) o devolucion al metodo original (3-5 dias).
- Proceso: correo con codigo + fotos -> evaluacion 24-48h -> resolucion.
- Envio devolucion: si es error nuestro lo cubrimos; si es cambio de opinion, paga el cliente.

PAGOS:
- Transferencia bancaria, pago contra entrega (algunos casos), saldo BRILLARTE.
- Cuotas flexibles: mitad ahora y mitad despues, hasta 5+ cuotas segun monto.

CUENTA:
- Saldo/credito para compras futuras.
- Programa de referidos con beneficios.
- Verificacion de cuenta disponible.
- Tarjetas de regalo.

REGLAS IMPORTANTES:
- Para precios exactos, orienta a /productos o WhatsApp.
- Si hay codigo de pedido, usa SOLO el estado real. No inventes.
- No compartas datos de otros clientes.
- Si falta informacion, pide el dato de forma natural.
- Si la pregunta no es sobre BRILLARTE, responde brevemente y redirige amablemente a temas de la tienda.
- Si preguntan algo que no sabes, se honesto: "No tengo esa info especifica, pero te recomiendo escribirnos al WhatsApp para que el equipo te ayude."

${userInfo}${orderInfo}`;
}

// ==========================================
// AI PROVIDERS
// ==========================================

async function getAiResponse(aiMessages: any[], openAiKey: string | null, lovableApiKey: string | null): Promise<string> {
  // Try Lovable AI FIRST (preferred - uses advanced models)
  if (lovableApiKey) {
    try {
      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: aiMessages, max_tokens: 500, temperature: 0.75 }),
      });

      if (lovableResponse.ok) {
        const data = await lovableResponse.json();
        const msg = extractAssistantMessage(data);
        if (msg) return stripEmojis(msg);
      } else {
        const errorText = await lovableResponse.text();
        console.error('Lovable AI error:', lovableResponse.status, errorText);
      }
    } catch (e) {
      console.error('Lovable AI failed:', e);
    }
  }

  // Fallback to OpenAI with advanced model
  if (openAiKey) {
    try {
      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', messages: aiMessages, max_tokens: 500, temperature: 0.75 }),
      });

      if (openAiResponse.ok) {
        const data = await openAiResponse.json();
        const msg = extractAssistantMessage(data);
        if (msg) return stripEmojis(msg);
      } else {
        const errorText = await openAiResponse.text();
        console.error('OpenAI error:', openAiResponse.status, errorText);
      }
    } catch (e) {
      console.error('OpenAI failed:', e);
    }
  }

  throw new Error('No hay proveedor de IA disponible');
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, email, orderCode } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect order code in last message
    const lastMsg = messages[messages.length - 1]?.content || '';
    const codeMatch = lastMsg.match(/\b(BRI-?\d{3,8})\b/i) || lastMsg.match(/\b([A-Z]{2,5}-?\d{3,8})\b/i) || lastMsg.match(/\b(B\d{4,5}-\d{4,5})\b/i);
    const codeToTrack = codeMatch ? codeMatch[1].toUpperCase() : orderCode;

    // Lookup order info
    let orderInfo = '';
    if (codeToTrack) {
      const { data: pedidoOnline } = await supabase
        .from('pedidos_online')
        .select('*, empresas_envio(nombre)')
        .eq('codigo_pedido', codeToTrack)
        .single();

      if (pedidoOnline) {
        orderInfo = `\nPEDIDO ${codeToTrack}: Estado: ${pedidoOnline.estado}${pedidoOnline.estado_detallado ? ` (${pedidoOnline.estado_detallado})` : ''} | Total: RD$${pedidoOnline.total} | Direccion: ${pedidoOnline.direccion_envio}${pedidoOnline.tracking_envio ? ` | Tracking: ${pedidoOnline.tracking_envio}` : ''}${pedidoOnline.empresas_envio ? ` | Enviado por: ${pedidoOnline.empresas_envio.nombre}` : ''} | Fecha: ${new Date(pedidoOnline.created_at).toLocaleDateString('es-DO')}`;
      } else {
        const { data: pedidoLegacy } = await supabase
          .from('Pedidos')
          .select('*, Estatus:Estatus_id(nombre)')
          .eq('Código de pedido', codeToTrack)
          .single();

        if (pedidoLegacy) {
          orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoLegacy.Cliente} | Estado: ${pedidoLegacy.Estatus?.nombre || pedidoLegacy.estado || 'Pendiente'} | Total: RD$${pedidoLegacy.Total || pedidoLegacy.Precio || 'N/A'}`;
        } else {
          const { data: pedidoReg } = await supabase
            .from('pedidos_registro')
            .select('*')
            .eq('codigo_pedido', codeToTrack)
            .single();

          if (pedidoReg) {
            orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoReg.nombre_cliente} | Estado: ${pedidoReg.estado_pedido} | Credito: RD$${pedidoReg.credito || 0}`;
          } else {
            orderInfo = `\nNo se encontro ningun pedido con el codigo ${codeToTrack}. Verifica que el codigo sea correcto.`;
          }
        }
      }
    }

    // Lookup user profile
    let userInfo = '';
    if (email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre_completo, saldo')
        .eq('correo', email)
        .single();
      if (profile) {
        userInfo = `\nCliente: ${profile.nombre_completo || email}${profile.saldo ? ` | Saldo: RD$${profile.saldo}` : ''}`;
      }
    }

    const systemPrompt = buildSystemPrompt(userInfo, orderInfo);

    // Build messages for AI - support multimodal
    const aiMessages: any[] = [{ role: 'system', content: systemPrompt }];

    for (const msg of messages) {
      if (msg.imageUrl) {
        aiMessages.push({
          role: msg.role,
          content: [
            ...(msg.content ? [{ type: 'text', text: msg.content }] : []),
            { type: 'image_url', image_url: { url: msg.imageUrl } },
          ],
        });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    let assistantMessage = '';

    if (OPENAI_API_KEY || LOVABLE_API_KEY) {
      try {
        assistantMessage = await getAiResponse(aiMessages, OPENAI_API_KEY, LOVABLE_API_KEY);
      } catch (aiError) {
        console.error('AI providers unavailable:', aiError);
        assistantMessage = buildHumanFallbackResponse(lastMsg, orderInfo);
      }
    } else {
      assistantMessage = buildHumanFallbackResponse(lastMsg, orderInfo);
    }

    if (!assistantMessage) {
      assistantMessage = buildHumanFallbackResponse(lastMsg, orderInfo);
    }

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in chatbot-assistant:', error);

    // Even on total failure, give a useful response
    const fallback = 'Disculpa, tengo un inconveniente tecnico en este momento. Por favor escribenos al WhatsApp 849-425-2220 y te atendemos de inmediato.';
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido', response: fallback }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
