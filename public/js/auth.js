// Authentication JavaScript
$(document).ready(function() {
    // Check if user is already logged in
    checkAuthStatus();

    // Login form handler
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        
        if (!username || !password) {
            showAlert('error', 'Please fill in all fields');
            return;
        }

        // Username: 3–30 characters, alphanumeric and underscore only
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
            showAlert('error', 'Invalid credentials');
            return;
        }

        login(username, password);
    });

    // Register form handler
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        // 1. fill in all fields
        if (!username || !email || !password || !confirmPassword) {
            showAlert('error', 'Please fill in all fields');
            return;
        }

        // 2. Username: 3–30 chars, no leading/trailing whitespace, only alphanumerics and underscores
        const usernameRegex = /^(?!.*\s{2,})[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
            showAlert('error', 'Username must be 3–30 characters long and contain only letters, numbers, or underscores');
            return;
        }

        // 3. Email: basic structure, max 254 characters
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email) || email.length > 254) {
            showAlert('error', 'Invalid email format');
            return;
        }

        // 4. Password: 8–100 characters, must include uppercase, lowercase, number, and special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,100}$/;
        if (!passwordRegex.test(password)) {
            showAlert('error', 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
            return;
        }

        // 5. Passwords match exactly
        if (password !== confirmPassword) {
            showAlert('error', 'Passwords do not match');
            return;
        }        

        register(username, email, password);
    });
});

function checkAuthStatus() {
    $.get('/api/auth/me')
        .done(function(data) {
            // User is logged in, redirect to dashboard
            if (window.location.pathname === '/' || window.location.pathname === '/login.html') {
                window.location.href = '/dashboard.html';
            }

            if (!data.lastChangePwrd) {
                setTimeout(() => $('#securityQuestionsModal').modal('show'), 500);
            }
        })
        .fail(function() {
            // User is not logged in
            if (window.location.pathname === '/dashboard.html') {
                window.location.href = '/login.html';
            }
        });
}

function login(username, password) {
    const loginBtn = $('#loginForm button[type="submit"]');
    const originalText = loginBtn.html();
    
    loginBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Signing In...').prop('disabled', true);
    
    $.ajax({
        url: '/api/auth/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ username, password }),
        success: function(response) {
            showAlert('success', 'Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Login failed';
            showAlert('error', error);
            loginBtn.html(originalText).prop('disabled', false);
        }
    });
}

function register(username, email, password) {
    const registerBtn = $('#registerForm button[type="submit"]');
    const originalText = registerBtn.html();
    
    registerBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Creating Account...').prop('disabled', true);
    
    $.ajax({
        url: '/api/auth/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ username, email, password }),
        success: function(response) {
            showAlert('success', 'Registration successful! You can now login.');
            $('#registerForm')[0].reset();
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Registration failed';
            showAlert('error', error);
            registerBtn.html(originalText).prop('disabled', false);
        }
    });
}

function logout() {
    $.ajax({
        url: '/api/auth/logout',
        method: 'POST',
        success: function() {
            window.location.href = '/login.html';
        },
        error: function() {
            // Even if logout fails, redirect to login
            window.location.href = '/login.html';
        }
    });
}

function showAlert(type, message) {
    const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
    const alertId = type === 'error' ? 'errorAlert' : 'successAlert';
    
    $(`#${alertId}`)
        .removeClass('d-none')
        .addClass(alertClass)
        .text(message);
    
    // Hide other alert
    const otherId = type === 'error' ? 'successAlert' : 'errorAlert';
    $(`#${otherId}`).addClass('d-none');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        $(`#${alertId}`).addClass('d-none');
    }, 5000);
}

// Reset Password Flow

let currentUsername = '';

function showResetAlert(type, message) {
    const alert = $('#alert');
    alert
        .removeClass(function (index, className) {
            return (className.match(/(^|\s)alert-\S+/g) || []).join(' ');
        })
        .addClass(`alert alert-${type}`)
        .removeClass('d-none')
        .text(message);

    setTimeout(() => alert.addClass('d-none'), 5000);
}

// Step 1: Submit username
$('#usernameForm').on('submit', function (e) {
    e.preventDefault();
    const username = $('#username').val();
    if (!username) return showResetAlert('danger', 'Username is required.');

    // Validate username format: 3–30 characters, alphanumeric + underscore
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
        return showResetAlert('danger', 'User not found');
    }

    $.ajax({
        url: `/api/auth/security-question?username=${encodeURIComponent(username)}`,
        method: 'GET',
        success: function (res) {
            currentUsername = username;
            $('#securityQuestion1').val(res.question1);
            $('#securityQuestion2').val(res.question2);

            $('#step1').removeClass('active');
            $('#step2').addClass('active');
            showResetAlert('success', 'Security questions loaded.');
        },
        error: function (xhr) {
            const message =
                xhr.responseJSON && xhr.responseJSON.error
                    ? xhr.responseJSON.error
                    : 'Error resetting password. Try again later.';
            showResetAlert('danger', message);
        }
    });
});

// Step 2: Submit answers
$('#securityForm').on('submit', function (e) {
    e.preventDefault();

    const answer1 = $('#answer1').val();
    const answer2 = $('#answer2').val();

    const answerRegex = /^[a-zA-Z0-9\s!?@#%&\-_,.]{3,100}$/;

    if (!answer1 || !answer2)
        return showResetAlert('danger', 'Please answer both questions.');

    if (!answerRegex.test(answer1)) {
        return showResetAlert('danger', 'Incorrect answers');
    }

    if (!answerRegex.test(answer2)) {
        return showResetAlert('danger', 'Incorrect answers');
    }

    $.ajax({
        url: '/api/auth/verify-answers',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            username: currentUsername,
            answer1,
            answer2
        }),
        success: function () {
            $('#step2').removeClass('active');
            $('#step3').addClass('active');
            showResetAlert('success', 'Security answers verified.');
        },
        error: function (xhr) {
            const message =
                xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : 'Error resetting password. Try again later.';
            showResetAlert('danger', message);
        }
    });
});

// Step 3: Reset password
$('#resetForm').on('submit', function (e) {
    e.preventDefault();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    if (!newPassword || !confirmPassword)
        return showResetAlert('danger', 'Please fill in all password fields.');

    if (newPassword !== confirmPassword)
        return showResetAlert('danger', 'Passwords do not match.');

    if (newPassword.length < 8)
        return showResetAlert('danger', 'Password must be at least 8 characters long.');

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;
    if (!passwordComplexityRegex.test(newPassword))
        return showResetAlert(
            'danger',
            'Password must include uppercase, lowercase, number, and special character.'
        );

    $.ajax({
        url: '/api/auth/reset-password',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            username: currentUsername,
            newPassword
        }),
        success: function () {
            showResetAlert('success', 'Password successfully reset. You can now log in.');
            $('#resetForm button').prop('disabled', true);

            setTimeout(() => {
                currentUsername = '';
                window.location.href = '/login.html';
            }, 1500);
        },
        error: function (xhr) {
            const message =
                xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : 'Error resetting password. Try again later.';
            showResetAlert('danger', message);
        }
    });
});

        