// Cookie management JavaScript

function showCookies() {
    currentView = 'cookies';
    updateActiveNav('Cookies');
    
    const content = $('#dashboardContent');
    
    if (currentUser.role === 'customer') {
        // Customer view - browse and add to cart
        content.html(`
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="fw-bold mb-3">Our Delicious Cookies</h2>
                        <p class="text-muted">Fresh baked daily with the finest ingredients</p>
                    </div>
                </div>
                <div class="row" id="cookiesList">
                    <div class="col-12 text-center">
                        <div class="spinner-border text-primary" role="status"></div>
                    </div>
                </div>
            </div>
        `);
        loadCookiesForCustomer();
    } else {
        // Manager/Admin view - manage cookies
        content.html(`
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2 class="fw-bold mb-3">Cookie Management</h2>
                        <p class="text-muted">Manage your cookie inventory</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="showAddCookieModal()">
                            <i class="fas fa-plus me-2"></i>Add New Cookie
                        </button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-striped" id="cookiesTable">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Price</th>
                                                <th>Stock</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colspan="6" class="text-center">
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

            <!-- Add/Edit Cookie Modal -->
            <div class="modal fade" id="cookieModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="cookieModalTitle">Add New Cookie</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="cookieAlert" class="alert d-none" role="alert"></div>
                            <form id="cookieForm" enctype="multipart/form-data">
                                <input type="hidden" id="cookieId">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="cookieName" class="form-label">Cookie Name</label>
                                            <input type="text" class="form-control" id="cookieName" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="cookiePrice" class="form-label">Price (₱)</label>
                                            <input type="number" class="form-control" id="cookiePrice" step="0.01" min="0" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="cookieStock" class="form-label">Stock Quantity</label>
                                            <input type="number" class="form-control" id="cookieStock" min="0" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="cookieDescription" class="form-label">Description</label>
                                            <textarea class="form-control" id="cookieDescription" rows="3" required></textarea>
                                        </div>
                                        <div class="mb-3">
                                            <label for="cookieImage" class="form-label">Cookie Image</label>
                                            <input type="file" class="form-control" id="cookieImage" accept="image/*">
                                            <div class="form-text">Leave empty to keep current image</div>
                                        </div>
                                        <div class="mb-3">
                                            <img id="imagePreview" src="" alt="Preview" class="img-thumbnail d-none" style="max-height: 150px;">
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveCookie()">Save Cookie</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        loadCookiesForManager();
    }
}

function loadCookiesForCustomer() {
    $.get('/api/cookies')
        .done(function(cookies) {
            let html = '';
            cookies.forEach(cookie => {
                html += `
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card cookie-card h-100">
                            <img src="${cookie.image}" class="card-img-top cookie-image" alt="${cookie.name}" onerror="this.src='/images/default-cookie.jpg'">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${cookie.name}</h5>
                                <p class="card-text text-muted flex-grow-1">${cookie.description}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="price-tag">₱${cookie.price.toFixed(2)}</div>
                                    <small class="text-muted">${cookie.stock} in stock</small>
                                </div>
                                <div class="mt-3">
                                    ${cookie.stock > 0 ? 
                                        `<button class="btn btn-primary w-100" onclick="addToCart('${cookie._id}')">
                                            <i class="fas fa-cart-plus me-2"></i>Add to Cart
                                        </button>` :
                                        `<button class="btn btn-secondary w-100" disabled>
                                            <i class="fas fa-times me-2"></i>Out of Stock
                                        </button>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            if (cookies.length === 0) {
                html = '<div class="col-12 text-center"><p class="text-muted">No cookies available at the moment.</p></div>';
            }
            
            $('#cookiesList').html(html);
        })
        .fail(function() {
            $('#cookiesList').html('<div class="col-12 text-center"><p class="text-danger">Error loading cookies.</p></div>');
        });
}

function loadCookiesForManager() {
    $.get('/api/cookies')
        .done(function(cookies) {
            let html = '';
            cookies.forEach(cookie => {
                html += `
                    <tr>
                        <td>
                            <img src="${cookie.image}" alt="${cookie.name}" class="img-thumbnail" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.src='/images/default-cookie.jpg'">
                        </td>
                        <td><strong>${cookie.name}</strong></td>
                        <td>${cookie.description}</td>
                        <td>₱${cookie.price.toFixed(2)}</td>
                        <td>
                            <span class="badge ${cookie.stock < 10 ? 'bg-warning' : 'bg-success'}">${cookie.stock}</span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editCookie('${cookie._id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCookie('${cookie._id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            if (cookies.length === 0) {
                html = '<tr><td colspan="6" class="text-center text-muted">No cookies found. Add some cookies to get started!</td></tr>';
            }
            
            $('#cookiesTable tbody').html(html);
        })
        .fail(function() {
            $('#cookiesTable tbody').html('<tr><td colspan="6" class="text-center text-danger">Error loading cookies.</td></tr>');
        });
}

function addToCart(cookieId) {
    $.get(`/api/cookies/${cookieId}`)
        .done(function(cookie) {
            const existingItem = cart.find(item => item.cookieId === cookieId);
            
            if (existingItem) {
                if (existingItem.quantity < cookie.stock) {
                    existingItem.quantity++;
                    showSuccessMessage(`Added another ${cookie.name} to cart`);
                } else {
                    showErrorMessage('Not enough stock available');
                    return;
                }
            } else {
                cart.push({
                    cookieId: cookie._id,
                    name: cookie.name,
                    price: cookie.price,
                    image: cookie.image,
                    quantity: 1
                });
                showSuccessMessage(`${cookie.name} added to cart`);
            }
            
            updateCartCount();
        })
        .fail(function() {
            showErrorMessage('Error adding item to cart');
        });
}

function showAddCookieModal() {
    $('#cookieModalTitle').text('Add New Cookie');
    $('#cookieForm')[0].reset();
    $('#cookieId').val('');
    $('#imagePreview').addClass('d-none');
    showCookieAlert('', '');
    $('#cookieModal').modal('show');
}

function editCookie(cookieId) {
    $.get(`/api/cookies/${cookieId}`)
        .done(function(cookie) {
            $('#cookieModalTitle').text('Edit Cookie');
            $('#cookieId').val(cookie._id);
            $('#cookieName').val(cookie.name);
            $('#cookieDescription').val(cookie.description);
            $('#cookiePrice').val(cookie.price);
            $('#cookieStock').val(cookie.stock);
            
            if (cookie.image) {
                $('#imagePreview').attr('src', cookie.image).removeClass('d-none');
            }
            
            showCookieAlert('', '');
            $('#cookieModal').modal('show');
        })
        .fail(function() {
            showErrorMessage('Error loading cookie details');
        });
}

function saveCookie() {
    const cookieId = $('#cookieId').val();

    const name = $('#cookieName').val();
    const description = $('#cookieDescription').val();
    const price = $('#cookiePrice').val();
    const stock = $('#cookieStock').val();

    // Validation rules
    const nameRegex = /^[a-zA-Z0-9\s\-'.]{2,50}$/; // 2–50 chars, basic chars
    const descriptionRegex = /^[\w\s\-.,'!@#%&()]{0,300}$/; // 10–300 chars
    const priceValue = parseFloat(price);
    const stockValue = parseInt(stock);

    if (!name || !nameRegex.test(name)) {
        return showCookieAlert('danger', 'Name must be 2–50 characters and contain only letters, numbers, spaces, or basic punctuation.');
    }

    if (!description || !descriptionRegex.test(description)) {
        return showCookieAlert('danger', 'Description must be at most 300 characters and contain valid punctuation.');
    }

    if (isNaN(priceValue) || priceValue < 1 || priceValue > 9999.99) {
        return showCookieAlert('danger', 'Price must be a number between 1.00 and 9999.99.');
    }

    if (!Number.isInteger(stockValue) || stockValue < 0 || stockValue > 10000) {
        return showCookieAlert('danger', 'Stock must be an integer between 0 and 10,000.');
    }

    const formData = new FormData();
    
    formData.append('name', $('#cookieName').val());
    formData.append('description', $('#cookieDescription').val());
    formData.append('price', $('#cookiePrice').val());
    formData.append('stock', $('#cookieStock').val());
    
    const imageFile = $('#cookieImage')[0].files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const url = cookieId ? `/api/cookies/${cookieId}` : '/api/cookies';
    const method = cookieId ? 'PUT' : 'POST';
    
    $.ajax({
        url: url,
        method: method,
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            showCookieAlert('success', response.message);
            setTimeout(() => {
                $('#cookieModal').modal('hide');
                loadCookiesForManager();
            }, 1500);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error saving cookie';
            showCookieAlert('danger', error);
        }
    });
}

function deleteCookie(cookieId) {
    if (!confirm('Are you sure you want to delete this cookie?')) {
        return;
    }
    
    $.ajax({
        url: `/api/cookies/${cookieId}`,
        method: 'DELETE',
        success: function(response) {
            showSuccessMessage(response.message);
            loadCookiesForManager();
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error deleting cookie';
            showErrorMessage(error);
        }
    });
}

function showCookieAlert(type, message) {
    if (!message) {
        $('#cookieAlert').addClass('d-none');
        return;
    }
    
    const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
    $('#cookieAlert')
        .removeClass('d-none alert-danger alert-success')
        .addClass(alertClass)
        .text(message);
}

// Image preview functionality
$(document).on('change', '#cookieImage', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            $('#imagePreview').attr('src', e.target.result).removeClass('d-none');
        };
        reader.readAsDataURL(file);
    }
});

function showCart() {
    currentView = 'cart';
    updateActiveNav('Cart');
    
    const content = $('#dashboardContent');
    content.html(`
        <div class="fade-in">
            <div class="row mb-4">
                <div class="col-md-8">
                    <h2 class="fw-bold mb-3">Shopping Cart</h2>
                    <p class="text-muted">Review your items before checkout</p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-success" onclick="showCheckout()" ${cart.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-credit-card me-2"></i>Proceed to Checkout
                    </button>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-8">
                    <div id="cartItems">
                        ${cart.length === 0 ? 
                            '<div class="card"><div class="card-body text-center text-muted">Your cart is empty</div></div>' :
                            ''
                        }
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Order Summary</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span id="cartSubtotal">$0.00</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Tax (8.5%)</span>
                                <span id="cartTax">$0.00</span>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between fw-bold">
                                <span>Total</span>
                                <span id="cartTotal">$0.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Checkout Modal -->
        <div class="modal fade" id="checkoutModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Checkout</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="checkoutAlert" class="alert d-none" role="alert"></div>
                        <form id="checkoutForm">
                            <div class="mb-3">
                                <label for="shippingAddress" class="form-label">Shipping Address</label>
                                <textarea class="form-control" id="shippingAddress" rows="3" required placeholder="Enter your complete shipping address"></textarea>
                            </div>
                            <div class="mb-3">
                                <h6>Order Summary</h6>
                                <div id="checkoutSummary"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="placeOrder()">Place Order</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    renderCart();
}

function renderCart() {
    if (cart.length === 0) {
        return;
    }
    
    let html = '';
    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${item.image}" alt="${item.name}" class="img-fluid rounded" onerror="this.src='/images/default-cookie.jpg'">
                    </div>
                    <div class="col-md-4">
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">₱${item.price.toFixed(2)} each</small>
                    </div>
                    <div class="col-md-3">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateCartQuantity(${index}, -1)">-</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="col-md-2 text-end">
                        <strong>₱${itemTotal.toFixed(2)}</strong>
                    </div>
                    <div class="col-md-1 text-end">
                        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    $('#cartItems').html(html);
    
    const tax = subtotal * 0.085;
    const total = subtotal + tax;
    
    $('#cartSubtotal').text('₱' + subtotal.toFixed(2));
    $('#cartTax').text('₱' + tax.toFixed(2));
    $('#cartTotal').text('₱' + total.toFixed(2));
}

function updateCartQuantity(index, change) {
    if (cart[index].quantity + change <= 0) {
        removeFromCart(index);
        return;
    }
    
    cart[index].quantity += change;
    updateCartCount();
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    renderCart();
    
    if (cart.length === 0) {
        showCart(); // Refresh the view
    }
}

function showCheckout() {
    if (cart.length === 0) {
        showErrorMessage('Your cart is empty');
        return;
    }
    
    let html = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="d-flex justify-content-between mb-1">
                <span>${item.name} x ${item.quantity}</span>
                <span>₱${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });
    
    const tax = total * 0.085;
    const grandTotal = total + tax;
    
    html += `
        <hr>
        <div class="d-flex justify-content-between mb-1">
            <span>Subtotal</span>
            <span>₱${total.toFixed(2)}</span>
        </div>
        <div class="d-flex justify-content-between mb-1">
            <span>Tax</span>
            <span>₱${tax.toFixed(2)}</span>
        </div>
        <div class="d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span>₱${grandTotal.toFixed(2)}</span>
        </div>
    `;
    
    $('#checkoutSummary').html(html);
    $('#checkoutModal').modal('show');
}

function placeOrder() {
    const shippingAddress = $('#shippingAddress').val();

    // Validate: required, 10–200 chars, basic punctuation and alphanumerics
    const addressRegex = /^[a-zA-Z0-9\s,.'\-#]{10,200}$/;
    
    if (!shippingAddress) {
        showCheckoutAlert('danger', 'Please enter a shipping address');
        return;
    }

    if (!addressRegex.test(shippingAddress)) {
        showCheckoutAlert('danger', 'Shipping address must be 10–200 characters and contain only letters, numbers, and basic punctuation.');
        return;
    }
    
    const orderItems = cart.map(item => ({
        cookieId: item.cookieId,
        quantity: item.quantity
    }));
    
    $.ajax({
        url: '/api/orders',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            items: orderItems,
            shippingAddress: shippingAddress
        }),
        success: function(response) {
            showCheckoutAlert('success', 'Order placed successfully!');
            cart = []; // Clear cart
            updateCartCount();
            
            setTimeout(() => {
                $('#checkoutModal').modal('hide');
                showOrders(); // Show orders page
            }, 2000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error placing order';
            showCheckoutAlert('danger', error);
        }
    });
}

function showCheckoutAlert(type, message) {
    const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
    $('#checkoutAlert')
        .removeClass('d-none alert-danger alert-success')
        .addClass(alertClass)
        .text(message);
}

// Utility functions
function showSuccessMessage(message) {
    // Create a temporary toast-like notification
    const toast = $(`
        <div class="alert alert-success alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('body').append(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const toast = $(`
        <div class="alert alert-danger alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('body').append(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}