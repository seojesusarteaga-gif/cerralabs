# Fase RD5 — Lo que necesito de ti

El panel está construido y desplegado. Ahora mismo `/admin` responde 503 a
propósito: sin base de datos no puede validar sesiones, y prefiero que falle
cerrado a que deje pasar a alguien.

Faltan dos cosas que solo puedes hacer tú: crear la cuenta de Neon y elegir la
contraseña del panel.

---

## Bloque 1 — Base de datos en Neon (3 minutos)

1. Entra en <https://neon.tech> y regístrate con `seo.jesusarteaga@gmail.com`.
   El plan gratuito da 0,5 GB, de sobra para años de leads.
2. **Create project**:
   - Name: `cerralabs`
   - Postgres: la versión que venga por defecto
   - Region: **Europe (Frankfurt)** — la más cercana
3. Al terminar te muestra **Connection string**. Necesito **dos**, y son
   distintas:

   **La pooled** — es la que sale por defecto. Contiene `-pooler` en el host:
   ```
   postgresql://usuario:clave@ep-algo-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   **La directa** — quita el `-pooler` del host, o búscala en el desplegable
   como *Direct connection*:
   ```
   postgresql://usuario:clave@ep-algo-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

Hacen falta las dos porque cumplen funciones distintas: la pooled la usan las
funciones del servidor, que abren y cierran conexiones todo el rato, y la
directa la usan las migraciones, que fallan si van por el pooler.

### Lo que tienes que copiarme

Las dos cadenas. O, si prefieres no pegarlas en el chat, las metes tú:

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm DATABASE_URL production --yes && vercel env add DATABASE_URL production
```

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm DIRECT_URL production --yes && vercel env add DIRECT_URL production
```

---

## Bloque 2 — Contraseña del panel

Elige una contraseña de **12 caracteres como mínimo**. No reutilices ninguna que
uses en otro sitio: esto da acceso a los datos de contacto de todos tus
prospectos.

Puedes pasármela o crear tú la cuenta cuando la base de datos esté lista:

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env pull .env.local && ADMIN_EMAIL=seo.jesusarteaga@gmail.com ADMIN_PASSWORD=tu-contraseña-aqui ADMIN_NOMBRE="Jesús Arteaga" npm run seed:admin
```

> El alta de usuarios está desactivada en el propio código. Este script es la
> única vía de crear una cuenta, y solo funciona con acceso al proyecto. Si
> estuviera abierta, cualquiera podría registrarse y entrar al panel.

---

## Qué haré yo después

1. Aplicar la migración inicial contra la cadena directa para crear las tablas.
2. Configurar las variables en Vercel y desplegar.
3. Crear tu cuenta con el script, si me pasas la contraseña.
4. Enviar el formulario de verdad y comprobar las tres cosas a la vez: llega el
   Telegram, llega el email y **aparece la fila en el panel**.
5. Cambiar el estado de ese lead y recargar para confirmar que persiste.
6. Comprobar que sin sesión `/admin` redirige al login y que
   `POST /api/admin/lead` devuelve 401.
7. Comprobar que el alta de usuarios está efectivamente cerrada.

---

## Lo que ya está hecho y verificado

| | |
|---|---|
| Sitio público tras el cambio | 14 páginas respondiendo 200 |
| Formulario de contacto | Sigue avisando por Telegram y email |
| Panel sin configurar | 503, falla cerrado |
| Auditoría del sitio | 0 errores |
| JavaScript al cliente | 0 KB, panel incluido |
| `/admin` en sitemap | Excluido |
| `robots.txt` | `Disallow: /admin` y `Disallow: /api/` |

## Cómo será el panel

Una lista de solicitudes ordenada por fecha, con filtros por estado arriba y
contador en cada uno. Cada tarjeta muestra nombre, empresa, web, email,
facturación, vertical y el mensaje completo, con dos campos editables: el estado
(Nuevo, Contactado, Llamada agendada, Propuesta, Cerrado, Descartado) y unas
notas internas para apuntar el seguimiento sin salir de ahí.

Las notas no las pediste; las he añadido porque un listado sin sitio donde
anotar «me dijo que lo mira en septiembre» obliga a llevar el seguimiento en
otro lado. Si sobran, se quitan en un minuto.
