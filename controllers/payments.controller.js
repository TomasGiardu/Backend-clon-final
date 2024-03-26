import express from 'express';
import PaymentService from '../services/payment.services';

const router = express.Router();
const paymentService = new PaymentService();

// Ruta para crear un nuevo pago
router.post('/payments', async (req, res) => {
    try {
        const { amount, currency, description, payment_method } = req.body;

        // Crear el pago utilizando el servicio de pagos
        const paymentIntent = await paymentService.createPayment({
            amount,
            currency,
            description,
            payment_method
        });

        // Enviar la respuesta al cliente
        res.status(200).json({ paymentIntent });
    } catch (error) {
        console.error('Error al procesar el pago:', error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
});

export default router;

