
import requests
import sys
import json
from datetime import datetime

class OilInventoryAPITester:
    def __init__(self, base_url="http://localhost:3000/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.current_date = datetime.now().strftime("%Y-%m-%d")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_products_api(self):
        """Test products API"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        if success:
            print(f"Found {len(response)} products")
            if len(response) == 20:
                print("✅ Correct number of products (20)")
            else:
                print(f"❌ Expected 20 products, got {len(response)}")
        return success

    def test_routes_api(self):
        """Test routes API"""
        success, response = self.run_test(
            "Get Routes",
            "GET",
            "routes",
            200
        )
        if success:
            print(f"Found {len(response)} routes")
            if len(response) == 7:
                print("✅ Correct number of routes (7)")
            else:
                print(f"❌ Expected 7 routes, got {len(response)}")
        return success

    def test_vehicles_api(self):
        """Test vehicles API"""
        success, response = self.run_test(
            "Get Vehicles",
            "GET",
            "vehicles",
            200
        )
        if success:
            print(f"Found {len(response)} vehicles")
            if len(response) == 6:
                print("✅ Correct number of vehicles (6)")
            else:
                print(f"❌ Expected 6 vehicles, got {len(response)}")
        return success

    def test_stock_log_api(self):
        """Test stock log API"""
        # Test GET
        success, response = self.run_test(
            "Get Stock Log",
            "GET",
            "stock-log",
            200,
            params={"date": self.current_date}
        )
        if not success:
            return False

        print(f"Found {len(response)} stock entries")
        
        # Test POST
        if len(response) > 0:
            product_id = response[0]["product_id"]
            success, post_response = self.run_test(
                "Update Stock Log",
                "POST",
                "stock-log",
                200,
                data={
                    "product_id": product_id,
                    "date": self.current_date,
                    "field": "sales_office",
                    "value": 5
                }
            )
            return success
        return True

    def test_prices_api(self):
        """Test prices API"""
        # Test GET
        success, response = self.run_test(
            "Get Prices",
            "GET",
            "prices",
            200
        )
        if not success:
            return False

        print(f"Found {len(response)} price entries")
        
        # Test POST
        if len(response) > 0:
            product_id = response[0]["productId"]
            base_rate = response[0]["baseRate"]
            conversion_factor = response[0]["conversionFactor"]
            
            success, post_response = self.run_test(
                "Update Price",
                "POST",
                "prices",
                200,
                data={
                    "product_id": product_id,
                    "base_rate": base_rate,
                    "conversion_factor": conversion_factor
                }
            )
            return success
        return True

    def test_dispatch_log_api(self):
        """Test dispatch log API"""
        # Test GET
        success, response = self.run_test(
            "Get Dispatch Log",
            "GET",
            "dispatch-log",
            200,
            params={"date": self.current_date}
        )
        if not success:
            return False

        print(f"Found {len(response)} dispatch entries")
        
        # Test POST
        success, products_response = self.run_test(
            "Get Products for Dispatch",
            "GET",
            "products",
            200
        )
        
        if success and len(products_response) > 0:
            success, post_response = self.run_test(
                "Create Dispatch Entry",
                "POST",
                "dispatch-log",
                200,
                data={
                    "route_name": "Uthukottai",
                    "vehicle_number": "2259",
                    "products": [
                        {"productId": products_response[0]["id"], "quantity": 2},
                        {"productId": products_response[1]["id"], "quantity": 3}
                    ],
                    "date": self.current_date
                }
            )
            return success
        return True

    def test_vehicle_sales_api(self):
        """Test vehicle sales API"""
        # First create a dispatch entry
        success, products_response = self.run_test(
            "Get Products for Vehicle Sales",
            "GET",
            "products",
            200
        )
        
        if not success or len(products_response) == 0:
            return False
            
        # Create dispatch entry
        success, dispatch_response = self.run_test(
            "Create Dispatch for Vehicle Sales",
            "POST",
            "dispatch-log",
            200,
            data={
                "route_name": "Ponneri",
                "vehicle_number": "4080",
                "products": [
                    {"productId": products_response[0]["id"], "quantity": 2}
                ],
                "date": self.current_date
            }
        )
        
        if not success:
            return False
            
        # Get stock log
        success, stock_response = self.run_test(
            "Get Stock Log for Vehicle Sales",
            "GET",
            "stock-log",
            200,
            params={"date": self.current_date}
        )
        
        if not success or len(stock_response) == 0:
            return False
            
        # Test vehicle sales POST
        success, post_response = self.run_test(
            "Create Vehicle Sales Entry",
            "POST",
            "vehicle-sales",
            200,
            data={
                "stock_log_id": stock_response[0]["product_id"],
                "vehicle_number": "4080",
                "quantity": 1
            }
        )
        return success

def main():
    # Setup
    tester = OilInventoryAPITester()
    
    # Run tests
    print("\n===== TESTING OIL INVENTORY MANAGEMENT SYSTEM API =====\n")
    
    # Test products API
    tester.test_products_api()
    
    # Test routes API
    tester.test_routes_api()
    
    # Test vehicles API
    tester.test_vehicles_api()
    
    # Test stock log API
    tester.test_stock_log_api()
    
    # Test prices API
    tester.test_prices_api()
    
    # Test dispatch log API
    tester.test_dispatch_log_api()
    
    # Test vehicle sales API
    tester.test_vehicle_sales_api()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
