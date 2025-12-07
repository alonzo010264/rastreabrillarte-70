// Lista de palabras prohibidas para validacion del lado del cliente
const PALABRAS_PROHIBIDAS = [
  'mamaguebo', 'mamaguevo', 'mamahuevo', 'puto', 'puta', 'mierda', 
  'culo', 'pendejo', 'cabron', 'cabrón', 'negro', 'negra', 
  'chino', 'india', 'indio', 'hijueputa', 'malparido', 'gonorrea',
  'verga', 'coño', 'cono', 'maricon', 'marica', 'perra', 'zorra',
  'bastardo', 'idiota', 'estupido', 'imbecil', 'retrasado'
];

export const containsProfanity = (text: string): { hasProfanity: boolean; word?: string } => {
  const normalizedText = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, ''); // Remove special chars

  for (const palabra of PALABRAS_PROHIBIDAS) {
    const normalizedWord = palabra.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    if (normalizedText.includes(normalizedWord)) {
      return { hasProfanity: true, word: palabra };
    }
  }

  return { hasProfanity: false };
};

export const validateRegistration = (name: string, email: string): { 
  isValid: boolean; 
  reason?: string;
  detectedWord?: string;
} => {
  // Check name
  const nameCheck = containsProfanity(name);
  if (nameCheck.hasProfanity) {
    return { 
      isValid: false, 
      reason: 'Nombre contiene palabras inapropiadas',
      detectedWord: nameCheck.word
    };
  }

  // Check email prefix (before @)
  const emailPrefix = email.split('@')[0];
  const emailCheck = containsProfanity(emailPrefix);
  if (emailCheck.hasProfanity) {
    return { 
      isValid: false, 
      reason: 'Correo contiene palabras inapropiadas',
      detectedWord: emailCheck.word
    };
  }

  return { isValid: true };
};
