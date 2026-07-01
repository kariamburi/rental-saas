export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function money(value: unknown) {
    return `KES ${Number(value || 0).toLocaleString()}`;
}
function buildItemDescription(item: any) {
    const description = String(item.description || "");

    if (!["WATER", "ELECTRICITY", "UTILITY"].includes(String(item.type))) {
        return description;
    }

    const match = description.match(/\(([\d,.]+)\s*→\s*([\d,.]+)\s*@\s*KES\s*([\d,.]+)\)/);

    if (!match) return description;

    const previous = Number(match[1].replace(/,/g, ""));
    const current = Number(match[2].replace(/,/g, ""));
    const rate = Number(match[3].replace(/,/g, ""));
    const consumed = current - previous;

    const billTitle = description.split("(")[0].trim();

    return `${billTitle}
Previous reading: ${previous.toLocaleString()}
Current reading: ${current.toLocaleString()}
Total consumed units: ${consumed.toLocaleString()}
Rate: KES ${rate.toLocaleString()}`;
}
export async function GET(
    req: Request,
    { params }: { params: Promise<{ invoiceId: string }> }
) {
    const { invoiceId } = await params;

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            company: true,
            tenant: true,
            unit: { include: { property: true } },
            items: true,
        },
    });

    if (!invoice) notFound();

    const isUtilityOnly = invoice.invoiceType === "UTILITY_ONLY";

    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
        size: "A4",
        margin: 40,
    });

    const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on("data", (chunk: any) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#059669");
    doc.text("RENTAL MANAGEMENT SYSTEM", { characterSpacing: 1.5 });

    doc.moveDown(0.4);
    doc.fontSize(22).fillColor("#0f172a");
    doc.text(isUtilityOnly ? "Utility Bills Invoice" : "Monthly Rent Invoice");

    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").fillColor("#64748b");
    doc.text(`Invoice No: ${invoice.invoiceNo}`);
    doc.text(`Billing Month: ${invoice.periodKey}`);
    doc.text(`Invoice Type: ${isUtilityOnly ? "Bills Only" : "Full Monthly"}`);

    doc.moveDown();

    doc.fontSize(11).fillColor("#0f172a").font("Helvetica-Bold");
    doc.text(invoice.company.name);
    doc.font("Helvetica").fillColor("#475569");
    doc.text(invoice.company.phone || "");

    doc.moveDown();

    doc.font("Helvetica-Bold").fillColor("#0f172a");
    doc.text("Tenant Details");
    doc.moveDown(0.3);

    doc.font("Helvetica").fillColor("#334155");
    doc.text(`Tenant: ${invoice.tenant.name}`);
    doc.text(`Phone: ${invoice.tenant.phone}`);
    doc.text(
        `Property / Unit: ${invoice.unit.property.name} - Unit ${invoice.unit.unitNumber}`
    );
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString("en-KE")}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-KE")}`);

    doc.moveDown();

    const startX = 40;
    let y = doc.y + 10;

    const columns = [
        { label: "Description", x: startX, width: 290 },
        { label: "Type", x: 330, width: 90 },
        { label: "Amount", x: 430, width: 110 },
    ];

    doc.rect(startX, y, 500, 24).fill("#F1F5F9");
    doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold");

    columns.forEach((col) => {
        doc.text(col.label, col.x + 4, y + 8, {
            width: col.width,
            lineBreak: false,
        });
    });

    y += 24;

    const items =
        invoice.items.length > 0
            ? invoice.items
            : [
                {
                    id: "default",
                    description: isUtilityOnly ? "Utility Bills" : "Monthly Rent",
                    type: isUtilityOnly ? "UTILITY" : "RENT",
                    amount: invoice.amount,
                },
            ];

    doc.font("Helvetica").fontSize(9);

    items.forEach((item: any, index) => {
        if (y > 740) {
            doc.addPage();
            y = 40;
        }

        const rowHeight = isUtilityOnly ? 58 : 28;

        if (index % 2 === 0) {
            doc.rect(startX, y, 500, rowHeight).fill("#FAFAFA");
        }
        doc.fillColor("#111827");
        const description = buildItemDescription(item);

        doc.text(description, startX + 4, y + 7, {
            width: 285,
        });

        doc.text(item.type, 334, y + 9, {
            width: 85,
            lineBreak: false,
        });

        doc.font("Helvetica-Bold");
        doc.text(money(item.amount), 434, y + 9, {
            width: 100,
            align: "right",
            lineBreak: false,
        });

        doc.font("Helvetica");
        y += rowHeight;
    });

    y += 20;

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a");
    doc.text(`Invoice Amount: ${money(invoice.amount)}`, 340, y, {
        width: 200,
        align: "right",
    });

    y += 20;
    doc.text(`Paid Amount: ${money(invoice.paidAmount)}`, 340, y, {
        width: 200,
        align: "right",
    });

    y += 20;
    doc.fontSize(14).fillColor("#b91c1c");
    doc.text(`Balance: ${money(invoice.balance)}`, 340, y, {
        width: 200,
        align: "right",
    });

    doc.moveDown(4);
    doc.fontSize(9).fillColor("#94a3b8").font("Helvetica");
    doc.text("Powered by Craft Inventors", { align: "center" });

    doc.end();

    const pdfBuffer = await pdfBufferPromise;

    return new Response(new Uint8Array(pdfBuffer), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${invoice.invoiceNo}.pdf"`,
        },
    });
}