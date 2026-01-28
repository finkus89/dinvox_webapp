export const HELP_SECTIONS = [
  {
    id: "que-es-dinvox",
    title: "¿Qué es Dinvox?",
    body: `
Dinvox es un asistente para registrar tus gastos diarios de forma rápida y sin fricción, usando Telegram (texto o audio) y una página web para ver tu información organizada. Más adelante, Dinvox también se integrará con WhatsApp.

No necesitas abrir hojas de cálculo ni escribir todo perfecto.
La idea es registrar en el momento, y luego ver con claridad en qué se va tu dinero.

Cómo funciona en simple:
- Registras un gasto por Telegram (mensaje o audio).
- Dinvox lo procesa y lo guarda.
- En la web ves tus gastos resumidos en gráficos y tablas.
- Usas filtros para entender patrones por fechas y categorías.

Qué NO es Dinvox:
- No es un banco.
- No es un software contable.
- No hace presupuestos automáticos.

Es una herramienta práctica para tomar conciencia, no para complicarte.
    `,
  },

{
  id: "como-registrar-gastos",
  title: "¿Cómo registrar gastos?",
  body: `
Puedes registrar gastos de dos formas: texto o audio. La idea es que sea rápido y claro.

1) Registrar por texto (recomendado si estás en silencio)
Ejemplos:
- "Almuerzo 18000"
- "Uber 12500"
- "Mercado 64200"
- "Gasolina 60000"

Puedes agregar más contexto si quieres:
- "Almuerzo 18000 con Juan"
- "Hice Mercado por 64200 en D1"
- "Gasolina 60000 carro"

2) Registrar por audio (recomendado si vas caminando)
Di una frase corta y directa, por ejemplo:
- "Gaste en Almuerzo dieciocho mil"
- "Uber doce mil quinientos"
- "Mercado sesenta y cuatro mil doscientos en olimpica"

También puedes dar más contexto en el audio, siempre que el monto quede claro.

Reglas importantes (para evitar errores):
- Envía SOLO un gasto por mensaje.
- Incluye un monto claro (sin dudas).
- Evita mandar dos montos diferentes en el mismo mensaje.
- Si necesitas registrar varios gastos, envíalos en mensajes separados.

Después de registrar, puedes entrar a la web (Dashboard) para ver gráficos, filtros por fecha y el detalle de tus gastos.
  `,
},

{
  id: "categorias",
  title: "Categorías de gastos",
  body: `
Dinvox clasifica automáticamente tus gastos en una de las siguientes categorías.
Para que la clasificación sea correcta, es importante que el mensaje tenga un monto claro y algo de contexto.

Categorías disponibles:

- Comida  
  Restaurantes, snacks, cafés, domicilios.

- Transporte  
  Taxi, bus, Uber, gasolina, peajes.

- Mercado  
  Compras en supermercado (D1, Ara, Éxito).

- Servicios  
  Luz, agua, gas, internet, celular.

- Ocio  
  Planes, salidas, cine, entretenimiento.

- Salud  
  Medicinas, citas médicas, exámenes.

- Créditos  
  Cuotas, intereses, pagos financieros.

- Finanzas  
  Inversiones, compra de acciones, CDTs.

- Hogar  
  Limpieza, artículos para la casa, mantenimiento, arriendo (si aplica).

- Mascotas  
  Comida, veterinario, accesorios.

- Regalos  
  Detalles, obsequios, celebraciones.

- Ropa  
  Tenis, camisas, pantalones, gorras, sandalias.

- Artículos personales  
  Desodorante, crema, lociones, jabones, toallas, cuidado personal.

- Educación  
  Cursos, talleres, libros, formación.

- Otros  
  Todo lo que no encaja en las categorías anteriores.

Tip adicional:
Si quieres tener más control, puedes mencionar explícitamente la categoría en el mensaje.
Esto ayuda al modelo cuando el gasto puede interpretarse de varias formas.

No es obligatorio. 
Dinvox intenta clasificar automáticamente usando el contexto del mensaje.

Tip importante:
Si tienes dudas sobre la categoría, no te preocupes. 
Envía el gasto con monto y contexto, y Dinvox lo clasificará automáticamente.
  `,
},


{
  id: "errores-comunes",
  title: "Errores comunes (qué NO decir)",
  body: `
Para que Dinvox registre bien tus gastos, evita estos casos comunes:

1) Mandar varios gastos en un solo mensaje
Ejemplo incorrecto:
- "Almuerzo 18000 y taxi 9000"

Solución:
- Envía cada gasto en un mensaje separado.

2) No incluir el monto
Ejemplo incorrecto:
- "Almuerzo"
- "Uber al trabajo"

Solución:
- Siempre incluye el valor: "Almuerzo 18000".

3) Enviar varios montos diferentes
Ejemplo incorrecto:
- "Mercado 30000 y 15000"

Solución:
- Registra un solo monto por mensaje.

4) Frases ambiguas o poco claras
Ejemplo incorrecto:
- "Gasto de hoy"
- "Lo de ayer"

Solución:
- Usa frases simples y directas con monto claro.

5) Falta de contexto
Dar contexto es importante para que el modelo pueda inferir bien la categoría del gasto.

Ejemplo poco claro:
- "Pago 25000"

Ejemplo mejor:
- "Cena 25000"
- "Transporte 25000 taxi"

Recuerda:
El monto y el contexto son lo más importante para un buen registro.

Si el mensaje no es claro, Dinvox puede pedirte que lo reformules.

Tip general:
Entre más claro y simple sea el mensaje, mejor será el registro.

Si el gasto puede prestarse a confusión, puedes mencionar la categoría de forma explícita.
Esto no es un error y puede ayudar a que el gasto quede donde tú esperas.

  `,
},

{
  id: "dashboard",
  title: "La web de Dinvox (Dashboard)",
  body: `
La web de Dinvox es donde puedes ver y analizar tus gastos con más detalle.
Desde aquí tienes una vista clara de en qué se va tu dinero.

¿Qué encuentras en el Dashboard?

- Un resumen visual de tus gastos.
- Gráficos por categorías para ver la distribución.
- Totales claros según el período que elijas.

Filtros por fecha:
Puedes filtrar tu información por:
- Hoy
- Esta semana
- Este mes
- Mes anterior
- Últimos 7 días
- Rango de fechas personalizado

Interacción con los gráficos:
- Si haces clic en una categoría (en las barras), Dinvox te lleva al detalle de esa categoría.
- El sistema filtra automáticamente los gastos según el período seleccionado.

Navegación inteligente:
Desde el Dashboard puedes pasar al detalle de los gastos sin perder los filtros.
Esto te permite ir de lo general a lo específico de forma rápida.
  `,
},

{
  id: "tabla-gastos",
  title: "Tabla de gastos (Registros)",
  body: `
La tabla de gastos muestra el detalle de todos tus registros según los filtros activos.
Es la vista más precisa para revisar, corregir o exportar tu información.

¿Qué ves en la tabla?
- Fecha del gasto.
- Categoría.
- Monto.
- Nota o contexto del gasto.

Acciones disponibles:

Editar un gasto:
- Haz clic sobre el gasto que quieres modificar.
- Se abrirá una ventana donde puedes ajustar fecha, monto, categoría o nota.

Eliminar un gasto:
- Haz clic en el ícono de la caneca.
- Confirma la acción para eliminar el registro.

Agregar un nuevo gasto:
- Usa el botón "Nuevo gasto".
- Puedes registrar manualmente un gasto desde la web.

Exportar a CSV:
- Puedes exportar los gastos visibles según el período y filtros actuales.
- Si cambias los filtros, el archivo incluirá solo esos registros.

Importante:
La tabla siempre respeta los filtros activos.
Está pensada para ajustes finos y revisión detallada, complementando el Dashboard.
  `,
},

{
  id: "tercios-del-mes",
  title: "Tercios del mes",
  body: `
Este gráfico divide tu gasto mensual en tres partes iguales de tiempo:

- T1: días 1–10
- T2: días 11–20
- T3: días 21–fin de mes

Cada barra muestra cuánto gastaste en ese tramo y qué porcentaje representa sobre el total del mes.

¿Para qué sirve?
Para entender cuándo se te va la plata, no en qué categoría.

Te ayuda a detectar patrones como:
- gastar más al inicio del mes,
- gastar de forma pareja,
- o concentrar gastos al final.

Cómo leerlo:
- La barra más alta indica el tercio donde se concentró la mayor parte del gasto.
- Los porcentajes se calculan sobre el total registrado del mes.
- Si el mes está en curso, el último tercio puede estar incompleto.
  `,
},

{
  id: "ritmo-del-mes",
  title: "Ritmo del mes",
  body: `
Este gráfico muestra cómo va creciendo tu gasto día a día durante el mes
y lo compara contra una referencia, cuando existe.

La línea sólida representa tu gasto acumulado real.
La línea punteada (si aparece) es la referencia esperada.

¿Para qué sirve?
Para saber si tu gasto va contenido, normal o acelerado en el tiempo.

No mira categorías.
Mira velocidad.

Cómo funciona el ritmo (R):
El ritmo compara tu gasto actual contra una referencia.

- R < 0.9 → Gasto contenido
- R entre 0.9 y 1.1 → Gasto normal
- R > 1.1 → Gasto acelerado

Ejemplo:
Un R de 0.66x significa que estás gastando más lento que tu referencia.

¿Qué es la referencia?
La referencia se calcula usando tu historial reciente:
- puede ser el mes anterior,
- o la mediana de los últimos meses disponibles.

Si aún no hay datos suficientes, no se usa referencia.

Cuando no hay referencia:
Si no hay historial suficiente, el sistema muestra únicamente tu
promedio diario de gasto hasta la fecha.
Ese mes se usará luego como base inicial.

Importante:
Este gráfico no es un presupuesto.
No te dice cuánto deberías gastar.
Te muestra si estás acelerando o conteniendo tu gasto en el tiempo.
  `,
},

{
  id: "evolucion-mensual",
  title: "Evolución mensual",
  body: `
La sección de Evolución mensual te muestra cómo se han comportado tus gastos mes a mes a lo largo del tiempo.

Aquí puedes:
- Ver un gráfico con el total de gastos por mes.
- Analizar los gastos totales o filtrar por una categoría específica.
- Cambiar el período de análisis entre:
  - Últimos 6 meses
  - Últimos 12 meses
  - Este año (desde enero hasta hoy)

Encima del gráfico verás un insight principal que compara el último mes cerrado con el mes anterior, mostrando si gastaste más o menos y en qué porcentaje.

El mes actual se marca como “mes en curso” y no se usa para comparaciones, ya que aún no ha terminado.

Al tocar un punto del gráfico puedes ver:
- El mes correspondiente.
- El total gastado.
- La variación porcentual frente al mes anterior, cuando aplica.

Esta vista es útil para identificar tendencias, detectar aumentos sostenidos y entender la evolución general de tus gastos sin entrar en el detalle diario.
  `,
},


{
  id: "menu-telegram",
  title: "Menú de Telegram",
  body: `
Desde Telegram puedes usar Dinvox sin abrir la web.
El menú te permite acceder rápido a las funciones principales.

Opciones del menú:

Resumen hoy:
- Muestra el total de gastos registrados en el día.
- Útil para ver rápidamente cómo vas hoy.

Últimos gastos:
- Muestra los últimos 5 registros realizados.
- Ideal para confirmar que un gasto quedó bien guardado.

Borrar último:
- Elimina el último gasto registrado (con Confirmación).
- Se usa cuando cometiste un error al enviar un gasto.

Categorías:
- Muestra la lista de categorías que Dinvox puede reconocer.
- Te ayuda a saber cómo clasificar mejor tus gastos.

Abrir Dinvox:
- Abre la página web de Dinvox.
- Si ya estás logueado, entras directo al Dashboard.
- Si no, se te pedirá iniciar sesión.

Ayuda:
- Muestra información básica de uso y recomendaciones.
- Te guía si tienes dudas sobre cómo registrar gastos.

El menú está pensado para que puedas usar Dinvox de forma rápida y sin complicaciones desde Telegram.
  `,
},

{
  id: "privacidad-datos",
  title: "Privacidad y datos",
  body: `
En Dinvox nos tomamos en serio tu privacidad y el uso responsable de tus datos.
Aquí te explicamos de forma clara cómo se manejan.

¿Qué datos recopilamos?
- Los gastos que registras.
- Información básica de tu cuenta (como nombre, correo, idioma y moneda).
- Identificadores necesarios para que el servicio funcione (por ejemplo, Telegram).

¿Qué hacemos con esos datos?
- Los usamos exclusivamente para ofrecer el servicio de Dinvox.
- Para almacenar y procesar la información usamos plataformas de terceros (como servicios de base de datos, mensajería y hosting).
- Estos proveedores solo acceden a los datos en la medida necesaria para que Dinvox funcione correctamente.

¿Qué NO hacemos?
- No vendemos tus datos.
- No usamos tu información para publicidad.
- No compartimos tus datos con terceros con fines comerciales.

¿Puedo eliminar mis datos?
Sí. Desde la sección de Configuración en la web puedes solicitar la eliminación de tu cuenta.
Esto eliminará tu información y tus registros asociados.

Seguridad:
- Usamos conexiones seguras y cifradas.
- Aplicamos medidas estándar de seguridad para proteger tu información.

Más información legal:
Términos y Condiciones:
https://dinvox-webapp.vercel.app/legal#terminos

Política de Privacidad:
https://dinvox-webapp.vercel.app/legal#privacidad
  `,
},

{
  id: "configuracion-cuenta",
  title: "Configuración de la cuenta",
  body: `
En la sección de Configuración puedes ver y gestionar información básica de tu cuenta.

Actualmente puedes:
- Ver tus datos de cuenta (nombre, correo, idioma y moneda).
- Solicitar la eliminación de tu cuenta.

La opción de eliminar cuenta está pensada para darte control total sobre tu información.

Más adelante, esta sección incluirá nuevas opciones relacionadas con preferencias y ajustes del servicio.
  `,
},


];

