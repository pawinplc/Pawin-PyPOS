import React from 'react';

const UserGuide = () => {
  const sections = [
    {
      title: 'Getting Started with POS',
      icon: 'ti-shopping-cart',
      steps: [
        'Select a category from the top bar to filter products.',
        'Click on a product image or name to add it to your cart.',
        'Use the + and - buttons in the cart to adjust quantities.',
        'Click "Checkout" and choose a payment method to complete the sale.',
        'Print or download the generated receipt.'
      ]
    },
    {
      title: 'Inventory Management',
      icon: 'ti-box',
      steps: [
        'Visit the "Items" page to add new stationery products.',
        'Set "Low Stock Alerts" to get notified when items are running out.',
        'Use the "Stock" page to record new shipments and bulk arrivals.',
        'Manage "Categories" to keep your store organized.'
      ]
    },
    {
      title: 'Sales & Reporting',
      icon: 'ti-chart-bar',
      steps: [
        'View the "Dashboard" for a quick summary of today\'s performance.',
        'Go to "Sales History" to view, search, or print past transactions.',
        'Generate "Monthly Reports" to export detailed CSV/Excel data for accounting.',
        'Monitor "Analytics" to identify your best-selling products.'
      ]
    },
    {
      title: 'Account & Settings',
      icon: 'ti-settings',
      steps: [
        'Change your password in the "Account" section.',
        'Admins can manage user permissions and add new staff accounts.',
        'Toggle between Light and Dark mode for your comfort.'
      ]
    }
  ];

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col">
          <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>User Guide & Onboarding</h2>
          <p className="text-muted">Master Pawin PyPOS with these simple instructions.</p>
        </div>
      </div>

      <div className="row">
        {sections.map((section, idx) => (
          <div key={idx} className="col-lg-6 mb-4">
            <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle p-3 me-3" style={{ backgroundColor: 'var(--primary-color-faint)', color: 'var(--primary-color)' }}>
                    <i className={`ti ${section.icon} fs-4`}></i>
                  </div>
                  <h4 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>{section.title}</h4>
                </div>
                <div className="ps-2">
                  {section.steps.map((step, sIdx) => (
                    <div key={sIdx} className="d-flex align-items-start mb-2">
                      <div className="badge rounded-pill bg-primary me-3 mt-1" style={{ fontSize: '10px' }}>{sIdx + 1}</div>
                      <p className="mb-0 text-muted">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-3 text-center" style={{ backgroundColor: 'var(--primary-color-faint)', border: '1px dashed var(--primary-color)' }}>
        <h5 className="fw-bold" style={{ color: 'var(--primary-color)' }}>Need Technical Support?</h5>
        <p className="text-muted mb-0">Contact our technical team at <span className="fw-bold">support@pawinplc.com</span> for any system issues.</p>
      </div>
    </div>
  );
};

export default UserGuide;
