const API = "http://127.0.0.1:8000";

export const invoiceService = {
  analyze: async (file, token) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API}/read-invoice`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Invoice analysis failed");
    }
    return res.json();
  },

  chat: async (question, invoiceData, token) => {
    const context = `
Invoice Data:
- Invoice Number: ${invoiceData.invoice_number || "N/A"}
- Vendor: ${invoiceData.vendor_name || "N/A"}
- Client: ${invoiceData.client_name || "N/A"}
- Date: ${invoiceData.invoice_date || "N/A"}
- Due Date: ${invoiceData.due_date || "N/A"}
- Subtotal: ${invoiceData.subtotal || "N/A"}
- Tax: ${invoiceData.tax_amount || "N/A"}
- Total: ${invoiceData.total_amount || "N/A"}
- Currency: ${invoiceData.currency || "USD"}
- Line Items: ${JSON.stringify(invoiceData.line_items || [])}
- Payment Terms: ${invoiceData.payment_terms || "N/A"}

User Question: ${question}

Answer based ONLY on the invoice data above. Be concise and accurate.`;

    const res = await fetch(`${API}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: context, file_id: "invoice_chat" }),
    });
    if (!res.ok) throw new Error("Chat failed");
    return res.json();
  },
};

export const invoiceExportService = {
  toJSON: (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.invoice_data?.invoice_number || "invoice"}_Data.json`;
    link.click();
  },

  toCSV: (data) => {
    const items = data.invoice_data?.line_items || [];
    const rows = [
      ["Description", "Quantity", "Unit Price", "Total"],
      ...items.map(i => [i.description, i.quantity, i.unit_price, i.total]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.invoice_data?.invoice_number || "invoice"}_LineItems.csv`;
    link.click();
  },
};