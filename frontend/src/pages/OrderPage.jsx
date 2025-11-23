import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { ShoppingCart, Plus, Minus, Send, CheckCircle } from 'lucide-react';

function OrderPage() {
  const { tableId } = useParams();
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    loadData();
  }, [tableId]);

  const loadData = async () => {
    try {
      const [tableRes, menuRes] = await Promise.all([
        axios.get(`${API_URL}/api/tables/${tableId}`),
        axios.get(`${API_URL}/api/menu/categories`)
      ]);
      setTable(tableRes.data);
      setCategories(menuRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.menu_item_id === item.id);
    if (existingItem) {
      setCart(cart.map(c =>
        c.menu_item_id === item.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find(c => c.menu_item_id === itemId);
    if (existingItem.quantity > 1) {
      setCart(cart.map(c =>
        c.menu_item_id === itemId
          ? { ...c, quantity: c.quantity - 1 }
          : c
      ));
    } else {
      setCart(cart.filter(c => c.menu_item_id !== itemId));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      await axios.post(`${API_URL}/api/orders`, {
        table_id: tableId,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity
        })),
        notes
      });

      setOrderPlaced(true);
      setTimeout(() => {
        setCart([]);
        setNotes('');
        setOrderPlaced(false);
      }, 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <CheckCircle className="w-24 h-24 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Placed!</h2>
          <p className="text-gray-600">Your order has been sent to the kitchen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">{table?.table_number}</h1>
          <p className="text-sm text-blue-100">Scan, Order, Enjoy!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-32">
        {/* Menu */}
        {categories.map(category => (
          <div key={category.id} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{category.name}</h2>
            <div className="grid gap-4">
              {category.items.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <p className="text-lg font-bold text-blue-600 mt-2">${item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-4xl mx-auto p-4">
            {/* Cart Items */}
            <div className="mb-4 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div key={item.menu_item_id} className="flex justify-between items-center mb-2">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.menu_item_id)}
                        className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => addToCart({ id: item.menu_item_id, name: item.name, price: item.price })}
                        className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <input
              type="text"
              placeholder="Special instructions (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-4"
            />

            {/* Total and Place Order */}
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold">Total: ${calculateTotal()}</div>
              <button
                onClick={placeOrder}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderPage;
