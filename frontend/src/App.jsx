import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, getPublicAssetUrl } from './api/client';
import './App.css';

const SHOP_LOGO_PATH = '/Assets/IMG-743fadedeae8e984e2be4e1c65adaa85-V-removebg-preview.png';
const ORDER_STATUS_STEPS = [
  { key: 'pending_payment_review', label: 'Pending Review' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'delivered', label: 'Delivered' }
];

function hasImageSource(value) {
  return typeof value === 'string' && value.trim().length > 5 && !/^[A-Z\s]+$/.test(value.trim());
}

function normalizeProduct(product) {
  return {
    ...product,
    price: Number(product?.price || 0),
    image: product?.image || ''
  };
}

function normalizeOrder(order) {
  return {
    ...order,
    id: order.orderRef || order.id,
    status: order.status || 'pending_payment_review',
    total: Number(order.total || 0),
    receiptImg: getPublicAssetUrl(order.paymentProofPath),
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date()
  };
}

function normalizeNotification(notification) {
  return {
    ...notification,
    amount: Number(notification.amount || 0),
    time: notification.createdAt ? new Date(notification.createdAt) : new Date()
  };
}

function App() {
  // Navbar state
  const [navbarOpen, setNavbarOpen] = useState(false);

  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Navigation state
  const [currentView, setCurrentView] = useState('shop');
  const [adminTab, setAdminTab] = useState('orders');

  // UI state
  const [brandSelected, setBrandSelected] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Shop state
  const [currentCategory, setCurrentCategory] = useState('Premium');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [lastOrderRef, setLastOrderRef] = useState('');

  // Checkout state
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', address: '' });
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  // Admin state - Orders & Notifications
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Tracking state
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Product management state
  const [newProduct, setNewProduct] = useState({
    name: '', category: 'Premium', price: 0, unit: '', image: ''
  });
  const [editProduct, setEditProduct] = useState({
    id: null, name: '', category: 'Premium', price: 0, unit: '', image: ''
  });
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);

  // Accounting state
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Operations', description: '', amount: ''
  });

  // Utility functions
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await api.get('/products');
      const normalizedProducts = (response.data.products || []).map(normalizeProduct);
      setProducts(normalizedProducts);
      if (normalizedProducts.length > 0 && !normalizedProducts.some((product) => product.category === currentCategory)) {
        setCurrentCategory(normalizedProducts[0].category);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      showToast(error.message || 'Connection lost. Please try again.');
    }
  }, [currentCategory, showToast]);

  const loadAdminData = useCallback(async () => {
    try {
      const [ordersResponse, notificationsResponse, expensesResponse] = await Promise.all([
        api.get('/orders/admin/list'),
        api.get('/notifications'),
        api.get('/expenses')
      ]);

      setOrders((ordersResponse.data.orders || []).map(normalizeOrder));
      setNotifications((notificationsResponse.data.notifications || []).map(normalizeNotification));
      setExpenses((expensesResponse.data.expenses || []).map((expense) => ({
        ...expense,
        amount: Number(expense.amount || 0)
      })));
    } catch (error) {
      console.error('Failed to load admin data:', error);
      if (error.status === 401) {
        setIsAdminLoggedIn(false);
      }
      showToast(error.message || 'Failed to load admin dashboard.');
    }
  }, [showToast]);

  const restoreAdminSession = useCallback(async () => {
    try {
      await api.get('/auth/me');
      setIsAdminLoggedIn(true);
    } catch (error) {
      console.error('Failed to restore admin session:', error);
      setIsAdminLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    restoreAdminSession();
  }, [loadProducts, restoreAdminSession]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    loadAdminData();
  }, [isAdminLoggedIn, loadAdminData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_payment_review':
        return '#ffc107';
      case 'confirmed':
        return '#0d6efd';
      case 'delivered':
        return '#198754';
      default:
        return '#6c757d';
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_payment_review':
        return 'P';
      case 'confirmed':
        return 'C';
      case 'delivered':
        return 'D';
      default:
        return '?';
    }
  };

  const getStatusLabel = (status) => {
    return ORDER_STATUS_STEPS.find((step) => step.key === status)?.label || status;
  };

  // Shop functions
  const filteredProducts = useMemo(
    () => products.filter((p) => p.category === currentCategory),
    [products, currentCategory]
  );

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const cartSummary = useMemo(() => {
    const grouped = new Map();
    cart.forEach((item) => {
      const existing = grouped.get(item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        grouped.set(item.id, { ...item, quantity: 1 });
      }
    });
    return Array.from(grouped.values());
  }, [cart]);

  const addToCart = (product) => {
    setCart([...cart, { ...product }]);
    setCartOpen(true);
    showToast('Added to cart.');
  };

  const removeFromCart = (index) => {
    const removedItem = cart[index];
    setCart(cart.filter((_, i) => i !== index));
    showToast(`Removed ${removedItem.name} from cart.`);
  };

  const updateCartQuantity = (productId, nextQuantity) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    if (nextQuantity <= 0) {
      setCart(cart.filter((item) => item.id !== productId));
      return;
    }

    const cartWithoutProduct = cart.filter((item) => item.id !== productId);
    const rebuiltItems = Array.from({ length: nextQuantity }, () => ({ ...targetProduct }));
    setCart([...cartWithoutProduct, ...rebuiltItems]);
  };

  const goToCheckout = () => {
    if (cart.length === 0) {
      showToast('Your cart is empty. Add items first.');
      return;
    }
    setCurrentView('checkout');
  };

  // Checkout functions
  const previewReceipt = (event) => {
    const file = event.target.files[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target.result);
      reader.readAsDataURL(file);
      return;
    }

    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handlePaymentSubmission = async (e) => {
    e.preventDefault();
    const sanitizedName = checkoutForm.name.trim().replace(/\s+/g, ' ');
    const sanitizedPhone = checkoutForm.phone.replace(/[\s-]/g, '').trim();
    const sanitizedAddress = checkoutForm.address.trim().replace(/\s+/g, ' ');
    const namePattern = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
    const phonePattern = /^(?:\+63|0)9\d{9}$/;

    if (!sanitizedName || !sanitizedPhone || !sanitizedAddress) {
      showToast('Please complete name, contact number, and address.');
      return;
    }

    if (!namePattern.test(sanitizedName)) {
      showToast('Enter a valid full name (letters, spaces, apostrophe, dash).');
      return;
    }

    if (!phonePattern.test(sanitizedPhone)) {
      showToast('Enter a valid PH contact number (09XXXXXXXXX or +639XXXXXXXXX).');
      return;
    }

    if (sanitizedAddress.length < 10) {
      showToast('Please enter a more complete address (at least 10 characters).');
      return;
    }

    const groupedItems = cartSummary.map((item) => ({
      productId: item.id,
      quantity: item.quantity
    }));

    try {
      const response = await api.post('/orders', {
        customer: sanitizedName,
        phone: sanitizedPhone,
        address: sanitizedAddress,
        items: groupedItems
      });

      let createdOrder = normalizeOrder(response.data.order || {});

      if (receiptFile) {
        const formData = new FormData();
        formData.append('paymentProof', receiptFile);
        await api.post(`/orders/${createdOrder.orderRef}/payment-proof`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        createdOrder = {
          ...createdOrder,
          receiptImg: receiptPreview
        };
      }

      setLastOrderRef(createdOrder.orderRef || createdOrder.id);
      setTrackedOrder(createdOrder);
      setCurrentView('success');
      setCart([]);
      setCheckoutForm({ name: '', phone: '', address: '' });
      setReceiptPreview(null);
      setReceiptFile(null);

      if (isAdminLoggedIn) {
        loadAdminData();
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      showToast(error.message || 'Failed to submit order. Please try again.');
    }
  };

  // Tracking functions
  const handleTrackOrder = async () => {
    if (!trackingOrderId.trim()) {
      showToast('Enter an order ID first.');
      return;
    }

    try {
      const response = await api.get(`/orders/track/${trackingOrderId.trim()}`);
      setTrackedOrder(normalizeOrder(response.data.order || {}));
    } catch (error) {
      console.error('Order tracking failed:', error);
      setTrackedOrder(null);
      showToast(error.message || 'Order not found. Please check the order ID.');
    }
  };

  // Auto-poll for order status updates every 5 seconds when tracking
  useEffect(() => {
    if (!trackedOrder) return;

    const pollOrder = async () => {
      try {
        const response = await api.get(`/orders/track/${trackedOrder.id}`);
        setTrackedOrder(normalizeOrder(response.data.order || {}));
      } catch (error) {
        console.error('Polling failed:', error);
      }
    };

    // Poll immediately, then every 5 seconds
    pollOrder();
    const interval = setInterval(pollOrder, 5000);
    setPollingInterval(interval);

    return () => clearInterval(interval);
  }, [trackedOrder?.id]);

  const returnFromTracker = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setCurrentView('shop');
    setTrackedOrder(null);
    setTrackingOrderId('');
  };

  // Admin Auth functions
  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      await api.post('/auth/login', loginForm);
      setIsAdminLoggedIn(true);
      setCurrentView('admin');
      setAdminTab('orders');
      setLoginForm({ username: '', password: '' });
      showToast('Admin logged in.');
      await loadAdminData();
    } catch (error) {
      console.error('Admin login failed:', error);
      showToast(error.message || 'Invalid admin credentials.');
    }
  };

  const handleAdminLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Admin logout failed:', error);
    }

    setIsAdminLoggedIn(false);
    setOrders([]);
    setNotifications([]);
    setExpenses([]);
    setCurrentView('shop');
    setLoginForm({ username: '', password: '' });
    showToast('Logged out');
  };

  // Order management
  const ordersByStatus = (status) => orders.filter((o) => o.status === status);

  const updateOrderStatus = async (orderId, newStatus) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder || currentOrder.status === newStatus) return;

    try {
      await api.patch(`/orders/${currentOrder.orderRef || currentOrder.id}/status`, { status: newStatus });
      await loadAdminData();
      setSelectedNotification((prev) =>
        prev && prev.orderRef === currentOrder.orderRef && newStatus === 'delivered' ? null : prev
      );
    } catch (error) {
      console.error('Order status update failed:', error);
      showToast(error.message || 'Failed to update order status.');
    }
  };

  // Notification functions
  const markNotificationAsRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showToast(error.message || 'Failed to update notification.');
    }
  };

  const clearNotifications = async () => {
    try {
      await api.delete('/notifications/clear');
      setNotifications([]);
      showToast('Notifications cleared.');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      showToast(error.message || 'Failed to clear notifications.');
    }
  };

  const activeNotifications = useMemo(
    () => notifications.filter((n) => n.status !== 'delivered'),
    [notifications]
  );

  const unreadNotificationCount = useMemo(
    () => activeNotifications.filter((n) => !n.read).length,
    [activeNotifications]
  );

  // Product management
  const handleAddProduct = async () => {
    try {
      const response = await api.post('/products', {
        name: newProduct.name.trim(),
        category: newProduct.category,
        price: Number(newProduct.price),
        unit: newProduct.unit.trim().toUpperCase(),
        image: newProduct.image || '',
        inStock: true
      });

      setProducts((prev) => [...prev, normalizeProduct(response.data.product)]);
      setNewProduct({ name: '', category: 'Premium', price: 0, unit: '', image: '' });
      showToast('Product added.');
    } catch (error) {
      console.error('Add product failed:', error);
      showToast(error.message || 'Failed to add product.');
    }
  };

  const openEditModal = (product) => {
    setEditProduct({ ...product, image: product.image || '' });
    setEditModalOpen(true);
  };

  const saveEdit = async () => {
    try {
      const response = await api.put(`/products/${editProduct.id}`, {
        name: editProduct.name.trim(),
        category: editProduct.category,
        price: Number(editProduct.price),
        unit: editProduct.unit.trim().toUpperCase(),
        image: editProduct.image || '',
        inStock: Boolean(editProduct.inStock)
      });

      setProducts((prev) =>
        prev.map((product) =>
          product.id === editProduct.id ? normalizeProduct(response.data.product) : product
        )
      );
      setEditModalOpen(false);
      showToast('Product updated.');
    } catch (error) {
      console.error('Edit product failed:', error);
      showToast(error.message || 'Failed to update product.');
    }
  };

  const toggleStock = async (id) => {
    const currentProduct = products.find((product) => product.id === id);
    if (!currentProduct) return;

    try {
      const response = await api.put(`/products/${id}`, { inStock: !currentProduct.inStock });
      setProducts((prev) =>
        prev.map((product) => (product.id === id ? normalizeProduct(response.data.product) : product))
      );
    } catch (error) {
      console.error('Toggle stock failed:', error);
      showToast(error.message || 'Failed to update stock status.');
    }
  };

  const deleteProduct = (id) => {
    setPendingDeleteProduct(products.find((product) => product.id === id));
  };

  const confirmDeleteProduct = async () => {
    if (!pendingDeleteProduct) return;

    try {
      await api.delete(`/products/${pendingDeleteProduct.id}`);
      const productName = pendingDeleteProduct.name;
      setProducts((prev) => prev.filter((product) => product.id !== pendingDeleteProduct.id));
      setPendingDeleteProduct(null);
      showToast(`Product "${productName}" deleted successfully`);
    } catch (error) {
      console.error('Delete product failed:', error);
      showToast(error.message || 'Failed to delete product.');
    }
  };

  const handleProductImageUpload = (event) => {
    if (event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setNewProduct({ ...newProduct, image: e.target.result });
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleEditImageUpload = (event) => {
    if (event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setEditProduct({ ...editProduct, image: e.target.result });
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const getCategoryBadgeClass = (category) => {
    const classes = {
      Premium: 'bg-dark',
      Poultry: 'bg-warning text-dark',
      Pork: 'bg-danger',
      Beef: 'bg-primary'
    };
    return classes[category] || 'bg-secondary';
  };

  // Accounting functions
  const accountingSummary = useMemo(() => {
    const grossSales = orders.reduce((sum, order) => sum + order.total, 0);
    const collectedRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, order) => sum + order.total, 0);
    const receivables = orders.filter(o => o.status !== 'delivered').reduce((sum, order) => sum + order.total, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      grossSales, collectedRevenue, receivables, totalExpenses,
      averageOrderValue: orders.length ? grossSales / orders.length : 0,
      netBalance: collectedRevenue - totalExpenses
    };
  }, [orders, expenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseForm.amount);

    if (!expenseForm.date || !expenseForm.description.trim() || !parsedAmount || parsedAmount <= 0) {
      showToast('Please complete the accounting entry.');
      return;
    }

    try {
      const response = await api.post('/expenses', {
        date: expenseForm.date,
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        amount: parsedAmount
      });

      setExpenses((prev) => [
        { ...response.data.expense, amount: Number(response.data.expense?.amount || 0) },
        ...prev
      ]);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        category: 'Operations', description: '', amount: ''
      });
      showToast('Expense recorded.');
    } catch (error) {
      console.error('Add expense failed:', error);
      showToast(error.message || 'Failed to save expense.');
    }
  };

  const deleteExpense = async (expenseId) => {
    const expense = expenses.find((e) => e.id === expenseId);

    try {
      await api.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter((e) => e.id !== expenseId));
      showToast(`Expense removed: PHP ${expense?.amount || 0}`);
    } catch (error) {
      console.error('Delete expense failed:', error);
      showToast(error.message || 'Failed to remove expense.');
    }
  };

  // Navigation helpers
  const goBackToShop = () => {
    setCurrentView('shop');
    setLoginForm({ username: '', password: '' });
    setShowPassword(false);
  };

  const goToTrackOrder = () => {
    setCurrentView('track-order');
    setNavbarOpen(false);
  };

  // ==================== RENDER FULL APP ====================
  return (
    <>
      {/* Admin Login Modal */}
      {!isAdminLoggedIn && currentView === 'admin-login' && (
        <div className="login-container">
          <div className="login-box">
            <h2>🔐 Admin Login</h2>
            <form onSubmit={handleAdminLogin}>
              <div className="mb-3">
                <label className="form-label fw-bold text-secondary">Username</label>
                <input
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  type="text"
                  className="form-control bg-light"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label fw-bold text-secondary">Password</label>
                <input
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  type={showPassword ? 'text' : 'password'}
                  className="form-control bg-light"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn btn-sm btn-light border w-100 mb-4 fw-bold"
              >
                {showPassword ? 'Hide Password' : 'Show Password'}
              </button>
              <button type="submit" className="btn w-100 fw-bold text-white py-2" style={{ backgroundColor: '#c00000' }}>
                Login
              </button>
              <button
                type="button"
                onClick={goBackToShop}
                className="btn btn-outline-secondary w-100 fw-bold mt-2"
              >
                Back to Shop
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      {currentView !== 'admin-login' && (
        <nav className="navbar">
          <div className="container navbar-shell">
            <div className="navbar-brand-wrap">
              <button
                type="button"
                className={`navbar-brand fw-bold fs-5 cursor-pointer d-flex align-items-center gap-2 m-0 nav-icon-btn ${brandSelected ? 'brand-selected' : ''}`}
                onClick={() => { setBrandSelected(true); setCurrentView('shop'); setNavbarOpen(false); }}
                style={{ cursor: 'pointer' }}
              >
                <img src={SHOP_LOGO_PATH} alt="Farmer's Premium Meatshop logo" className="brand-logo" />
                <div className="brand-copy">
                  <div className="brand-title">Farmer's Premium Meatshop</div>
                  <small className="brand-tagline">Prime cuts, pure flavor</small>
                </div>
              </button>
              {currentView !== 'admin' && (
                <button
                  className="navbar-toggler d-lg-none"
                  type="button"
                  onClick={() => setNavbarOpen(!navbarOpen)}
                  style={{ border: 'none', background: 'none', color: 'white', fontSize: '1.5rem', padding: '0' }}
                  title="Toggle navigation"
                >
                  ☰
                </button>
              )}
            </div>

            <div className={`navbar-menu ${navbarOpen ? 'show' : ''} d-none d-lg-flex`} style={{ display: 'flex' }}>
              <div className="navbar-actions navbar-nav">
                <button
                  className="btn btn-light fw-bold rounded-pill px-4 shadow-sm d-lg-none"
                  onClick={() => { setCurrentView('shop'); setNavbarOpen(false); }}
                  title="Back to shop"
                >
                  🏠 Home
                </button>
                <button
                  className="btn btn-track-order fw-bold rounded-pill px-4 d-lg-none"
                  onClick={goToTrackOrder}
                  title="Track your order"
                >
                  Track Order
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Shop View */}
      {currentView === 'shop' && (
        <div className="container mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h2 className="fw-bold m-0 text-dark">Order Fresh Meats</h2>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-track-order fw-bold rounded-pill px-4 d-none d-md-inline-block"
                onClick={goToTrackOrder}
                title="Track your order"
              >
                Track Order
              </button>
              <button className="btn btn-dark fw-bold fs-5 shadow-sm rounded-pill px-4" onClick={goToCheckout}>
                🛒 Cart ({cart.length})
              </button>
              {!isAdminLoggedIn && (
                <button
                  type="button"
                  className="btn btn-dark fw-bold rounded-pill px-4 shadow-sm"
                  onClick={() => setCurrentView('admin-login')}
                  title="Admin login"
                >
                  Admin
                </button>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-center mb-5 gap-2 flex-wrap">
            {['Premium', 'Poultry', 'Pork', 'Beef'].map(cat => {
              return (
                <button
                  key={cat}
                  className="fw-bold px-4 py-2 border-0 rounded-pill"
                  style={{
                    background: currentCategory === cat ? 'linear-gradient(135deg, #c81e1e 0%, #8b1212 100%)' : '#f3f4f6 !important',
                    color: currentCategory === cat ? 'white' : '#6b7280',
                    borderWidth: currentCategory === cat ? '0' : '2px',
                    borderStyle: 'solid',
                    borderColor: currentCategory === cat ? 'transparent' : '#e5e7eb',
                    transform: currentCategory === cat ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    animation: currentCategory === cat ? 'pulse 1.5s ease-in-out infinite' : 'none',
                    cursor: 'pointer',
                    boxShadow: currentCategory === cat ? '0 4px 12px rgba(200, 30, 30, 0.3)' : 'none',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                  onClick={() => setCurrentCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="row g-4">
            {filteredProducts.length === 0 && (
              <div className="col-12">
                <div className="panel-box text-center">
                  <h5 className="fw-bold mb-2">No products in this category yet</h5>
                  <p className="text-muted mb-3">Try a different category or add products in the admin inventory.</p>
                  <button
                    type="button"
                    className="btn btn-dark fw-bold rounded-pill px-4"
                    onClick={() => {
                      const firstProduct = products[0];
                      if (firstProduct) setCurrentCategory(firstProduct.category);
                    }}
                  >
                    Show Available Products
                  </button>
                </div>
              </div>
            )}
            {filteredProducts.map(product => (
              <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div className={`product-card p-3 d-flex flex-column position-relative ${!product.inStock ? 'opacity-75' : ''}`}>
                  {!product.inStock && (
                    <span className="badge bg-danger position-absolute top-0 end-0 m-3 shadow-sm">Out of Stock</span>
                  )}
                  <div className="meat-img-large">
                    {hasImageSource(product.image) ? (
                      <img src={product.image} style={{ objectFit: 'contain' }} alt={product.name} />
                    ) : (
                      <span className="product-image-fallback">No image</span>
                    )}
                  </div>
                  <h5 className="fw-bold text-dark mb-1 mt-3">{product.name}</h5>
                  <div className="mt-auto pt-2 border-top">
                    <div className="price-tag mb-3 mt-2">
                      ₱{(product.price || 0).toLocaleString()}
                      <span className="fs-6 text-dark fw-normal"> / {product.unit}</span>
                    </div>
                    <button
                      className="btn-add shadow-sm"
                      disabled={!product.inStock}
                      onClick={() => addToCart(product)}
                    >
                      {product.inStock ? 'Add to Cart' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkout View */}
      {currentView === 'checkout' && (
        <div className="container mb-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10">
              <button
                className="btn btn-sm btn-outline-secondary mb-3 fw-bold rounded-pill px-3"
                onClick={() => setCurrentView('shop')}
              >
                ← Back to Shop
              </button>
              <div className="panel-box">
                <div className="row g-2 g-md-4">
                  <div className="col-12 col-md-6 checkout-left pe-md-4 mb-3 mb-md-0">
                    <h4 className="fw-bold mb-4 text-dark">Delivery Details</h4>
                    <div className="mb-3">
                      <label className="form-label fw-bold text-secondary small">Full Name</label>
                      <input
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        maxLength="80"
                        className="form-control bg-light"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold text-secondary small">Contact Number</label>
                      <input
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        type="tel"
                        inputMode="tel"
                        pattern="(?:\+63|0)9[0-9]{9}"
                        title="Use 09XXXXXXXXX or +639XXXXXXXXX"
                        maxLength="13"
                        className="form-control bg-light"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small">Complete Address & Landmark</label>
                      <textarea
                        value={checkoutForm.address}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                        className="form-control bg-light"
                        rows="3"
                        minLength="10"
                        maxLength="180"
                        required
                      ></textarea>
                    </div>
                    <div className="panel-box p-3 mt-4" style={{ backgroundColor: '#fcfcfc' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold m-0 text-dark">Order Summary</h5>
                        <span className="badge bg-secondary">{cart.length} item{cart.length === 1 ? '' : 's'}</span>
                      </div>
                      {cartSummary.length === 0 ? (
                        <p className="text-muted mb-0">Your cart is empty.</p>
                      ) : (
                        <>
                          {cartSummary.map(item => (
                            <div key={item.id} className="checkout-summary-item">
                              <div>
                                <div className="fw-bold text-dark">{item.name}</div>
                                <small className="text-muted">
                                  ₱{(item.price || 0).toLocaleString()} / {item.unit}
                                </small>
                              </div>
                              <div className="text-end">
                                <div className="quantity-stepper mb-2">
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  >
                                    -
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="fw-bold text-danger">
                                  ₱{((item.price || 0) * item.quantity).toLocaleString()}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger fw-bold mt-2"
                                  onClick={() => updateCartQuantity(item.id, 0)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="checkout-summary-total mt-3 d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-secondary">Grand Total</span>
                            <span className="fw-bold text-danger fs-5">₱{cartTotal.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-md-6 checkout-right ps-md-4 text-center mt-0 mt-md-0">
                    <h4 className="fw-bold mb-2">Scan & Pay</h4>
                    <p className="text-muted mb-3">
                      Total Amount: <strong className="text-danger fs-3">₱{cartTotal.toLocaleString()}</strong>
                    </p>
                    <div className="bg-light p-4 rounded-3 mb-3 d-inline-block border font-monospace text-muted fw-bold">
                      [ STATIC GCASH QR CODE ]
                    </div>
                    <form onSubmit={handlePaymentSubmission} className="text-start">
                      <div className="mb-3">
                        <label className="form-label fw-bold text-secondary small">Upload Screenshot of Payment</label>
                        <input
                          type="file"
                          className="form-control bg-light"
                          accept="image/*"
                          onChange={previewReceipt}
                          required
                        />
                      </div>
                      {receiptPreview && (
                        <div className="img-preview-box mb-4">
                          <img src={receiptPreview} alt="Receipt Preview" />
                        </div>
                      )}
                      <button type="submit" className="btn btn-dark w-100 py-3 fw-bold fs-5 rounded-pill shadow">
                        Submit Final Order
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success View */}
      {currentView === 'success' && (
        <div className="container text-center py-5">
          <div className="display-1 text-success mb-3">✅</div>
          <h2 className="fw-bold">Payment Under Review</h2>
          <p className="text-muted mb-4 fs-5">
            We've received your order. Your reference number is <strong className="text-dark">{lastOrderRef}</strong>.
          </p>
          <button
            className="btn btn-outline-dark fw-bold rounded-pill px-5 py-2"
            onClick={() => setCurrentView('shop')}
          >
            Return to Store
          </button>
        </div>
      )}

      {/* Track Order View */}
      {currentView === 'track-order' && (
        <div className="container mb-5">
          <div className="row">
            <div className="col-12 col-md-10 col-lg-8 mx-auto">
              <div className="tracker-header">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-bold rounded-pill px-4"
                  onClick={returnFromTracker}
                >
                  Go Back
                </button>
                <h2 className="fw-bold text-dark tracker-title text-center">Track Your Order</h2>
              </div>
              <div className="panel-box mb-4">
                <p className="text-muted mb-3">Enter your Order ID (e.g., ORD-1234) to track your delivery status</p>
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter Order ID..."
                    value={trackingOrderId}
                    onChange={(e) => setTrackingOrderId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
                  />
                  <button
                    className="btn btn-danger fw-bold"
                    type="button"
                    onClick={handleTrackOrder}
                  >
                    🔍 Search
                  </button>
                </div>
              </div>

              {trackedOrder ? (
                <div className="panel-box">
                  <div style={{ marginBottom: '30px' }}>
                    <h4 className="fw-bold text-dark mb-4">Order Details</h4>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <p className="text-muted small">Order ID</p>
                        <h5 className="fw-bold" style={{ color: '#c00000' }}>
                          {trackedOrder.id}
                        </h5>
                      </div>
                      <div className="col-md-6">
                        <p className="text-muted small">Customer</p>
                        <h5 className="fw-bold">{trackedOrder.customer}</h5>
                      </div>
                    </div>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <p className="text-muted small">Total Amount</p>
                        <h5 className="fw-bold" style={{ color: '#c00000', fontSize: '1.5rem' }}>
                          ₱{(trackedOrder.total || 0).toLocaleString()}
                        </h5>
                      </div>
                      <div className="col-md-6">
                        <p className="text-muted small">Delivery Address</p>
                        <h6 className="fw-bold">{trackedOrder.address}</h6>
                      </div>
                    </div>
                  </div>

                  <hr style={{ margin: '30px 0' }} />

                  <div>
                    <h4 className="fw-bold text-dark mb-4">Delivery Status</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: '40px' }}>
                      {ORDER_STATUS_STEPS.map(({ key: st, label }) => (
                        <div key={st} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              backgroundColor:
                                trackedOrder.status === st || 
                                (trackedOrder.status === 'confirmed' && st !== 'delivered') || 
                                (trackedOrder.status === 'delivered')
                                  ? getStatusColor(st)
                                  : '#e9ecef',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              boxShadow: trackedOrder.status === st ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                              transition: 'all 0.3s ease',
                              zIndex: 2,
                              border: '3px solid white'
                            }}
                          >
                            {getStatusEmoji(st)}
                          </div>
                          <p style={{ marginTop: '15px', fontWeight: '600', textAlign: 'center', color: trackedOrder.status === st ? '#c00000' : '#666', fontSize: '0.95rem' }}>
                            {label}
                          </p>
                        </div>
                      ))}
                      <div
                        style={{
                          position: 'absolute',
                          top: '30px',
                          left: '16.66%',
                          right: '16.66%',
                          height: '4px',
                          backgroundColor: '#e9ecef',
                          zIndex: 1
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: getStatusColor(trackedOrder.status),
                            width:
                              trackedOrder.status === 'pending_payment_review'
                                ? '0%'
                                : trackedOrder.status === 'confirmed'
                                ? '50%'
                                : '100%',
                            transition: 'width 0.3s ease'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                        <strong>Current Status:</strong> Your order is currently{' '}
                        <strong style={{ color: getStatusColor(trackedOrder.status) }}>
                          {getStatusEmoji(trackedOrder.status)} {getStatusLabel(trackedOrder.status)}
                        </strong>
                      </p>
                    </div>

                    {trackedOrder.receiptImg && (
                      <div style={{ marginTop: '20px' }}>
                        <p className="text-muted small">Payment Receipt</p>
                        <img
                          src={trackedOrder.receiptImg}
                          style={{
                            width: '100%',
                            maxWidth: '300px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            cursor: 'pointer'
                          }}
                          onClick={() => setImagePreview(trackedOrder.receiptImg)}
                          title="Click to view full size"
                          alt="Receipt"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-outline-dark fw-bold rounded-pill px-5 mt-5 w-100"
                    onClick={returnFromTracker}
                  >
                    Return to Store
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p style={{ fontSize: '1.1rem' }}>👉 Enter your Order ID above to see the delivery status</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard - Will add detailed implementation in next section */}
      {currentView === 'admin' && isAdminLoggedIn && (
        <div className="container mb-5">
          <div className="admin-header mb-4">
            <h2 className="fw-bold text-dark m-0">Admin Dashboard</h2>
            <div className="admin-toolbar">
              <button
                type="button"
                className={`btn fw-bold rounded-pill px-4 shadow-sm ${adminTab === 'orders' ? 'btn-dark text-white' : 'btn-outline-dark'}`}
                onClick={() => setAdminTab('orders')}
              >
                📦 Orders
              </button>
              <button
                type="button"
                className={`btn fw-bold rounded-pill px-4 shadow-sm ${adminTab === 'inventory' ? 'btn-dark text-white' : 'btn-outline-dark'}`}
                onClick={() => setAdminTab('inventory')}
              >
                🥩 Product Inventory
              </button>
              <button
                type="button"
                className={`btn fw-bold rounded-pill px-4 shadow-sm ${adminTab === 'accounting' ? 'btn-dark text-white' : 'btn-outline-dark'}`}
                onClick={() => setAdminTab('accounting')}
              >
                Accounting
              </button>
              <button
                type="button"
                className="position-relative notification-trigger px-3 py-2 rounded-pill fw-bold"
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                style={{ backgroundColor: '#c81e1e', color: 'white' }}
                title="View notifications"
              >
                <span className="me-2">🔔 Notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white fw-bold">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-danger fw-bold rounded-pill px-3 shadow-sm"
                onClick={clearNotifications}
                title="Clear all notifications"
              >
                Clear
              </button>
              <button
                type="button"
                className="btn btn-warning fw-bold rounded-pill px-4 shadow-sm"
                onClick={handleAdminLogout}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Orders Kanban */}
          {adminTab === 'orders' && (
            <div className="row g-3 g-md-4">
              {ORDER_STATUS_STEPS.map(({ key: status, label }) => (
                <div key={status} className="col-12 col-md-6 col-lg-4">
                  <div className="kanban-col">
                    <h6 className="fw-bold text-muted mb-3 d-flex justify-content-between align-items-center">
                      {label}
                      <span className="badge bg-secondary rounded-pill">{ordersByStatus(status).length}</span>
                    </h6>
                    {ordersByStatus(status).map(order => (
                      <div
                        key={order.id}
                        className={`kanban-card border-${
                          status === 'pending_payment_review' ? 'warning' : status === 'confirmed' ? 'primary' : 'success'
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="font-monospace text-muted px-2 py-1 bg-light rounded border">
                            {order.orderRef || order.id}
                          </small>
                          <strong className="text-danger fs-5">₱{(order.total || 0).toLocaleString()}</strong>
                        </div>
                        <p className="fw-bold mb-0 text-dark fs-5">{order.customer}</p>
                        <p className="text-muted small mb-1">📄 {order.phone}</p>
                        <p className="text-muted small mb-3">🗭 {order.address}</p>
                        {order.receiptImg && (
                          <img
                            src={order.receiptImg}
                            className="w-100 mb-3 rounded border"
                            style={{ height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setImagePreview(order.receiptImg)}
                            title="Click to view full size payment proof"
                            alt="Receipt"
                          />
                        )}
                        {status === 'pending_payment_review' && (
                          <button
                            className="btn btn-sm btn-success w-100 fw-bold py-2"
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          >
                            Accept & Prepare
                          </button>
                        )}
                        {status === 'confirmed' && (
                          <button
                            className="btn btn-sm btn-primary w-100 fw-bold py-2"
                            onClick={() => {
                              if (window.confirm(`Mark order ${order.id} as delivered?`)) {
                                updateOrderStatus(order.id, 'delivered');
                              }
                            }}
                          >
                            Mark Delivered
                          </button>
                        )}
                        {status === 'delivered' && (
                          <span className="text-success fw-bold small d-block text-center border py-2 rounded bg-light">
                            ✅ Complete
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inventory Management */}
          {adminTab === 'inventory' && (
            <div className="row g-3 g-md-4">
              <div className="col-12 col-lg-4">
                <div className="panel-box">
                  <h5 className="fw-bold border-bottom pb-2 mb-3">➕ Add New Product</h5>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddProduct();
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label fw-bold text-secondary small">Product Name</label>
                      <input
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="form-control bg-light"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold text-secondary small">Category</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="form-select bg-light"
                      >
                        <option>Premium</option>
                        <option>Poultry</option>
                        <option>Pork</option>
                        <option>Beef</option>
                      </select>
                    </div>
                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label fw-bold text-secondary small">Price (₱)</label>
                        <input
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                          type="number"
                          className="form-control bg-light"
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold text-secondary small">Unit (e.g. KG)</label>
                        <input
                          value={newProduct.unit}
                          onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                          className="form-control bg-light"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small">Upload Photo (Optional)</label>
                      <input
                        type="file"
                        className="form-control bg-light"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                      />
                    </div>
                    <button type="submit" className="btn text-white w-100 py-2 fw-bold" style={{ backgroundColor: '#c00000' }}>
                      Save Product
                    </button>
                  </form>
                </div>
              </div>
              <div className="col-12 col-lg-8">
                <div className="panel-box">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                    <h5 className="fw-bold m-0 text-dark">Active Product Catalog</h5>
                    <span className="badge bg-secondary">Total: {products.length}</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover table-middle m-0 small">
                      <thead className="table-light text-muted">
                        <tr>
                          <th>Image</th>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id}>
                            <td>
                              <div
                                className="meat-icon-sm border"
                                onClick={() => setImagePreview(product.image)}
                                style={{ cursor: 'pointer' }}
                                title="Click to view full size"
                              >
                                {hasImageSource(product.image) ? (
                                  <img src={product.image} style={{ objectFit: 'contain', borderRadius: '8px' }} alt={product.name} />
                                ) : (
                                  <span className="product-image-fallback product-image-fallback-sm">No image</span>
                                )}
                              </div>
                            </td>
                            <td><div className="fw-bold text-dark">{product.name}</div></td>
                            <td><span className={`badge ${getCategoryBadgeClass(product.category)}`}>{product.category}</span></td>
                            <td className="text-danger fw-bold">
                              ₱{(product.price || 0).toLocaleString()}{' '}
                              <span className="text-muted fw-normal">/{product.unit}</span>
                            </td>
                            <td>
                              {product.inStock ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                  In Stock
                                </span>
                              ) : (
                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                  Out of Stock
                                </span>
                              )}
                            </td>
                            <td className="text-end">
                              <div className="product-row-actions">
                                <button
                                  className="btn btn-sm btn-light border text-primary fw-bold product-row-action-btn"
                                  title={`Edit ${product.name}`}
                                  onClick={() => openEditModal(product)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={`btn btn-sm fw-bold product-row-action-btn ${product.inStock ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                  title={product.inStock ? `Mark ${product.name} out of stock` : `Mark ${product.name} in stock`}
                                  onClick={() => toggleStock(product.id)}
                                >
                                  {product.inStock ? 'Out of Stock' : 'In Stock'}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger fw-bold product-row-action-btn"
                                  title={`Delete ${product.name}`}
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Accounting Tab */}
          {adminTab === 'accounting' && (
            <div className="row g-3 g-md-4">
              <div className="col-12 col-xl-7">
                <div className="panel-box h-100">
                  <div className="accounting-section-title">Sales Snapshot</div>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <div className="accounting-card">
                        <div className="accounting-label">Gross Sales</div>
                        <div className="accounting-value">₱{accountingSummary.grossSales.toLocaleString()}</div>
                        <div className="accounting-subcopy">
                          {orders.length} total order{orders.length === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="accounting-card">
                        <div className="accounting-label">Collected Revenue</div>
                        <div className="accounting-value positive">₱{accountingSummary.collectedRevenue.toLocaleString()}</div>
                        <div className="accounting-subcopy">Delivered orders already collected</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="accounting-card">
                        <div className="accounting-label">Outstanding</div>
                        <div className="accounting-value">₱{accountingSummary.receivables.toLocaleString()}</div>
                        <div className="accounting-subcopy">Pending and confirmed orders</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="accounting-card">
                        <div className="accounting-label">Average Order</div>
                        <div className="accounting-value">
                          ₱{Math.round(accountingSummary.averageOrderValue).toLocaleString()}
                        </div>
                        <div className="accounting-subcopy">Average basket size per order</div>
                      </div>
                    </div>
                  </div>

                  <div className="accounting-section-title mt-4">Sales Ledger</div>
                  <div className="table-responsive">
                    <table className="table table-hover table-middle m-0 small">
                      <thead className="table-light text-muted">
                        <tr>
                          <th>Date</th>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Status</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No sales recorded yet.
                            </td>
                          </tr>
                        ) : (
                          orders
                            .slice()
                            .reverse()
                            .map(order => (
                              <tr key={order.id}>
                                <td>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                                <td><span className="font-monospace text-muted">{order.id}</span></td>
                                <td>{order.customer}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      order.status === 'delivered'
                                        ? 'bg-success'
                                        : order.status === 'confirmed'
                                        ? 'bg-primary'
                                        : 'bg-warning text-dark'
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td className="text-end fw-bold text-danger">₱{(order.total || 0).toLocaleString()}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-5">
                <div className="panel-box mb-4">
                  <div className="accounting-section-title">Add Expense</div>
                  <form onSubmit={handleAddExpense}>
                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label fw-bold text-secondary small">Date</label>
                        <input
                          type="date"
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                          className="form-control bg-light"
                          required
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label fw-bold text-secondary small">Category</label>
                        <select
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                          className="form-select bg-light"
                        >
                          <option>Operations</option>
                          <option>Supplies</option>
                          <option>Utilities</option>
                          <option>Delivery</option>
                          <option>Payroll</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary small">Description</label>
                        <input
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          className="form-control bg-light"
                          placeholder="Example: freezer maintenance"
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary small">Amount</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          className="form-control bg-light"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn text-white w-100 py-2 fw-bold mt-4"
                      style={{ backgroundColor: '#c00000' }}
                    >
                      Save Expense
                    </button>
                  </form>
                </div>

                <div className="panel-box">
                  <div className="accounting-section-title">Expense Ledger</div>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <div className="accounting-card">
                        <div className="accounting-label">Total Expenses</div>
                        <div className="accounting-value negative">
                          ₱{accountingSummary.totalExpenses.toLocaleString()}
                        </div>
                        <div className="accounting-subcopy">
                          {expenses.length} recorded expense{expenses.length === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="accounting-card">
                        <div className="accounting-label">Net Balance</div>
                        <div
                          className={`accounting-value ${accountingSummary.netBalance >= 0 ? 'positive' : 'negative'}`}
                        >
                          ₱{accountingSummary.netBalance.toLocaleString()}
                        </div>
                        <div className="accounting-subcopy">Collected revenue minus expenses</div>
                      </div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover table-middle m-0 small">
                      <thead className="table-light text-muted">
                        <tr>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th className="text-end">Amount</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No expenses recorded yet.
                            </td>
                          </tr>
                        ) : (
                          expenses.map(expense => (
                            <tr key={expense.id}>
                              <td>{expense.date}</td>
                              <td>{expense.category}</td>
                              <td>{expense.description}</td>
                              <td className="text-end fw-bold text-danger">
                                ₱{(expense.amount || 0).toLocaleString()}
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light border text-danger fw-bold"
                                  title="Delete expense"
                                  onClick={() => deleteExpense(expense.id)}
                                >
                                  🗑️ Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Product Modal */}
      {editModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" style={{ marginTop: '50px' }}>
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">✏️ Edit Product</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3 text-center">
                  {hasImageSource(editProduct.image) ? (
                    <img src={editProduct.image} style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }} alt={editProduct.name} />
                  ) : (
                    <div className="meat-img-large" style={{ width: '150px', height: '150px', margin: '0 auto', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '12px' }}>
                      <span className="product-image-fallback">No image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="form-control bg-light mt-2"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold text-secondary">Product Name</label>
                  <input
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    className="form-control bg-light"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold text-secondary">Category</label>
                  <select
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                    className="form-select bg-light"
                  >
                    <option>Premium</option>
                    <option>Poultry</option>
                    <option>Pork</option>
                    <option>Beef</option>
                  </select>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold text-secondary">Price (₱)</label>
                    <input
                      value={editProduct.price}
                      onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                      type="number"
                      className="form-control bg-light"
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold text-secondary">Unit</label>
                    <input
                      value={editProduct.unit}
                      onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}
                      className="form-control bg-light"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn text-white fw-bold"
                  style={{ backgroundColor: '#c00000' }}
                  onClick={() => {
                    saveEdit();
                    setEditModalOpen(false);
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {cartOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg" style={{ marginTop: '50px' }}>
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">🛒 Your Cart ({cart.length})</h5>
                <button type="button" className="btn-close" onClick={() => setCartOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {cart.length === 0 ? (
                  <p className="text-muted text-center">Your cart is empty.</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div>
                        <span className="fw-bold text-dark d-block">{item.name}</span>
                        <small className="text-muted text-danger fw-bold">₱{(item.price || 0).toLocaleString()}</small>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger fw-bold"
                        title="Remove from cart"
                        onClick={() => removeFromCart(index)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="modal-footer bg-light border-top">
                <div className="w-100">
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-bold text-secondary">Total:</span>
                    <span className="fw-bold text-danger fs-5">₱{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary w-100"
                      onClick={() => setCartOpen(false)}
                    >
                      Continue Shopping
                    </button>
                    <button
                      type="button"
                      className="btn btn-add w-100"
                      onClick={() => {
                        goToCheckout();
                        setCartOpen(false);
                      }}
                    >
                      Proceed to Checkout →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-lg" style={{ marginTop: '50px' }}>
            <div className="modal-content bg-dark">
              <div className="modal-header bg-dark border-secondary">
                <h5 className="modal-title fw-bold text-white">📷 Full Size Image</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setImagePreview(null)}></button>
              </div>
              <div className="modal-body bg-dark text-center">
                {imagePreview.length > 5 ? (
                  <img
                    src={imagePreview}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '600px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    alt="Full Size Preview"
                  />
                ) : (
                  <div style={{ fontSize: '200px' }}>{imagePreview}</div>
                )}
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-light" onClick={() => setImagePreview(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {pendingDeleteProduct && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm" style={{ marginTop: '100px' }}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">⚠️ Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPendingDeleteProduct(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-center text-dark">
                  Are you sure you want to delete <strong>{pendingDeleteProduct.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPendingDeleteProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteProduct}
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Overlay & Panel */}
      <div
        className={`notification-overlay ${notificationPanelOpen ? 'open' : ''}`}
        onClick={() => setNotificationPanelOpen(false)}
      ></div>

      {/* Notification Sidebar Panel */}
      <div className={`notification-panel ${notificationPanelOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px', borderBottom: '2px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 className="m-0 fw-bold">🔔 Notifications</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotificationPanelOpen(false)}
          ></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {activeNotifications.length > 0 ? (
            activeNotifications.map((notification, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  backgroundColor: notification.read ? '#f9f9f9' : '#fff3cd',
                  borderLeft: `4px solid ${notification.read ? '#ddd' : '#c81e1e'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  if (!notification.read) {
                    markNotificationAsRead(notification.id);
                  }
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = notification.read ? '#f9f9f9' : '#fff3cd'; }}
              >
                <div style={{ fontWeight: notification.read ? '500' : '700', color: '#333', marginBottom: '4px' }}>
                  {notification.message}
                </div>
                <small style={{ color: '#999' }}>
                  {notification.time ? new Date(notification.time).toLocaleTimeString() : 'Just now'}
                </small>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <p>✅ No active notifications</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && <div className="toast-custom">{toastMessage}</div>}
    </>
  );
}

export default App;
