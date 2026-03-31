import { useState, useEffect } from 'react';
import { itemsAPI, salesAPI, categoriesAPI } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const POS = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customerPayment, setCustomerPayment] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, allItems] = await Promise.all([
        categoriesAPI.getAll(),
        itemsAPI.getAll({})
      ]);
      setCategories(cats || []);
      
      const filteredItems = (allItems || []).filter(item => 
        item.is_active !== false && 
        item.category_name?.toLowerCase() !== 'stationery services'
      );
      setItems(filteredItems);
      
      const services = (allItems || []).filter(item => 
        item.category_name?.toLowerCase() === 'stationery services' ||
        item.category_name?.toLowerCase() === 'printing & scanning'
      );
      setServiceItems(services);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const params = { search };
      if (selectedCategory) params.category_id = selectedCategory;
      const data = await itemsAPI.getAll(params);
      const filtered = (data || []).filter(item => 
        item.is_active !== false && 
        item.category_name?.toLowerCase() !== 'stationery services' &&
        item.category_name?.toLowerCase() !== 'printing & scanning'
      );
      setItems(filtered);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const addToCart = (item) => {
    setAddingToCart(item.id);
    setTimeout(() => {
      const existingItem = cart.find(cartItem => cartItem.item_id === item.id);
      if (existingItem) {
        if (existingItem.quantity >= item.quantity && item.quantity > 0) {
          setCart(cart.map(cartItem =>
            cartItem.item_id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1, subtotal: (cartItem.quantity + 1) * cartItem.unit_price }
              : cartItem
          ));
          toast.success(`Added another ${item.name}`);
        } else {
          toast.error('Not enough stock');
        }
      } else {
        setCart([...cart, {
          item_id: item.id,
          name: item.name,
          sku: item.sku,
          unit_price: parseFloat(item.unit_price),
          quantity: 1,
          subtotal: parseFloat(item.unit_price),
          max_qty: item.quantity
        }]);
        toast.success(`Added ${item.name} to cart`);
      }
      setAddingToCart(null);
    }, 150);
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(cartItem => {
      if (cartItem.item_id === itemId) {
        const newQty = cartItem.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > cartItem.max_qty) {
          toast.error('Not enough stock');
          return cartItem;
        }
        return { ...cartItem, quantity: newQty, subtotal: newQty * cartItem.unit_price };
      }
      return cartItem;
    }).filter(Boolean));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(cartItem => cartItem.item_id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerPayment('');
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getChange = () => {
    const total = getTotal();
    const payment = parseFloat(customerPayment) || 0;
    return payment >= total ? payment - total : 0;
  };

  const canCheckout = () => {
    const total = getTotal();
    const payment = parseFloat(customerPayment) || 0;
    return cart.length > 0 && payment >= total;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const total = getTotal();
    const payment = parseFloat(customerPayment) || 0;
    
    if (payment < total) {
      toast.error(`Insufficient payment. Total is TSH ${total.toLocaleString()}`);
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: 'cash',
      };

      const result = await salesAPI.create(saleData);
      setLastSale({
        id: result?.id,
        items: [...cart],
        total: getTotal(),
        payment: payment,
        change: getChange(),
        date: new Date()
      });
      setShowReceipt(true);
      toast.success(`Sale completed! Receipt #${String(result?.id).padStart(5, '0')}`);
      setCart([]);
      setCustomerPayment('');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setLastSale(null);
  };

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="mb-4">
          <h1 className="fs-3 mb-1" style={{ color: 'var(--text-primary)' }}>Point of Sale</h1>
          <p className="text-muted mb-0">Select items to add to cart</p>
        </div>
      </div>

      <div className="col-lg-8">
        {serviceItems.length > 0 && (
          <div className="card mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0"><i className="ti ti-printer me-2"></i>Stationery Services</h5>
            </div>
            <div className="card-body p-3">
              <div className="d-flex gap-3 justify-content-start flex-wrap">
                {serviceItems.map(service => (
                  <div 
                    key={service.id} 
                    className={`service-item-card p-3 ${addingToCart === service.id ? 'adding-to-cart' : ''}`}
                    onClick={() => addToCart(service)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(230, 98, 57, 0.1) 0%, rgba(230, 98, 57, 0.02) 100%)',
                      border: addingToCart === service.id ? '2px solid var(--primary)' : '2px dashed var(--primary)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '180px',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      flex: '1',
                      maxWidth: '250px',
                      position: 'relative',
                      opacity: addingToCart === service.id ? 0.7 : 1
                    }}
                  >
                    {addingToCart === service.id && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <span className="spinner-border spinner-border-sm"></span>
                      </div>
                    )}
                    <div className="mb-2">
                      <i className={`ti ${service.name.toLowerCase().includes('print') ? 'ti-printer' : 'ti-scan'}`} style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
                    </div>
                    <h5 className="mb-1" style={{ color: 'var(--text-primary)' }}>{service.name}</h5>
                    <h4 className="mb-1 text-primary">TSH {parseFloat(service.unit_price).toLocaleString()}</h4>
                    <small className="text-muted">Click to add</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card mb-4">
          <div className="card-body p-3">
            <div className="d-flex gap-2 flex-wrap justify-content-between mb-3">
              <div className="search-box flex-grow-1" style={{ maxWidth: 300 }}>
                <span className="search-box-icon"><i className="ti ti-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: 150 }}
              >
                <option value="">All Categories</option>
                {categories.filter(c => c.name.toLowerCase() !== 'stationery services' && c.name.toLowerCase() !== 'printing & scanning').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pos-items-grid">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`pos-item-card ${addingToCart === item.id ? 'adding-to-cart' : ''}`}
              onClick={() => addToCart(item)}
              style={{ position: 'relative' }}
            >
              {addingToCart === item.id && (
                <div className="add-to-cart-spinner">
                  <span className="spinner-border spinner-border-sm"></span>
                </div>
              )}
              <div className="pos-item-name">{item.name}</div>
              <div className="pos-item-price">TSH{parseFloat(item.unit_price).toLocaleString()}</div>
              <small className="text-muted">Stock: {item.quantity}</small>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-12">
              <div className="empty-state">
                <i className="ti ti-box fs-1 text-muted"></i>
                <p className="mt-2 text-muted">No items found</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-lg-4">
        <div className="pos-cart-section">
          <div className="pos-cart-header">
            <h4 className="mb-0" style={{ color: 'var(--text-primary)' }}>
              <i className="ti ti-shopping-cart me-2"></i>
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h4>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={clearCart} 
              disabled={cart.length === 0}
            >
              <i className="ti ti-trash"></i>
              Clear
            </button>
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state py-5">
                <i className="ti ti-shopping-cart fs-1 text-muted"></i>
                <p className="mt-2 mb-0 text-muted">Cart is empty</p>
                <small className="text-muted">Click items to add</small>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.item_id} className="pos-cart-item">
                  <div className="pos-cart-item-info">
                    <div className="pos-cart-item-name">{item.name}</div>
                    <div className="pos-cart-item-price">TSH{item.unit_price.toLocaleString()} each</div>
                  </div>
                  <div className="pos-cart-item-qty">
                    <button onClick={() => updateQuantity(item.item_id, -1)}>
                      <i className="ti ti-minus"></i>
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.item_id, 1)}>
                      <i className="ti ti-plus"></i>
                    </button>
                  </div>
                  <div className="pos-cart-item-subtotal">
                    TSH{item.subtotal.toLocaleString()}
                  </div>
                  <button 
                    className="table-action-btn danger ms-2"
                    onClick={() => removeFromCart(item.item_id)}
                  >
                    <i className="ti ti-x"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pos-cart-footer">
            <div className="pos-cart-summary">
              <div className="pos-cart-summary-row">
                <span>Total Items:</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="pos-cart-summary-row total">
                <span>Total:</span>
                <span>TSH{getTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="payment-section mt-3">
              <div className="mb-2">
                <label className="form-label small" style={{ color: 'var(--text-primary)' }}>Amount from Customer (TSH)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter amount..."
                  value={customerPayment}
                  onChange={(e) => setCustomerPayment(e.target.value)}
                  min="0"
                />
              </div>
              {customerPayment && parseFloat(customerPayment) >= getTotal() && getTotal() > 0 && (
                <div className="change-display mb-2 p-2 rounded" style={{ background: 'rgba(0, 201, 81, 0.1)', border: '1px solid var(--success)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: 'var(--success)' }}>Change:</span>
                    <span className="fw-bold" style={{ color: 'var(--success)', fontSize: '1.1rem' }}>
                      TSH{getChange().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {customerPayment && parseFloat(customerPayment) < getTotal() && getTotal() > 0 && (
                <div className="mb-2 p-2 rounded text-muted small">
                  <i className="ti ti-info-circle me-1"></i>
                  Remaining: TSH{(getTotal() - parseFloat(customerPayment)).toLocaleString()}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary w-100 mt-2"
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing || !canCheckout()}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="ti ti-credit-card me-2"></i>
                  Complete Sale
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showReceipt && lastSale && (
        <div className="modal-overlay" onClick={closeReceipt}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Receipt #{String(lastSale.id).padStart(5, '0')}</h3>
              <button onClick={closeReceipt} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="text-center border-bottom pb-3 mb-3">
                <h4 className="mb-1" style={{ color: 'var(--text-primary)' }}>Pawin PyPOS</h4>
                <p className="text-muted mb-1 small">University Stationery Store</p>
                <p className="text-muted mb-0 small">{lastSale.date.toLocaleString()}</p>
              </div>

              <div className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between fw-semibold mb-2 small" style={{ color: 'var(--text-primary)' }}>
                  <span>Item</span>
                  <span>Total</span>
                </div>
                {lastSale.items.map((item, index) => (
                  <div key={index} className="d-flex justify-content-between small mb-1" style={{ color: 'var(--text-primary)' }}>
                    <span>{item.name} x{item.quantity}</span>
                    <span>TSH{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div>
                <div className="d-flex justify-content-between small mb-1" style={{ color: 'var(--text-primary)' }}>
                  <span>Subtotal:</span>
                  <span>TSH{lastSale.total.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between small mb-1" style={{ color: 'var(--text-primary)' }}>
                  <span>Cash:</span>
                  <span>TSH{lastSale.payment.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top" style={{ color: 'var(--text-primary)' }}>
                  <span>Change:</span>
                  <span style={{ color: 'var(--success)' }}>TSH{lastSale.change.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-0 small">Thank you for your purchase!</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeReceipt} className="btn btn-primary w-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
