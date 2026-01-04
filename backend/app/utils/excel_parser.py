import pandas as pd
from typing import List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SSRExcelParser:
    @staticmethod
    def parse_ssr_excel(file_path: str) -> List[Dict[str, Any]]:
        """Parse SSR Excel file and return list of SSR items"""
        try:
            df = pd.read_excel(file_path)
            
            # Map columns based on provided structure
            ssr_items = []
            for _, row in df.iterrows():
                item = {
                    'sr_no': row.get('Sr.No.', 0),
                    'chapter': str(row.get('Chapter', '')),
                    'ssr_item_no': str(row.get('SSR Item No.', '')),
                    'reference_no': str(row.get('Reference No.', '')),
                    'description': str(row.get('Description of the item', '')),
                    'additional_specification': str(row.get('Additional Specification', '')),
                    'unit': str(row.get('Unit', '')),
                    'completed_rate': float(row.get('Completed Rate for 2022-23 excluding GST In Rs.', 0)),
                    'labour_rate': float(row.get('Labour Rate for 2022-23 excluding GST In Rs.', 0))
                }
                ssr_items.append(item)
            
            return ssr_items
        except Exception as e:
            logger.error(f"Error parsing SSR Excel: {e}")
            raise

class BOQExcelParser:
    @staticmethod
    def parse_boq_excel(file_path: str, project_id: str, project_name: str) -> List[Dict[str, Any]]:
        """Parse BOQ Excel file and return list of BOQ items"""
        try:
            df = pd.read_excel(file_path)
            
            boq_items = []
            for _, row in df.iterrows():
                item = {
                    'item_no': str(row.get('Item No. From BOQ', '')),
                    'description': str(row.get('Description of Work', '')),
                    'ssr_page_number': str(row.get('SSR Page number for that item', '')),
                    'ssr_item_no': str(row.get('SSR Item No.', '')),
                    'unit': str(row.get('Unit', '')),
                    'completed_rate': float(row.get('Completed Rate for 2022-23 excluding GST In Rs.', 0)),
                    'quantity': float(row.get('Quantity', 0)),
                    'project_id': project_id,
                    'project_name': project_name
                }
                boq_items.append(item)
            
            return boq_items
        except Exception as e:
            logger.error(f"Error parsing BOQ Excel: {e}")
            raise

class ExcelProcessor:
    def __init__(self, db):
        self.db = db
        self.ssr_parser = SSRExcelParser()
        self.boq_parser = BOQExcelParser()
    
    def import_ssr_from_excel(self, file_path: str):
        """Import SSR items from Excel file"""
        from app import schemas, crud
        
        ssr_items_data = self.ssr_parser.parse_ssr_excel(file_path)
        imported_count = 0
        failed_items = []
        
        for item_data in ssr_items_data:
            try:
                ssr_item = schemas.SSRItemCreate(**item_data)
                crud.create_ssr_item(self.db, ssr_item)
                imported_count += 1
            except Exception as e:
                failed_items.append({
                    'item': item_data.get('ssr_item_no', 'Unknown'),
                    'error': str(e)
                })
        
        return {
            'imported_count': imported_count,
            'failed_count': len(failed_items),
            'failed_items': failed_items
        }
    
    def import_boq_from_excel(self, file_path: str, project_id: str, project_name: str):
        """Import BOQ items from Excel file"""
        from app import schemas, crud
        
        boq_items_data = self.boq_parser.parse_boq_excel(file_path, project_id, project_name)
        imported_count = 0
        failed_items = []
        
        for item_data in boq_items_data:
            try:
                boq_item = schemas.BOQItemCreate(**item_data)
                crud.create_boq_item(self.db, boq_item)
                imported_count += 1
            except Exception as e:
                failed_items.append({
                    'item': item_data.get('item_no', 'Unknown'),
                    'error': str(e)
                })
        
        return {
            'imported_count': imported_count,
            'failed_count': len(failed_items),
            'failed_items': failed_items
        }