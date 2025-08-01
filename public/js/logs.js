// Logs management JavaScript

function showLogs() {
    currentView = 'logs';
    updateActiveNav('Logs');
    
    const content = $('#dashboardContent');
    content.html(`
        <div class="fade-in">
            <div class="row mb-4">
                <div class="col-12">
                    <h2 class="fw-bold mb-3">Activity Logs</h2>
                    <p class="text-muted">System activity and audit trail</p>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-3">
                    <label for="startDate" class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="startDate" onchange="filterLogs()">
                </div>
                <div class="col-md-3">
                    <label for="endDate" class="form-label">End Date</label>
                    <input type="date" class="form-control" id="endDate" onchange="filterLogs()">
                </div>
                <div class="col-md-3">
                    <label for="actionFilter" class="form-label">Action</label>
                    <select class="form-select" id="actionFilter" onchange="filterLogs()">
                        <option value="">All Actions</option>
                        <option value="LOGIN">Login</option>
                        <option value="REGISTER">Register</option>
                        <option value="CREATE_COOKIE">Create Cookie</option>
                        <option value="UPDATE_COOKIE">Update Cookie</option>
                        <option value="DELETE_COOKIE">Delete Cookie</option>
                        <option value="CREATE_ORDER">Create Order</option>
                        <option value="UPDATE_ORDER_STATUS">Update Order Status</option>
                        <option value="CANCEL_ORDER">Cancel Order</option>
                        <option value="CREATE_USER">Create User</option>
                        <option value="UPDATE_USER_ROLE">Update User Role</option>
                        <option value="DELETE_USER">Delete User</option>
                        <option value="DISABLE_CUSTOMER">Disable Customer</option>
                        <option value="ENABLE_CUSTOMER">Enable Customer</option>
                        <option value="PASSWORD_CHANGE">Password Change</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label for="userFilter" class="form-label">User</label>
                    <input type="text" class="form-control" id="userFilter" placeholder="Search by username..." onkeyup="filterLogs()">
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-12">
                    <button class="btn btn-secondary me-2" onclick="clearFilters()">
                        <i class="fas fa-times me-1"></i>Clear Filters
                    </button>
                    <button class="btn btn-outline-primary" onclick="refreshLogs()">
                        <i class="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Activity Logs</h5>
                            <small id="logCount" class="text-muted">Loading...</small>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped table-sm" id="logsTable">
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Action</th>
                                            <th>Details</th>
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

        <!-- Statistics Row -->
        <div class="row mt-4">
            <div class="col-md-3">
                <div class="stat-card primary">
                    <div class="stat-number" id="totalLogsCount">-</div>
                    <div class="stat-label">Total Logs</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card success">
                    <div class="stat-number" id="todayLogsCount">-</div>
                    <div class="stat-label">Today's Activity</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card warning">
                    <div class="stat-number" id="uniqueUsersCount">-</div>
                    <div class="stat-label">Active Users</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card info">
                    <div class="stat-number" id="topActionCount">-</div>
                    <div class="stat-label" id="topActionLabel">Most Common Action</div>
                </div>
            </div>
        </div>
    `);
    
    loadLogs();
    loadLogStats();
}

let allLogs = [];

function loadLogs() {
    const params = new URLSearchParams();
    
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();
    const action = $('#actionFilter').val();
    const user = $('#userFilter').val();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (action) params.append('action', action);
    if (user) params.append('userId', user);
    
    const url = '/api/logs' + (params.toString() ? '?' + params.toString() : '');
    
    $.get(url)
        .done(function(logs) {
            allLogs = logs;
            renderLogs(logs);
        })
        .fail(function() {
            $('#logsTable tbody').html('<tr><td colspan="5" class="text-center text-danger">Error loading logs.</td></tr>');
            $('#logCount').text('Error loading logs');
        });
}

function renderLogs(logs) {
    let html = '';
    
    logs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const actionClass = getActionClass(log.action);
        
        html += `
            <tr>
                <td><small>${timestamp}</small></td>
                <td><strong>${log.username}</strong></td>
                <td><span class="badge bg-secondary">${log.userRole}</span></td>
                <td><span class="badge ${actionClass}">${log.action}</span></td>
                <td><small>${log.details || '-'}</small></td>
            </tr>
        `;
    });
    
    if (logs.length === 0) {
        html = '<tr><td colspan="5" class="text-center text-muted">No logs found for the current filters.</td></tr>';
    }
    
    $('#logsTable tbody').html(html);
    $('#logCount').text(`${logs.length} log entries`);
}

function getActionClass(action) {
    const actionClasses = {
        'LOGIN': 'bg-success',
        'REGISTER': 'bg-info',
        'CREATE_COOKIE': 'bg-primary',
        'UPDATE_COOKIE': 'bg-warning',
        'DELETE_COOKIE': 'bg-danger',
        'CREATE_ORDER': 'bg-success',
        'UPDATE_ORDER_STATUS': 'bg-info',
        'CANCEL_ORDER': 'bg-warning',
        'CREATE_USER': 'bg-primary',
        'UPDATE_USER_ROLE': 'bg-warning',
        'DELETE_USER': 'bg-danger',
        'DISABLE_CUSTOMER': 'bg-warning',
        'ENABLE_CUSTOMER': 'bg-success',
        'PASSWORD_CHANGE': 'bg-info'
    };
    
    return actionClasses[action] || 'bg-secondary';
}

function loadLogStats() {
    $.get('/api/logs/stats')
        .done(function(stats) {
            $('#totalLogsCount').text(stats.totalLogs);
            $('#todayLogsCount').text(stats.todayLogs);
            
            // Count unique users
            const uniqueUsers = Object.keys(stats.userCounts).length;
            $('#uniqueUsersCount').text(uniqueUsers);
            
            // Find most common action
            const actions = Object.entries(stats.actionCounts);
            if (actions.length > 0) {
                const topAction = actions.reduce((a, b) => a[1] > b[1] ? a : b);
                $('#topActionCount').text(topAction[1]);
                $('#topActionLabel').text(topAction[0].replace(/_/g, ' '));
            }
        })
        .fail(function() {
            $('#totalLogsCount').text('Error');
            $('#todayLogsCount').text('Error');
            $('#uniqueUsersCount').text('Error');
            $('#topActionCount').text('Error');
        });
}

function filterLogs() {
    loadLogs();
}

function clearFilters() {
    $('#startDate').val('');
    $('#endDate').val('');
    $('#actionFilter').val('');
    $('#userFilter').val('');
    loadLogs();
}

function refreshLogs() {
    loadLogs();
    loadLogStats();
}