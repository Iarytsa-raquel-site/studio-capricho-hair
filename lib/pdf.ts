import type { Appointment, StudioSettings } from "@/lib/types";
import { dateBR, money } from "@/lib/supabase";

function ascii(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").replace(/([\\()])/g, "\\$1");
}

function pdfDocument(title: string, subtitle: string, sections: Array<{ label: string; value: string }>, footer: string) {
  const commands: string[] = [
    "0.08 0.07 0.06 rg 0 730 595 112 re f",
    "0.78 0.62 0.34 rg 0 724 595 6 re f",
    "0.78 0.62 0.34 rg 45 758 43 43 re f",
    "0.08 0.07 0.06 rg BT /F2 16 Tf 54 772 Td (CH) Tj ET",
    "1 1 1 rg BT /F2 24 Tf 104 790 Td (" + ascii(title) + ") Tj ET",
    "0.83 0.72 0.50 rg BT /F1 10 Tf 104 768 Td (" + ascii(subtitle) + ") Tj ET",
    "0.12 0.11 0.10 rg",
  ];
  let y = 680;
  sections.forEach((row, index) => {
    if (index % 2 === 0) commands.push(`0.97 0.95 0.91 rg 45 ${y - 13} 505 42 re f`);
    commands.push(`0.42 0.39 0.34 rg BT /F1 8 Tf 58 ${y + 12} Td (${ascii(row.label.toUpperCase())}) Tj ET`);
    commands.push(`0.10 0.09 0.08 rg BT /F2 11 Tf 58 ${y - 5} Td (${ascii(row.value)}) Tj ET`);
    y -= 52;
  });
  commands.push(`0.72 0.55 0.28 RG 45 ${Math.max(y - 3, 84)} m 550 ${Math.max(y - 3, 84)} l S`);
  commands.push(`0.36 0.33 0.29 rg BT /F1 9 Tf 58 ${Math.max(y - 28, 58)} Td (${ascii(footer)}) Tj ET`);
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function safeFilename(value: string) {
  return ascii(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadReceipt(appointment: Appointment, settings: StudioSettings) {
  const emittedAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  const blob = pdfDocument(settings.name, settings.specialty || settings.slogan, [
    { label: "Numero do recibo", value: appointment.receipt_number || "Recibo" },
    { label: "Cliente", value: appointment.client_name },
    { label: "WhatsApp", value: appointment.client_phone },
    { label: "Servico realizado", value: appointment.service_summary },
    { label: "Data e horario do servico", value: `${dateBR(appointment.scheduled_date)} as ${appointment.scheduled_time.slice(0, 5)}` },
    { label: "Valor recebido", value: money(appointment.total) },
    { label: "Forma de pagamento", value: appointment.payment_method || "Nao informado" },
    { label: "Endereco", value: `${settings.address} - ${settings.city}` },
    { label: "Emitido em", value: emittedAt },
  ], settings.thank_you_message || "Agradecemos a preferencia.");
  download(blob, `recibo-${safeFilename(settings.name)}-${safeFilename(appointment.client_name)}-${appointment.scheduled_date}.pdf`);
}

export function downloadFinancialReport(settings: StudioSettings, period: string, revenue: number, expenses: number, rows: Array<{ label: string; value: string }>) {
  const blob = pdfDocument(`${settings.name} - Relatorio financeiro`, period, [
    { label: "Faturamento", value: money(revenue) },
    { label: "Despesas", value: money(expenses) },
    { label: "Lucro estimado", value: money(revenue - expenses) },
    ...rows.slice(0, 7),
  ], `Gerado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date())}.`);
  download(blob, `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`);
}
