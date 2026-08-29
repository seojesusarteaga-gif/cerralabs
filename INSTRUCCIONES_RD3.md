# Fase RD3 — Instrucciones para Jesús

Dos cuentas que crear: un bot de Telegram y Resend. Unos 10 minutos en total.
El formulario ya está desplegado y esperando los tokens.

**Aviso sobre secretos.** Los tokens dan control sobre tu bot y tu cuenta de
correo. Pégamelos en el chat solo si te parece bien; la alternativa es que los
metas tú con los comandos que van al final de cada bloque y me digas «hecho».

---

## Bloque 1 — Bot de Telegram (unos 5 minutos)

### 1.1 Crear el bot

1. Abre Telegram y busca **BotFather**. Asegúrate de que es el que lleva la
   marca de verificación azul: hay imitaciones.
2. Pulsa **Start** y envía `/newbot`.
3. Te pide el **nombre visible**: pon `Cerra Labs Leads`.
4. Te pide el **nombre técnico**: pon `cerralabs_bot`. Tiene que acabar en
   `_bot`. Si está ocupado prueba `cerralabs_leads_bot` o `cerralabsleads_bot`.
5. BotFather te devuelve un token con esta pinta: `8123456789:AAH...`.
   **Cópialo.**

### 1.2 El paso que se olvida siempre

6. Busca en Telegram el bot que acabas de crear, por su nombre técnico.
7. Pulsa **Start**.
8. Escríbele `hola`.

**Esto es obligatorio.** Un bot de Telegram no puede escribir a nadie que no le
haya hablado antes. Sin este paso el aviso falla con «chat not found» aunque
todo lo demás esté bien. Es el error exacto que ocurrió en Hispalense Solar.

### 1.3 Chat ID

No uses UserInfoBot: en Hispalense Solar devolvió un identificador que no
funcionaba. Yo lo saco de `getUpdates`, que lee la conversación real.

Si prefieres sacarlo tú, abre esta URL sustituyendo el token y busca
`"chat":{"id":` — ese número es el Chat ID:

```
https://api.telegram.org/bot<TU_TOKEN>/getUpdates
```

### Lo que tienes que copiarme

1. El **token del bot**.
2. Confirmación de que le has escrito «hola».

Con eso saco el Chat ID y configuro las dos variables. Si prefieres meter el
token tú:

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm TELEGRAM_BOT_TOKEN production --yes && vercel env add TELEGRAM_BOT_TOKEN production
```

---

## Bloque 2 — Resend (unos 5 minutos)

### 2.1 Crear la cuenta y la clave

1. Entra en <https://resend.com/signup> y regístrate con
   `seo.jesusarteaga@gmail.com`.
2. Plan **Free**: 100 emails al día, 3.000 al mes. De sobra.
3. **API Keys** → **Create API Key**.
   - Name: `cerralabs-produccion`
   - Permission: **Sending access**. No des acceso completo: esta clave solo
     necesita enviar.
4. Copia la clave. Empieza por `re_`. **Solo se muestra una vez.**

### 2.2 Sobre el remitente

**No verifiques dominio todavía.** Sin `cerralabs.com` comprado no puedes, así
que de momento el aviso saldrá desde `onboarding@resend.dev`, el remitente
compartido de Resend.

Esto tiene una consecuencia que conviene que sepas: **puede caer en spam**. No
importa demasiado, porque el aviso te lo mando a ti y el canal principal es
Telegram. Márcalo como «no es spam» la primera vez.

Cuando compremos el dominio, en la fase M4.5, verificamos `cerralabs.com` en
Resend y cambiamos el remitente a `avisos@cerralabs.com`. Está previsto: basta
con cambiar la variable `RESEND_FROM`.

### Lo que tienes que copiarme

1. La **API key** de Resend (empieza por `re_`).
2. El email donde quieres recibir los avisos.

O bien:

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm RESEND_API_KEY production --yes && vercel env add RESEND_API_KEY production
```

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm LEAD_NOTIFICATION_EMAIL production --yes && vercel env add LEAD_NOTIFICATION_EMAIL production
```

---

## Variables de entorno

| Variable | Para qué | Estado |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token que devuelve BotFather | PENDIENTE |
| `TELEGRAM_CHAT_ID` | Destinatario del aviso | PENDIENTE |
| `RESEND_API_KEY` | Envío del email de respaldo | PENDIENTE |
| `LEAD_NOTIFICATION_EMAIL` | Dónde llega el email | PENDIENTE |
| `RESEND_FROM` | Remitente. Vacío usa el compartido de Resend | Opcional |

Son cuatro, no tres: el endpoint necesita saber **a qué dirección** enviar el
email, y eso no se puede deducir de la clave de Resend. Cuando exista
`hola@cerralabs.com` podremos prescindir de `LEAD_NOTIFICATION_EMAIL` y usarla
por defecto.

---

## Qué haré yo cuando me pases los datos

1. Sacar el Chat ID de Telegram con `getUpdates`.
2. Configurar las variables en Vercel y redesplegar.
3. Enviar el formulario de verdad desde el navegador y comprobar que te llegan
   los dos avisos.
4. Verificar que la auditoría sigue en verde y que las 14 páginas continúan
   siendo estáticas.

## Comprobación rápida en cualquier momento

Esta URL dice qué está configurado, sin exponer ningún valor:

```
https://cerralabs.vercel.app/api/contact
```

Y el formulario está en <https://cerralabs.vercel.app/contacto>. Ahora mismo
acepta el envío, valida los campos y responde «El formulario todavía no está
operativo» porque no hay ningún canal configurado. Es lo esperado hasta que
metas los tokens.
