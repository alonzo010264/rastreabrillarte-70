-- Agregar el nuevo estatus "Embarcado" con categoría shipping
INSERT INTO public."Estatus" (nombre, descripcion, categoria, orden, activo)
VALUES (
  'Embarcado', 
  'Tu pedido ha sido embarcado y está en tránsito internacional. Pronto llegará a República Dominicana para continuar con el proceso de entrega.', 
  'shipping', 
  6, 
  true
);