/* ==========================================================
   HERRAMIENTAS360
   Calculadora de Calorías
   SCRIPT.JS
   Motor principal de cálculo
   Versión 1.0
   © 2026 José Carlos Núñez Florido
========================================================== */

"use strict";


/* ==========================================================
   ELEMENTOS DEL DOM
========================================================== */

const formulario = $("#formulario");

const campoSexo = $("#sexo");
const campoEdad = $("#edad");
const campoPeso = $("#peso");
const campoAltura = $("#altura");
const campoActividad = $("#actividad");
const campoObjetivo = $("#objetivo");

const botonCalcular =
    formulario?.querySelector('button[type="submit"]') ?? null;


/* ==========================================================
   ESTADO DE LA APLICACIÓN
========================================================== */

let calculando = false;
let ultimoResultado = null;


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

document.addEventListener("DOMContentLoaded", iniciarAplicacion);


/**
 * Prepara los eventos principales de la calculadora.
 */
function iniciarAplicacion() {

    if (!formulario) {

        console.error(
            "Herramientas360: no se ha encontrado el formulario con id='formulario'."
        );

        return;

    }

    formulario.addEventListener("submit", gestionarCalculo);

    formulario.addEventListener("reset", gestionarReinicio);

    actualizarAnioFooter();

}


/* ==========================================================
   GESTIÓN DEL FORMULARIO
========================================================== */

/**
 * Gestiona el envío del formulario.
 *
 * @param {SubmitEvent} evento
 */
async function gestionarCalculo(evento) {

    evento.preventDefault();

    if (calculando) return;

    ocultarResultadosAnteriores();

    const datos = obtenerDatosFormulario();

    const validacion = validarDatosFormulario(datos);

    if (!validacion.valido) {

        mostrarError(validacion.mensaje);

        enfocarCampo(validacion.campo);

        return;

    }

    try {

        establecerEstadoCalculando(true);

        await ejecutarAnimacionCalculo();

        const resultado = calcularResultadoCompleto(datos);

        ultimoResultado = resultado;

        mostrarResultados(resultado);

    } catch (error) {

        console.error(
            "Herramientas360: se ha producido un error durante el cálculo.",
            error
        );

        mostrarError(
            "No se ha podido completar el cálculo. Revisa los datos e inténtalo de nuevo."
        );

    } finally {

        establecerEstadoCalculando(false);

    }

}


/**
 * Gestiona el reinicio nativo del formulario.
 */
function gestionarReinicio() {

    ultimoResultado = null;

    window.setTimeout(() => {

        ocultarResultadosAnteriores();

        limpiarEstadoCalculo();

        campoSexo?.focus();

    }, 0);

}


/* ==========================================================
   OBTENCIÓN DE DATOS
========================================================== */

/**
 * Obtiene y normaliza los datos introducidos.
 *
 * @returns {{
 *   sexo: string,
 *   edad: number,
 *   peso: number,
 *   altura: number,
 *   actividad: string,
 *   objetivo: string
 * }}
 */
function obtenerDatosFormulario() {

    return {

        sexo: normalizarTexto(campoSexo?.value),

        edad: numero(campoEdad?.value),

        peso: numero(campoPeso?.value),

        altura: numero(campoAltura?.value),

        actividad: normalizarClaveActividad(
            campoActividad?.value
        ),

        objetivo: normalizarTexto(
            campoObjetivo?.value
        )

    };

}


/**
 * Normaliza un valor de texto.
 *
 * @param {string} valor
 * @returns {string}
 */
function normalizarTexto(valor) {

    return String(valor ?? "").trim();

}


/**
 * Admite algunas variantes habituales para los niveles de actividad.
 *
 * @param {string} valor
 * @returns {string}
 */
function normalizarClaveActividad(valor) {

    const clave = normalizarTexto(valor);

    const equivalencias = {

        "sedentario": "sedentario",

        "ligero": "ligero",
        "actividad-ligera": "ligero",

        "moderado": "moderado",
        "actividad-moderada": "moderado",

        "intenso": "intenso",
        "actividad-intensa": "intenso",

        "muy-intenso": "muyIntenso",
        "muy_intenso": "muyIntenso",
        "muyIntenso": "muyIntenso"

    };

    return equivalencias[clave] ?? clave;

}


/* ==========================================================
   VALIDACIÓN
========================================================== */

/**
 * Valida todos los datos necesarios.
 *
 * @param {Object} datos
 * @returns {{
 *   valido: boolean,
 *   mensaje: string,
 *   campo: HTMLElement|null
 * }}
 */
function validarDatosFormulario(datos) {

    if (!datos.sexo) {

        return crearErrorValidacion(
            "Selecciona tu sexo.",
            campoSexo
        );

    }

    if (!["hombre", "mujer"].includes(datos.sexo)) {

        return crearErrorValidacion(
            "Selecciona una opción válida en el campo sexo.",
            campoSexo
        );

    }

    if (!Number.isFinite(datos.edad)) {

        return crearErrorValidacion(
            "Introduce una edad válida.",
            campoEdad
        );

    }

    if (
        !dentroDeRango(
            datos.edad,
            LIMITES.edad.min,
            LIMITES.edad.max
        )
    ) {

        return crearErrorValidacion(
            MENSAJES.errorEdad,
            campoEdad
        );

    }

    if (!Number.isFinite(datos.peso)) {

        return crearErrorValidacion(
            "Introduce un peso válido.",
            campoPeso
        );

    }

    if (
        !dentroDeRango(
            datos.peso,
            LIMITES.peso.min,
            LIMITES.peso.max
        )
    ) {

        return crearErrorValidacion(
            MENSAJES.errorPeso,
            campoPeso
        );

    }

    if (!Number.isFinite(datos.altura)) {

        return crearErrorValidacion(
            "Introduce una altura válida.",
            campoAltura
        );

    }

    if (
        !dentroDeRango(
            datos.altura,
            LIMITES.altura.min,
            LIMITES.altura.max
        )
    ) {

        return crearErrorValidacion(
            MENSAJES.errorAltura,
            campoAltura
        );

    }

    if (
        !datos.actividad ||
        !Object.hasOwn(ACTIVIDAD, datos.actividad)
    ) {

        return crearErrorValidacion(
            "Selecciona un nivel de actividad válido.",
            campoActividad
        );

    }

    if (
        !datos.objetivo ||
        !Object.hasOwn(OBJETIVOS, datos.objetivo)
    ) {

        return crearErrorValidacion(
            "Selecciona un objetivo válido.",
            campoObjetivo
        );

    }

    return {

        valido: true,

        mensaje: "",

        campo: null

    };

}


/**
 * Crea una respuesta de validación fallida.
 *
 * @param {string} mensaje
 * @param {HTMLElement|null} campo
 * @returns {Object}
 */
function crearErrorValidacion(mensaje, campo = null) {

    return {

        valido: false,

        mensaje,

        campo

    };

}


/**
 * Coloca el foco en el campo incorrecto.
 *
 * @param {HTMLElement|null} campo
 */
function enfocarCampo(campo) {

    if (!campo) return;

    campo.focus();

}


/* ==========================================================
   MOTOR DE CÁLCULO
========================================================== */

/**
 * Ejecuta todos los cálculos y prepara el objeto que recibe results.js.
 *
 * @param {Object} datos
 * @returns {Object}
 */
function calcularResultadoCompleto(datos) {

    const tmb = calcularTMB(datos);

    const factorActividad =
        ACTIVIDAD[datos.actividad].factor;

    const tdee = calcularTDEE(
        tmb,
        factorActividad
    );

    const caloriasPerder = aplicarAjuste(
        tdee,
        OBJETIVOS.perder.ajuste
    );

    const caloriasMantener = aplicarAjuste(
        tdee,
        OBJETIVOS.mantener.ajuste
    );

    const caloriasGanar = aplicarAjuste(
        tdee,
        OBJETIVOS.ganar.ajuste
    );

    const caloriasObjetivo = obtenerCaloriasObjetivo(
        datos.objetivo,
        {
            perder: caloriasPerder,
            mantener: caloriasMantener,
            ganar: caloriasGanar
        }
    );

    const ajuste = OBJETIVOS[datos.objetivo].ajuste;

    const confianza = calcularConfianzaEstimacion(datos);

    return {

        sexo: datos.sexo,

        edad: datos.edad,

        peso: datos.peso,

        altura: datos.altura,

        actividad: datos.actividad,

        objetivo: datos.objetivo,

        formula: FORMULA.nombre,

        factorActividad,

        ajuste,

        tmb: redondear(tmb),

        tdee: redondear(tdee),

        calorias: redondear(caloriasObjetivo),

        caloriasPerder: redondear(caloriasPerder),

        caloriasMantener: redondear(caloriasMantener),

        caloriasGanar: redondear(caloriasGanar),

        confianza,

        fecha: new Date()

    };

}


/**
 * Calcula la Tasa Metabólica Basal mediante Mifflin-St Jeor.
 *
 * Hombre:
 * 10 × peso + 6,25 × altura − 5 × edad + 5
 *
 * Mujer:
 * 10 × peso + 6,25 × altura − 5 × edad − 161
 *
 * @param {Object} datos
 * @returns {number}
 */
function calcularTMB(datos) {

    const base =
        (10 * datos.peso) +
        (6.25 * datos.altura) -
        (5 * datos.edad);

    if (datos.sexo === "hombre") {

        return base + 5;

    }

    return base - 161;

}


/**
 * Calcula el gasto energético total diario.
 *
 * @param {number} tmb
 * @param {number} factorActividad
 * @returns {number}
 */
function calcularTDEE(tmb, factorActividad) {

    return tmb * factorActividad;

}


/**
 * Aplica un porcentaje de déficit o superávit.
 *
 * @param {number} caloriasBase
 * @param {number} ajuste
 * @returns {number}
 */
function aplicarAjuste(caloriasBase, ajuste) {

    return caloriasBase * (1 + ajuste);

}


/**
 * Selecciona las calorías correspondientes al objetivo.
 *
 * @param {string} objetivo
 * @param {Object} opciones
 * @returns {number}
 */
function obtenerCaloriasObjetivo(objetivo, opciones) {

    if (!Object.hasOwn(opciones, objetivo)) {

        return opciones.mantener;

    }

    return opciones[objetivo];

}


/* ==========================================================
   FIABILIDAD ORIENTATIVA
========================================================== */

/**
 * Calcula un nivel orientativo de confianza.
 *
 * No representa precisión clínica. Únicamente informa de que
 * el resultado procede de una fórmula estimativa.
 *
 * @param {Object} datos
 * @returns {{
 *   nivel: string,
 *   porcentaje: number
 * }}
 */
function calcularConfianzaEstimacion(datos) {

    let porcentaje = 84;

    if (
        datos.edad <= LIMITES.edad.min + 2 ||
        datos.edad >= LIMITES.edad.max - 5
    ) {

        porcentaje -= 5;

    }

    if (
        datos.peso <= LIMITES.peso.min + 5 ||
        datos.peso >= LIMITES.peso.max - 20
    ) {

        porcentaje -= 5;

    }

    if (
        datos.altura <= LIMITES.altura.min + 5 ||
        datos.altura >= LIMITES.altura.max - 5
    ) {

        porcentaje -= 4;

    }

    porcentaje = Math.max(
        65,
        Math.min(90, porcentaje)
    );

    let nivel = "Alta";

    if (porcentaje < 75) {

        nivel = "Orientativa";

    } else if (porcentaje < 82) {

        nivel = "Media";

    }

    return {

        nivel,

        porcentaje

    };

}


/* ==========================================================
   ANIMACIÓN DE CÁLCULO
========================================================== */

/**
 * Ejecuta la animación configurada en core.js.
 */
async function ejecutarAnimacionCalculo() {

    if (
        typeof animacionCalculo === "function"
    ) {

        await animacionCalculo();

    }

}


/**
 * Activa o desactiva el estado visual de cálculo.
 *
 * @param {boolean} activo
 */
function establecerEstadoCalculando(activo) {

    calculando = activo;

    if (!botonCalcular) return;

    botonCalcular.disabled = activo;

    botonCalcular.setAttribute(
        "aria-busy",
        String(activo)
    );

    if (activo) {

        botonCalcular.dataset.textoOriginal =
            botonCalcular.textContent.trim();

        botonCalcular.textContent =
            "Calculando...";

        return;

    }

    const textoOriginal =
        botonCalcular.dataset.textoOriginal;

    botonCalcular.textContent =
        textoOriginal || "Calcular calorías";

}


/**
 * Limpia el texto del proceso de cálculo.
 */
function limpiarEstadoCalculo() {

    const estadoCalculo = $("#estado-calculo");

    if (estadoCalculo) {

        estadoCalculo.textContent = "";

    }

}


/* ==========================================================
   RESULTADOS
========================================================== */

/**
 * Oculta la sección anterior antes de realizar un cálculo nuevo.
 */
function ocultarResultadosAnteriores() {

    const seccionResultados = $("#resultados");

    if (seccionResultados) {

        seccionResultados.hidden = true;

    }

}


/* ==========================================================
   PIE DE PÁGINA
========================================================== */

/**
 * Actualiza el año del footer si existe un elemento compatible.
 */
function actualizarAnioFooter() {

    const elementoAnio =
        $("#anio-actual") ||
        $("[data-current-year]");

    if (!elementoAnio) return;

    elementoAnio.textContent =
        obtenerAnioActual();

}