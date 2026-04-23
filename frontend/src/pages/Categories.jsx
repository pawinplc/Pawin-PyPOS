import { useState, useEffect, useRef } from 'react';
import { categoriesAPI, subscribeToCategories } from '../services/supabase';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const Categories = ({ isAdmin = false }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [importData, setImportData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCategories();
    
    let unsubscribe;
    try {
      unsubscribe = subscribeToCategories(() => loadCategories());
    } catch (error) {
      console.warn('Realtime disabled:', error.message);
    }
    
    const interval = setInterval(() => loadCategories(true), 10000);
    
    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadCategories = async (isRefresh = false) => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data || []);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories(true);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Category created successfully');
      }
      closeModal();
      loadCategories();
    } catch (error) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setDeletingId(id);
    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      toast.error('Failed to delete category');
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

        const validatedData = jsonData.map((row, index) => {
          const item = {
            name: row.name || row.Name || row.NAME || '',
            description: row.description || row.Description || row.desc || ''
          };
          return item;
        }).filter(item => item.name);

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

    for (const item of importData) {
      try {
        await categoriesAPI.create({ name: item.name, description: item.description });
        successCount++;
      } catch (error) {
        // Skip duplicates
      }
    }

    setUploading(false);
    toast.success(`Imported ${successCount} categories successfully`);
    setShowImportModal(false);
    setImportData([]);
    loadCategories();
  };

  const downloadTemplate = () => {
    const template = [
      { name: 'Pens & Pencils', description: 'All types of pens and pencils' },
      { name: 'Notebooks', description: 'Exercise books and notebooks' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    XLSX.writeFile(wb, 'categories_template.xlsx');
  };

  const handleExport = () => {
    const exportData = filteredCategories.map(cat => ({
      name: cat.name,
      description: cat.description || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    XLSX.writeFile(wb, 'categories_export.xlsx');
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <div className="skeleton" style={{ width: 150, height: 24, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: 200, height: 16 }}></div>
            </div>
            <div className="d-flex gap-2">
              <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 4 }}></div>
              <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 4 }}></div>
              <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 4 }}></div>
              <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 4 }}></div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="card-body p-3">
              <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 16 }}></div>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th><div className="skeleton" style={{ width: 40, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 120, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 150, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 60, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ width: 30, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 120, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 150, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 50, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 70, height: 16 }}></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="fs-3 mb-1">Categories</h1>
            <p className="text-muted mb-0">Manage your product categories</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={handleRefresh} disabled={refreshing}>
              <i className={`ti ti-refresh ${refreshing ? 'fa-spin' : ''}`}></i>
              {refreshing ? ' Refreshing...' : ' Refresh'}
            </button>
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
            <button className="btn btn-outline-secondary" onClick={downloadTemplate}>
              <i className="ti ti-file-arrow-up me-1"></i>
              Template
            </button>
<button className="btn btn-outline-secondary" onClick={handleExport}>
              <i className="ti ti-download me-1"></i>
              Export
            </button>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => openModal()}>
                <i className="ti ti-plus"></i>
                Add Category
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-body p-3">
            <div className="search-box">
              <span className="search-box-icon"><i className="ti ti-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 300 }}
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover">
              <thead className="table-light border-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Items</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(category => (
                  <tr key={category.id} className="align-middle">
                    <td>{category.id}</td>
                    <td className="fw-medium">{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary border border-primary">
                        {category.items_count || 0}
                      </span>
                    </td>
                    <td>
                      {isAdmin && (
                        <>
                          <button onClick={() => openModal(category)} className="table-action-btn" disabled={saving || deletingId}>
                            <i className="ti ti-edit"></i>
                          </button>
                          <button onClick={() => handleDelete(category.id)} className="table-action-btn danger" disabled={deletingId === category.id}>
                            {deletingId === category.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="ti ti-trash"></i>
                            )}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && (
              <div className="empty-state py-5">
                <i className="ti ti-tags fs-1 text-muted"></i>
                <p className="mt-2">No categories found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={closeModal} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                <div className="form-group mb-0">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
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
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCategory ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Import Categories ({importData.length} found)</h3>
              <button onClick={() => setShowImportModal(false)} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="table-responsive" style={{ maxHeight: 300 }}>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    Import {importData.length} Categories
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

export default Categories;
