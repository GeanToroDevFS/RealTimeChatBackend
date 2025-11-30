# RealTime Chat Backend

Este es el segundo servidor para la plataforma de videollamadas RealTime, manejando funcionalidad de chat en tiempo real usando Socket.IO y almacenamiento de metadatos de reuniones en Firestore. Está construido con Node.js, TypeScript y Express.

## Características

- **Chat en Tiempo Real**: Los usuarios pueden unirse a salas de reuniones y enviar/recibir mensajes en tiempo real via Socket.IO.
- **Gestión de Reuniones**: Crear, obtener y finalizar reuniones via API REST. Metadatos (ID, creador, estado) se almacenan en Firestore.
- **Autenticación**: Rutas protegidas usando tokens JWT del backend de usuario.
- **Sin Persistencia de Mensajes**: Los mensajes son efímeros; solo metadatos de reuniones se guardan.

## Tecnologías

- Node.js
- TypeScript
- Express
- Socket.IO
- Firebase Admin SDK (Firestore solo para reuniones)

## Configuración

1. Clona este repositorio.
2. Instala dependencias: `npm install`.
3. Copia `.env.example` a `.env` y completa las variables (comparte configuración de Firebase del backend de usuario).
4. Construye: `npm run build`.
5. Ejecuta: `npm start` (o `npm run dev` para desarrollo).

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3001)
- `JWT_SECRET`: Secreto JWT para autenticación
- `FIREBASE_PROJECT_ID`: ID del proyecto Firebase
- `FIREBASE_SERVICE_ACCOUNT_KEY`: JSON de cuenta de servicio Firebase
- `FRONTEND_URL`: URL del frontend para CORS

## Endpoints de API

- `POST /api/meetings`: Crear reunión (protegido)
- `GET /api/meetings/:id`: Obtener reunión por ID (protegido)
- `PUT /api/meetings/:id/end`: Finalizar reunión (protegido)

## Eventos de Socket.IO

- `join-meeting`: Unirse a sala de reunión
- `send-message`: Enviar mensaje a la sala
- `leave-meeting`: Salir de la sala
- `receive-message`: Recibir mensajes de otros

## Despliegue

Despliega en Render. Asegura que las variables de entorno estén configuradas.

## Contribuyendo

Sigue el Git Workflow: Crea ramas, haz commits pequeños, envía PRs con tag `sprint-X-release`.