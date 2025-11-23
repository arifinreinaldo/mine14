import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ChefHat, Users, Settings } from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Restaurant POS System</h1>
          <p className="text-xl text-white/90">QR Code Ordering & Kitchen Management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/kitchen"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <ChefHat className="w-16 h-16 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Kitchen Display</h2>
              <p className="text-gray-600">View incoming orders and update their status</p>
            </div>
          </Link>

          <Link
            to="/server"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <Users className="w-16 h-16 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Server Dashboard</h2>
              <p className="text-gray-600">See ready orders and serve to tables</p>
            </div>
          </Link>

          <Link
            to="/admin"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <Settings className="w-16 h-16 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Panel</h2>
              <p className="text-gray-600">Manage tables, menu, and view QR codes</p>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              <Utensils className="w-16 h-16 text-orange-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Ordering</h2>
              <p className="text-gray-600">Customers scan QR code at their table to order</p>
              <div className="mt-4 text-sm text-gray-500">
                (Accessed via QR code scan)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-white/80 text-sm">
          <p>Built with React + Express + Socket.IO + SQLite</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
