function slugifyLabel(value, fallback = "bono") {
  const normalized = String(value || fallback)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function buildVoucherHtml(request) {
  const generatedAt = new Date().toLocaleString("es-ES");
  const recipient = request.recipientName || "Sin destinatario especificado";
  const businessName = request.businessName || "Negocio";
  const serviceTitle = request.serviceTitle || "Bono DonostiGo";
  const voucherCode = request.voucherCode || "PENDIENTE";
  const priceLabel = request.quotedPriceLabel || "Consultar con el negocio";
  const fulfillmentNote = request.fulfillmentNote || "El negocio te indicara los siguientes pasos.";
  const businessReply = request.businessReply || "Solicitud gestionada desde DonostiGo.";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${serviceTitle} · ${businessName}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #123b59;
        --muted: #5b7083;
        --accent: #0f766e;
        --paper: #f8fbfd;
        --line: rgba(18, 59, 89, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        font-family: Arial, sans-serif;
        background: linear-gradient(180deg, #ffffff 0%, var(--paper) 100%);
        color: var(--ink);
      }
      .voucher {
        max-width: 760px;
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 24px;
        overflow: hidden;
        background: white;
        box-shadow: 0 24px 60px rgba(18, 59, 89, 0.12);
      }
      .hero {
        padding: 32px;
        background: linear-gradient(135deg, rgba(18,59,89,0.96), rgba(15,118,110,0.92));
        color: white;
      }
      .eyebrow {
        margin: 0 0 10px;
        font-size: 12px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        opacity: 0.8;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 34px;
        line-height: 1.08;
      }
      .subtitle {
        margin: 0;
        font-size: 17px;
        opacity: 0.92;
      }
      .body {
        padding: 28px 32px 32px;
        display: grid;
        gap: 22px;
      }
      .code {
        display: inline-block;
        padding: 12px 16px;
        border-radius: 14px;
        background: rgba(15, 118, 110, 0.08);
        color: var(--accent);
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }
      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 16px 18px;
      }
      .label {
        margin: 0 0 6px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .value {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
      }
      .note {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }
      .footer {
        padding: 0 32px 28px;
        color: var(--muted);
        font-size: 13px;
      }
      @media print {
        body { padding: 0; background: white; }
        .voucher { box-shadow: none; border-radius: 0; }
      }
    </style>
  </head>
  <body>
    <main class="voucher">
      <section class="hero">
        <p class="eyebrow">DonostiGo · Bono emitido</p>
        <h1>${serviceTitle}</h1>
        <p class="subtitle">${businessName}</p>
      </section>
      <section class="body">
        <div>
          <p class="label">Codigo del bono</p>
          <span class="code">${voucherCode}</span>
        </div>

        <div class="grid">
          <article class="card">
            <p class="label">Destinatario</p>
            <p class="value">${recipient}</p>
          </article>
          <article class="card">
            <p class="label">Importe orientativo</p>
            <p class="value">${priceLabel}</p>
          </article>
        </div>

        <article class="card">
          <p class="label">Instrucciones del negocio</p>
          <p class="note">${fulfillmentNote}</p>
        </article>

        <article class="card">
          <p class="label">Respuesta del negocio</p>
          <p class="note">${businessReply}</p>
        </article>
      </section>
      <footer class="footer">
        Generado el ${generatedAt}. Este bono ha sido emitido desde DonostiGo y debe validarse con el negocio antes de su uso definitivo.
      </footer>
    </main>
  </body>
</html>`;
}

export function downloadVoucherDocument(request) {
  if (!request?.voucherCode) {
    throw new Error("Este bono todavia no tiene un codigo disponible para descargar.");
  }

  const blob = new Blob([buildVoucherHtml(request)], { type: "text/html;charset=utf-8" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${slugifyLabel(request.businessName, "donostigo")}-${slugifyLabel(
    request.serviceTitle,
    "bono"
  )}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}
