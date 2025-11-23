import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_URL, WS_URL } from '../config';
import { Clock, CheckCircle, ChefHat } from 'lucide-react';

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    loadOrders();

    // Setup Socket.IO
    const newSocket = io(WS_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join-kitchen');
    });

    newSocket.on('new-order', (order) => {
      console.log('New order received:', order);
      setOrders(prev => [order, ...prev]);
      // Play notification sound
      playNotificationSound();
    });

    newSocket.on('order-updated', (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders`);
      // Filter orders that are not completed
      const activeOrders = response.data.filter(
        order => order.status !== 'completed' && order.status !== 'cancelled'
      );
      setOrders(activeOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status } : o
      ));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'preparing': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'ready': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now - created) / 1000 / 60); // minutes
    return `${diff} min ago`;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Kitchen Display System</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Active Orders</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div>
            <div className="bg-yellow-600 text-white px-4 py-2 rounded-t-lg font-semibold">
              New Orders ({pendingOrders.length})
            </div>
            <div className="space-y-4 mt-4">
              {pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  getStatusColor={getStatusColor}
                  getTimeElapsed={getTimeElapsed}
                />
              ))}
            </div>
          </div>

          {/* Preparing Orders */}
          <div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold">
              In Progress ({preparingOrders.length})
            </div>
            <div className="space-y-4 mt-4">
              {preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  getStatusColor={getStatusColor}
                  getTimeElapsed={getTimeElapsed}
                />
              ))}
            </div>
          </div>

          {/* Ready Orders */}
          <div>
            <div className="bg-green-600 text-white px-4 py-2 rounded-t-lg font-semibold">
              Ready ({readyOrders.length})
            </div>
            <div className="space-y-4 mt-4">
              {readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  getStatusColor={getStatusColor}
                  getTimeElapsed={getTimeElapsed}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus, getStatusColor, getTimeElapsed }) {
  return (
    <div className={`border-2 rounded-lg p-4 ${getStatusColor(order.status)} bg-white`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-2xl font-bold text-gray-800">{order.table_number}</div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {getTimeElapsed(order.created_at)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">Order #{order.order_number?.slice(-4)}</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.items?.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="font-medium">
              {item.quantity}x {item.name}
            </span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4 text-sm">
          <strong>Note:</strong> {order.notes}
        </div>
      )}

      <div className="flex gap-2">
        {order.status === 'pending' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'preparing')}
            className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Preparing
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'ready')}
            className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Mark Ready
          </button>
        )}
        {order.status === 'ready' && (
          <div className="flex-1 bg-green-100 text-green-800 py-2 rounded font-semibold text-center">
            Waiting for Server
          </div>
        )}
      </div>
    </div>
  );
}

export default KitchenDisplay;
