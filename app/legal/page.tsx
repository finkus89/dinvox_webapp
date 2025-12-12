// webapp/src/app/legal/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal | Dinvox",
  description: "Términos y Condiciones y Política de Privacidad de Dinvox.",
};

const LAST_UPDATED = "12 de diciembre de 2025";
const CONTACT_EMAIL = "contacto@dinvox.app";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            Legal – Dinvox
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Última actualización: <span className="font-medium">{LAST_UPDATED}</span>
          </p>

          <nav className="mt-6 flex gap-3 text-sm">
            <a
              href="#terminos"
              className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
            >
              Términos y Condiciones
            </a>
            <a
              href="#privacidad"
              className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
            >
              Política de Privacidad
            </a>
          </nav>
        </header>

        {/* =========================
            TÉRMINOS Y CONDICIONES
           ========================= */}
        <section id="terminos" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">
            Términos y Condiciones – Dinvox
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Última actualización: <span className="font-medium">{LAST_UPDATED}</span>
          </p>

          <div className="mt-8 space-y-8 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold">1. Aceptación de los términos</h3>
              <p className="mt-2">
                Al crear una cuenta y utilizar Dinvox, aceptas estos Términos y
                Condiciones. Si no estás de acuerdo con alguno de ellos, no debes
                usar el servicio.
              </p>
              <p className="mt-2">
                El uso continuo de la plataforma implica la aceptación de cualquier
                actualización posterior de estos términos.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">2. Qué es Dinvox</h3>
              <p className="mt-2">
                Dinvox es una herramienta digital que permite a los usuarios{" "}
                <strong>registrar y visualizar gastos personales</strong>, principalmente
                mediante texto o voz a través de Telegram (y en el futuro otros canales
                como WhatsApp), con una interfaz web de apoyo.
              </p>
              <p className="mt-2">
                Dinvox <strong>no es un software contable</strong>, no reemplaza asesoría
                financiera, contable o legal profesional, y no garantiza resultados
                financieros específicos.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">3. Registro y cuenta de usuario</h3>
              <p className="mt-2">Para usar Dinvox debes:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Crear una cuenta con correo electrónico y contraseña.</li>
                <li>Confirmar tu correo electrónico.</li>
                <li>Vincular tu cuenta con Telegram mediante un <code>chat_id</code>.</li>
              </ul>
              <p className="mt-3">Eres responsable de:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Mantener la confidencialidad de tus credenciales.</li>
                <li>Toda actividad realizada desde tu cuenta.</li>
              </ul>
              <p className="mt-3">
                Dinvox no se hace responsable por accesos no autorizados derivados de
                negligencia del usuario.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">4. Uso permitido</h3>
              <p className="mt-2">El usuario puede utilizar Dinvox únicamente para fines personales y legales, incluyendo:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Registrar gastos propios.</li>
                <li>Consultar resúmenes, gráficos y listados.</li>
                <li>Editar o eliminar sus propios registros.</li>
              </ul>
              <p className="mt-3">Queda prohibido:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Intentar acceder a datos de otros usuarios.</li>
                <li>Usar el servicio con fines ilegales, abusivos o fraudulentos.</li>
                <li>Interferir con el funcionamiento normal de la plataforma.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">5. Comunicaciones funcionales</h3>
              <p className="mt-2">
                Al aceptar estos términos, el usuario autoriza a Dinvox a enviar{" "}
                <strong>comunicaciones funcionales necesarias para la operación del servicio</strong>,
                tales como confirmaciones de acciones, mensajes de soporte, y avisos técnicos u operativos.
              </p>
              <p className="mt-2">Estas comunicaciones pueden realizarse por:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Telegram</li>
                <li>WhatsApp (cuando esté disponible)</li>
                <li>Correo electrónico</li>
              </ul>
              <p className="mt-3">
                Estas comunicaciones <strong>no son marketing</strong> y no requieren consentimiento adicional.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">6. Comunicaciones promocionales y marketing</h3>
              <p className="mt-2">
                Al aceptar estos Términos y Condiciones, el usuario autoriza a Dinvox a enviar
                comunicaciones promocionales, informativas o de marketing{" "}
                <strong>únicamente por correo electrónico</strong>.
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Dinvox <strong>no enviará marketing por Telegram ni WhatsApp</strong>.</li>
                <li>
                  Estas comunicaciones pueden incluir novedades del producto, mejoras, avisos comerciales
                  u ofertas relacionadas con Dinvox.
                </li>
                <li>
                  El usuario podrá retirar este consentimiento en cualquier momento mediante el enlace incluido
                  en los correos o desde la configuración de su cuenta.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">7. Disponibilidad, errores e interrupciones</h3>
              <p className="mt-2">
                Dinvox se ofrece <strong>“tal como está” y “según disponibilidad”</strong>.
              </p>
              <p className="mt-2">No se garantiza que el servicio:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Sea ininterrumpido.</li>
                <li>Esté libre de errores.</li>
                <li>Funcione sin fallos técnicos, pérdidas de información o demoras.</li>
              </ul>
              <p className="mt-3">
                Dinvox podrá realizar mantenimientos, cambios técnicos o suspensiones temporales sin previo aviso.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">8. Propiedad intelectual</h3>
              <p className="mt-2">
                Todo el contenido relacionado con Dinvox, incluyendo pero no limitado a: nombre del producto,
                marca, diseño visual, interfaz, código fuente y estructura del software, es propiedad exclusiva
                de <strong>Dinvox</strong> o de la entidad legal que lo opere en el futuro.
              </p>
              <p className="mt-2">
                El uso del servicio <strong>no otorga ningún derecho</strong> sobre la propiedad intelectual del producto.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">9. Eliminación de cuenta</h3>
              <p className="mt-2">
                El usuario podrá solicitar la eliminación de su cuenta y datos personales. Este proceso se habilitará
                desde la plataforma o mediante contacto directo.
              </p>
              <p className="mt-2">
                Al eliminar la cuenta, se perderá el acceso al servicio y los datos asociados podrán ser eliminados o
                anonimizados según políticas internas y obligaciones legales.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">10. Limitación de responsabilidad</h3>
              <p className="mt-2">
                Dinvox no será responsable por decisiones financieras tomadas por el usuario, pérdidas económicas directas
                o indirectas, ni errores derivados de interpretaciones automáticas de texto o voz.
              </p>
              <p className="mt-2">El usuario utiliza el servicio bajo su propia responsabilidad.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">11. Contacto</h3>
              <p className="mt-2">
                Para soporte o consultas:{" "}
                <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="my-12 border-slate-200" />

        {/* =========================
            POLÍTICA DE PRIVACIDAD
           ========================= */}
        <section id="privacidad" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">
            Política de Privacidad – Dinvox
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Última actualización: <span className="font-medium">{LAST_UPDATED}</span>
          </p>

          <div className="mt-8 space-y-8 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold">1. Datos que recopilamos</h3>

              <h4 className="mt-3 font-semibold">Datos de cuenta</h4>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Nombre</li>
                <li>Correo electrónico</li>
                <li>Número de teléfono</li>
                <li><code>chat_id</code> de Telegram</li>
                <li>Idioma, moneda y zona horaria</li>
              </ul>

              <h4 className="mt-4 font-semibold">Datos de uso</h4>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Gastos registrados</li>
                <li>Fechas</li>
                <li>Categorías</li>
                <li>Notas asociadas</li>
              </ul>

              <h4 className="mt-4 font-semibold">Datos técnicos y estadísticos</h4>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Frecuencia de uso</li>
                <li>Cantidad de registros</li>
                <li>Información agregada para análisis y mejora del producto</li>
              </ul>

              <p className="mt-3 text-slate-700">
                Estos datos se usan de forma interna y <strong>no identifican públicamente al usuario</strong>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">2. Uso de los datos</h3>
              <p className="mt-2">Los datos se utilizan para:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Operar el servicio correctamente.</li>
                <li>Mostrar información y resúmenes al usuario.</li>
                <li>Mejorar funcionalidades y experiencia.</li>
                <li>Soporte y auditoría interna.</li>
              </ul>
              <p className="mt-3">
                Dinvox <strong>no vende ni alquila datos personales</strong>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">3. Uso de inteligencia artificial</h3>
              <p className="mt-2">
                Dinvox utiliza inteligencia artificial <strong>únicamente para interpretar mensajes de texto o voz</strong>{" "}
                y transformarlos en registros estructurados.
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>La IA no toma decisiones financieras por el usuario.</li>
                <li>No genera perfiles publicitarios.</li>
                <li>No analiza historiales completos con fines externos.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">4. Comunicaciones</h3>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><strong>Funcionales:</strong> Telegram, WhatsApp y correo electrónico.</li>
                <li><strong>Promocionales:</strong> solo correo electrónico y solo con consentimiento explícito.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">5. Almacenamiento y seguridad</h3>
              <p className="mt-2">
                Los datos se almacenan en proveedores seguros (por ejemplo Supabase). Se aplican políticas de control
                de acceso y medidas razonables de seguridad.
              </p>
              <p className="mt-2">
                Aun así, ningún sistema puede garantizar seguridad absoluta.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">6. Derechos del usuario</h3>
              <p className="mt-2">El usuario puede:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Acceder a sus datos.</li>
                <li>Editarlos o eliminarlos.</li>
                <li>Solicitar la eliminación de su cuenta.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">7. Compartición de datos</h3>
              <p className="mt-2">
                Los datos no se comparten con terceros, salvo:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Proveedores técnicos necesarios para operar el servicio.</li>
                <li>Requerimientos legales.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">8. Cambios en esta política</h3>
              <p className="mt-2">
                Dinvox podrá actualizar esta política. Los cambios relevantes se comunicarán por los canales habituales.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">9. Contacto</h3>
              <p className="mt-2">
                <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-14 text-xs text-slate-500">
          © {new Date().getFullYear()} Dinvox. Todos los derechos reservados.
        </footer>
      </div>
    </main>
  );
}
