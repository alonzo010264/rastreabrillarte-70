// Filtro de datos sensibles para proteger la privacidad de los clientes

const SENSITIVE_PATTERNS = [
  // Direcciones
  /\b(calle|avenida|av\.|c\/|carretera|autopista|sector|urbanizacion|urb\.|residencial|apartamento|apto\.?|piso|edificio|casa|local|numero|no\.?)\s*[a-záéíóúñ0-9\s,.-]+/gi,
  // Teléfonos
  /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
  /\b(8[0-9]{2}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})\b/g,
  // Instagram/redes sociales
  /@[a-zA-Z0-9._]+/g,
  /instagram\.com\/[a-zA-Z0-9._]+/gi,
  /facebook\.com\/[a-zA-Z0-9._]+/gi,
  // Cédula dominicana
  /\b\d{3}[-\s]?\d{7}[-\s]?\d{1}\b/g,
  // Códigos postales
  /\b\d{5}(-\d{4})?\b/g,
];

const SENSITIVE_KEYWORDS = [
  'direccion', 'dirección', 'donde vives', 'dónde vives', 'tu casa', 'domicilio',
  'telefono', 'teléfono', 'numero de telefono', 'número de teléfono', 'celular', 'movil', 'móvil',
  'whatsapp', 'numero whatsapp', 'número whatsapp',
  'instagram', 'ig', 'insta', 'tu instagram', 'tu insta',
  'facebook', 'fb', 'tu facebook',
  'cedula', 'cédula', 'documento', 'identificacion', 'identificación',
  'pasame tu', 'dame tu', 'enviame tu', 'envíame tu', 'pasame el', 'dame el',
  'cual es tu direccion', 'cuál es tu dirección', 'donde te entrego', 'dónde te entrego'
];

export function containsSensitiveDataRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check for keywords that indicate requesting sensitive data
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

export function filterSensitiveData(message: string): { filtered: string; wasSensitive: boolean } {
  let filtered = message;
  let wasSensitive = false;
  
  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      wasSensitive = true;
      filtered = filtered.replace(pattern, '[DATO PROTEGIDO]');
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }
  
  return { filtered, wasSensitive };
}

export function isSensitiveDataMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check if agent is asking for sensitive data
  if (containsSensitiveDataRequest(message)) {
    return true;
  }
  
  // Check for sensitive data patterns in the message
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      pattern.lastIndex = 0;
      return true;
    }
  }
  
  return false;
}

// Remove emojis from text
export function removeEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{E0020}-\u{E007F}]|[\u{200D}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]|[\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}]|[✅✓✔️❌❎⭐]/gu, '').trim();
}
