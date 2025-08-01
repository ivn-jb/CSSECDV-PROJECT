// Dashboard JavaScript

// Redirect to login if not authenticated
fetch('/api/auth/me')
  .then(res => {
    if (!res.ok) {
      window.location.href = '/'; // go back to login page
      throw new Error('Unauthorized');
    }
    return res.json();
  })
  .then(user => {
    // Save user globally (optional, if you use currentUser)
    window.currentUser = user;

    // Now proceed to load dashboard based on role
    initDashboard();
  })
  .catch(err => {
    console.error('Auth check failed:', err);
  });

let currentUser = null;
let currentView = 'dashboard';

$(document).ready(function() {
    checkAuth();
});

function checkAuth() {
    $.get('/api/auth/me')
        .done(function(user) {
            currentUser = user;
            initializeDashboard();
        })
        .fail(function() {
            window.location.href = '/login.html';
        });
}

function initializeDashboard() {
    updateNavigation();
    showDashboard();
}



function updateNavigation() {
    $('#currentUser').text(currentUser.username + ' (' + currentUser.role + ')');
    
    const navLinks = $('#navLinks');
    navLinks.empty();
    
    // Common links
    navLinks.append(`
        <li class="nav-item">
            <a class="nav-link" href="#" onclick="showDashboard()">
                <i class="fas fa-tachometer-alt me-1"></i>Dashboard
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#" onclick="showCookies()">
                <i class="fas fa-cookie-bite me-1"></i>Cookies
            </a>
        </li>
    `);

    // Role-specific links
    if (currentUser.role === 'customer') {
        navLinks.append(`
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showCart()">
                    <i class="fas fa-shopping-cart me-1"></i>Cart <span id="cartCount" class="badge bg-warning">0</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showOrders()">
                    <i class="fas fa-list-alt me-1"></i>My Orders
                </a>
            </li>
        `);
    } else if (currentUser.role === 'manager') {
        navLinks.append(`
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showOrders()">
                    <i class="fas fa-list-alt me-1"></i>Orders
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showCustomers()">
                    <i class="fas fa-users me-1"></i>Customers
                </a>
            </li>
        `);
    } else if (currentUser.role === 'admin') {
        navLinks.append(`
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showOrders()">
                    <i class="fas fa-list-alt me-1"></i>Orders
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showUsers()">
                    <i class="fas fa-users-cog me-1"></i>Users
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showLogs()">
                    <i class="fas fa-history me-1"></i>Logs
                </a>
            </li>
        `);
    }
}

function showDashboard() {
    currentView = 'dashboard';
    updateActiveNav('Dashboard');
    
    const content = $('#dashboardContent');
    
    if (currentUser.role === 'customer') {
        content.html(`
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="fw-bold mb-3">Welcome back, ${currentUser.username}!</h2>
                        <p class="text-muted">Discover our delicious collection of freshly baked cookies</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card primary">
                            <div class="stat-number" id="customerOrders">-</div>
                            <div class="stat-label">My Orders</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card success">
                            <div class="stat-number" id="cartItems">0</div>
                            <div class="stat-label">Items in Cart</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card warning">
                            <div class="stat-number" id="totalSpent">₱0</div>
                            <div class="stat-label">Total Spent</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card info">
                            <div class="stat-number" id="availableCookies">-</div>
                            <div class="stat-label">Available Cookies</div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-star me-2"></i>Featured Cookies</h5>
                            </div>
                            <div class="card-body" id="featuredCookies">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        loadCustomerDashboard();
    } else if (currentUser.role === 'manager') {
        content.html(`
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="fw-bold mb-3">Manager Dashboard</h2>
                        <p class="text-muted">Manage cookies, orders, and customers</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card primary">
                            <div class="stat-number" id="totalCookies">-</div>
                            <div class="stat-label">Total Cookies</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card success">
                            <div class="stat-number" id="totalOrders">-</div>
                            <div class="stat-label">Total Orders</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card warning">
                            <div class="stat-number" id="pendingOrders">-</div>
                            <div class="stat-label">Pending Orders</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card info">
                            <div class="stat-number" id="totalCustomers">-</div>
                            <div class="stat-label">Customers</div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-clock me-2"></i>Recent Orders</h5>
                            </div>
                            <div class="card-body" id="recentOrders">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Low Stock Cookies</h5>
                            </div>
                            <div class="card-body" id="lowStockCookies">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        loadManagerDashboard();
    } else if (currentUser.role === 'admin') {
        content.html(`
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="fw-bold mb-3">Administrator Dashboard</h2>
                        <p class="text-muted">System overview and management</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card primary">
                            <div class="stat-number" id="totalUsers">-</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card success">
                            <div class="stat-number" id="totalOrders">-</div>
                            <div class="stat-label">Total Orders</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card warning">
                            <div class="stat-number" id="totalLogs">-</div>
                            <div class="stat-label">Activity Logs</div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="stat-card info">
                            <div class="stat-number" id="todayLogs">-</div>
                            <div class="stat-label">Today's Activity</div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-history me-2"></i>Recent Activity</h5>
                            </div>
                            <div class="card-body" id="recentActivity">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-users me-2"></i>User Distribution</h5>
                            </div>
                            <div class="card-body" id="userDistribution">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        loadAdminDashboard();
    }
}

function loadCustomerDashboard() {
    // Load customer statistics
    $.get('/api/orders').done(function(orders) {
        $('#customerOrders').text(orders.length);
        
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        $('#totalSpent').text('₱' + totalSpent.toFixed(2));
    });
    
    $.get('/api/cookies').done(function(cookies) {
        $('#availableCookies').text(cookies.length);
        
        // Show featured cookies (first 3)
        const featured = cookies.slice(0, 3);
        let html = '<div class="row">';
        featured.forEach(cookie => {
            html += `
                <div class="col-md-4">
                    <div class="card cookie-card mb-3">
                        <img src="${cookie.image}" class="card-img-top cookie-image" alt="${cookie.name}" onerror="this.src='/images/default-cookie.jpg'">
                        <div class="card-body">
                            <h6 class="card-title">${cookie.name}</h6>
                            <p class="card-text text-muted small">${cookie.description}</p>
                            <div class="price-tag">₱${cookie.price.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        $('#featuredCookies').html(html);
    });
    
    // Update cart count
    updateCartCount();
}

function loadManagerDashboard() {
    // Load manager statistics
    $.get('/api/cookies').done(function(cookies) {
        $('#totalCookies').text(cookies.length);
        
        // Show low stock cookies
        const lowStock = cookies.filter(c => c.stock < 10);
        let html = '';
        if (lowStock.length === 0) {
            html = '<p class="text-muted">All cookies are well stocked!</p>';
        } else {
            lowStock.forEach(cookie => {
                html += `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>${cookie.name}</span>
                        <span class="badge bg-warning">${cookie.stock} left</span>
                    </div>
                `;
            });
        }
        $('#lowStockCookies').html(html);
    });
    
    $.get('/api/orders').done(function(orders) {
        $('#totalOrders').text(orders.length);
        
        const pending = orders.filter(o => o.status === 'pending');
        $('#pendingOrders').text(pending.length);
        
        // Show recent orders
        const recent = orders.slice(0, 5);
        let html = '';
        if (recent.length === 0) {
            html = '<p class="text-muted">No orders yet</p>';
        } else {
            recent.forEach(order => {
                html += `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <strong>Order #${order._id}</strong><br>
                            <small>${order.customerName}</small>
                        </div>
                        <div class="text-end">
                            <div class="badge status-${order.status}">${order.status}</div><br>
                            <small>₱${order.totalAmount.toFixed(2)}</small>
                        </div>
                    </div>
                `;
            });
        }
        $('#recentOrders').html(html);
    });
    
    $.get('/api/customers').done(function(customers) {
        $('#totalCustomers').text(customers.length);
    });
}

function loadAdminDashboard() {
    // Load admin statistics
    $.get('/api/users').done(function(users) {
        $('#totalUsers').text(users.length);
        
        // Show user distribution
        const roleCount = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
        
        let html = '';
        Object.entries(roleCount).forEach(([role, count]) => {
            html += `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-capitalize">${role}s</span>
                    <span class="badge bg-primary">${count}</span>
                </div>
            `;
        });
        $('#userDistribution').html(html);
    });
    
    $.get('/api/orders').done(function(orders) {
        $('#totalOrders').text(orders.length);
    });
    
    $.get('/api/logs/stats').done(function(stats) {
        $('#totalLogs').text(stats.totalLogs);
        $('#todayLogs').text(stats.todayLogs);
        
        // Show recent activity
        $.get('/api/logs?limit=5').done(function(logs) {
            let html = '';
            if (logs.length === 0) {
                html = '<p class="text-muted">No recent activity</p>';
            } else {
                logs.slice(0, 5).forEach(log => {
                    const date = new Date(log.timestamp).toLocaleString();
                    html += `
                        <div class="mb-2">
                            <strong>${log.username}</strong>
                            <span class="text-muted">${log.action}</span><br>
                            <small class="text-muted">${date}</small>
                        </div>
                    `;
                });
            }
            $('#recentActivity').html(html);
        });
    });
}

function updateActiveNav(activeItem) {
    $('#navLinks .nav-link').removeClass('active');
    $('#navLinks .nav-link').each(function() {
        if ($(this).text().trim().includes(activeItem)) {
            $(this).addClass('active');
        }
    });
}

function showProfile() {
    $('#lastLoginText').text(currentUser.previousLogin 
        ? new Date(currentUser.previousLogin).toLocaleString() 
        : 'No login history');

    $('#lastFailedLoginText').text(currentUser.lastFailedLogin 
        ? new Date(currentUser.lastFailedLogin).toLocaleString() 
        : 'No failed login history');

    $('#profileModal').modal('show');
}

function changePassword() {
    const currentPassword = $('#currentPassword').val();
    const newPassword = $('#newPassword').val();
    const confirmNewPassword = $('#confirmNewPassword').val();
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showProfileAlert('danger', 'Please fill in all fields');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showProfileAlert('danger', 'New passwords do not match');
        return;
    }
    
    if (newPassword.length < 8) {
        showProfileAlert('danger', 'Password must be at least 8 characters long');
        return;
    }

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;
    if (!passwordComplexityRegex.test(newPassword)) {
        showProfileAlert('danger', 'Password must include uppercase, lowercase, number, and special character');
        return;
    }
    
    $.ajax({
        url: '/api/auth/change-password',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ currentPassword, newPassword }),
        success: function(response) {
            showProfileAlert('success', 'Password changed successfully');
            $('#changePasswordForm')[0].reset();
            setTimeout(() => {
                $('#profileModal').modal('hide');
            }, 2000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error changing password';
            showProfileAlert('danger', error);
        }
    });
}

function showProfileAlert(type, message) {
    const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
    $('#profileAlert')
        .removeClass('d-none alert-danger alert-success')
        .addClass(alertClass)
        .text(message);
    
    setTimeout(() => {
        $('#profileAlert').addClass('d-none');
    }, 5000);
}

// Initialize cart if customer
let cart = [];

function updateCartCount() {
    if (currentUser && currentUser.role === 'customer') {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        $('#cartCount').text(count);
        $('#cartItems').text(count);
    }
}

function showSecurityAlert(type, message) {
  const alertBox = $('#securityQuestionsAlert');
  alertBox
    .removeClass('d-none alert-success alert-danger')
    .addClass(type === 'success' ? 'alert-success' : 'alert-danger')
    .text(message);

  // Auto-hide after 5 seconds
  setTimeout(() => alertBox.addClass('d-none'), 5000);
}


// make sec answers
$('#securityQuestionsForm').on('submit', function (e) {
  e.preventDefault();

  const answer1 = $('#answer1').val();
  const answer2 = $('#answer2').val();
  const password = $('#authPassword').val();

  // Simple validation function
  function isValidAnswer(ans) {
    return ans.length >= 3 && /^[a-zA-Z0-9\s!?@#%&\-_,.]+$/.test(ans);
  }

  if (!isValidAnswer(answer1)) {
    showSecurityAlert('danger', 'Answer 1 must be at least 3 characters and contain only letters, numbers, or basic punctuation.');
    return;
  }

  if (!isValidAnswer(answer2)) {
    showSecurityAlert('danger', 'Answer 2 must be at least 3 characters and contain only letters, numbers, or basic punctuation.');
    return;
  }

  if (!password) {
    showSecurityAlert('danger', 'You must enter your password to confirm.');
    return;
  }

  const data = {
    question1: $('#question1').val(),
    answer1: answer1,
    question2: $('#question2').val(),
    answer2: answer2,
    password: password
  };

  $.ajax({
    url: '/api/auth/set-security-questions',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data),
    success: function () {
      $('#securityQuestionsModal').modal('hide');
      showSecurityAlert('success', 'Security questions saved!');
    },
    error: function (xhr) {
      const msg = xhr.responseJSON?.error || 'Something went wrong.';
      showSecurityAlert('danger', msg);
    }
  });
});