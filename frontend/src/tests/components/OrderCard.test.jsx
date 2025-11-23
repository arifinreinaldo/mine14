import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Simple OrderCard component for testing
function OrderCard({ order, onUpdateStatus }) {
  return (
    <div data-testid="order-card">
      <h3>{order.table_number}</h3>
      <div>Order #{order.order_number}</div>
      <div>Status: {order.status}</div>
      <div>Total: ${order.total_amount}</div>
      {order.items?.map(item => (
        <div key={item.id}>
          {item.quantity}x {item.name}
        </div>
      ))}
      {order.status === 'pending' && (
        <button onClick={() => onUpdateStatus(order.id, 'preparing')}>
          Start Preparing
        </button>
      )}
    </div>
  );
}

describe('OrderCard Component', () => {
  const mockOrder = {
    id: 1,
    table_number: 'Table 1',
    order_number: 'ORD-001',
    status: 'pending',
    total_amount: 25.99,
    items: [
      { id: 1, name: 'Burger', quantity: 2 },
      { id: 2, name: 'Fries', quantity: 1 }
    ]
  };

  it('should render order details', () => {
    render(<OrderCard order={mockOrder} onUpdateStatus={() => {}} />);

    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
    expect(screen.getByText('Status: pending')).toBeInTheDocument();
    expect(screen.getByText('Total: $25.99')).toBeInTheDocument();
  });

  it('should render order items', () => {
    render(<OrderCard order={mockOrder} onUpdateStatus={() => {}} />);

    expect(screen.getByText('2x Burger')).toBeInTheDocument();
    expect(screen.getByText('1x Fries')).toBeInTheDocument();
  });

  it('should call onUpdateStatus when button is clicked', () => {
    const handleUpdateStatus = vi.fn();
    render(<OrderCard order={mockOrder} onUpdateStatus={handleUpdateStatus} />);

    const button = screen.getByText('Start Preparing');
    fireEvent.click(button);

    expect(handleUpdateStatus).toHaveBeenCalledWith(1, 'preparing');
  });

  it('should not show button for non-pending orders', () => {
    const readyOrder = { ...mockOrder, status: 'ready' };
    render(<OrderCard order={readyOrder} onUpdateStatus={() => {}} />);

    expect(screen.queryByText('Start Preparing')).not.toBeInTheDocument();
  });
});
