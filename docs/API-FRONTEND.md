# Documentación API Seguros — Para el equipo de Frontend

Documentación para integrar el frontend con la API de seguros. Base URL en desarrollo: **`http://localhost:3001`**.

---

## 1. Autenticación

- **Tipo:** JWT en header `Authorization`.
- **Formato:** `Authorization: Bearer <token>`  
  El backend puede devolver el token ya con prefijo `"Bearer "`; en ese caso usar el valor de `access_token` tal cual como valor del header (p. ej. `Authorization: <access_token>`).
- **Dónde se obtiene el token:** endpoints **Crear usuario** y **Login** devuelven `access_token`.
- **Persistencia:** El frontend debe guardar el token (p. ej. `localStorage` o memoria) y enviarlo en todas las peticiones que requieran autenticación.
- **Roles:** El campo `user.admin` indica si es administrador. Solo los admins pueden usar los endpoints de **Seguros** y **Hacer admin**.

---

## 2. Endpoints

### 2.1 Usuarios

#### Crear usuario  
`POST /users`  
**Auth:** No.

**Body (JSON):**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Respuesta 201 (éxito):**
```json
{
  "access_token": "Bearer <jwt>",
  "user": {
    "id": "<mongoId>",
    "name": "string",
    "email": "string",
    "admin": false
  },
  "message": "User created"
}
```

**Errores:**
- `409 Conflict` — "El usuario ya existe" (email duplicado).

---

#### Login  
`POST /users/login`  
**Auth:** No.

**Body (JSON):**
```json
{
  "email": "string",
  "password": "string"
}
```

**Respuesta 200 (éxito):**
```json
{
  "access_token": "Bearer <jwt>",
  "user": {
    "id": "<mongoId>",
    "name": "string",
    "email": "string",
    "admin": false
  },
  "message": "Login successful"
}
```

**Errores:**
- `401 Unauthorized` — "Invalid credentials" (email o contraseña incorrectos).

---

#### Actualizar usuario  
`PUT /users/:id`  
**Auth:** Sí (cualquier usuario autenticado).

**Params:** `id` — ID del usuario (Mongo ObjectId).

**Body (JSON), todos opcionales:**
```json
{
  "name": "string",
  "admin": false
}
```

**Respuesta 200 (éxito):**
```json
{
  "user": {
    "id": "<mongoId>",
    "name": "string",
    "email": "string",
    "admin": false
  },
  "message": "User updated"
}
```

**Errores:**
- `401` — Token faltante o inválido.
- `404 Not Found` — "Usuario no encontrado".

---

#### Hacer admin  
`PUT /users/:id/admin`  
**Auth:** Sí, y el usuario debe ser **admin**.

**Params:** `id` — ID del usuario a promover.

**Body:** ninguno.

**Respuesta 200 (éxito):**
```json
{
  "user": {
    "id": "<mongoId>",
    "name": "string",
    "email": "string",
    "admin": true
  },
  "message": "User made admin"
}
```

**Errores:**
- `401` — Token faltante o inválido.
- `403 Forbidden` — "Usuario no autorizado" (no es admin).
- `404 Not Found` — "User not found".

---

### 2.2 Seguros

Todos los endpoints de seguros requieren **usuario autenticado y admin**.

#### Crear seguro  
`POST /seguros`  
**Auth:** Admin.

**Body (JSON):**
```json
{
  "name": "string",
  "phone": "string",
  "tuition": "string",
  "type": "string",
  "expirationDate": "2026-12-31"
}
```

- **expirationDate:** formato ISO (p. ej. `YYYY-MM-DD` o ISO completo).
- **phone:** el backend normaliza el número (quita espacios, guiones, añade prefijo 598 si aplica).
- **tuition:** matrícula; debe ser única. El backend la guarda en mayúsculas.

**Respuesta 201 (éxito):** Objeto seguro creado (ver modelo más abajo).

**Errores:**
- `400 Bad Request` — "La matrícula ya está registrada" (tuition duplicada).
- `401` — Token faltante o inválido.
- `403` — Usuario no admin.

---

#### Listar seguros  
`GET /seguros`  
**Auth:** Admin.

**Respuesta 200 (éxito):** Array de seguros:
```json
[
  {
    "_id": "<mongoId>",
    "name": "string",
    "phone": "string",
    "tuition": "string",
    "type": "string",
    "expirationDate": "2026-12-31T00:00:00.000Z",
    "reminderSent": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Errores:**
- `401` — Token faltante o inválido.
- `403` — Usuario no admin.

---

#### Actualizar seguro  
`PUT /seguros/:id`  
**Auth:** Admin.

**Params:** `id` — ID del seguro (Mongo ObjectId).

**Body (JSON), todos opcionales (solo enviar los que cambian):**
```json
{
  "name": "string",
  "phone": "string",
  "tuition": "string",
  "type": "string",
  "expirationDate": "2026-12-31"
}
```

**Respuesta 200 (éxito):** Objeto seguro actualizado (mismo formato que en listar).

**Errores:**
- `400` — "Seguro no encontrado".
- `409 Conflict` — "La matrícula ya está registrada" (si se cambia tuition a una ya existente).
- `401` — Token faltante o inválido.
- `403` — Usuario no admin.

---

## 3. Modelos de datos (TypeScript / uso en frontend)

```ts
// Usuario (tal como lo devuelve la API en user)
interface User {
  id: string;       // Mongo ObjectId
  name: string;
  email: string;
  admin: boolean;
}

// Respuesta de login / crear usuario
interface AuthResponse {
  access_token: string;
  user: User;
  message: string;
}

// Seguro (tal como lo devuelve GET /seguros o create/update)
interface Insurance {
  _id: string;
  name: string;
  phone: string;
  tuition: string;
  type: string;
  expirationDate: string;  // ISO date
  reminderSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Body para crear seguro
interface CreateInsuranceBody {
  name: string;
  phone: string;
  tuition: string;
  type: string;
  expirationDate: string;  // ISO, ej. "2026-12-31"
}

// Body para actualizar seguro (todos opcionales)
interface UpdateInsuranceBody {
  name?: string;
  phone?: string;
  tuition?: string;
  type?: string;
  expirationDate?: string;
}
```

---

## 4. Resumen de rutas y permisos

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | /users | No | — | Crear usuario |
| POST | /users/login | No | — | Login |
| PUT | /users/:id | Bearer | Cualquiera | Actualizar usuario |
| PUT | /users/:id/admin | Bearer | Admin | Hacer admin a un usuario |
| POST | /seguros | Bearer | Admin | Crear seguro |
| GET | /seguros | Bearer | Admin | Listar seguros |
| PUT | /seguros/:id | Bearer | Admin | Actualizar seguro |

---

## 5. Códigos HTTP y mensajes de error

- **400 Bad Request** — Datos inválidos o recurso no encontrado (seguro).
- **401 Unauthorized** — "Token missing", "Invalid token format", "Invalid or expired token", o "Invalid credentials" (login).
- **403 Forbidden** — "Usuario no autorizado" (acción solo para admins).
- **404 Not Found** — Usuario no encontrado.
- **409 Conflict** — Email o matrícula ya registrados.

Las respuestas de error suelen tener cuerpo JSON con `message` y a veces `statusCode` y `error` (formato estándar NestJS).

---

## 6. Flujo recomendado en el frontend

1. **Registro / Login:** llamar a `POST /users` o `POST /users/login`, guardar `access_token` y `user` (incluido `user.admin`).
2. **Peticiones protegidas:** enviar en todas las peticiones a rutas protegidas el header `Authorization` con el token (si el backend devuelve "Bearer ...", usar ese valor tal cual como valor del header).
3. **Redirección por rol:** si `user.admin === false`, no mostrar ni llamar a endpoints de seguros ni "Hacer admin"; opcionalmente redirigir a una vista de solo lectura o mensaje de “sin permisos”.
4. **IDs:** para actualizar usuario o seguro, usar `user.id` o `insurance._id` en la URL (`/users/:id`, `/seguros/:id`).
5. **CORS:** la API debe estar configurada para aceptar el origen del frontend (ej. `http://localhost:5173`); si hay problemas, revisar en backend.

---

## 7. Base URL por entorno

- **Desarrollo:** `http://localhost:3001`
- **Producción:** definir variable de entorno en el frontend (ej. `VITE_API_URL` o `NEXT_PUBLIC_API_URL`) y apuntarla al host de la API.

Con esta documentación, una IA o desarrollador frontend puede implementar la integración con la API sin necesidad de leer el código del backend.
