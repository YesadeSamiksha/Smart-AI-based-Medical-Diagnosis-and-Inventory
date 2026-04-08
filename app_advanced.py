# Advanced Flask Backend with AI Agent
# File: app_advanced.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import json
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
import time
import uuid
import razorpay

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)
ai_model = genai.GenerativeModel('gemini-pro')

# Initialize Razorpay (Test Mode)
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_dummy')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'dummy_secret')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Email Configuration
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@medai.com')

# ========================================
# HELPER FUNCTIONS
# ========================================

def send_email(to_email, subject, body_html):
    """Send email notification"""
    try:
        if not EMAIL_USER or not EMAIL_PASSWORD:
            print("Email credentials not configured")
            return False
            
        msg = MIMEMultipart('alternative')
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        html_part = MIMEText(body_html, 'html')
        msg.attach(html_part)
        
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()
        
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

def send_order_confirmation_email(order_id, user_email, user_name, items, total):
    """Send order confirmation to user"""
    items_html = ''.join([
        f"<tr><td>{item['name']}</td><td>{item['quantity']}</td><td>₹{item['price']}</td><td>₹{item['quantity'] * item['price']}</td></tr>"
        for item in items
    ])
    
    html = f"""
    <html>
    <body style="font-family: Arial; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #6366f1;">🎉 Order Confirmed!</h2>
            <p>Hi <strong>{user_name}</strong>,</p>
            <p>Thank you for your order! We've received it and will start processing soon.</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> #{order_id[:8]}</p>
                <p><strong>Date:</strong> {datetime.now().strftime('%B %d, %Y %I:%M %p')}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #e5e7eb;">
                        <th style="padding: 10px; text-align: left;">Item</th>
                        <th style="padding: 10px;">Qty</th>
                        <th style="padding: 10px;">Price</th>
                        <th style="padding: 10px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                        <td style="padding: 10px;"><strong>₹{total}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            <p style="color: #6b7280;">Your order will be delivered within 3-5 business days.</p>
            <p>Questions? Contact us at <a href="mailto:support@medai.com">support@medai.com</a></p>
        </div>
    </body>
    </html>
    """
    
    send_email(user_email, f"Order Confirmation - #{order_id[:8]}", html)

def send_low_stock_alert(item_name, current_stock, reorder_quantity):
    """Send low stock alert to admin"""
    html = f"""
    <html>
    <body style="font-family: Arial; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 5px solid #ffc107;">
            <h2 style="color: #856404;">⚠️ Low Stock Alert</h2>
            <p><strong>Item:</strong> {item_name}</p>
            <p><strong>Current Stock:</strong> {current_stock} units</p>
            <p><strong>Recommended Reorder:</strong> {reorder_quantity} units</p>
            <p style="margin-top: 20px;">The AI agent has detected low stock. Please review and approve the reorder.</p>
            <a href="http://localhost:5000/admin-v2.html" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Admin Panel</a>
        </div>
    </body>
    </html>
    """
    
    send_email(ADMIN_EMAIL, f"Low Stock Alert: {item_name}", html)

def send_auto_reorder_notification(item_name, quantity):
    """Notify admin about automatic reorder"""
    html = f"""
    <html>
    <body style="font-family: Arial; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #d1fae5; padding: 20px; border-radius: 10px; border-left: 5px solid #10b981;">
            <h2 style="color: #065f46;">🤖 AI Auto-Reorder Executed</h2>
            <p>The AI agent has automatically placed a reorder:</p>
            <p><strong>Item:</strong> {item_name}</p>
            <p><strong>Quantity:</strong> {quantity} units</p>
            <p><strong>Expected Delivery:</strong> {(datetime.now() + timedelta(days=2)).strftime('%B %d, %Y')}</p>
            <p style="margin-top: 20px; color: #6b7280;">This order was placed automatically based on stock levels and demand predictions.</p>
        </div>
    </body>
    </html>
    """
    
    send_email(ADMIN_EMAIL, f"Auto-Reorder: {item_name}", html)

# ========================================
# INVENTORY API ENDPOINTS
# ========================================

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    """Get all inventory items"""
    try:
        response = supabase.table('inventory').select('*').order('name').execute()
        return jsonify({'success': True, 'data': response.data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inventory', methods=['POST'])
def create_inventory_item():
    """Create new inventory item (Admin only)"""
    try:
        data = request.json
        
        item_data = {
            'name': data.get('name'),
            'category': data.get('category'),
            'quantity': data.get('quantity', 0),
            'price': data.get('price', 0),
            'description': data.get('description', ''),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        response = supabase.table('inventory').insert(item_data).execute()
        return jsonify({'success': True, 'data': response.data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inventory/<item_id>', methods=['PUT'])
def update_inventory_item(item_id):
    """Update inventory item (Admin only)"""
    try:
        data = request.json
        data['updated_at'] = datetime.now().isoformat()
        
        response = supabase.table('inventory').update(data).eq('id', item_id).execute()
        return jsonify({'success': True, 'data': response.data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/inventory/<item_id>', methods=['DELETE'])
def delete_inventory_item(item_id):
    """Delete inventory item (Admin only)"""
    try:
        response = supabase.table('inventory').delete().eq('id', item_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========================================
# ORDERS API ENDPOINTS
# ========================================

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create new order"""
    try:
        data = request.json
        
        user_id = data.get('user_id')
        items = data.get('items', [])
        payment_method = data.get('payment_method', 'COD')
        
        # Calculate total
        subtotal = sum(item['price'] * item['quantity'] for item in items)
        delivery_fee = 50
        total = subtotal + delivery_fee
        
        # Create order
        order_data = {
            'user_id': user_id,
            'items': json.dumps(items),
            'subtotal': subtotal,
            'delivery_fee': delivery_fee,
            'total': total,
            'payment_method': payment_method,
            'payment_status': 'pending',
            'order_status': 'pending',
            'created_at': datetime.now().isoformat()
        }
        
        order_response = supabase.table('orders').insert(order_data).execute()
        order = order_response.data[0]
        
        # Deduct stock for each item
        for item in items:
            current = supabase.table('inventory').select('quantity').eq('id', item['id']).execute()
            if current.data:
                new_quantity = current.data[0]['quantity'] - item['quantity']
                supabase.table('inventory').update({'quantity': new_quantity}).eq('id', item['id']).execute()
        
        # Get user email
        user_response = supabase.table('profiles').select('email, full_name').eq('id', user_id).execute()
        if user_response.data:
            user = user_response.data[0]
            # Send confirmation email in background
            threading.Thread(target=send_order_confirmation_email, args=(
                order['id'], user['email'], user['full_name'], items, total
            )).start()
        
        return jsonify({'success': True, 'order': order})
    except Exception as e:
        print(f"Order error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders/user/<user_id>', methods=['GET'])
def get_user_orders(user_id):
    """Get orders for a user"""
    try:
        response = supabase.table('orders').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        orders = response.data
        for order in orders:
            order['items'] = json.loads(order['items'])
        
        return jsonify({'success': True, 'orders': orders})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_all_orders():
    """Get all orders (Admin only)"""
    try:
        response = supabase.table('orders').select('*').order('created_at', desc=True).execute()
        
        orders = response.data
        for order in orders:
            order['items'] = json.loads(order['items'])
        
        return jsonify({'success': True, 'orders': orders})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status (Admin only)"""
    try:
        data = request.json
        status = data.get('status')
        
        response = supabase.table('orders').update({
            'order_status': status,
            'updated_at': datetime.now().isoformat()
        }).eq('id', order_id).execute()
        
        return jsonify({'success': True, 'order': response.data[0]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========================================
# PAYMENT API ENDPOINTS
# ========================================

@app.route('/api/payment/create-order', methods=['POST'])
def create_razorpay_order():
    """Create Razorpay order for payment"""
    try:
        data = request.json
        amount = int(data.get('amount') * 100)  # Convert to paise
        
        order_data = {
            'amount': amount,
            'currency': 'INR',
            'receipt': f"order_{uuid.uuid4().hex[:8]}",
            'payment_capture': 1
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        return jsonify({
            'success': True,
            'order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'key_id': RAZORPAY_KEY_ID
        })
    except Exception as e:
        print(f"Razorpay error: {e}")
        # Return mock order for demo
        return jsonify({
            'success': True,
            'order_id': f"order_demo_{uuid.uuid4().hex[:8]}",
            'amount': data.get('amount') * 100,
            'currency': 'INR',
            'key_id': 'rzp_test_demo',
            'demo_mode': True
        })

@app.route('/api/payment/verify', methods=['POST'])
def verify_payment():
    """Verify Razorpay payment"""
    try:
        data = request.json
        
        # In demo mode, accept all payments
        if data.get('demo_mode'):
            return jsonify({'success': True, 'verified': True})
        
        # Real verification
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        })
        
        return jsonify({'success': True, 'verified': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# ========================================
# AI AGENT FOR AUTO-REORDERING
# ========================================

class InventoryAIAgent:
    """AI Agent for automatic inventory management"""
    
    def __init__(self):
        self.running = False
        self.check_interval = 3600  # Check every hour
        
    def start(self):
        """Start the AI agent"""
        self.running = True
        thread = threading.Thread(target=self._monitor_loop, daemon=True)
        thread.start()
        print("🤖 AI Inventory Agent started")
        
    def stop(self):
        """Stop the AI agent"""
        self.running = False
        print("🤖 AI Inventory Agent stopped")
        
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                self.check_inventory()
            except Exception as e:
                print(f"AI Agent error: {e}")
            time.sleep(self.check_interval)
            
    def check_inventory(self):
        """Check inventory and auto-reorder if needed"""
        try:
            # Get all inventory items
            response = supabase.table('inventory').select('*').execute()
            items = response.data
            
            # Get recent order data for analysis
            orders_response = supabase.table('orders').select('items, created_at').gte(
                'created_at', (datetime.now() - timedelta(days=30)).isoformat()
            ).execute()
            
            for item in items:
                if item['quantity'] < 10:  # Low stock threshold
                    print(f"⚠️ Low stock detected: {item['name']} ({item['quantity']} units)")
                    
                    # Use AI to determine reorder quantity
                    reorder_qty = self.calculate_reorder_quantity(item, orders_response.data)
                    
                    # Send alert
                    threading.Thread(target=send_low_stock_alert, args=(
                        item['name'], item['quantity'], reorder_qty
                    )).start()
                    
                    # Auto-reorder (simulated)
                    self.place_auto_order(item, reorder_qty)
                    
        except Exception as e:
            print(f"Inventory check error: {e}")
            
    def calculate_reorder_quantity(self, item, order_history):
        """Use AI to calculate optimal reorder quantity"""
        try:
            # Analyze order patterns
            item_orders = []
            for order in order_history:
                items = json.loads(order['items'])
                for order_item in items:
                    if order_item.get('id') == item['id']:
                        item_orders.append({
                            'quantity': order_item['quantity'],
                            'date': order['created_at']
                        })
            
            # Prepare AI prompt
            prompt = f"""
            Analyze this inventory item and recommend a reorder quantity:
            
            Item: {item['name']}
            Category: {item['category']}
            Current Stock: {item['quantity']}
            Recent Orders (last 30 days): {len(item_orders)} orders
            
            Order History:
            {json.dumps(item_orders, indent=2)}
            
            Consider:
            1. Current demand trend
            2. Seasonal variations
            3. Safety stock levels
            4. Storage capacity
            
            Provide only a number (integer) for the recommended reorder quantity.
            """
            
            response = ai_model.generate_content(prompt)
            qty_str = response.text.strip().split()[0]
            qty = int(''.join(filter(str.isdigit, qty_str)))
            
            # Ensure reasonable quantity (20-100 units)
            return max(20, min(qty, 100))
            
        except Exception as e:
            print(f"AI calculation error: {e}")
            # Fallback: 2x current usage or 30 units
            return max(30, item['quantity'] * 2)
            
    def place_auto_order(self, item, quantity):
        """Place automatic reorder (simulated)"""
        try:
            # Log the reorder
            reorder_data = {
                'item_id': item['id'],
                'item_name': item['name'],
                'quantity': quantity,
                'status': 'pending',
                'expected_delivery': (datetime.now() + timedelta(days=2)).isoformat(),
                'created_at': datetime.now().isoformat(),
                'created_by': 'AI_AGENT'
            }
            
            supabase.table('auto_reorders').insert(reorder_data).execute()
            
            # Send notification
            threading.Thread(target=send_auto_reorder_notification, args=(
                item['name'], quantity
            )).start()
            
            print(f"✅ Auto-reorder placed: {item['name']} x{quantity}")
            
            # Simulate delivery after 2 days (for demo, we'll do it after 1 minute)
            threading.Timer(60, self.receive_reorder, args=(item['id'], quantity)).start()
            
        except Exception as e:
            print(f"Auto-order error: {e}")
            
    def receive_reorder(self, item_id, quantity):
        """Simulate receiving reordered items"""
        try:
            # Update stock
            current = supabase.table('inventory').select('quantity').eq('id', item_id).execute()
            if current.data:
                new_quantity = current.data[0]['quantity'] + quantity
                supabase.table('inventory').update({
                    'quantity': new_quantity,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', item_id).execute()
                
                print(f"📦 Reorder received: Item {item_id} +{quantity} units (new total: {new_quantity})")
        except Exception as e:
            print(f"Receive error: {e}")

# Initialize AI Agent
ai_agent = InventoryAIAgent()

@app.route('/api/ai-agent/start', methods=['POST'])
def start_ai_agent():
    """Start the AI agent (Admin only)"""
    ai_agent.start()
    return jsonify({'success': True, 'message': 'AI agent started'})

@app.route('/api/ai-agent/stop', methods=['POST'])
def stop_ai_agent():
    """Stop the AI agent (Admin only)"""
    ai_agent.stop()
    return jsonify({'success': True, 'message': 'AI agent stopped'})

@app.route('/api/ai-agent/status', methods=['GET'])
def get_ai_agent_status():
    """Get AI agent status"""
    return jsonify({
        'success': True,
        'running': ai_agent.running,
        'check_interval': ai_agent.check_interval
    })

@app.route('/api/auto-reorders', methods=['GET'])
def get_auto_reorders():
    """Get all auto-reorders (Admin only)"""
    try:
        response = supabase.table('auto_reorders').select('*').order('created_at', desc=True).execute()
        return jsonify({'success': True, 'reorders': response.data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========================================
# HEALTH CHECK
# ========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ai_agent_running': ai_agent.running,
        'services': {
            'database': 'connected',
            'ai': 'active' if GEMINI_API_KEY else 'inactive',
            'email': 'configured' if EMAIL_USER else 'not_configured',
            'payment': 'demo_mode'
        }
    })

# ========================================
# START SERVER
# ========================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 MedAI Advanced Backend Starting...")
    print("="*50)
    print("\n📌 Features:")
    print("  ✅ Inventory Management API")
    print("  ✅ Order Processing & History")
    print("  ✅ Payment Gateway (Razorpay)")
    print("  ✅ Email Notifications")
    print("  ✅ AI Auto-Reordering Agent")
    print("\n🤖 Starting AI Agent...")
    ai_agent.start()
    print("\n🌐 Server running on http://localhost:5000")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
