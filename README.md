# Hospice San Camilo - Sistema de Gestión de Voluntarios y Partes Diarios

Este proyecto es una aplicación web desarrollada para el Hospice San Camilo, orientada a la gestión de voluntarios y la organización de partes diarios de los turnos de atención.

## Características principales

- **Login ultra simple:** pensado para adultos mayores, solo requiere ingresar el email (sin contraseña).
- **Registro automático de voluntarios:** cada email ingresado queda registrado en Firestore.
- **Gestión de partes diarios:** permite cargar partes de los turnos (mañana, tarde, noche) y generar un resumen diario.
- **Envío automático de resúmenes:** el resumen diario se envía por email a todos los voluntarios registrados (mediante un script Node.js).
- **Interfaz responsive:** diseño adaptado para escritorio y móvil, con barra de navegación inferior en dispositivos móviles.
- **Desarrollado con:** React, Vite, Tailwind CSS, Firebase (Firestore), Node.js, SendGrid.

## Pensado para usuarios reales

El sistema fue diseñado específicamente para ser usado por voluntarios mayores, priorizando la facilidad de uso y la accesibilidad.

## ¿Cómo funciona el envío de mails?

El envío de resúmenes diarios se realiza mediante un script Node.js que lee los datos de Firestore y utiliza SendGrid para enviar los correos a todos los voluntarios registrados.

## Seguridad

- El frontend no expone ninguna clave privada ni credenciales sensibles.
- El archivo de credenciales de Firebase Admin y las claves de SendGrid solo se usan en el script backend y no están incluidos en este repositorio.

## Demo

(Si tienes un link de demo, agrégalo aquí)

## Autor

Desarrollado por [Tu Nombre] para el Hospice San Camilo.

---

¡Gracias por visitar el proyecto!