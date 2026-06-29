export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { notFound } from "next/navigation";

function money(value: any) {
    return `KES ${Number(value || 0).toLocaleString()}`;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ propertyId: string }> }
) {
    const user = await getAuthUser();
    if (!user || user.role !== Roles.COMPANY_ADMIN || !user.companyId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { propertyId } = await params;

    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            companyId: user.companyId,
        },
    });

    if (!property) notFound();

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId: user.companyId,
            balance: { gt: 0 },
            unit: {
                propertyId,
            },
        },
        include: {
            tenant: true,
            unit: true,
        },
        orderBy: { dueDate: "asc" },
    });

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

    const totalBalance = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.balance || 0),
        0
    );

    doc.fontSize(18).font("Helvetica-Bold").text("Property Arrears Report");
    doc.moveDown(0.5);

    doc.fontSize(11).font("Helvetica").text(`Property: ${property.name}`);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-KE")}`);
    doc.text(`Total Tenants With Balance: ${invoices.length}`);
    doc.text(`Total Balance: ${money(totalBalance)}`);
    doc.moveDown();

    const startX = 40;
    let y = doc.y + 10;

    const columns = [
        { label: "Tenant Name", x: startX, width: 170 },
        { label: "Unit", x: 210, width: 70 },
        { label: "Invoice", x: 280, width: 90 },
        { label: "Amount", x: 370, width: 80 },
        { label: "Paid", x: 450, width: 70 },
        { label: "Balance", x: 520, width: 80 },
    ];

    doc.rect(startX, y, 520, 22).fill("#F1F5F9");
    doc.fillColor("#111827").fontSize(8).font("Helvetica-Bold");

    columns.forEach((col) => {
        doc.text(col.label, col.x + 4, y + 7, {
            width: col.width,
            lineBreak: false,
        });
    });

    y += 22;

    doc.font("Helvetica").fontSize(8);

    invoices.forEach((invoice, index) => {
        if (y > 760) {
            doc.addPage();
            y = 40;
        }

        if (index % 2 === 0) {
            doc.rect(startX, y, 520, 24).fill("#FAFAFA");
        }

        doc.fillColor("#111827");

        doc.text(invoice.tenant.name || "-", startX + 4, y + 7, {
            width: 165,
            lineBreak: false,
        });

        doc.text(invoice.unit.unitNumber || "-", 214, y + 7, {
            width: 60,
            lineBreak: false,
        });

        doc.text(invoice.invoiceNo || "-", 284, y + 7, {
            width: 80,
            lineBreak: false,
        });

        doc.text(money(invoice.amount), 374, y + 7, {
            width: 70,
            lineBreak: false,
        });

        doc.text(money(invoice.paidAmount), 454, y + 7, {
            width: 65,
            lineBreak: false,
        });

        doc.font("Helvetica-Bold").fillColor("#B91C1C");
        doc.text(money(invoice.balance), 524, y + 7, {
            width: 75,
            lineBreak: false,
        });

        doc.font("Helvetica").fillColor("#111827");

        y += 24;
    });

    doc.end();

    const pdfBuffer = await pdfBufferPromise;

    return new Response(new Uint8Array(pdfBuffer), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${property.name}-arrears-report.pdf"`,
        },
    });
}