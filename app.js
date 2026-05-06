const express = require('express');
const cors = require('cors');

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

//principal

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API de Google Token + Academic',
        version: '1.0.0',
        endpoints: {
            'GET /health': 'Health check',
            'GET /api/student': 'Obtener info del estudiante'
        }
    });
});

// Rutas
const studentRoutes = require('./src/routes/student.routes');
app.use('/api', studentRoutes);

// Rutas de pago MIT Webpay PLUS
const paymentRoutes = require('./src/routes/payment.routes');
app.use('/api', paymentRoutes);

//ruta no encontrada 
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path
    });
});

//manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
});

module.exports = app;