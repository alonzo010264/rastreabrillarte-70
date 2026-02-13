import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generatePaymentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) segments.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  segments.push('-');
  for (let i = 0; i < 4; i++) segments.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  segments.push('-');
  for (let i = 0; i < 2; i++) segments.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  return segments.join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = claimsData.user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, codigo, pedidoId } = await req.json();

    // For admin actions (ensure-codes), verify admin role
    if (action === 'ensure-codes') {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleData?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'No autorizado - se requiere rol admin' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      const { data: existingCodes, error: fetchError } = await supabase
        .from('codigos_pago')
        .select('id')
        .eq('usado', false);

      if (fetchError) throw fetchError;

      const codesNeeded = 5 - (existingCodes?.length || 0);

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

        const { error: insertError } = await supabase.from('codigos_pago').insert(newCodes);
        if (insertError) throw insertError;
      }

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
      if (!codigo || typeof codigo !== 'string') {
        return new Response(
          JSON.stringify({ valid: false, message: 'Código inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
      if (!codigo || typeof codigo !== 'string') {
        return new Response(
          JSON.stringify({ success: false, message: 'Código inválido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

      const newCode = generatePaymentCode();
      await supabase.from('codigos_pago').insert({ codigo: newCode });

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
