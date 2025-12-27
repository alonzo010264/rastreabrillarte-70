import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generar código de pago aleatorio de 10 caracteres
function generatePaymentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments: string[] = [];
  
  // Formato: XXXX-XXXX-XX (total 10 caracteres sin guiones)
  for (let i = 0; i < 4; i++) {
    segments.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  segments.push('-');
  for (let i = 0; i < 4; i++) {
    segments.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  segments.push('-');
  for (let i = 0; i < 2; i++) {
    segments.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }
  
  return segments.join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, codigo, userId, pedidoId } = await req.json();

    console.log(`Action: ${action}`);

    if (action === 'ensure-codes') {
      // Asegurar que siempre haya 5 códigos disponibles
      const { data: existingCodes, error: fetchError } = await supabase
        .from('codigos_pago')
        .select('id')
        .eq('usado', false);

      if (fetchError) throw fetchError;

      const codesNeeded = 5 - (existingCodes?.length || 0);
      console.log(`Codes available: ${existingCodes?.length || 0}, needed: ${codesNeeded}`);

      if (codesNeeded > 0) {
        const newCodes: { codigo: string }[] = [];
        
        for (let i = 0; i < codesNeeded; i++) {
          let code: string;
          let attempts = 0;
          
          do {
            code = generatePaymentCode();
            attempts++;
          } while (attempts < 10 && newCodes.some(c => c.codigo === code));
          
          newCodes.push({ codigo: code });
        }

        const { error: insertError } = await supabase
          .from('codigos_pago')
          .insert(newCodes);

        if (insertError) throw insertError;
        
        console.log(`Created ${codesNeeded} new payment codes`);
      }

      // Retornar códigos disponibles
      const { data: codes, error: codesError } = await supabase
        .from('codigos_pago')
        .select('id, codigo, created_at')
        .eq('usado', false)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      return new Response(
        JSON.stringify({ success: true, codes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'validate') {
      // Validar un código
      const { data: codeData, error: codeError } = await supabase
        .from('codigos_pago')
        .select('id, codigo, usado')
        .eq('codigo', codigo.toUpperCase().trim())
        .single();

      if (codeError || !codeData) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Código no encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (codeData.usado) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Este código ya fue utilizado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, codeId: codeData.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'use') {
      // Marcar código como usado y generar uno nuevo
      const { data: codeData, error: codeError } = await supabase
        .from('codigos_pago')
        .select('id, usado')
        .eq('codigo', codigo.toUpperCase().trim())
        .single();

      if (codeError || !codeData) {
        return new Response(
          JSON.stringify({ success: false, message: 'Código no encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (codeData.usado) {
        return new Response(
          JSON.stringify({ success: false, message: 'Este código ya fue utilizado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Marcar como usado
      const { error: updateError } = await supabase
        .from('codigos_pago')
        .update({
          usado: true,
          usado_por: userId,
          pedido_id: pedidoId,
          usado_at: new Date().toISOString()
        })
        .eq('id', codeData.id);

      if (updateError) throw updateError;

      // Generar nuevo código para reemplazar
      const newCode = generatePaymentCode();
      const { error: insertError } = await supabase
        .from('codigos_pago')
        .insert({ codigo: newCode });

      if (insertError) {
        console.error('Error creating replacement code:', insertError);
      }

      console.log(`Code ${codigo} used, replaced with ${newCode}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Código utilizado correctamente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});