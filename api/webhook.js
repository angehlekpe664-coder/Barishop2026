import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        console.log('Webhook received:', payload);

        // Ajuster cette logique de vérification en fonction de la documentation exacte de Fusion Pay
        let orderId = null;
        let isSuccess = false;

        const statusStr = (payload.status || '').toString().toLowerCase();
        if (payload.statut === true || statusStr === 'success' || statusStr === 'successful') {
            isSuccess = true;
        }

        // Récupérer l'ID de commande si renvoyé
        if (payload.personal_Info && payload.personal_Info.length > 0) {
            orderId = payload.personal_Info[0].orderId;
        } else if (payload.payment_ref) {
            orderId = payload.payment_ref;
        } else if (payload.reference) {
            orderId = payload.reference;
        }

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID not found in payload' });
        }

        if (isSuccess && db) {
            // Mettre à jour la commande dans Firestore
            const orderRef = db.collection('orders').doc(orderId.toString());
            const orderDoc = await orderRef.get();
            
            if (orderDoc.exists) {
                const orderData = orderDoc.data();
                
                await orderRef.update({
                    status: 'Payé',
                    paymentDetails: payload,
                    updatedAt: new Date().toISOString()
                });
                console.log(`Commande ${orderId} mise à jour en 'Payé'`);

                // ENVOYER L'EMAIL DE CONFIRMATION
                try {
                    // Note: Import Resend or use a helper
                    const { Resend } = await import('resend');
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    
                    // On essaie de trouver l'email dans les données de la commande
                    const customerEmail = orderData.email || (orderData.personal_Info && orderData.personal_Info[0].email);
                    
                    if (customerEmail && process.env.RESEND_API_KEY) {
                        await resend.emails.send({
                            from: 'Barishop <onboarding@resend.dev>',
                            to: customerEmail,
                            subject: `Paiement Confirmé - Commande #${orderId}`,
                            html: `<h1>Merci pour votre achat !</h1><p>Votre paiement pour la commande #${orderId} a été confirmé. Nous préparons votre colis.</p>`
                        });
                    }
                } catch (emailError) {
                    console.error('Failed to send confirmation email:', emailError);
                }
            }
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
