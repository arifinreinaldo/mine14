import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { QrCode, Table, Menu, Settings, Plus, Trash2, Edit, Download, RefreshCw } from 'lucide-react';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tablesRes, categoriesRes, itemsRes] = await Promise.all([
        axios.get(`${API_URL}/api/tables`),
        axios.get(`${API_URL}/api/menu/categories`),
        axios.get(`${API_URL}/api/menu/items`)
      ]);
      setTables(tablesRes.data);
      setCategories(categoriesRes.data);
      setMenuItems(itemsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const generateQRCodes = async () => {
    try {
      await axios.post(`${API_URL}/api/tables/generate-qr`);
      alert('QR codes generated successfully!');
      loadData();
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Failed to generate QR codes');
    }
  };

  const addTable = async () => {
    const tableNumber = prompt('Enter table number/name:');
    if (!tableNumber) return;

    try {
      await axios.post(`${API_URL}/api/tables`, { table_number: tableNumber });
      loadData();
    } catch (error) {
      console.error('Error adding table:', error);
      alert('Failed to add table');
    }
  };

  const deleteTable = async (id) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await axios.delete(`${API_URL}/api/tables/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    }
  };

  const addCategory = async () => {
    const name = prompt('Enter category name:');
    if (!name) return;

    try {
      await axios.post(`${API_URL}/api/menu/categories`, { name, display_order: categories.length });
      loadData();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  };

  const addMenuItem = async () => {
    const name = prompt('Enter item name:');
    if (!name) return;

    const description = prompt('Enter description (optional):');
    const price = parseFloat(prompt('Enter price:'));
    const categoryId = parseInt(prompt('Enter category ID:'));

    if (!price || !categoryId) {
      alert('Price and category are required');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/menu/items`, {
        name,
        description,
        price,
        category_id: categoryId
      });
      loadData();
    } catch (error) {
      console.error('Error adding menu item:', error);
      alert('Failed to add menu item');
    }
  };

  const toggleItemAvailability = async (itemId, currentAvailability) => {
    try {
      await axios.put(`${API_URL}/api/menu/items/${itemId}/availability`, {
        available: currentAvailability ? 0 : 1
      });
      loadData();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item availability');
    }
  };

  const deleteMenuItem = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await axios.delete(`${API_URL}/api/menu/items/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete menu item');
    }
  };

  const printQRCode = (table) => {
    const qrUrl = `${API_URL}${table.qr_code}`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${table.table_number}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            h1 { font-size: 48px; margin-bottom: 20px; }
            img { width: 400px; height: 400px; }
            p { margin-top: 20px; font-size: 24px; }
          </style>
        </head>
        <body>
          <h1>${table.table_number}</h1>
          <img src="${qrUrl}" alt="QR Code" />
          <p>Scan to Order</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'tables'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Table className="w-5 h-5" />
              Tables & QR Codes
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'menu'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Menu className="w-5 h-5" />
              Menu Management
            </button>
          </div>
        </div>

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tables</h2>
                <div className="flex gap-3">
                  <button
                    onClick={generateQRCodes}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Generate All QR Codes
                  </button>
                  <button
                    onClick={addTable}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Table
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map(table => (
                  <div key={table.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{table.table_number}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          table.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTable(table.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {table.qr_code && (
                      <div className="text-center mb-3">
                        <img
                          src={`${API_URL}${table.qr_code}`}
                          alt={`QR Code for ${table.table_number}`}
                          className="w-32 h-32 mx-auto mb-2"
                        />
                        <button
                          onClick={() => printQRCode(table)}
                          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1 mx-auto"
                        >
                          <Download className="w-4 h-4" />
                          Print QR Code
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Menu Categories</h2>
                <button
                  onClick={addCategory}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Category
                </button>
              </div>

              <div className="space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="border rounded p-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-800">{category.name}</span>
                    <span className="text-sm text-gray-600">
                      {category.items?.length || 0} items
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Menu Items</h2>
                <button
                  onClick={addMenuItem}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Menu Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {menuItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-600">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.category_name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleItemAvailability(item.id, item.available)}
                            className={`text-xs px-2 py-1 rounded font-semibold ${
                              item.available
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {item.available ? 'Available' : 'Unavailable'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteMenuItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
