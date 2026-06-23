const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { cliente, productos, subtotal, envio, total, metodo } = req.body;
  if (!cliente?.email) return res.status(400).json({ error: 'Email requerido' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const productosHTML = (productos || []).map(p => {
    const variant = [p.color, p.talle].filter(Boolean).join(' · ');
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:14px;color:#f0ebe0;">
          <strong>${p.nombre}</strong>${variant ? ` <span style="color:#777;">(${variant})</span>` : ''}&nbsp;&nbsp;<span style="color:#555;">×${p.qty}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:14px;color:#1AAECD;text-align:right;white-space:nowrap;">
          ${p.precio}
        </td>
      </tr>`;
  }).join('');

  const fmt = n => '$' + Number(n).toLocaleString('es-AR');

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:Arial,Helvetica,sans-serif;color:#f0ebe0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:#0d0d0d;padding:36px 40px 30px;text-align:center;border-bottom:3px solid #1AAECD;">
      <p style="margin:0;font-size:30px;font-weight:900;letter-spacing:7px;text-transform:uppercase;color:#f0ebe0;">MANA STREET</p>
      <p style="margin:8px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#1AAECD;">La Plata · Buenos Aires</p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#0d0d0d;padding:36px 40px;">

      <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f0ebe0;">¡Gracias por tu compra, ${cliente.nombre}! 🙌</p>
      <p style="margin:0 0 30px;font-size:14px;color:#888;line-height:1.65;">Recibimos tu pedido y ya lo estamos preparando con todo el amor. Te avisamos cuando esté en camino.</p>

      <!-- PRODUCTOS -->
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555;">Tu pedido</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
        ${productosHTML}
      </table>

      <!-- TOTALES -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:10px;padding:18px 20px;margin-bottom:28px;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#666;">Subtotal productos</td>
          <td style="padding:4px 0;font-size:13px;color:#666;text-align:right;">${fmt(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#666;">Envío estimado 📦</td>
          <td style="padding:4px 0;font-size:13px;color:#666;text-align:right;">${fmt(envio)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:0;"><div style="height:1px;background:#222;margin:12px 0;"></div></td>
        </tr>
        <tr>
          <td style="font-size:15px;font-weight:700;color:#f0ebe0;">Total (${metodo})</td>
          <td style="font-size:20px;font-weight:700;color:#1AAECD;text-align:right;">${fmt(total)}</td>
        </tr>
      </table>

      <!-- DIRECCIÓN -->
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555;">Dirección de envío</p>
      <p style="margin:0 0 30px;font-size:14px;color:#f0ebe0;line-height:1.7;">
        ${cliente.direccion}<br>
        ${cliente.localidad}, ${cliente.provincia} (CP ${cliente.cp})<br>
        <span style="color:#888;">Tel: ${cliente.tel}</span>
      </p>

      <!-- WHATSAPP -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#25D366;border-radius:8px;">
            <a href="https://wa.me/5492213080753" style="display:inline-block;padding:13px 26px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff;text-decoration:none;">💬 Contactanos por WhatsApp</a>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:12px;color:#555;line-height:1.6;">¿Tenés alguna duda? Respondé este mail o escribinos por WhatsApp y te ayudamos enseguida.</p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#080808;padding:22px 40px;text-align:center;border-top:1px solid #1a1a1a;">
      <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;">© 2025 Mana Street · La Plata, Buenos Aires</p>
      <p style="margin:8px 0 0;font-size:12px;">
        <a href="https://instagram.com/manastreet.ind" style="color:#1AAECD;text-decoration:none;">@manastreet.ind</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"Mana Street" <${process.env.GMAIL_USER}>`,
      to: cliente.email,
      subject: `¡Gracias por tu compra en Mana Street, ${cliente.nombre}! 🙌`,
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error enviando email:', err);
    return res.status(500).json({ error: 'No se pudo enviar el email' });
  }
};
