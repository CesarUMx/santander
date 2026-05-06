const express = require('express');
const router = express.Router();
const { generarLigaController, webhookController } = require('../controllers/payment.controller');

// POST /api/payment/generar-liga
// Genera una liga de cobro en MIT Webpay PLUS
router.post('/payment/generar-liga', generarLigaController);

// POST /api/payment/webhook
// Recibe la notificación de resultado de cobro de MIT
// URL pública requerida — MIT la configura como notificador
router.post('/payment/webhook', webhookController);

module.exports = router;
