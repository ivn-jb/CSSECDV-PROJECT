// User management JavaScript

let reauthCallback = null;

let onReauthSuccess = null;

function requireReauth(callback) {
    $('#reauthPassword').val('');
    $('#reauthAlert').addClass('d-none').text('');
    onReauthSuccess = callback;
    new bootstrap.Modal(document.getElementById('reauthModal')).show();
}

function confirmReauth() {
    const password = $('#reauthPassword').val();
    if (!password) return;

    $.ajax({
        url: '/api/auth/reauthenticate',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ password }),
        success: function () {
            bootstrap.Modal.getInstance(document.getElementById('reauthModal')).hide();
            if (typeof onReauthSuccess === 'function') onReauthSuccess();
        },
        error: function (xhr) {
            $('#reauthAlert')
                .removeClass('d-none alert-success')
                .addClass('alert alert-danger')
                .text(xhr.responseJSON?.message || 'Incorrect password.');
        }
    });
}

function showUsers() {
    currentView = 'users';
    updateActiveNav('Users');
    
    const content = $('#dashboardContent');
    content.html(`
        

        <!-- Main -->
        <div class="fade-in">
            <div class="row mb-4">
                <div class="col-md-8">
                    <h2 class="fw-bold mb-3">User Management</h2>
                    <p class="text-muted">Manage administrators and managers</p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-primary" onclick="showAddUserModal()">
                        <i class="fas fa-user-plus me-2"></i>Add User
                    </button>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped" id="usersTable">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td colspan="5" class="text-center">
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

        <!-- Add User Modal -->
        <div class="modal fade" id="addUserModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New User</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="userAlert" class="alert d-none" role="alert"></div>
                        <form id="addUserForm">
                            <div class="mb-3">
                                <label for="newUsername" class="form-label">Username</label>
                                <input type="text" class="form-control" id="newUsername" required>
                            </div>
                            <div class="mb-3">
                                <label for="newEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="newEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="newPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="newPassword" required minlength="6">
                            </div>
                            <div class="mb-3">
                                <label for="newRole" class="form-label">Role</label>
                                <select class="form-select" id="newRole" required>
                                    <option value="">Select Role</option>
                                    <option value="admin">Administrator</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="checkCreateUserForm()">Create User</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Change Role Modal -->
        <div class="modal fade" id="changeRoleModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Change User Role</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="roleAlert" class="alert d-none" role="alert"></div>
                        <input type="hidden" id="changeRoleUserId">
                        <div class="mb-3">
                            <label for="changeRoleSelect" class="form-label">New Role</label>
                            <select class="form-select" id="changeRoleSelect">
                                <option value="admin">Administrator</option>
                                <option value="manager">Manager</option>
                                <option value="customer">Customer</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="requireReauth(changeUserRole)">Change Role</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Re-authentication Modal -->
        <div class="modal fade" id="reauthModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm Your Password</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="reauthAlert" class="alert d-none" role="alert"></div>
                    <input type="password" class="form-control mb-2" id="reauthPassword" placeholder="Enter your password">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-primary" onclick="confirmReauth()">Confirm</button>
                </div>
                </div>
            </div>
        </div>
    `);
    
    loadUsers();
}

function authenticate(){

}

function showCustomers() {
    currentView = 'customers';
    updateActiveNav('Customers');
    
    const content = $('#dashboardContent');
    content.html(`
        <div class="fade-in">
            <div class="row mb-4">
                <div class="col-12">
                    <h2 class="fw-bold mb-3">Customer Management</h2>
                    <p class="text-muted">View and manage customer accounts</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped" id="customersTable">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Registration Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td colspan="5" class="text-center">
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
    `);
    
    loadCustomers();
}

function loadUsers() {
    $.get('/api/users')
        .done(function(users) {
            let html = '';
            users.forEach(user => {
                const date = new Date(user.createdAt).toLocaleDateString();
                const roleClass = user.role === 'admin' ? 'bg-danger' : 'bg-warning';
                
                html += `
                    <tr>
                        <td><strong>${user.username}</strong></td>
                        <td>${user.email}</td>
                        <td><span class="badge ${roleClass}">${user.role}</span></td>
                        <td>${date}</td>
                        <td>
                            ${user._id !== currentUser._id ? `
                                <button class="btn btn-sm btn-outline-warning me-1" onclick="showChangeRoleModal('${user._id}', '${user.role}')" title="Change Role">
                                    <i class="fas fa-user-tag"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user._id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : '<span class="text-muted">Current User</span>'}
                        </td>
                    </tr>
                `;
            });
            
            if (users.length === 0) {
                html = '<tr><td colspan="5" class="text-center text-muted">No users found.</td></tr>';
            }
            
            $('#usersTable tbody').html(html);
        })
        .fail(function() {
            $('#usersTable tbody').html('<tr><td colspan="5" class="text-center text-danger">Error loading users.</td></tr>');
        });
}

function loadCustomers() {
    $.get('/api/customers')
        .done(function(customers) {
            let html = '';
            customers.forEach(customer => {
                const date = new Date(customer.createdAt).toLocaleDateString();
                const isDisabled = customer.disabled || false;
                
                html += `
                    <tr>
                        <td><strong>${customer.username}</strong></td>
                        <td>${customer.email}</td>
                        <td>${date}</td>
                        <td>
                            <span class="badge ${isDisabled ? 'bg-danger' : 'bg-success'}">
                                ${isDisabled ? 'Disabled' : 'Active'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-${isDisabled ? 'success' : 'warning'}" 
                                    onclick="toggleCustomerStatus('${customer._id}', ${!isDisabled})" 
                                    title="${isDisabled ? 'Enable' : 'Disable'} Customer">
                                <i class="fas fa-${isDisabled ? 'check' : 'ban'}"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            if (customers.length === 0) {
                html = '<tr><td colspan="5" class="text-center text-muted">No customers found.</td></tr>';
            }
            
            $('#customersTable tbody').html(html);
        })
        .fail(function() {
            $('#customersTable tbody').html('<tr><td colspan="5" class="text-center text-danger">Error loading customers.</td></tr>');
        });
}

function showAddUserModal() {
    $('#addUserForm')[0].reset();
    showUserAlert('', '');
    $('#addUserModal').modal('show');
}

function checkCreateUserForm(){
    const username = $('#newUsername').val();
    const email = $('#newEmail').val();
    const password = $('#newPassword').val();
    const role = $('#newRole').val();

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#%&])[A-Za-z\d!@#%&]{8,100}$/;

    if (!username || !email || !password || !role) {
        return showUserAlert('danger', 'Please fill in all fields.');
    }

    if (!usernameRegex.test(username)) {
        return showUserAlert('danger', 'Username must be 3–30 characters and contain only letters, numbers, or underscores.');
    }

    if (!emailRegex.test(email)) {
        return showUserAlert('danger', 'Please enter a valid email address.');
    }

    if (!passwordRegex.test(password)) {
        return showUserAlert('danger', 'Password must be 8–100 characters long and include uppercase, lowercase, number, and special character (!@#%&).');
    }

    requireReauth(createUser);

}

function createUser() {
    const username = $('#newUsername').val();
    const email = $('#newEmail').val();
    const password = $('#newPassword').val();
    const role = $('#newRole').val();
    
    $.ajax({
        url: '/api/users',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ username, email, password, role }),
        success: function(response) {
            showUserAlert('success', response.message);
            setTimeout(() => {
                $('#addUserModal').modal('hide');
                loadUsers();
            }, 1500);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error creating user';
            showUserAlert('danger', error);
        }
    });
}

function showChangeRoleModal(userId, currentRole) {
    $('#changeRoleUserId').val(userId);
    $('#changeRoleSelect').val(currentRole);
    showRoleAlert('', '');
    $('#changeRoleModal').modal('show');
}

function changeUserRole() {
    const userId = $('#changeRoleUserId').val();
    const newRole = $('#changeRoleSelect').val();
    
    $.ajax({
        url: `/api/users/${userId}/role`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ role: newRole }),
        success: function(response) {
            showRoleAlert('success', response.message);
            setTimeout(() => {
                $('#changeRoleModal').modal('hide');
                loadUsers();
            }, 1500);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error changing user role';
            showRoleAlert('danger', error);
        }
    });
}

function deleteUser(userId) {
    requireReauth(() => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        $.ajax({
            url: `/api/users/${userId}`,
            method: 'DELETE',
            success: function(response) {
                showSuccessMessage(response.message);
                loadUsers();
            },
            error: function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error deleting user';
                showErrorMessage(error);
            }
        });
    });
}

function toggleCustomerStatus(customerId, disable) {
    const action = disable ? 'disable' : 'enable';
    
    if (!confirm(`Are you sure you want to ${action} this customer?`)) {
        return;
    }
    
    $.ajax({
        url: `/api/customers/${customerId}/status`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ disabled: disable }),
        success: function(response) {
            showSuccessMessage(response.message);
            loadCustomers();
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : `Error ${action}ing customer`;
            showErrorMessage(error);
        }
    });
}

function showUserAlert(type, message) {
    if (!message) {
        $('#userAlert').addClass('d-none');
        return;
    }
    
    const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
    $('#userAlert')
        .removeClass('d-none alert-danger alert-success')
        .addClass(alertClass)
        .text(message);
}

function showRoleAlert(type, message) {
    if (!message) {
        $('#roleAlert').addClass('d-none');
        return;
    }
    
    const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
    $('#roleAlert')
        .removeClass('d-none alert-danger alert-success')
        .addClass(alertClass)
        .text(message);
}