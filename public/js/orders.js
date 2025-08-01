// Orders management JavaScript

function showOrders() {
    currentView = 'orders';
    updateActiveNav('Orders');
    
    const content = $('#dashboardContent');
    
    if (currentUser.role === 'customer') {
        content.html(`
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="fw-bold mb-3">My Orders</h2>
                        <p class="text-muted">Track your cookie orders</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <div id="ordersList">
                                    <div class="text-center">
                                        <div class="spinner-border text-primary" role="status"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    } else {
        content.html(`
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="fw-bold mb-3">Order Management</h2>
                        <p class="text-muted">Manage all customer orders</p>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <select class="form-select" id="statusFilter" onchange="filterOrders()">
                            <option value="">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <input type="text" class="form-control" id="customerSearch" placeholder="Search by customer name..." onkeyup="filterOrders()">
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-striped" id="ordersTable">
                                        <thead>
                                            <tr>
                                                <th>Order #</th>
                                                <th>Customer</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colspan="7" class="text-center">
                                                    <div class="spinner-border text-primary" role="status"></div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Order Details Modal -->
            <div class="modal fade" id="orderDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Order Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="orderDetailsContent">
                            <!-- Content will be loaded dynamically -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Update Status Modal -->
            <div class="modal fade" id="updateStatusModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Order Status</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="statusAlert" class="alert d-none" role="alert"></div>
                            <input type="hidden" id="updateOrderId">
                            <div class="mb-3">
                                <label for="newStatus" class="form-label">New Status</label>
                                <select class="form-select" id="newStatus">
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="updateOrderStatus()">Update Status</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    loadOrders();
}

let allOrders = [];

function loadOrders() {
    $.get('/api/orders')
        .done(function(orders) {
            allOrders = orders;
            if (currentUser.role === 'customer') {
                renderCustomerOrders(orders);
            } else {
                renderManagerOrders(orders);
            }
        })
        .fail(function() {
            const errorMessage = '<div class="text-center text-danger">Error loading orders.</div>';
            if (currentUser.role === 'customer') {
                $('#ordersList').html(errorMessage);
            } else {
                $('#ordersTable tbody').html('<tr><td colspan="7" class="text-center text-danger">Error loading orders.</td></tr>');
            }
        });
}

function renderCustomerOrders(orders) {
    if (orders.length === 0) {
        $('#ordersList').html('<div class="text-center text-muted">You haven\'t placed any orders yet.</div>');
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        const statusClass = `status-${order.status}`;
        
        html += `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Order #${order._id}</strong>
                        <span class="badge ${statusClass} ms-2">${order.status}</span>
                    </div>
                    <div>
                        <small class="text-muted">${date}</small>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6>Items Ordered:</h6>
                            <ul class="list-unstyled">
                                ${order.items.map(item => `
                                    <li class="d-flex justify-content-between align-items-center mb-1">
                                        <span>${item.cookieName} x ${item.quantity}</span>
                                        <span>$${item.subtotal.toFixed(2)}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="col-md-4 text-end">
                            <h5 class="text-primary">Total: ₱${order.totalAmount.toFixed(2)}</h5>
                            <p class="mb-2"><strong>Shipping Address:</strong><br>
                            <small>${order.shippingAddress}</small></p>
                            <button class="btn btn-sm btn-outline-danger" onclick="cancelOrder('${order._id}')">
                                <i class="fas fa-times me-1"></i>Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    $('#ordersList').html(html);
}

function renderManagerOrders(orders) {
    let html = '';
    
    orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        const statusClass = `status-${order.status}`;
        
        html += `
            <tr>
                <td><strong>#${order._id}</strong></td>
                <td>${order.customerName}</td>
                <td>
                    <small>
                        ${order.items.map(item => `${item.cookieName} (${item.quantity})`).join(', ')}
                    </small>
                </td>
                <td><strong>₱${order.totalAmount.toFixed(2)}</strong></td>
                <td><span class="badge ${statusClass}">${order.status}</span></td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="showOrderDetails('${order._id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="showUpdateStatusModal('${order._id}', '${order.status}')" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${order.status === 'pending' || order.status === 'processing' ? 
                        `<button class="btn btn-sm btn-outline-danger" onclick="cancelOrder('${order._id}')" title="Cancel">
                            <i class="fas fa-times"></i>
                        </button>` : ''
                    }
                </td>
            </tr>
        `;
    });
    
    if (orders.length === 0) {
        html = '<tr><td colspan="7" class="text-center text-muted">No orders found.</td></tr>';
    }
    
    $('#ordersTable tbody').html(html);
}

function filterOrders() {
    const statusFilter = $('#statusFilter').val();
    const customerSearch = $('#customerSearch').val().toLowerCase();
    
    let filteredOrders = allOrders;
    
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    if (customerSearch) {
        filteredOrders = filteredOrders.filter(order => 
            order.customerName.toLowerCase().includes(customerSearch)
        );
    }
    
    renderManagerOrders(filteredOrders);
}

function showOrderDetails(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;
    
    const date = new Date(order.createdAt).toLocaleString();
    const statusClass = `status-${order.status}`;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Order Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Order ID:</strong></td><td>#${order._id}</td></tr>
                    <tr><td><strong>Customer:</strong></td><td>${order.customerName}</td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="badge ${statusClass}">${order.status}</span></td></tr>
                    <tr><td><strong>Order Date:</strong></td><td>${date}</td></tr>
                    <tr><td><strong>Total Amount:</strong></td><td><strong>₱${order.totalAmount.toFixed(2)}</strong></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Shipping Address</h6>
                <p class="border rounded p-2">${order.shippingAddress}</p>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Order Items</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Cookie</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.cookieName}</td>
                                    <td>₱${item.price.toFixed(2)}</td>
                                    <td>${item.quantity}</td>
                                    <td>₱${item.subtotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    $('#orderDetailsContent').html(content);
    $('#orderDetailsModal').modal('show');
}

function showUpdateStatusModal(orderId, currentStatus) {
    $('#updateOrderId').val(orderId);
    $('#newStatus').val(currentStatus);
    showStatusAlert('', '');
    $('#updateStatusModal').modal('show');
}

function updateOrderStatus() {
    const orderId = $('#updateOrderId').val();
    const newStatus = $('#newStatus').val();
    
    $.ajax({
        url: `/api/orders/${orderId}/status`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function(response) {
            showStatusAlert('success', response.message);
            setTimeout(() => {
                $('#updateStatusModal').modal('hide');
                loadOrders();
            }, 1500);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error updating order status';
            showStatusAlert('danger', error);
        }
    });
}

function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    $.ajax({
        url: `/api/orders/${orderId}`,
        method: 'DELETE',
        success: function(response) {
            showSuccessMessage(response.message);
            loadOrders();
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error cancelling order';
            showErrorMessage(error);
        }
    });
}

function showStatusAlert(type, message) {
    if (!message) {
        $('#statusAlert').addClass('d-none');
        return;
    }
    
    const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
    $('#statusAlert')
        .removeClass('d-none alert-danger alert-success')
        .addClass(alertClass)
        .text(message);
}