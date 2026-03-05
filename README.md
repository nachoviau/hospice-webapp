# Hospice San Camilo - Sistema de Gestión de Voluntarios y Partes Diarios

Este proyecto es una aplicación web desarrollada para el Hospice San Camilo, orientada a la gestión de voluntarios y la organización de partes diarios de los turnos de atención.

## Características principales

- **Login ultra simple:** pensado para adultos mayores, solo requiere ingresar el email (sin contraseña).
- **Registro automático de voluntarios:** cada email ingresado queda registrado en Firestore.
- **Gestión de partes diarios:** permite cargar partes de los turnos (mañana, tarde, noche) y generar un resumen diario.
- **Notificaciones push por comentarios:** cuando hay nuevos comentarios en un parte, se notifica a participantes del hilo (excepto quien comenta) en dispositivos con notificaciones habilitadas.
- **Envío automático de resúmenes:** el resumen diario se envía por email a todos los voluntarios registrados (mediante un script Node.js).
- **Interfaz responsive:** diseño adaptado para escritorio y móvil, con barra de navegación inferior en dispositivos móviles.
- **Desarrollado con:** React, Vite, Tailwind CSS, Firebase (Firestore), Node.js, SendGrid.

## Pensado para usuarios reales

El sistema fue diseñado específicamente para ser usado por voluntarios mayores, priorizando la facilidad de uso y la accesibilidad.

## ¿Cómo funciona el envío de mails?

El envío de resúmenes diarios se realiza mediante un script Node.js que lee los datos de Firestore y utiliza SendGrid para enviar los correos a todos los voluntarios registrados.

## Configuración de notificaciones push (FCM)

Para habilitar push web en la PWA:

1. Crear una Web Push certificate key (VAPID) en Firebase Console.
2. Definir en frontend la variable `VITE_FIREBASE_VAPID_KEY`.
3. Deployar Hosting + Functions.

Cuando un usuario con email inicia sesión y acepta el permiso del navegador:
- se guarda su token FCM en `voluntarios/{email}` (campo `tokens`),
- y queda habilitado para recibir notificaciones por nuevos comentarios.

### Flujo de destinatarios

Al crear un comentario en `partesDiarios/{fecha}/comentarios/{id}`, la Cloud Function:
- toma como participantes al `uploadedBy` del turno + autores de comentarios del mismo turno,
- excluye al autor actual del comentario,
- envía push a los tokens válidos y limpia tokens inválidos.

### Checklist manual de validación

1. En dos celulares distintos, instalar la PWA e iniciar sesión con emails diferentes.
2. Aceptar permiso de notificaciones en ambos.
3. En Firestore verificar que ambos tienen `tokens` en `voluntarios/{email}`.
4. Usuario A comenta en un parte:
   - B recibe push,
   - A no recibe push de su propio comentario.
5. Usuario B responde:
   - A recibe push.
6. Probar usuario anónimo:
   - no guarda token,
   - no recibe push.

## Seguridad

- El frontend no expone ninguna clave privada ni credenciales sensibles.
- El archivo de credenciales de Firebase Admin y las claves de SendGrid solo se usan en el script backend y no están incluidos en este repositorio.

---

¡Gracias por visitar el proyecto!
