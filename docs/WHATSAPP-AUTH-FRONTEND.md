# Pantalla de vinculación WhatsApp (consumo desde el frontend)

Documentación para implementar en el **front** la página que muestra el código QR y el estado de conexión de WhatsApp Web (backend NestJS + `whatsapp-web.js`).

## Base URL del API

- **Local:** `http://localhost:3002` (o el puerto que use `PORT` en `.env`).
- **Producción:** la URL pública del backend (ej. `https://tu-api.railway.app`).

No hay prefijo global tipo `/api` en el servidor: las rutas empiezan directamente en `/whatsapp/...`.

## CORS

El backend tiene `app.enableCors()` sin restricción de origen. El front puede estar en otro dominio o puerto.

## Endpoint principal: estado del QR

### `GET /whatsapp/auth/status`

**Uso:** polling cada **1,5–2 segundos** hasta que `connected === true`. El QR de WhatsApp se renueva periódicamente; el polling actualiza la imagen.

### Respuestas JSON

| Situación | Cuerpo |
|-----------|--------|
| WhatsApp ya conectado | `{ "connected": true }` |
| Hay QR listo para escanear | `{ "connected": false, "qrDataUrl": "data:image/png;base64,..." }` |
| Servidor arrancando o aún no hay QR | `{ "connected": false }` (sin `qrDataUrl`) |

### UI recomendada

1. Mientras `connected === false` y **no** hay `qrDataUrl`: mensaje tipo “Esperando código QR…” (spinner opcional).
2. Si hay `qrDataUrl`: mostrar `<img src={qrDataUrl} alt="Vincular WhatsApp" width={280} height={280} />` (o similar; conviene `width`/`height` fijos para que el lector del móvil enfoque bien).
3. Si `connected === true`: mensaje de éxito y **detener** el polling.

### Instrucciones para el usuario

Texto sugerido: *WhatsApp → Ajustes → Dispositivos vinculados → Vincular dispositivo* y escanear el QR de la pantalla.

## Endpoint opcional: listado de grupos

### `GET /whatsapp/groups`

Solo útil **después** de que WhatsApp esté conectado (si no, puede fallar o devolver vacío).

Respuesta: array de objetos `{ "id": string, "name": string }` (IDs para configurar envíos a grupos en el backend).

## Variable de entorno en el front

Definir la base del API, por ejemplo:

- Vite: `VITE_API_URL=https://tu-backend.com`
- Next: `NEXT_PUBLIC_API_URL=...`

Las peticiones serán: `${API_URL}/whatsapp/auth/status` (sin barra final en `API_URL`, o normalizar al unir rutas).

## Ejemplo mínimo (React)

```tsx
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';

function WhatsappLinkPage() {
  const [auth, setAuth] = useState<{ connected?: boolean; qrDataUrl?: string }>({});

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API}/whatsapp/auth/status`);
        const data = await res.json();
        setAuth(data);
        if (data.connected) clearInterval(id);
      } catch {
        /* opcional: toast de error */
      }
    }, 1500);
    return () => clearInterval(id);
  }, []);

  if (auth.connected) return <p>WhatsApp conectado</p>;
  if (auth.qrDataUrl)
    return (
      <img src={auth.qrDataUrl} alt="Vincular WhatsApp" width={280} height={280} />
    );
  return <p>Esperando código QR…</p>;
}
```

## Notas

- La sesión de WhatsApp vive en el **servidor** (carpeta `.wwebjs_auth` en el proceso del backend). Esta pantalla solo muestra el QR durante el emparejamiento.
- Si el despliegue reinicia el contenedor sin volumen persistente, puede pedir QR de nuevo.
- No hace falta autenticación JWT en estos `GET` en la versión actual del backend; si más adelante se protegen, este documento habría que actualizarlo con headers/cookies.
