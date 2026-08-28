# Fase RD3 — Instrucciones para Jesús

Tres cuentas que crear: Cal.com, un bot de Telegram y Resend. Calcula unos
40 minutos en total. El código ya está desplegado y esperando los datos.

Al terminar cada bloque, pásame lo que te pida en **«Lo que tienes que
copiarme»**. No hace falta que lo hagas todo de una sentada: cada bloque
funciona por separado.

**Aviso importante sobre secretos.** Los tokens que vas a generar dan control
sobre tu bot y tu cuenta de correo. Pégamelos en el chat solo si te parece
bien; la alternativa es que los metas tú directamente en Vercel y me digas
únicamente «hecho». Te indico el comando exacto en cada caso.

---

## Bloque 1 — Cal.com (unos 20 minutos)

### 1.1 Crear la cuenta

1. Entra en <https://cal.com/signup>.
2. Regístrate con `seo.jesusarteaga@gmail.com`.
3. En **username** pon `cerralabs`. Es lo que aparecerá en la URL pública
   (`cal.com/cerralabs/...`). Si estuviera cogido, prueba `cerra-labs` o
   `cerralabs-es` y **avísame del que quede**, porque hay que reflejarlo en el
   código.
4. Elige el plan **Free**. Es suficiente: permite eventos ilimitados, un
   calendario conectado y webhooks.
5. Conecta tu Google Calendar cuando te lo pida. Sin esto Cal.com no sabe
   cuándo estás ocupado y te va a agendar encima de otras reuniones.
6. En **Availability**, define tu horario real de llamadas. Sugerencia:
   lunes a viernes, de 10:00 a 14:00 y de 16:00 a 18:00, zona horaria
   `Europe/Madrid`. Ajústalo a tu realidad, no a lo que suene bien.

### 1.2 Crear el primer tipo de evento

1. **Event Types** → **New**.
2. Rellena:
   - Title: `Diagnóstico`
   - URL: `diagnostico` ← **este slug tiene que ser exacto**
   - Duration: `30` minutos
   - Description: *Treinta minutos para revisar tus números de cierre y decidir
     si encajamos. Sin coste y sin presentación comercial.*
3. Guarda.

### 1.3 Añadir las 7 preguntas de pre-cualificación

Dentro del evento, pestaña **Advanced** → sección **Booking questions** →
**Add a question**. Añade estas siete, una a una.

Los **identificadores** de la columna «Identifier» son los que lee el webhook.
Si escribes uno distinto, el dato llegará igual pero sin etiqueta ordenada, así
que cópialos tal cual.

| # | Identifier | Label (lo que ve el prospecto) | Tipo | Obligatoria |
|---|---|---|---|---|
| 1 | `empresa` | Empresa y web | Short Text | Sí |
| 2 | `facturacion` | Facturación anual aproximada | Select | Sí |
| 3 | `leads-mes` | ¿Cuántos leads calificados generáis al mes? | Short Text | Sí |
| 4 | `ticket-medio` | Ticket medio de vuestro servicio o producto | Short Text | Sí |
| 5 | `ciclo-venta` | ¿Cómo es hoy vuestro proceso de venta? | Long Text | Sí |
| 6 | `expectativas` | ¿Qué esperáis de Cerra Labs? | Long Text | Sí |
| 7 | `timeline` | ¿Cuándo querríais empezar? | Select | Sí |

Opciones para la pregunta 2 (`facturacion`), como Select:

```
Menos de 300.000 €
Entre 300.000 € y 1 M€
Entre 1 M€ y 5 M€
Más de 5 M€
Prefiero no decirlo
```

Opciones para la pregunta 7 (`timeline`), como Select:

```
Este mes
En uno o dos meses
Este trimestre
Solo estoy explorando
```

> **Por qué las siete son obligatorias.** Este formulario es el filtro. Alguien
> que no quiere dedicar dos minutos a contestar tampoco va a dedicar dos horas
> al onboarding. Y la pregunta de facturación con «prefiero no decirlo» te da
> información igualmente: quien la elige suele estar por debajo del umbral.

### 1.4 Duplicar para los cinco eventos restantes

Usa **Duplicate** sobre el evento que acabas de crear, así se copian las
preguntas. Cambia solo título y slug:

| Título | Slug (exacto) | Duración |
|---|---|---|
| Diagnóstico · Agencias | `diagnostico-agencias` | 30 min |
| Diagnóstico · SaaS | `diagnostico-saas` | 30 min |
| Diagnóstico · Infoproductores | `diagnostico-infoproductores` | 30 min |
| Diagnóstico · Clínicas | `diagnostico-clinicas` | 30 min |

Y uno más, **este sin las 7 preguntas** (bórralas tras duplicar) porque es para
closers, no para clientes:

| Título | Slug (exacto) | Duración |
|---|---|---|
| Entrevista de closer | `entrevista-closer` | 30 min |

Para `entrevista-closer` añade en su lugar tres preguntas:

| Identifier | Label | Tipo |
|---|---|---|
| `experiencia` | ¿Qué has vendido, con qué ticket y durante cuánto tiempo? | Long Text |
| `verticales` | ¿En qué sectores has trabajado? | Short Text |
| `disponibilidad` | ¿Qué disponibilidad tienes en horario comercial español? | Short Text |

### 1.5 Redirección a la página de gracias

En cada uno de los seis eventos: **Advanced** → **Redirect on booking** →
activar y poner:

```
https://cerralabs.vercel.app/gracias
```

Esa página ya existe y explica qué llevar preparado a la llamada.

### 1.6 Crear el webhook

1. Menú lateral → **Settings** → **Developer** → **Webhooks** → **New**.
2. Subscriber URL:
   ```
   https://cerralabs.vercel.app/api/booking-notification
   ```
3. Event triggers: marca **Booking created**, **Booking rescheduled** y
   **Booking cancelled**.
4. **Secret**: pulsa para generar uno, o inventa una cadena larga y aleatoria.
   **Cópiala antes de guardar** — no siempre se puede volver a ver.
5. Guarda y deja el webhook **activo**.

> Sin este secreto el endpoint devuelve 503 y no procesa nada. Es deliberado:
> un webhook sin firma sería una vía abierta para que cualquiera te llenara el
> Telegram de avisos falsos.

### Lo que tienes que copiarme (bloque 1)

1. Tu username final de Cal.com (`cerralabs` u otro).
2. Confirmación de que los seis slugs están creados tal cual.
3. El **secreto del webhook**.

O, si prefieres no pegar el secreto en el chat, mételo tú:

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm CALCOM_WEBHOOK_SECRET production --yes && vercel env add CALCOM_WEBHOOK_SECRET production
```

---

## Bloque 2 — Bot de Telegram (unos 5 minutos)

### 2.1 Crear el bot

1. Abre Telegram y busca **BotFather**. Asegúrate de que es el que lleva la
   marca de verificación azul: hay imitaciones.
2. Pulsa **Start** y envía `/newbot`.
3. Te pide el **nombre visible**: pon `Cerra Labs Leads`.
4. Te pide el **nombre técnico**: pon `cerralabs_bot`. Tiene que acabar en
   `_bot`. Si está ocupado prueba `cerralabs_leads_bot` o
   `cerralabsleads_bot`.
5. BotFather te devuelve un token con esta pinta:
   `8123456789:AAH...`. **Cópialo.**

### 2.2 Paso que se olvida siempre

6. Busca en Telegram el bot que acabas de crear (por su nombre técnico).
7. Pulsa **Start**.
8. Escríbele `hola`.

**Esto es obligatorio.** Un bot de Telegram no puede escribir a nadie que no le
haya hablado antes. Sin este paso el aviso falla con «chat not found» aunque
todo lo demás esté bien.

### 2.3 Chat ID

No uses UserInfoBot: en el proyecto de Hispalense Solar devolvió un identificador
que no funcionaba. Yo lo saco de `getUpdates`, que lee la conversación real.

Si prefieres sacarlo tú, abre esta URL en el navegador sustituyendo el token, y
busca `"chat":{"id":` — ese número es el Chat ID:

```
https://api.telegram.org/bot<TU_TOKEN>/getUpdates
```

### Lo que tienes que copiarme (bloque 2)

1. El **token del bot**.
2. Confirmación de que le has escrito «hola».

Con eso saco el Chat ID y lo configuro. Si prefieres no pegar el token:

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm TELEGRAM_BOT_TOKEN production --yes && vercel env add TELEGRAM_BOT_TOKEN production
```

---

## Bloque 3 — Resend (unos 5 minutos)

### 3.1 Crear la cuenta y la clave

1. Entra en <https://resend.com/signup> y regístrate con
   `seo.jesusarteaga@gmail.com`.
2. Plan **Free**: 100 emails al día, 3.000 al mes. De sobra.
3. **API Keys** → **Create API Key**.
   - Name: `cerralabs-produccion`
   - Permission: **Sending access**. No des acceso completo: esta clave solo
     necesita enviar.
   - Domain: déjalo en todos.
4. Copia la clave. Empieza por `re_`. **Solo se muestra una vez.**

### 3.2 Sobre el remitente

**No verifiques dominio todavía.** Sin `cerralabs.com` comprado no puedes, así
que de momento el aviso saldrá desde `onboarding@resend.dev`, el remitente
compartido de Resend.

Esto tiene una consecuencia que conviene que sepas: **puede caer en spam**.
No importa demasiado, porque el aviso te lo mando a ti, no a clientes, y el
canal principal es Telegram. Añade `onboarding@resend.dev` a contactos y
márcalo como «no es spam» la primera vez.

Cuando compremos el dominio, en la fase M4.5, verificamos `cerralabs.com` en
Resend y cambiamos el remitente a `avisos@cerralabs.com`. Está previsto en el
código: basta con cambiar la variable `RESEND_FROM`.

### Lo que tienes que copiarme (bloque 3)

1. La **API key** de Resend (empieza por `re_`).
2. El email donde quieres recibir los avisos.

O bien:

```bash
cd "C:\Users\Usuario\Desktop\proyectos\cerra labs" && vercel env rm RESEND_API_KEY production --yes && vercel env add RESEND_API_KEY production
```

---

## Qué haré yo cuando me pases todo

1. Poner tu username real de Cal.com en `src/config/site.ts` y activar
   `BOOKING_ENABLED`. Los 35 botones de la web dejan de estar inertes.
2. Sacar el Chat ID de Telegram con `getUpdates`.
3. Configurar las variables en Vercel y redesplegar.
4. Lanzar una reserva de prueba real contra el webhook y comprobar que te
   llegan los dos avisos.
5. Verificar que la auditoría sigue en verde y que las 14 páginas continúan
   siendo estáticas.

## Comprobación rápida en cualquier momento

Esta URL te dice qué está configurado y qué no, sin exponer ningún valor:

```
https://cerralabs.vercel.app/api/booking-notification
```
