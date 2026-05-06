/**
 * Servicio de integración con MIT Webpay PLUS.
 * Implementa el flujo completo de generación de liga de cobro.
 *
 * Flujo:
 *   1. Armar XML con datos del cobro
 *   2. Cifrar XML con AES-128
 *   3. Armar petición POST con data0 + xml cifrado
 *   4. Enviar POST a MIT (URL QA o Producción)
 *   5. Descifrar respuesta
 *   6. Parsear XML de respuesta y extraer liga de pago (nb_url)
 */

const axios = require('axios');
const { cifrarAES, descifrarAES } = require('../utils/aes.util');
const { config } = require('../config');

/**
 * Arma el XML de petición siguiendo la especificación de MIT.
 * Tags obligatorios según la Guía de Desarrollo WPP v2.1:
 *   - reference: único por transacción (alfanumérico, max 50)
 *   - amount: decimal con 2 decimales separados por punto (ej: "1.00")
 *   - moneda: "MXN" o "USD"
 *   - canal: siempre "W"
 *   - omitir_notif_default: "0" envía notif al tarjetahabiente, "1" no envía
 *   - version: siempre "IntegraWPP"
 */
function armarXML({ reference, amount, moneda = 'MXN', omitir_notif_default = '0' }) {
    const { idCompany, idBranch, mitUser, mitPwd } = config.mit;

    return `<?xml version="1.0" encoding="UTF-8"?><P><business><id_company>${idCompany}</id_company><id_branch>${idBranch}</id_branch><user>${mitUser}</user><pwd>${mitPwd}</pwd></business><url><reference>${reference}</reference><amount>${amount}</amount><moneda>${moneda}</moneda><canal>W</canal><omitir_notif_default>${omitir_notif_default}</omitir_notif_default><version>IntegraWPP</version></url></P>`;
}

/**
 * Parsea el XML de respuesta de MIT de forma simple con regex.
 * No se usa xml2js para no agregar dependencias.
 * @param {string} xmlString - XML descifrado de respuesta MIT
 * @returns {object} Objeto con las propiedades cd_response, nb_response, nb_url, nb_error
 */
function parsearXMLRespuesta(xmlString) {
    const extraer = (tag) => {
        const match = xmlString.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
        return match ? match[1].trim() : '';
    };
    return {
        cd_response: extraer('cd_response'),
        nb_response: extraer('nb_response'),
        nb_url: extraer('nb_url'),
        nb_error: extraer('nb_error'),
    };
}

/**
 * Parsea el XML de la respuesta de cobro (webhook) de MIT.
 * Guarda los tags SUGERIDOS por MIT: id_url, reference, foliocpagos, amount, cc_mask, auth.
 * @param {string} xmlString - XML descifrado del webhook
 * @returns {object} Datos de la transacción
 */
function parsearXMLCobro(xmlString) {
    const extraer = (tag) => {
        const match = xmlString.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
        return match ? match[1].trim() : '';
    };
    return {
        // Tags SUGERIDOS por MIT (necesarios para aclaraciones/contracargos)
        id_url: extraer('id_url'),
        reference: extraer('reference'),
        foliocpagos: extraer('foliocpagos'),
        amount: extraer('amount'),
        cc_mask: extraer('cc_mask'),
        auth: extraer('auth'),
        // Tags adicionales útiles
        response: extraer('response'),       // "approved" | "denied"
        nb_error: extraer('nb_error'),
        cd_response: extraer('cd_response'),
        time: extraer('time'),
        date: extraer('date'),
        nb_company: extraer('nb_company'),
        cc_type: extraer('cc_type'),
        email: extraer('email'),
    };
}

/**
 * Genera una liga de cobro en MIT Webpay PLUS.
 *
 * @param {object} datosCobro
 * @param {string} datosCobro.reference - Referencia única de la transacción (ej: "FACTURA-001")
 * @param {string} datosCobro.amount - Monto con 2 decimales (ej: "1.00")
 * @param {string} [datosCobro.moneda] - "MXN" (default) o "USD"
 * @param {string} [datosCobro.omitir_notif_default] - "0" notifica al cliente, "1" no notifica
 * @returns {Promise<object>} { ok, nb_url, cd_response, nb_response, nb_error }
 */
async function generarLiga(datosCobro) {
    const { aesKey, data0, urlQa, urlProd } = config.mit;

    // Seleccionar URL según ambiente
    const url = config.nodeEnv === 'production' ? urlProd : urlQa;

    // Paso 1: Armar XML
    const xml = armarXML(datosCobro);

    // Paso 2: Cifrar XML con AES-128
    const xmlCifrado = cifrarAES(xml, aesKey);

    // Paso 3: Armar cuerpo de petición POST
    // Estructura: xml=<pgs><data0>DATA0</data0><data>CADENA_CIFRADA</data></pgs>
    const xmlPeticion = `<pgs><data0>${data0}</data0><data>${xmlCifrado}</data></pgs>`;
    const body = `xml=${encodeURIComponent(xmlPeticion)}`;

    // Paso 4: Enviar POST a MIT
    const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
    });

    // Paso 5: Descifrar respuesta
    // La respuesta llega como string cifrado en Base64
    const respuestaCifrada = response.data;
    console.log('respuestaCifrada', respuestaCifrada);
    const respuestaXML = descifrarAES(respuestaCifrada, aesKey);

    // Paso 6: Parsear XML de respuesta
    const resultado = parsearXMLRespuesta(respuestaXML);
    console.log('resultado', resultado);

    return {
        ok: resultado.cd_response === 'success',
        nb_url: resultado.nb_url,
        cd_response: resultado.cd_response,
        nb_response: resultado.nb_response,
        nb_error: resultado.nb_error,
        xml_respuesta: respuestaXML, // útil en desarrollo para debug
    };
}

/**
 * Procesa la notificación de resultado de cobro recibida en el webhook.
 * MIT envía el resultado cifrado en el campo "strResponse" del body POST.
 *
 * IMPORTANTE:
 *   - MIT puede enviar el strResponse con URL encoding (%2B, %3D, %2F, etc.)
 *   - El URL decode se hace DENTRO de descifrarAES automáticamente
 *   - El webhook SIEMPRE debe responder HTTP 200, aunque haya error interno
 *   - MIT reintentará si no recibe 200 en menos de 10 segundos
 *
 * @param {string} strResponse - El valor del campo strResponse del POST de MIT
 * @returns {object} Datos de la transacción descifrados
 */
function procesarWebhook(strResponse) {
    const { aesKey } = config.mit;

    if (!strResponse) {
        throw new Error('strResponse vacío o no recibido');
    }

    // Descifrar (incluye URL decode automático si viene con %2B, etc.)
    const xmlCobro = descifrarAES(strResponse, aesKey);

    // Parsear y retornar los datos del cobro
    return parsearXMLCobro(xmlCobro);
}

module.exports = { generarLiga, procesarWebhook };
