const { generarLiga, procesarWebhook } = require('../services/payment.service');

/**
 * POST /api/payment/generar-liga
 * Body JSON: { reference, amount, moneda?, omitir_notif_default? }
 *
 * Genera una liga de cobro en MIT Webpay PLUS.
 */
async function generarLigaController(req, res) {
    try {
        const { reference, amount, moneda, omitir_notif_default } = req.body;

        // Validaciones básicas
        if (!reference || !amount) {
            return res.status(400).json({
                ok: false,
                error: 'Faltan campos obligatorios: reference, amount',
            });
        }

        // Validar formato del amount (decimal con hasta 2 decimales, sin comas)
        const amountRegex = /^\d+(\.\d{1,2})?$/;
        if (!amountRegex.test(amount)) {
            return res.status(400).json({
                ok: false,
                error: 'El campo amount debe ser decimal con punto (ej: "1.00"). Sin comas ni signos.',
            });
        }

        const resultado = await generarLiga({ reference, amount, moneda, omitir_notif_default });

        if (!resultado.ok) {
            return res.status(422).json({
                ok: false,
                error: 'MIT rechazó la petición',
                cd_response: resultado.cd_response,
                nb_response: resultado.nb_response,
                nb_error: resultado.nb_error,
            });
        }

        return res.status(200).json({
            ok: true,
            nb_url: resultado.nb_url,
            reference,
        });

    } catch (error) {
        console.error('[payment.controller] Error generando liga:', error.message);
        return res.status(500).json({
            ok: false,
            error: 'Error interno al generar liga de pago',
        });
    }
}

/**
 * POST /api/payment/webhook
 * Body urlencoded: strResponse=CADENA_CIFRADA
 *
 * Recibe la notificación de resultado de cobro de MIT.
 *
 * REGLAS CRÍTICAS para certificación:
 *   1. SIEMPRE responder HTTP 200 (aunque haya error interno)
 *   2. Responder en menos de 10 segundos
 *   3. MIT reintentará si no recibe 200
 */
async function webhookController(req, res) {
    try {
        const strResponse = req.body.strResponse;

        const datosCobro = procesarWebhook(strResponse);

        // LOG del resultado (aquí se guardaría en BD si el proyecto tuviera)
        console.log('[webhook] Cobro recibido:', {
            reference: datosCobro.reference,
            response: datosCobro.response,     // "approved" | "denied"
            amount: datosCobro.amount,
            foliocpagos: datosCobro.foliocpagos,
            auth: datosCobro.auth,
            cc_mask: datosCobro.cc_mask,
            id_url: datosCobro.id_url,
        });

        // TODO: Aquí guardar en BD los datos del cobro
        // Los tags MÍNIMOS que MIT exige guardar son:
        //   id_url, reference, foliocpagos, amount, cc_mask, auth
        // (Necesarios para aclaraciones y contracargos)

        return res.status(200).send('OK');

    } catch (error) {
        console.error('[payment.controller] Error en webhook:', error.message);
        // CRÍTICO: aunque haya error, siempre responder 200
        return res.status(200).send('OK');
    }
}

module.exports = { generarLigaController, webhookController };
