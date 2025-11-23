import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';

describe('Home Page', () => {
  it('should render the main title', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Restaurant POS System')).toBeInTheDocument();
  });

  it('should display all navigation cards', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Kitchen Display')).toBeInTheDocument();
    expect(screen.getByText('Server Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Customer Ordering')).toBeInTheDocument();
  });

  it('should have links to correct routes', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const kitchenLink = screen.getByText('Kitchen Display').closest('a');
    const serverLink = screen.getByText('Server Dashboard').closest('a');
    const adminLink = screen.getByText('Admin Panel').closest('a');

    expect(kitchenLink).toHaveAttribute('href', '/kitchen');
    expect(serverLink).toHaveAttribute('href', '/server');
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('should display technology stack information', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Built with React/i)).toBeInTheDocument();
  });
});
