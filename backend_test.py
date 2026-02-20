#!/usr/bin/env python3
"""
CheckMate Backend API Testing Suite
Tests all inspection-related endpoints comprehensively
"""

import requests
import json
import base64
import time
from datetime import datetime
import sys

# Backend URL from environment - API endpoints prefixed with /api
BASE_URL = "https://checkmate-checklist.preview.emergentagent.com/api"

class CheckMateAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.created_inspection_id = None
        
    def log_result(self, test_name, success, message, response_code=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        code_info = f" (HTTP {response_code})" if response_code else ""
        print(f"{status} {test_name}{code_info}: {message}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_code': response_code
        })
    
    def test_health_check(self):
        """Test GET /api/ - Health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if "CheckMate" in data.get("message", ""):
                    self.log_result("Health Check", True, "API is healthy and responding", 200)
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected response format: {data}", 200)
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_create_inspection(self):
        """Test POST /api/inspections - Create new inspection"""
        try:
            # Sample property configuration as per review request
            payload = {
                "property_config": {
                    "property_name": "Skyview Apartments Unit 304",
                    "property_address": "123 Main Street, Downtown",
                    "property_type": "apartment",
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "balconies": 2,
                    "parking_spots": 1,
                    "has_kitchen": True
                },
                "inspector_name": "John Doe"
            }
            
            response = self.session.post(
                f"{self.base_url}/inspections",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['id', 'property_config', 'checklist_items', 'status']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Create Inspection", False, f"Missing fields: {missing_fields}", 200)
                    return False
                
                # Store inspection ID for subsequent tests
                self.created_inspection_id = data['id']
                
                # Verify checklist generation
                checklist_items = data.get('checklist_items', [])
                if not checklist_items:
                    self.log_result("Create Inspection", False, "No checklist items generated", 200)
                    return False
                
                # Verify checklist has items for configured spaces
                categories = {item['category'] for item in checklist_items}
                expected_categories = set()
                
                # Should have bedroom categories
                expected_categories.update([f"Bedroom {i+1}" for i in range(3)])
                # Should have bathroom categories
                expected_categories.update([f"Bathroom {i+1}" for i in range(2)])
                # Should have balcony categories
                expected_categories.update([f"Balcony {i+1}" for i in range(2)])
                # Should have parking category
                expected_categories.add("Parking Spot 1")
                # Should have kitchen category
                expected_categories.add("Kitchen")
                # Should have common areas
                expected_categories.update(["Living Room", "Entry/Corridor", "Electrical System", "Plumbing System", "Overall"])
                
                missing_categories = expected_categories - categories
                if missing_categories:
                    self.log_result("Create Inspection", False, f"Missing categories in checklist: {missing_categories}", 200)
                    return False
                
                self.log_result("Create Inspection", True, 
                    f"Created inspection {self.created_inspection_id} with {len(checklist_items)} checklist items across {len(categories)} categories", 200)
                return True
            else:
                self.log_result("Create Inspection", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Create Inspection", False, f"Error: {str(e)}")
            return False
    
    def test_list_inspections(self):
        """Test GET /api/inspections - List all inspections"""
        try:
            response = self.session.get(f"{self.base_url}/inspections")
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_result("List Inspections", False, f"Expected list, got {type(data)}", 200)
                    return False
                
                if len(data) == 0:
                    self.log_result("List Inspections", True, "Retrieved empty inspections list", 200)
                    return True
                
                # Verify structure of first inspection
                inspection = data[0]
                required_fields = ['property_config', 'checklist_items', 'status', 'inspection_date']
                missing_fields = [field for field in required_fields if field not in inspection]
                
                if missing_fields:
                    self.log_result("List Inspections", False, f"Missing fields in inspection: {missing_fields}", 200)
                    return False
                
                self.log_result("List Inspections", True, f"Retrieved {len(data)} inspections with correct structure", 200)
                return True
            else:
                self.log_result("List Inspections", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("List Inspections", False, f"Error: {str(e)}")
            return False
    
    def test_get_inspection_by_id(self):
        """Test GET /api/inspections/{id} - Get specific inspection"""
        if not self.created_inspection_id:
            self.log_result("Get Inspection by ID", False, "No inspection ID available for testing")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/inspections/{self.created_inspection_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all fields are returned
                required_fields = ['id', 'property_config', 'checklist_items', 'status', 'inspection_date', 'inspector_name']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Get Inspection by ID", False, f"Missing fields: {missing_fields}", 200)
                    return False
                
                # Verify ID matches
                if data['id'] != self.created_inspection_id:
                    self.log_result("Get Inspection by ID", False, f"ID mismatch: expected {self.created_inspection_id}, got {data['id']}", 200)
                    return False
                
                self.log_result("Get Inspection by ID", True, f"Retrieved inspection {self.created_inspection_id} with all fields", 200)
                return True
            elif response.status_code == 404:
                self.log_result("Get Inspection by ID", False, "Inspection not found", 404)
                return False
            else:
                self.log_result("Get Inspection by ID", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Get Inspection by ID", False, f"Error: {str(e)}")
            return False
    
    def test_get_invalid_inspection(self):
        """Test GET /api/inspections/{invalid_id} - Error handling"""
        try:
            invalid_id = "non-existent-inspection-id"
            response = self.session.get(f"{self.base_url}/inspections/{invalid_id}")
            
            if response.status_code == 404:
                self.log_result("Get Invalid Inspection", True, "Correctly returned 404 for non-existent inspection", 404)
                return True
            else:
                self.log_result("Get Invalid Inspection", False, f"Expected 404, got HTTP {response.status_code}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Get Invalid Inspection", False, f"Error: {str(e)}")
            return False
    
    def test_update_checklist_item(self):
        """Test PUT /api/inspections/{id}/items/{item_id} - Update checklist item"""
        if not self.created_inspection_id:
            self.log_result("Update Checklist Item", False, "No inspection ID available for testing")
            return False
        
        try:
            # First, get the inspection to find a checklist item
            response = self.session.get(f"{self.base_url}/inspections/{self.created_inspection_id}")
            if response.status_code != 200:
                self.log_result("Update Checklist Item", False, "Could not retrieve inspection for item update test")
                return False
            
            inspection = response.json()
            checklist_items = inspection.get('checklist_items', [])
            if not checklist_items:
                self.log_result("Update Checklist Item", False, "No checklist items available for testing")
                return False
            
            # Use the first item
            first_item = checklist_items[0]
            item_id = first_item['item_id']
            
            # Sample base64 image data (minimal JPEG header)
            sample_base64_image = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
            
            update_payload = {
                "status": "pass",
                "notes": "Everything looks good",
                "photos": [sample_base64_image]
            }
            
            response = self.session.put(
                f"{self.base_url}/inspections/{self.created_inspection_id}/items/{item_id}",
                json=update_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify the item was updated
                updated_items = data.get('checklist_items', [])
                updated_item = next((item for item in updated_items if item['item_id'] == item_id), None)
                
                if not updated_item:
                    self.log_result("Update Checklist Item", False, "Updated item not found in response", 200)
                    return False
                
                # Check if status was updated
                if updated_item['status'] != 'pass':
                    self.log_result("Update Checklist Item", False, f"Status not updated: expected 'pass', got '{updated_item['status']}'", 200)
                    return False
                
                # Check if notes were updated
                if updated_item['notes'] != 'Everything looks good':
                    self.log_result("Update Checklist Item", False, "Notes not updated correctly", 200)
                    return False
                
                # Check if photos were updated
                if len(updated_item['photos']) != 1 or updated_item['photos'][0] != sample_base64_image:
                    self.log_result("Update Checklist Item", False, "Photos not updated correctly", 200)
                    return False
                
                # Check if checked_at was set
                if not updated_item.get('checked_at'):
                    self.log_result("Update Checklist Item", False, "checked_at timestamp not set", 200)
                    return False
                
                self.log_result("Update Checklist Item", True, f"Successfully updated item {item_id} with status, notes, and photos", 200)
                return True
            elif response.status_code == 404:
                self.log_result("Update Checklist Item", False, "Inspection or item not found", 404)
                return False
            else:
                self.log_result("Update Checklist Item", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Update Checklist Item", False, f"Error: {str(e)}")
            return False
    
    def test_update_inspection_status(self):
        """Test PUT /api/inspections/{id} - Update inspection status"""
        if not self.created_inspection_id:
            self.log_result("Update Inspection Status", False, "No inspection ID available for testing")
            return False
        
        try:
            payload = {
                "status": "completed"
            }
            
            response = self.session.put(
                f"{self.base_url}/inspections/{self.created_inspection_id}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify status was updated
                if data.get('status') != 'completed':
                    self.log_result("Update Inspection Status", False, f"Status not updated: expected 'completed', got '{data.get('status')}'", 200)
                    return False
                
                # Verify completed_at was set
                if not data.get('completed_at'):
                    self.log_result("Update Inspection Status", False, "completed_at timestamp not set", 200)
                    return False
                
                self.log_result("Update Inspection Status", True, f"Successfully updated inspection status to completed with timestamp", 200)
                return True
            elif response.status_code == 404:
                self.log_result("Update Inspection Status", False, "Inspection not found", 404)
                return False
            else:
                self.log_result("Update Inspection Status", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Update Inspection Status", False, f"Error: {str(e)}")
            return False
    
    def test_generate_pdf_report(self):
        """Test GET /api/inspections/{id}/pdf - Generate PDF report"""
        if not self.created_inspection_id:
            self.log_result("Generate PDF Report", False, "No inspection ID available for testing")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/inspections/{self.created_inspection_id}/pdf")
            
            if response.status_code == 200:
                # Verify Content-Type header
                content_type = response.headers.get('content-type', '').lower()
                if 'application/pdf' not in content_type:
                    self.log_result("Generate PDF Report", False, f"Wrong content type: expected 'application/pdf', got '{content_type}'", 200)
                    return False
                
                # Verify Content-Disposition header
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' not in content_disposition or 'filename' not in content_disposition:
                    self.log_result("Generate PDF Report", False, f"Missing or incorrect Content-Disposition header: {content_disposition}", 200)
                    return False
                
                # Verify file content is not empty and starts with PDF header
                content = response.content
                if len(content) == 0:
                    self.log_result("Generate PDF Report", False, "PDF content is empty", 200)
                    return False
                
                if not content.startswith(b'%PDF'):
                    self.log_result("Generate PDF Report", False, "Content does not appear to be a valid PDF", 200)
                    return False
                
                self.log_result("Generate PDF Report", True, f"Generated PDF report ({len(content)} bytes) with correct headers", 200)
                return True
            elif response.status_code == 404:
                self.log_result("Generate PDF Report", False, "Inspection not found", 404)
                return False
            else:
                self.log_result("Generate PDF Report", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Generate PDF Report", False, f"Error: {str(e)}")
            return False
    
    def test_generate_excel_report(self):
        """Test GET /api/inspections/{id}/excel - Generate Excel report"""
        if not self.created_inspection_id:
            self.log_result("Generate Excel Report", False, "No inspection ID available for testing")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/inspections/{self.created_inspection_id}/excel")
            
            if response.status_code == 200:
                # Verify Content-Type header
                content_type = response.headers.get('content-type', '').lower()
                expected_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                if expected_type not in content_type:
                    self.log_result("Generate Excel Report", False, f"Wrong content type: expected '{expected_type}', got '{content_type}'", 200)
                    return False
                
                # Verify Content-Disposition header
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' not in content_disposition or 'filename' not in content_disposition:
                    self.log_result("Generate Excel Report", False, f"Missing or incorrect Content-Disposition header: {content_disposition}", 200)
                    return False
                
                # Verify file content is not empty and starts with Excel header
                content = response.content
                if len(content) == 0:
                    self.log_result("Generate Excel Report", False, "Excel content is empty", 200)
                    return False
                
                # Excel files start with PK (ZIP signature)
                if not content.startswith(b'PK'):
                    self.log_result("Generate Excel Report", False, "Content does not appear to be a valid Excel file", 200)
                    return False
                
                self.log_result("Generate Excel Report", True, f"Generated Excel report ({len(content)} bytes) with correct headers", 200)
                return True
            elif response.status_code == 404:
                self.log_result("Generate Excel Report", False, "Inspection not found", 404)
                return False
            else:
                self.log_result("Generate Excel Report", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Generate Excel Report", False, f"Error: {str(e)}")
            return False
    
    def test_delete_inspection(self):
        """Test DELETE /api/inspections/{id} - Delete inspection"""
        if not self.created_inspection_id:
            self.log_result("Delete Inspection", False, "No inspection ID available for testing")
            return False
        
        try:
            response = self.session.delete(f"{self.base_url}/inspections/{self.created_inspection_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify success message
                if 'message' not in data or 'deleted' not in data['message'].lower():
                    self.log_result("Delete Inspection", False, f"Unexpected response format: {data}", 200)
                    return False
                
                # Verify inspection no longer exists
                verify_response = self.session.get(f"{self.base_url}/inspections/{self.created_inspection_id}")
                if verify_response.status_code != 404:
                    self.log_result("Delete Inspection", False, f"Inspection still exists after deletion (HTTP {verify_response.status_code})", 200)
                    return False
                
                self.log_result("Delete Inspection", True, f"Successfully deleted inspection {self.created_inspection_id}", 200)
                # Clear the ID since it's now deleted
                self.created_inspection_id = None
                return True
            elif response.status_code == 404:
                self.log_result("Delete Inspection", False, "Inspection not found", 404)
                return False
            else:
                self.log_result("Delete Inspection", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
        except Exception as e:
            self.log_result("Delete Inspection", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests in sequence"""
        print("=" * 70)
        print("CheckMate Backend API Testing Suite")
        print(f"Testing against: {self.base_url}")
        print("=" * 70)
        
        # Test sequence - order matters for dependencies
        tests = [
            self.test_health_check,
            self.test_create_inspection,
            self.test_list_inspections,
            self.test_get_inspection_by_id,
            self.test_get_invalid_inspection,
            self.test_update_checklist_item,
            self.test_update_inspection_status,
            self.test_generate_pdf_report,
            self.test_generate_excel_report,
            self.test_delete_inspection
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_result(test.__name__, False, f"Unexpected error: {str(e)}")
            print()  # Add spacing between tests
        
        # Summary
        print("=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = sum(1 for result in self.test_results if not result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {passed/total*100:.1f}%")
        
        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        print("=" * 70)
        
        return passed == total


def main():
    """Main test runner"""
    print("Starting CheckMate Backend API Tests...")
    
    tester = CheckMateAPITester(BASE_URL)
    success = tester.run_all_tests()
    
    if success:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()