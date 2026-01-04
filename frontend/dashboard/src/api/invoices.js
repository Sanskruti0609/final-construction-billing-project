import api from './index'

export const invoicesAPI = {
  // Get all invoices
  getAll: () => api.get('/invoices/'),
  
  // Get invoice by ID
  getById: (id) => api.get(`/invoices/${id}`),
  
  // Create new invoice
  create: (invoiceData) => api.post('/invoices/', invoiceData),
  
  // Generate PDF
  generatePDF: (id, templateType = 'standard') => 
    api.post(`/invoices/${id}/generate-pdf/?template_type=${templateType}`, {}, {
      responseType: 'blob'
    }),
  
  // Update invoice status
  updateStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
  
  // Preview invoice
  preview: (id) => api.get(`/invoices/${id}/preview`),
}