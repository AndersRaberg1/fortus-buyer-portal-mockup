(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/buyer-portal-mockup/src/app/invoices/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Invoices
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$react$2d$dropzone$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/react-dropzone/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/buyer-portal-mockup/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://udybdvjqensxgsbcydoc.supabase.co"), ("TURBOPACK compile-time value", "sb_publishable_-p0mfuUlkcHSRfQkkYSY6A_XWY89Jvu"));
function Invoices() {
    _s();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [invoices, setInvoices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const fetchInvoices = async ()=>{
        const { data, error: error_0 } = await supabase.from('invoices').select('*').order('created_at', {
            ascending: false
        });
        if (error_0) console.error('Supabase fetch error:', error_0);
        else setInvoices(data || []);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Invoices.useEffect": ()=>{
            fetchInvoices();
        }
    }["Invoices.useEffect"], []);
    const onDrop = async (acceptedFiles)=>{
        if (acceptedFiles.length === 0) return;
        setLoading(true);
        setError(null);
        setResult(null);
        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);
        try {
            const res = await fetch('/api/extract-pdf', {
                method: 'POST',
                body: formData
            });
            const data_0 = await res.json();
            if (!res.ok) throw new Error(data_0.error);
            setResult(data_0);
            fetchInvoices(); // Uppdatera lista
        } catch (err) {
            setError(err.message);
        } finally{
            setLoading(false);
        }
    };
    const { getRootProps, getInputProps, isDragActive } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$react$2d$dropzone$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useDropzone"])({
        onDrop,
        accept: {
            'application/pdf': [
                '.pdf'
            ],
            'image/*': []
        },
        maxFiles: 1
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6 max-w-4xl mx-auto pb-20 md:pb-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-bold mb-6",
                children: "Fakturor & ordrar"
            }, void 0, false, {
                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white dark:bg-gray-800 rounded-xl shadow p-8 mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-medium mb-6",
                        children: "Ladda upp ny faktura"
                    }, void 0, false, {
                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-2 border-dashed rounded-xl p-12 text-center",
                        ...getRootProps(),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                ...getInputProps()
                            }, void 0, false, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            isDragActive ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Släpp här..."
                            }, void 0, false, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 65,
                                columnNumber: 27
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Dra och släpp PDF/bild eller klicka"
                            }, void 0, false, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 65,
                                columnNumber: 49
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-center text-primary mt-6",
                        children: "Bearbetar med OCR..."
                    }, void 0, false, {
                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                        lineNumber: 68,
                        columnNumber: 21
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-600 text-center mt-6",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                        lineNumber: 69,
                        columnNumber: 19
                    }, this),
                    result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-8 bg-green-50 dark:bg-green-900/20 rounded-xl p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-bold mb-4",
                                children: "Extraherad data"
                            }, void 0, false, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Belopp:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 73,
                                        columnNumber: 16
                                    }, this),
                                    " ",
                                    result.parsed.amount
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 73,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Förfallodatum:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 74,
                                        columnNumber: 16
                                    }, this),
                                    " ",
                                    result.parsed.dueDate
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Leverantör:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 75,
                                        columnNumber: 16
                                    }, this),
                                    " ",
                                    result.parsed.supplier
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Fakturanummer:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 76,
                                        columnNumber: 16
                                    }, this),
                                    " ",
                                    result.parsed.invoiceNumber
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 76,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "OCR-nummer:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 77,
                                        columnNumber: 16
                                    }, this),
                                    " ",
                                    result.parsed.ocrNumber
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 77,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-green-600 font-medium",
                                children: result.message
                            }, void 0, false, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 78,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                        lineNumber: 71,
                        columnNumber: 20
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xl font-bold mb-6",
                children: "Sparade fakturor"
            }, void 0, false, {
                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            invoices.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-500",
                children: "Inga fakturor sparade än."
            }, void 0, false, {
                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                lineNumber: 83,
                columnNumber: 32
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-6",
                children: invoices.map((inv)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white dark:bg-gray-800 rounded-xl shadow p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Belopp:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 85,
                                        columnNumber: 18
                                    }, this),
                                    " ",
                                    inv.parsed_data.amount
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 85,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Förfallodatum:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 86,
                                        columnNumber: 18
                                    }, this),
                                    " ",
                                    inv.parsed_data.dueDate
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 86,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Leverantör:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 87,
                                        columnNumber: 18
                                    }, this),
                                    " ",
                                    inv.parsed_data.supplier
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 87,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Fakturanummer:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 88,
                                        columnNumber: 18
                                    }, this),
                                    " ",
                                    inv.parsed_data.invoiceNumber
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 88,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "OCR-nummer:"
                                    }, void 0, false, {
                                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                        lineNumber: 89,
                                        columnNumber: 18
                                    }, this),
                                    " ",
                                    inv.parsed_data.ocrNumber
                                ]
                            }, void 0, true, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 89,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: inv.pdf_url,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                className: "mt-4 inline-block bg-primary text-white px-4 py-2 rounded-lg",
                                children: "Öppna PDF"
                            }, void 0, false, {
                                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                                lineNumber: 90,
                                columnNumber: 15
                            }, this)
                        ]
                    }, inv.id, true, {
                        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                        lineNumber: 84,
                        columnNumber: 32
                    }, this))
            }, void 0, false, {
                fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
                lineNumber: 83,
                columnNumber: 93
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/buyer-portal-mockup/src/app/invoices/page.tsx",
        lineNumber: 58,
        columnNumber: 10
    }, this);
}
_s(Invoices, "+CfonBDS33+Gaj9SVOIZXlO22Ag=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$buyer$2d$portal$2d$mockup$2f$node_modules$2f$react$2d$dropzone$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useDropzone"]
    ];
});
_c = Invoices;
var _c;
__turbopack_context__.k.register(_c, "Invoices");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=buyer-portal-mockup_src_app_invoices_page_tsx_9cdb9820._.js.map