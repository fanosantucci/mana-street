module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { items, transferOnly } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Carrito vacío' });
  }

  const mpItems = items.map(item => {
    const precio = parseInt(item.price.replace(/[^0-9]/g, '')) || 1000;
    return {
      id: item.cartId || item.name,
      title: item.name + (item.color ? ` - ${item.color}` : '') + (item.size ? ` Talle ${item.size}` : ''),
      quantity: item.qty,
      unit_price: precio,
      currency_id: 'ARS',
    };
  });

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: mpItems,
        back_urls: {
          success: `${process.env.SITE_URL}/gracias.html`,
          failure: `${process.env.SITE_URL}/#catalogo`,
          pending: `${process.env.SITE_URL}/#catalogo`,
        },
        auto_return: 'approved',
        statement_descriptor: 'MANA STREET',
        payment_methods: transferOnly
          ? {
              excluded_payment_types: [
                { id: 'credit_card' },
                { id: 'debit_card' },
                { id: 'prepaid_card' },
                { id: 'ticket' },
              ],
              installments: 1,
            }
          : {
              installments: 3,
            },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Mercado Pago:', data);
      return res.status(500).json({ error: 'Error al crear la preferencia', detalle: data });
    }

    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      preference_id: data.id,
    });

  } catch (err) {
    console.error('Error servidor:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
