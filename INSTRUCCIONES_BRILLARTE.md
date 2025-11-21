# Instrucciones para Configurar Cuenta Brillarte

## ✅ Sistema Implementado

Se ha implementado el sistema completo con las siguientes funcionalidades:

### 🎯 Funcionalidades Principales

1. **Sistema de Promociones**
   - Las promociones se publican automáticamente cuando están activas
   - Se envían notificaciones a TODOS los usuarios cuando se crea una promoción
   - La IA genera mensajes atractivos para las notificaciones de promociones

2. **Sistema de Notificaciones**
   - Campanita de notificaciones en la barra de navegación
   - Notificaciones en tiempo real
   - Administradores pueden enviar notificaciones individuales o masivas
   - Al publicar promoción, se envía automáticamente a todos

3. **Verificación de Cuentas**
   - Sistema de verificación (checkmark azul) para cuentas oficiales
   - Brillarte tendrá su logo oficial como foto de perfil automáticamente

4. **Perfiles de Usuario**
   - Los usuarios pueden ver perfiles públicos de otros usuarios
   - Subir fotos de perfil personalizadas
   - Inicial del nombre si no tienen foto

5. **Sistema de Menciones** (Preparado para implementar)
   - Base de datos lista para soportar menciones @usuario en comentarios
   - Notificaciones cuando alguien te menciona

---

## 🔧 Pasos para Configurar la Cuenta Brillarte

### Paso 1: Registrar la cuenta oficial

1. Ve a la página de registro: `/registro`
2. Regístrate con los siguientes datos:
   - **Nombre completo**: Brillarte
   - **Correo**: oficial@brillarte.lat
   - **Contraseña**: brillarte0102

### Paso 2: Asignar rol de administrador

Una vez registrada la cuenta, necesitas asignarle el rol de administrador. Ve a la interfaz de backend (Cloud):

**Haz clic en el botón "View Backend" para acceder a tu base de datos.**

Luego, ejecuta esta consulta SQL:

```sql
-- Asignar rol admin a la cuenta de Brillarte
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'oficial@brillarte.lat'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Paso 3: Activar verificación y foto de perfil

Ejecuta esta consulta para marcar la cuenta como verificada y asignar el logo:

```sql
-- Verificar cuenta y asignar logo oficial
UPDATE public.profiles
SET 
  verificado = true,
  avatar_url = '/assets/brillarte-logo.jpg'
WHERE correo = 'oficial@brillarte.lat';
```

---

## 📋 Uso del Sistema

### Para Administradores (Brillarte)

1. **Publicar Promociones**
   - Ve a `/admin/promociones`
   - Crea una nueva promoción
   - Si marcas como "activa", se envía notificación automática a TODOS los usuarios
   - La IA genera un mensaje atractivo para la notificación

2. **Enviar Notificaciones**
   - Ve a `/admin-dashboard`
   - Pestaña "Notificaciones"
   - Puedes enviar a un usuario específico o a todos

3. **Dashboard Admin**
   - Gestión completa de usuarios
   - Ver todos los tickets de soporte
   - Administrar productos
   - Gestionar promociones

### Para Usuarios

1. **Ver Notificaciones**
   - Campanita en la barra de navegación
   - Clic para ver todas las notificaciones
   - Notificaciones en tiempo real

2. **Participar en Promociones**
   - Ve a `/promociones`
   - Debes estar registrado para participar
   - Puedes comentar al participar

3. **Perfil Público**
   - Accede a `/perfil/:userId` para ver el perfil de cualquier usuario
   - Los usuarios verificados tienen un checkmark azul

---

## 🎨 Características de la Cuenta Brillarte

✅ **Logo oficial** como foto de perfil  
✅ **Checkmark de verificación** en el perfil y en todas las interacciones  
✅ **Rol de administrador** con acceso completo  
✅ **Capacidad de publicar promociones** con notificaciones automáticas  
✅ **Enviar notificaciones** a usuarios individuales o masivas  

---

## 🔔 Sistema de Notificaciones

- **Tipos de notificaciones**:
  - 🎁 Promociones nuevas
  - 💰 Créditos agregados
  - 📦 Paquetes asignados
  - 📢 Anuncios generales

- **Funcionalidades**:
  - Vista en tiempo real
  - Contador de no leídas
  - Marcar como leída
  - Click para ir a la acción relacionada

---

## 📱 Próximos Pasos Sugeridos

- [ ] Sistema de menciones (@usuario) completamente funcional
- [ ] Respuestas anidadas en comentarios de promociones
- [ ] Notificaciones push en navegador
- [ ] Panel de estadísticas de participación en promociones

---

## 🛠️ Solución de Problemas

**No puedo acceder al dashboard admin**
- Asegúrate de haber ejecutado la consulta SQL para asignar el rol admin
- Verifica que iniciaste sesión con oficial@brillarte.lat

**No aparece el checkmark de verificación**
- Ejecuta la consulta SQL de verificación
- Refresca la página

**Las notificaciones no se envían**
- Verifica que la promoción esté marcada como "activa"
- Revisa la consola del navegador por errores
- Asegúrate de que LOVABLE_API_KEY esté configurada

