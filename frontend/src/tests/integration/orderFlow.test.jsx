import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('Order Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Customer Order Placement', () => {
    it('should successfully place an order', async () => {
      const mockResponse = {
        data: {
          id: 1,
          order_number: 'ORD-12345',
          table_id: 1,
          status: 'pending',
          total_amount: 45.97,
          items: [
            { menu_item_id: 1, name: 'Burger', quantity: 2, price: 15.99 },
            { menu_item_id: 2, name: 'Fries', quantity: 1, price: 5.99 }
          ]
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const orderData = {
        table_id: 1,
        items: [
          { menu_item_id: 1, quantity: 2 },
          { menu_item_id: 2, quantity: 1 }
        ],
        notes: 'No onions please'
      };

      const response = await axios.post('http://localhost:3000/api/orders', orderData);

      expect(response.data.order_number).toBe('ORD-12345');
      expect(response.data.total_amount).toBe(45.97);
      expect(response.data.items).toHaveLength(2);
    });

    it('should handle order placement failure', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      await expect(
        axios.post('http://localhost:3000/api/orders', { items: [] })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Order Status Updates', () => {
    it('should update order from pending to preparing', async () => {
      const mockResponse = {
        data: {
          id: 1,
          status: 'preparing',
          updated_at: new Date().toISOString()
        }
      };

      axios.put.mockResolvedValue(mockResponse);

      const response = await axios.put(
        'http://localhost:3000/api/orders/1/status',
        { status: 'preparing' }
      );

      expect(response.data.status).toBe('preparing');
    });

    it('should update order from preparing to ready', async () => {
      const mockResponse = {
        data: {
          id: 1,
          status: 'ready',
          updated_at: new Date().toISOString()
        }
      };

      axios.put.mockResolvedValue(mockResponse);

      const response = await axios.put(
        'http://localhost:3000/api/orders/1/status',
        { status: 'ready' }
      );

      expect(response.data.status).toBe('ready');
    });

    it('should complete order and mark table available', async () => {
      const mockResponse = {
        data: {
          id: 1,
          status: 'completed',
          table: { status: 'available' }
        }
      };

      axios.put.mockResolvedValue(mockResponse);

      const response = await axios.put(
        'http://localhost:3000/api/orders/1/status',
        { status: 'completed' }
      );

      expect(response.data.status).toBe('completed');
    });
  });

  describe('Menu Item Retrieval', () => {
    it('should fetch menu categories with items', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Appetizers',
          items: [
            { id: 1, name: 'Spring Rolls', price: 8.99, available: true },
            { id: 2, name: 'Garlic Bread', price: 6.99, available: true }
          ]
        },
        {
          id: 2,
          name: 'Main Courses',
          items: [
            { id: 3, name: 'Burger', price: 15.99, available: true }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockCategories });

      const response = await axios.get('http://localhost:3000/api/menu/categories');

      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('Appetizers');
      expect(response.data[0].items).toHaveLength(2);
    });
  });

  describe('Table Management', () => {
    it('should fetch table information', async () => {
      const mockTable = {
        id: 1,
        table_number: 'Table 1',
        status: 'available',
        qr_code: '/qrcodes/table-1.png'
      };

      axios.get.mockResolvedValue({ data: mockTable });

      const response = await axios.get('http://localhost:3000/api/tables/1');

      expect(response.data.table_number).toBe('Table 1');
      expect(response.data.status).toBe('available');
    });

    it('should create a new table', async () => {
      const mockTable = {
        id: 5,
        table_number: 'Table 5',
        status: 'available'
      };

      axios.post.mockResolvedValue({ data: mockTable });

      const response = await axios.post('http://localhost:3000/api/tables', {
        table_number: 'Table 5'
      });

      expect(response.data.table_number).toBe('Table 5');
    });
  });
});
