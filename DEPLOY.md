# DEPLOY.md - Despliegue en OpenShift

## Solución Implementada: Script de Entrada + Config Dinámico

### Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│ Build Time (una sola vez)                                   │
│ npm run build → Genera dist/ sin valores hardcodeados       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Runtime (cada vez que arranca el Pod)                       │
│ 1. node generate-config.js                                  │
│    - Lee variables ENV del Pod (VITE_API_URL, etc.)         │
│    - Genera dist/config.js con window.__CONFIG__            │
│                                                              │
│ 2. node server.js                                           │
│    - Inicia servidor Vite preview                           │
│    - Sirve dist/ + config.js dinámico                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│ 1. Carga index.html                                         │
│ 2. Ejecuta <script src="/config.js"></script>               │
│    → window.__CONFIG__ = { VITE_API_URL: "..." }            │
│ 3. React lee window.__CONFIG__.VITE_API_URL                 │
└─────────────────────────────────────────────────────────────┘
```

### Componentes de la Solución

#### 1. Script de Generación de Config (`generate-config.js`)

```javascript
const config = {
  VITE_API_URL: process.env.VITE_API_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'production',
  APP_VERSION: process.env.APP_VERSION || '1.0.0'
};

const configContent = `window.__CONFIG__ = ${JSON.stringify(config, null, 2)};`;
writeFileSync('dist/config.js', configContent, 'utf8');
```

**¿Por qué esto funciona?**
- Se ejecuta **después del build**, cada vez que arranca el contenedor
- Lee las ENV del Pod (inyectadas desde ConfigMap de OpenShift)
- Genera un archivo JS que el navegador puede consumir

#### 2. HTML con Config Inyectado (`index.html`)

```html
<head>
  <script src="/config.js"></script>
</head>
```

#### 3. React Consumiendo Runtime Config (`App.jsx`)

```javascript
const apiUrl = window.__CONFIG__?.VITE_API_URL || import.meta.env.VITE_API_URL || '';
```

#### 4. Servidor Configurable (`server.js`)

```javascript
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '8080', 10);

const server = await createServer({
  mode: 'production',
  preview: { host: HOST, port: PORT }
});
```

#### 5. Script de Inicio (`package.json`)

```json
"start": "npm run build && node generate-config.js && node server.js"
```

**Flujo de ejecución:**
1. `npm run build` → Compila React (una vez)
2. `node generate-config.js` → Genera config dinámico con ENV del Pod
3. `node server.js` → Sirve la aplicación

## Variables de Entorno Soportadas

| Variable | Descripción | Default | Requerida |
|----------|-------------|---------|-----------|
| `VITE_API_URL` | URL de la API Quarkus | - | ✅ Sí |
| `PORT` | Puerto del servidor | 8080 | ❌ No |
| `HOST` | Host del servidor | 0.0.0.0 | ❌ No |
| `NODE_ENV` | Ambiente de ejecución | production | ❌ No |
| `APP_VERSION` | Versión de la app | 1.0.0 | ❌ No |

