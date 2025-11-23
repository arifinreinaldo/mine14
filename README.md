# Restaurant POS System with QR Code Ordering

A complete, modern restaurant Point of Sale (POS) system with QR code ordering, kitchen display, and server dashboard. Built for easy deployment and maintenance.

## Features

### Customer Ordering
- Scan QR code at table to access menu
- Browse menu by categories
- Add items to cart with quantities
- Add special instructions
- Submit orders directly to kitchen
- Mobile-friendly interface

### Kitchen Display System
- Real-time order notifications
- Three-column kanban view (New, In Progress, Ready)
- Audio alerts for new orders
- Update order status with one click
- Track order preparation time

### Server Dashboard
- View all ready orders
- Real-time notifications when orders are ready
- Audio alerts for ready orders
- Mark orders as served
- Track waiting time

### Admin Panel
- Manage tables (add, delete, view status)
- Generate QR codes for all tables
- Print individual QR codes
- Manage menu categories
- Add/edit/delete menu items
- Toggle item availability
- View all system data

## Technology Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: React + Vite + TailwindCSS
- **Database**: SQLite (no external DB needed)
- **Real-time**: Socket.IO for live updates
- **QR Codes**: Automatic generation per table
- **Deployment**: Docker + Docker Compose
- **Testing**: Jest, Vitest, Playwright (comprehensive test coverage)

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mine14
```

2. Start the application:
```bash
docker-compose up -d
```

3. Initialize the database:
```bash
docker-compose exec backend npm run init-db
```

4. Generate QR codes:
```bash
docker-compose exec backend node -e "require('./src/routes/tables'); const axios = require('axios'); axios.post('http://localhost:3000/api/tables/generate-qr');"
```

Or simply visit `http://localhost/admin` and click "Generate All QR Codes"

5. Access the application:
- **Main Dashboard**: http://localhost
- **Kitchen Display**: http://localhost/kitchen
- **Server Dashboard**: http://localhost/server
- **Admin Panel**: http://localhost/admin
- **Customer Ordering**: Scan QR code at table

### Stopping the Application
```bash
docker-compose down
```

### Viewing Logs
```bash
docker-compose logs -f
```

## Manual Setup (Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mine14
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:

Backend (.env):
```bash
cp backend/.env.example backend/.env
```

Frontend (.env):
```bash
cp frontend/.env.example frontend/.env
```

4. Initialize the database:
```bash
cd backend
npm run init-db
cd ..
```

5. Generate QR codes:
```bash
cd backend
npm start
# In another terminal:
curl -X POST http://localhost:3000/api/tables/generate-qr
```

Or visit the admin panel after starting the app.

6. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend on http://localhost:3000
- Frontend on http://localhost:5173

## Usage Guide

### Initial Setup

1. **Access Admin Panel**: Navigate to `/admin`
2. **Review Tables**: Check the default 10 tables or add more
3. **Generate QR Codes**: Click "Generate All QR Codes"
4. **Print QR Codes**: Click "Print QR Code" for each table
5. **Place QR Codes**: Print and place QR codes at each table
6. **Customize Menu**: Add/edit menu items and categories as needed

### Daily Operations

#### For Kitchen Staff
1. Open `/kitchen` on a display screen
2. View incoming orders in real-time
3. Click "Start Preparing" when starting an order
4. Click "Mark Ready" when order is complete
5. Orders automatically notify servers

#### For Servers
1. Open `/server` on a tablet or display
2. Get real-time alerts when orders are ready
3. Click "Mark as Served" after delivering to table
4. Tables automatically marked as available when all orders served

#### For Customers
1. Scan QR code at table
2. Browse menu and add items to cart
3. Add special instructions if needed
4. Click "Place Order"
5. Order sent directly to kitchen

## API Endpoints

### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create new table
- `POST /api/tables/generate-qr` - Generate all QR codes
- `DELETE /api/tables/:id` - Delete table

### Menu
- `GET /api/menu/categories` - Get all categories with items
- `GET /api/menu/items` - Get all menu items
- `POST /api/menu/categories` - Create category
- `POST /api/menu/items` - Create menu item
- `PUT /api/menu/items/:id` - Update menu item
- `DELETE /api/menu/items/:id` - Delete menu item

### Orders
- `GET /api/orders` - Get all orders (filter by status, table_id)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### WebSocket Events
- `new-order` - New order placed
- `order-ready` - Order ready for serving
- `order-updated` - Order status changed
- `order-completed` - Order served to customer

## Database Schema

### Tables
- `tables` - Restaurant tables with QR codes
- `menu_categories` - Menu categories
- `menu_items` - Individual menu items
- `orders` - Customer orders
- `order_items` - Items in each order

## Testing

The system includes comprehensive test coverage across all layers:

### Run All Tests
```bash
./run-all-tests.sh
```

### Backend Tests (Jest + Supertest)
```bash
cd backend
npm test                    # Run all tests with coverage
npm run test:watch          # Watch mode
npm run test:integration    # Integration tests only
```

Coverage includes:
- Database schema validation
- API endpoint testing (Tables, Menu, Orders)
- Order flow integration
- Error handling

### Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npm test                    # Run all tests with coverage
npm run test:watch          # Watch mode
npm run test:ui             # UI mode
```

Coverage includes:
- Component rendering
- User interactions
- API integration
- Navigation flow

### E2E Tests (Playwright)
```bash
cd e2e
npx playwright install      # First time only
npm test                    # Run E2E tests
npm run test:ui             # UI mode
npm run test:headed         # See browser
```

Coverage includes:
- Complete order workflow
- Kitchen display functionality
- Server dashboard operations
- Admin panel management
- Cross-browser testing (Chrome, Firefox, Safari, Mobile)

### View Test Documentation
See [TESTING.md](TESTING.md) for detailed testing guide.

## Customization

### Changing Port Numbers
Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 80 to your preferred port
```

### Adding Custom Menu Items
Use the Admin Panel or directly insert into database:
```bash
docker-compose exec backend sqlite3 data/restaurant.db
```

### Styling
Edit TailwindCSS classes in React components or modify `frontend/tailwind.config.js`

## Deployment to Production

### Using Docker (Recommended)

1. Update environment variables in `docker-compose.yml`
2. Set up reverse proxy (nginx/traefik) with SSL
3. Deploy:
```bash
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Serve frontend with nginx/apache
3. Run backend with PM2:
```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name restaurant-pos
```

## Troubleshooting

### QR Codes Not Working
- Ensure BASE_URL in backend .env is set correctly
- Regenerate QR codes from admin panel
- Check that frontend URL in QR code is accessible

### Orders Not Appearing in Kitchen
- Check Socket.IO connection in browser console
- Verify backend is running
- Check firewall settings for WebSocket connections

### Database Issues
- Reinitialize: `npm run init-db`
- Check file permissions on `backend/data/` directory

## Security Considerations

For production deployment:
1. Add authentication to admin panel
2. Use HTTPS/SSL certificates
3. Set up firewall rules
4. Use environment variables for sensitive data
5. Regular database backups
6. Rate limiting on API endpoints

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## License

MIT License - feel free to use for your restaurant!

## Credits

Built with React, Express, Socket.IO, SQLite, and TailwindCSS.
