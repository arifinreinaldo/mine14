import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_URL, WS_URL } from '../config';
import { Bell, CheckCircle, Users } from 'lucide-react';

function ServerDashboard() {
  const [readyOrders, setReadyOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadReadyOrders();

    // Setup Socket.IO
    const newSocket = io(WS_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join-server');
    });

    newSocket.on('order-ready', (order) => {
      console.log('Order ready:', order);
      setReadyOrders(prev => {
        // Check if order already exists
        const exists = prev.find(o => o.id === order.id);
        if (exists) {
          return prev.map(o => o.id === order.id ? order : o);
        }
        return [order, ...prev];
      });
      showNotification(`${order.table_number} - Order Ready!`);
      playNotificationSound();
    });

    newSocket.on('order-completed', (order) => {
      setReadyOrders(prev => prev.filter(o => o.id !== order.id));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const loadReadyOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders?status=ready`);
      setReadyOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1200;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.3);
    }, 200);
  };

  const markAsServed = async (orderId) => {
    try {
      await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'completed' });
      setReadyOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now - created) / 1000 / 60);
    return `${diff} min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-bounce">
          <Bell className="w-6 h-6" />
          <span className="font-semibold text-lg">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Server Dashboard</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/80">Ready Orders</div>
            <div className="text-4xl font-bold">{readyOrders.length}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {readyOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
            <p className="text-gray-600">No orders ready for serving at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-green-600 text-white p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">{order.table_number}</h3>
                    <div className="text-right">
                      <div className="text-xs opacity-90">Ready for</div>
                      <div className="text-lg font-semibold">{getTimeElapsed(order.updated_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Order #{order.order_number?.slice(-8)}</div>
                    <div className="space-y-2">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}

                  <button
                    onClick={() => markAsServed(order.id)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Served
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServerDashboard;
