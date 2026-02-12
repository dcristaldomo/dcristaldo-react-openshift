# React + Vite

## Configuración inicial

Antes de comenzar a trabajar con el proyecto, es necesario configurar las variables de entorno:

1. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.sample .env
   ```

2. Edita el archivo `.env` y configura las variables según tu entorno:
   - `VITE_API_URL`: URL de tu API backend
   - `PORT`: Puerto en el que se ejecutará el servidor (por defecto: 8080)
   - `HOST`: Host del servidor (por defecto: 0.0.0.0)
   - `NODE_ENV`: Entorno de ejecución (development/production)
   - `APP_VERSION`: Versión de la aplicación

3. **Importante - Certificados SSL**: Para que la aplicación funcione correctamente, debes aceptar los certificados SSL en tu navegador.

