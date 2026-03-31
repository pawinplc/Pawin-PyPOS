import { useState, useEffect, useRef } from 'react';
import { itemsAPI, categoriesAPI } from '../services/supabase';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const Items = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', sku: '', category_id: '',
    unit_price: '', cost_price: '', quantity: '', min_stock_level: ''
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      const [itemsData, catsData] = await Promise.all([
        itemsAPI.getAll({ search }),
        categoriesAPI.getAll(),
      ]);
      setItems(itemsData || []);
      setCategories(catsData || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        sku: item.sku,
        category_id: item.category_id || '',
        unit_price: item.unit_price,
        cost_price: item.cost_price,
        quantity: item.quantity,
        min_stock_level: item.min_stock_level
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '', sku: '', category_id: '',
        unit_price: '', cost_price: '', quantity: '', min_stock_level: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        unit_price: parseFloat(formData.unit_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        quantity: parseInt(formData.quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 5,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      if (editingItem) {
        await itemsAPI.update(editingItem.id, data);
        toast.success('Item updated successfully');
      } else {
        await itemsAPI.create(data);
        toast.success('Item created successfully');
      }
      closeModal();
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setDeletingId(id);
    try {
      await itemsAPI.delete(id);
      toast.success('Item deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          toast.error('The file is empty');
          return;
        }

        const errors = [];
        const validatedData = jsonData.map((row, index) => {
          const rowNum = index + 2;
          const item = {
            name: row.name || row.Name || row.NAME || '',
            sku: row.sku || row.SKU || row.Sku || '',
            category_name: row.category || row.Category || row.category_name || row['Category Name'] || '',
            unit_price: parseFloat(row.unit_price || row['Unit Price'] || row.price || row.Price || 0),
            cost_price: parseFloat(row.cost_price || row['Cost Price'] || row.cost || row.Cost || 0),
            quantity: parseInt(row.quantity || row.Quantity || row.stock || row.Stock || 0),
            min_stock_level: parseInt(row.min_stock_level || row['Min Stock'] || row.min_stock || row['Min Stock Level'] || 5),
          };

          if (!item.name) errors.push(`Row ${rowNum}: Name is required`);
          if (!item.sku) errors.push(`Row ${rowNum}: SKU is required`);
          if (isNaN(item.unit_price) || item.unit_price < 0) errors.push(`Row ${rowNum}: Invalid unit price`);

          return item;
        });

        setImportErrors(errors);
        setImportData(validatedData);
        setShowImportModal(true);
      } catch (error) {
        toast.error('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      toast.error('No data to import');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of importData) {
      try {
        const category = categories.find(c => c.name.toLowerCase() === item.category_name.toLowerCase());
        
        const data = {
          name: item.name,
          sku: item.sku,
          category_id: category?.id || null,
          unit_price: item.unit_price,
          cost_price: item.cost_price,
          quantity: item.quantity,
          min_stock_level: item.min_stock_level
        };

        await itemsAPI.create(data);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    setUploading(false);
    toast.success(`Imported ${successCount} items successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
    setShowImportModal(false);
    setImportData([]);
    setImportErrors([]);
    loadData();
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Example Item',
        sku: 'ITEM-001',
        category: 'Pens & Pencils',
        unit_price: 3500,
        cost_price: 1800,
        quantity: 100,
        min_stock_level: 10
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, 'items_template.xlsx');
  };

  const handleExport = () => {
    const exportData = items.map(item => ({
      name: item.name,
      sku: item.sku,
      category: item.category_name || '',
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      quantity: item.quantity,
      min_stock_level: item.min_stock_level
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.writeFile(wb, 'items_export.xlsx');
  };

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="fs-3 mb-1">Items</h1>
            <p className="text-muted mb-0">Manage your product inventory</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => fileInputRef.current?.click()}>
              <i className="ti ti-upload me-1"></i>
              Import CSV/XLS
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button className="btn btn-outline-secondary" onClick={handleExport}>
              <i className="ti ti-download me-1"></i>
              Export
            </button>
            <button className="btn btn-outline-secondary" onClick={downloadTemplate}>
              <i className="ti ti-file-arrow-up me-1"></i>
              Template
            </button>
            <button className="btn btn-primary" onClick={() => openModal()}>
              <i className="ti ti-plus"></i>
              Add Item
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-body p-3">
            <div className="d-flex gap-2 mb-3 flex-wrap justify-content-between">
              <div className="search-box">
                <span className="search-box-icon"><i className="ti ti-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="ti ti-filter"></i> Filter
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover">
              <thead className="table-light border-light">
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                  <th>Min</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="align-middle">
                    <td>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>{item.category_name || '-'}</td>
                    <td>TSH {parseFloat(item.unit_price).toLocaleString()}</td>
                    <td>TSH {parseFloat(item.cost_price || 0).toLocaleString()}</td>
                    <td className={item.is_low_stock ? 'text-danger fw-semibold' : ''}>{item.quantity}</td>
                    <td>{item.min_stock_level}</td>
                    <td>
                      <button onClick={() => openModal(item)} className="table-action-btn" disabled={saving || deletingId}>
                        <i className="ti ti-edit"></i>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="table-action-btn danger" disabled={deletingId === item.id}>
                        {deletingId === item.id ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="ti ti-trash"></i>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="empty-state py-5">
                <i className="ti ti-box fs-1 text-muted"></i>
                <p className="mt-2">No items found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={closeModal} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">SKU * <small className="text-muted">(Stock Keeping Unit)</small>
                        <span className="ms-1" data-bs-toggle="tooltip" title="Examples: PEN-001 (Pens), NB-002 (Notebooks), PAP-001 (Paper)">
                          <i className="ti ti-info-circle text-primary" style={{cursor: 'pointer'}}></i>
                        </span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="e.g., PEN-001, NB-002, PAP-001"
                        required
                        disabled={editingItem}
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.category_id}
                        onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Unit Price (TSH) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Cost Price (TSH)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Min Stock Level</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-outline-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {editingItem ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingItem ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Import Items ({importData.length} found)</h3>
              <button onClick={() => setShowImportModal(false)} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <div className="modal-body">
              {importErrors.length > 0 && (
                <div className="alert alert-warning mb-3">
                  <strong>Warnings:</strong>
                  <ul className="mb-0 mt-2">
                    {importErrors.slice(0, 5).map((err, i) => (
                      <li key={i} className="small">{err}</li>
                    ))}
                    {importErrors.length > 5 && <li className="small">...and {importErrors.length - 5} more</li>}
                  </ul>
                </div>
              )}
              <div className="table-responsive" style={{ maxHeight: 300 }}>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 10).map((item, i) => (
                      <tr key={i}>
                        <td>{item.sku}</td>
                        <td>{item.name}</td>
                        <td>{item.category_name || '-'}</td>
                        <td>TSH {item.unit_price.toLocaleString()}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 10 && (
                  <p className="text-muted text-center small">...and {importData.length - 10} more items</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowImportModal(false)} className="btn btn-outline-secondary">
                Cancel
              </button>
              <button onClick={handleImport} className="btn btn-primary" disabled={uploading}>
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Importing...
                  </>
                ) : (
                  <>
                    <i className="ti ti-upload me-1"></i>
                    Import {importData.length} Items
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
