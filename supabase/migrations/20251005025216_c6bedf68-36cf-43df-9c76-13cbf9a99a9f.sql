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

-- Drop old trigger if exists and create new one
drop trigger if exists trg_pedidos_enviar_correo_entregado on public."Pedidos";
create trigger trg_pedidos_enviar_correo_entregado
after update on public."Pedidos"
for each row execute function public.enviar_correo_entregado();