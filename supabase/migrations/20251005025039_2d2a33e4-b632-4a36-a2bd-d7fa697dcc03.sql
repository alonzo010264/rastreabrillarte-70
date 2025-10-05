-- Enable pg_net extension for HTTP calls from Postgres (if not already enabled)
create extension if not exists pg_net;

-- Allow public inserts into registros_acceso so the registration form can record access data
-- Keep SELECT/UPDATE restricted to admins via existing policies
create policy "Permitir insertar registros_acceso públicamente"
  on public.registros_acceso
  for insert
  with check (true);

-- Create function to send delivered email notifications only when status changes to 'Entregado'
create or replace function public.enviar_correo_entregado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act on real status changes and when customer email is present
  if tg_op = 'UPDATE' and new."Estatus_id" <> old."Estatus_id" and new.correo_cliente is not null then
    -- Check if the new status corresponds to 'Entregado'
    declare
      v_status_name text;
      v_cancelled boolean;
    begin
      select nombre into v_status_name from public."Estatus" where id = new."Estatus_id";

      -- Proceed only if status name indicates delivered
      if v_status_name ilike 'entregado%' then
        -- Check notifications cancellation for this email
        select exists(
          select 1 from public.cancelaciones_notificaciones 
          where correo = new.correo_cliente and activo = true
        ) into v_cancelled;

        if not v_cancelled then
          -- Send delivered notification via Edge Function
          perform net.http_post(
            url := 'https://gzyfcunlbrfcnbxxaaft.supabase.co/functions/v1/send-status-notification',
            headers := jsonb_build_object(
              'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
              'customerEmail', new.correo_cliente,
              'orderCode', new."Código de pedido",
              'statusName', 'Entregado',
              'statusDescription', 'Tu pedido fue entregado correctamente. Por favor revisa tu zona o confirma si fue entregado en tus manos. ¡Gracias por elegirnos!'
            )
          );

          -- Optionally record a history note
          insert into public."Historial_Estatus" ("Código de pedido", "Estatus_id", "Descripcion", "Usuario")
          values (new."Código de pedido", new."Estatus_id", 'Notificación de ENTREGADO enviada a ' || new.correo_cliente, 'Sistema-Email');
        end if;
      end if;
    end;
  end if;

  return new;
end;
$$;

-- Attach trigger to Pedidos for delivered notifications
create trigger trg_pedidos_enviar_correo_entregado
after update on public."Pedidos"
for each row execute function public.enviar_correo_entregado();