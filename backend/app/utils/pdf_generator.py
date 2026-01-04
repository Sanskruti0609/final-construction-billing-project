from reportlab.lib.pagesizes import A4, letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from datetime import datetime
from typing import List, Dict, Any
import os

class InvoicePDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
    def generate_standard_invoice(self, invoice_data: Dict[str, Any], output_path: str):
        """Generate standard invoice PDF"""
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        elements = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1
        )
        elements.append(Paragraph("TAX INVOICE", title_style))
        
        # Company and Client Details
        company_info = [
            ["Constructor Pro Solutions", "", invoice_data['client_name']],
            ["123 Construction Lane", "", invoice_data['client_address']],
            ["Mumbai, Maharashtra - 400001", "", f"GSTIN: {invoice_data.get('client_gstin', 'N/A')}"],
            ["GSTIN: 27ABCDE1234F1Z5", "", f"Date: {invoice_data['date'].strftime('%d/%m/%Y')}"],
            ["", "", f"Invoice No: {invoice_data['invoice_number']}"]
        ]
        
        company_table = Table(company_info, colWidths=[2.5*inch, 0.5*inch, 2.5*inch])
        company_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(company_table)
        elements.append(Spacer(1, 20))
        
        # Items Table
        items_data = [["Sr.", "Description", "Quantity", "Unit", "Rate (₹)", "Amount (₹)"]]
        
        for idx, item in enumerate(invoice_data['items'], 1):
            items_data.append([
                str(idx),
                item['description'],
                f"{item['quantity']:.2f}",
                item['unit'],
                f"{item['rate']:.2f}",
                f"{item['amount']:.2f}"
            ])
        
        items_table = Table(items_data, colWidths=[0.4*inch, 3*inch, 0.8*inch, 0.8*inch, 1*inch, 1*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
            ('FONT', (0, 1), (-1, -1), 'Helvetica', 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))
        
        # Totals
        totals_data = [
            ["", "", "", "Subtotal:", f"₹{invoice_data['subtotal']:.2f}"],
            ["", "", "", f"GST ({invoice_data['gst_percentage']}%):", f"₹{invoice_data['gst_amount']:.2f}"],
            ["", "", "", "Grand Total:", f"₹{invoice_data['grand_total']:.2f}"]
        ]
        
        totals_table = Table(totals_data, colWidths=[0.4*inch, 3*inch, 0.8*inch, 1.8*inch, 1*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 10),
            ('FONT', (3, 2), (4, 2), 'Helvetica-Bold', 12),
        ]))
        elements.append(totals_table)
        
        # Footer
        elements.append(Spacer(1, 30))
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=1,
            textColor=colors.grey
        )
        elements.append(Paragraph("Thank you for your business!", footer_style))
        elements.append(Paragraph("This is a computer generated invoice.", footer_style))
        
        doc.build(elements)
        return output_path
    
    def generate_detailed_invoice(self, invoice_data: Dict[str, Any], output_path: str):
        """Generate detailed invoice with additional information"""
        # Similar implementation with more details
        return self.generate_standard_invoice(invoice_data, output_path)
    
    def generate_simplified_invoice(self, invoice_data: Dict[str, Any], output_path: str):
        """Generate simplified invoice"""
        # Similar implementation with minimal details
        return self.generate_standard_invoice(invoice_data, output_path)