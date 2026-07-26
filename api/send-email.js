import { Resend } from 'resend';

// Vercel Environment Variable RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, orderId, nomClient, total, articles } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const articleList = articles ? articles.map(a => `<li>${Object.keys(a)[0]} : ${Object.values(a)[0]} FCFA</li>`).join('') : '';

        // Note : L'adresse email d'expédition (ex: commandes@votre-domaine.com) doit être vérifiée sur Resend
        const data = await resend.emails.send({
            from: 'Barishop <onboarding@resend.dev>', // Utilisez onboarding@resend.dev pour les tests, ou votre domaine vérifié
            to: email,
            subject: `Confirmation de commande #${orderId} - Barishop`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h1 style="color: #6b21a8; text-align: center;">Merci pour votre commande !</h1>
                    <p>Bonjour ${nomClient || 'Client'},</p>
                    <p>Votre commande <strong>#${orderId}</strong> a bien été confirmée et est en cours de préparation.</p>
                    
                    <div style="background-color: #f8f5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Détails de la commande</h3>
                        <ul>
                            ${articleList}
                        </ul>
                        <p style="font-size: 1.2em; font-weight: bold;">Total : ${total} FCFA</p>
                    </div>

                    <p>Vous recevrez un nouvel e-mail lors de l'expédition de votre colis.</p>
                    <br/>
                    <p>L'équipe <strong>Barishop</strong></p>
                </div>
            `
        });

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
