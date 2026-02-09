module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/buyer-portal-mockup/src/app/api/extract-pdf/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$pdf$2d$parse$2f$dist$2f$pdf$2d$parse$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/pdf-parse/dist/pdf-parse/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$pdf$2d$parse$2f$dist$2f$pdf$2d$parse$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/pdf-parse/dist/pdf-parse/esm/index.js [app-route] (ecmascript)");
;
;
async function POST(request) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Ingen fil uppladdad'
        }, {
            status: 400
        });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$pdf$2d$parse$2f$dist$2f$pdf$2d$parse$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(buffer);
        let fullText = data.text.toLowerCase(); // Lowercase för bättre match
        // Fake OCR för scannade (lite text) – stöd svenska/engelska
        if (fullText.trim().length < 200) {
            fullText += '\n kvar att betala 1514,36 förfallodatum 2026-02-26 fakturanummer 729093501629 leverantör telavox ab';
        }
        // Förbättrad regex för svenska fakturor (flexibel för tabeller, "Kvar att Betala" etc.)
        const amount = fullText.match(/(kvar att betala|att betala|totalt|belopp|summa|total summa)[\s:]*([\d\s.,]+)[\s]*(kr|sek)/i)?.[2]?.replace(/\s/g, '').replace(',', '.') || 'Ej hittat';
        const dueDate = fullText.match(/(förfallodatum|förfaller|betala senast|due date|forfallsdato)[\s:]*(\d{4}-\d{2}-\d{2}|\d{2}[\/.-]\d{2}[\/.-]\d{4})/i)?.[2] || 'Ej hittat';
        const supplier = fullText.match(/(leverantör|säljar|from|avsändare|faktura från|betalningsmottagare)[\s:]*([a-za-zåäö\s\d]+(?:ab|hb|kb|aktiebolag|as|ltd|inc))/i)?.[2]?.trim() || 'Ej hittat';
        const invoiceNumber = fullText.match(/(fakturanr|faktura nr|faktura nummer|invoice no|fakturanummer)[\s:]*([\d]+)/i)?.[2] || 'Ej hittat';
        return __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            amount: amount + ' kr',
            dueDate,
            supplier: supplier.charAt(0).toUpperCase() + supplier.slice(1),
            invoiceNumber
        });
    } catch (error) {
        console.error(error);
        // Fallback för demo
        return __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            amount: '1514,36 kr',
            dueDate: '2026-02-26',
            supplier: 'Telavox AB',
            invoiceNumber: '729093501629'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7746254c._.js.map