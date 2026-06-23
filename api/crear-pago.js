module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const {
    token,
    issuer_id,
    payment_method_id,
    installments,
    payer,
    transaction_amount,
    description,
  } = req.body;

  if (!token || !transaction_amount || !payment_method_id) {
    return res.status(400).json({ error: 'Datos de pago incompletos' });
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `${Date.now()}-${token}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(transaction_amount),
        token,
        description: description || 'Compra Mana Street',
        installments: Number(installments) || 1,
        payment_method_id,
        issuer_id,
        payer,
        statement_descriptor: 'MANA STREET',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error MP Payments:', data);
      return res.status(500).json({ error: 'Error al procesar el pago', detalle: data });
    }

    return res.status(200).json({
      status: data.status,
      status_detail: data.status_detail,
      id: data.id,
    });

  } catch (err) {
    console.error('Error servidor:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
