import Stripe from "stripe";

class PaymentService {
    constructor() {
        this.stripe = new Stripe(API_KEY_STRIPE);

    }

    async createPayment(data){
        return await this.stripe.paymentIntents.create(data);
    }
}

export default PaymentService;