console.log('Script loaded!');

// Global variables
let currentScreen = 'login';
let currentCategory = null;
let currentUser = null;
let currentTotal = 0;
let discountRate = 0;
let cart = [];
let lastTransaction = null;
const VAT_RATE = 0.12;

// Session timeout in minutes
const SESSION_TIMEOUT = 30;

// Sample data for the POS system
const sampleUsers = [
    { username: 'admin', password: 'admin', role: 'Admin' },
    { username: 'cashier', password: 'cashier', role: 'Cashier' }
];

// --- Replacement for sampleCategories (Around line 17 in original script.js) ---
// IMPORTANT: These paths require an 'images' folder with the corresponding files.
const sampleCategories = [
    { name: 'Lipstick', image: 'images/1.png' },
    { name: 'Foundation', image: 'images/2.png' },
    { name: 'Concealer', image: 'images/3.png' },
    { name: 'Blush', image: 'images/4.png' },
    { name: 'Eyeshadow', image: 'images/14.png' },
    { name: 'Skincare', image: 'images/11.png' }
];

// --- Replacement for sampleProducts (Around line 25 in original script.js) ---
const sampleProducts = [
    { category: 'Lipstick', name: 'Velvet Matte Lipstick', price: 299.99, image: 'images/7.png' },
    { category: 'Lipstick', name: 'Glossy Lip Gloss', price: 199.99, image: 'images/8.png' },
    { category: 'Foundation', name: 'Full Coverage Foundation', price: 599.99, image: 'images/9.png' },
    { category: 'Foundation', name: 'Lightweight BB Cream', price: 399.99, image: 'images/10.png' },
    { category: 'Concealer', name: 'Volume Concealer', price: 349.99, image: 'images/11.png' },
    { category: 'Concealer', name: 'Lengthening Concealer', price: 329.99, image: 'images/12.png' },
    { category: 'Blush', name: 'Powder Blush', price: 249.99, image: 'images/13.png' },
    { category: 'Blush', name: 'Cream Blush', price: 279.99, image: 'images/14.png' },
    { category: 'Eyeshadow', name: 'Neutral Palette', price: 699.99, image: 'images/15.png' },
    { category: 'Eyeshadow', name: 'Colorful Palette', price: 799.99, image: 'images/16.png' },
    { category: 'Skincare', name: 'Moisturizer', price: 499.99, image: 'images/17.png' },
    { category: 'Skincare', name: 'Cleanser', price: 349.99, image: 'images/18.png' }
];

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    // Show login screen by default
    const loginScreen = document.getElementById('login-screen');
    const posScreen = document.getElementById('pos-screen');
    
    if (loginScreen) {
        loginScreen.style.display = 'flex';
    }
    
    if (posScreen) {
        posScreen.style.display = 'none';
    }
    
    // Initialize data
    initializeData();
    checkExistingSession();
    setupEventListeners();
    displayCategories();
    updateCartDisplay();
    
    // Add Enter key support for login
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Add Enter key support for admin login
    document.getElementById('admin-username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleAdminLogin();
    });
    
    document.getElementById('admin-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleAdminLogin();
    });
    
    window.addEventListener('beforeunload', saveSessionState);
    setInterval(checkSessionValidity, 60000);
    
    console.log('Initialization complete');
});

// Initialize data in localStorage
function initializeData() {
    // Only set sample data if it doesn't exist
    if (!localStorage.getItem('posUsers')) {
        localStorage.setItem('posUsers', JSON.stringify(sampleUsers));
    }
    
    // 💥 THIS IS THE CRITICAL FIX 💥
    // Always overwrite categories and products to ensure the fixed image paths are loaded.
    // (We did this in the previous fix, but reinforcing the need to ensure it runs now)
    localStorage.setItem('posCategories', JSON.stringify(sampleCategories));
    localStorage.setItem('posProducts', JSON.stringify(sampleProducts));

    if (!localStorage.getItem('posTransactions')) {
        localStorage.setItem('posTransactions', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('posLoginLogs')) {
        const sampleLogs = [
            { username: 'admin', login_time: new Date().toISOString(), login_type: 'Admin' },
            { username: 'cashier', login_time: new Date(Date.now() - 3600000).toISOString(), login_type: 'Main' },
            { username: 'admin', login_time: new Date(Date.now() - 7200000).toISOString(), login_type: 'Admin' },
        ];
        localStorage.setItem('posLoginLogs', JSON.stringify(sampleLogs));
    }
}

// Get data from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('posUsers') || '[]');
}

function getCategories() {
    return JSON.parse(localStorage.getItem('posCategories') || '[]');
}

function getProducts() {
    return JSON.parse(localStorage.getItem('posProducts') || '[]');
}

function getTransactions() {
    return JSON.parse(localStorage.getItem('posTransactions') || '[]');
}

function getLoginLogs() {
    return JSON.parse(localStorage.getItem('posLoginLogs') || '[]');
}

// Save data to localStorage
function saveUsers(users) {
    localStorage.setItem('posUsers', JSON.stringify(users));
}

function saveCategories(categories) {
    localStorage.setItem('posCategories', JSON.stringify(categories));
}

function saveProducts(products) {
    localStorage.setItem('posProducts', JSON.stringify(products));
}

function saveTransactions(transactions) {
    localStorage.setItem('posTransactions', JSON.stringify(transactions));
}

function saveLoginLogs(logs) {
    localStorage.setItem('posLoginLogs', JSON.stringify(logs));
}

// Check if user already has a valid session
function checkExistingSession() {
    const sessionData = JSON.parse(localStorage.getItem('posSession') || 'null');
    
    if (sessionData) {
        const now = new Date().getTime();
        const sessionAge = now - sessionData.loginTime;
        const sessionAgeMinutes = sessionAge / (1000 * 60);
        
        if (sessionAgeMinutes < SESSION_TIMEOUT) {
            currentUser = sessionData.username;
            currentScreen = sessionData.screen || 'pos';
            
            if (sessionData.cart) {
                cart = sessionData.cart;
            }
            
            if (sessionData.currentCategory) {
                currentCategory = sessionData.currentCategory;
            }
            
            if (currentScreen === 'pos') {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('pos-screen').style.display = 'flex';
                
                if (currentCategory) {
                    setTimeout(() => {
                        showProductsByCategory(currentCategory);
                    }, 100);
                }
            }
            
            console.log('Session restored for user:', currentUser);
        } else {
            localStorage.removeItem('posSession');
            console.log('Session expired');
        }
    }
}

// Save session state to localStorage
function saveSessionState() {
    if (currentUser) {
        const sessionData = {
            username: currentUser,
            loginTime: new Date().getTime(),
            screen: currentScreen,
            cart: cart,
            currentCategory: currentCategory
        };
        localStorage.setItem('posSession', JSON.stringify(sessionData));
    }
}

// Check session validity periodically
function checkSessionValidity() {
    const sessionData = JSON.parse(localStorage.getItem('posSession') || 'null');
    
    if (sessionData && currentUser) {
        const now = new Date().getTime();
        const sessionAge = now - sessionData.loginTime;
        const sessionAgeMinutes = sessionAge / (1000 * 60);
        
        if (sessionAgeMinutes >= SESSION_TIMEOUT) {
            logoutUser();
            alert('Your session has expired. Please log in again.');
        }
    }
}

// Logout function
function logoutUser() {
    localStorage.removeItem('posSession');
    currentUser = null;
    currentScreen = 'login';
    cart = [];
    currentCategory = null;
    discountRate = 0;
    
    document.getElementById('pos-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    hideAllModals();
}

// Hide all modal windows
function hideAllModals() {
    const modals = [
        'admin-login-dialog',
        'admin-panel',
        'product-management',
        'user-management',
        'daily-sales',
        'login-history',
        'receipt-popup',
        'product-form-modal',
        'category-form-modal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

// Set up all event listeners
function setupEventListeners() {
    // Login button
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    
    // Admin panel button
    document.getElementById('admin-panel-btn').addEventListener('click', showAdminLogin);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to log out?')) {
            logoutUser();
        }
    });
    
    // Admin login
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
    document.getElementById('cancel-admin-login').addEventListener('click', function() {
        document.getElementById('admin-login-dialog').style.display = 'none';
    });
    
    // Admin panel buttons
    document.getElementById('product-management-btn').addEventListener('click', showProductManagement);
    document.getElementById('user-management-btn').addEventListener('click', showUserManagement);
    document.getElementById('daily-sales-btn').addEventListener('click', showDailySales);
    document.getElementById('login-history-btn').addEventListener('click', showLoginHistory);
    document.getElementById('close-admin-btn').addEventListener('click', function() {
        document.getElementById('admin-panel').style.display = 'none';
    });
    
    // Cart buttons
    document.getElementById('remove-item-btn').addEventListener('click', removeCartItem);
    document.getElementById('clear-cart-btn').addEventListener('click', clearCart);
    
    // Payment buttons
    document.getElementById('apply-discount-btn').addEventListener('click', applyDiscount);
    document.getElementById('process-payment-btn').addEventListener('click', processPayment);
    document.getElementById('payment-input').addEventListener('input', updateChange);
    
    // Product management
    document.getElementById('close-product-management').addEventListener('click', function() {
        document.getElementById('product-management').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    });
    
    // Product management CRUD buttons
    document.getElementById('add-product-btn').addEventListener('click', addNewProduct);
    document.getElementById('edit-product-btn').addEventListener('click', editSelectedProduct);
    document.getElementById('delete-product-btn').addEventListener('click', deleteSelectedProduct);
    document.getElementById('add-category-btn').addEventListener('click', addNewCategory);
    document.getElementById('edit-category-btn').addEventListener('click', editSelectedCategory);
    document.getElementById('delete-category-btn').addEventListener('click', deleteSelectedCategory);
    document.getElementById('view-category-products-btn').addEventListener('click', viewCategoryProducts);
    
    // Product form
    document.getElementById('product-form').addEventListener('submit', saveProduct);
    document.getElementById('cancel-product-form').addEventListener('click', function() {
        document.getElementById('product-form-modal').style.display = 'none';
    });
    
    // Category form
    document.getElementById('category-form').addEventListener('submit', saveCategory);
    document.getElementById('cancel-category-form').addEventListener('click', function() {
        document.getElementById('category-form-modal').style.display = 'none';
    });
    
    // Tabs in product management
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Close buttons for other modals
    document.getElementById('close-daily-sales').addEventListener('click', function() {
        document.getElementById('daily-sales').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    });
    
    document.getElementById('close-user-management').addEventListener('click', function() {
        document.getElementById('user-management').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    });
    
    document.getElementById('close-login-history').addEventListener('click', function() {
        document.getElementById('login-history').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    });
    
    document.getElementById('close-receipt-btn').addEventListener('click', function() {
        document.getElementById('receipt-popup').style.display = 'none';
    });
    
    // Cart row selection
    document.addEventListener('click', function(e) {
        if (e.target && e.target.tagName === 'TD' && e.target.closest('#cart-items')) {
            const row = e.target.closest('tr');
            
            document.querySelectorAll('#cart-items tr').forEach(r => {
                r.classList.remove('selected');
                r.style.backgroundColor = '';
            });
            
            row.classList.add('selected');
            row.style.backgroundColor = '#f0f0f0';
        }
    });
}

// Handle main login
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Please fill all fields!');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = username;
        currentScreen = 'pos';
        
        const sessionData = {
            username: username,
            loginTime: new Date().getTime(),
            screen: currentScreen,
            cart: [],
            currentCategory: null
        };
        
        localStorage.setItem('posSession', JSON.stringify(sessionData));
        
        const logs = getLoginLogs();
        logs.push({
            username: username,
            login_time: new Date().toISOString(),
            login_type: 'Main'
        });
        saveLoginLogs(logs);
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('pos-screen').style.display = 'flex';
        
        alert('Login successful!');
    } else {
        alert('Invalid username or password!');
    }
}

// Show admin login dialog
function showAdminLogin() {
    document.getElementById('admin-login-dialog').style.display = 'flex';
}

// Handle admin login
function handleAdminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password && u.role === 'Admin');
    
    if (user) {
        currentUser = username;
        
        const logs = getLoginLogs();
        logs.push({
            username: username,
            login_time: new Date().toISOString(),
            login_type: 'Admin'
        });
        saveLoginLogs(logs);
        
        document.getElementById('admin-login-dialog').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
    } else {
        alert('Only administrators are authorized to log in.');
    }
}

// Display categories
function displayCategories() {
    const categoriesGrid = document.getElementById('categories-grid');
    if (!categoriesGrid) return;
    
    const categories = getCategories();
    categoriesGrid.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        // The image source now uses a public URL that should load
        categoryCard.innerHTML = `
            <div class="category-image">
                <img src="${category.image}" alt="${category.name}" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/180x180/CCCCCC/666666?text=No+Image';">
            </div>
            <div class="category-name">${category.name}</div>
        `;
        
        categoryCard.addEventListener('click', function() {
            showProductsByCategory(category.name);
        });
        
        categoriesGrid.appendChild(categoryCard);
    });
}

// Show products by category
function showProductsByCategory(categoryName) {
    currentCategory = categoryName;
    
    const productsGrid = document.getElementById('categories-grid');
    productsGrid.classList.add('hidden');
    
    const productsView = document.getElementById('products-view');
    productsView.classList.remove('hidden');
    
    productsView.innerHTML = `
        <button id="back-to-categories" class="back-btn">Back to Categories</button>
        <div class="search-bar">
            <label>Search Product:</label>
            <input type="text" id="product-search-pos" placeholder="Search product name">
        </div>
        <div id="products-grid" class="products-grid"></div>
    `;
    
    document.getElementById('back-to-categories').addEventListener('click', function() {
        productsView.classList.add('hidden');
        productsGrid.classList.remove('hidden');
        currentCategory = null;
    });
    
    document.getElementById('product-search-pos').addEventListener('input', function() {
        displayProducts(categoryName, this.value);
    });
    
    displayProducts(categoryName);
}

// Display products for a category
function displayProducts(categoryName, searchText = '') {
    const productsGrid = document.getElementById('products-grid');
    const products = getProducts();
    
    const filteredProducts = products.filter(product => {
        const matchesCategory = product.category === categoryName;
        const matchesSearch = !searchText || 
            product.name.toLowerCase().includes(searchText.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    productsGrid.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        // The image source now uses a public URL that should load
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/120x120/CCCCCC/666666?text=No+Image';">
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">₱${product.price.toFixed(2)}</div>
            <button class="add-to-cart-btn" data-product='${JSON.stringify(product)}'>Add to Cart</button>
        `;
        
        productCard.querySelector('.add-to-cart-btn').addEventListener('click', function() {
            const productData = JSON.parse(this.getAttribute('data-product'));
            addToCart(productData);
        });
        
        productsGrid.appendChild(productCard);
    });
}

// Add product to cart
function addToCart(product) {
    const existingItemIndex = cart.findIndex(item => item.name === product.name);
    
    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += 1;
        cart[existingItemIndex].amount = cart[existingItemIndex].quantity * cart[existingItemIndex].price;
    } else {
        cart.push({
            name: product.name,
            price: product.price,
            quantity: 1,
            amount: product.price
        });
    }
    
    updateCartDisplay();
    saveSessionState();
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Cart is empty</td></tr>';
        updateTotals();
        return;
    }
    
    cartItems.innerHTML = '';
    
    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td><input type="number" class="qty-input" value="${item.quantity}" min="1" data-index="${index}"></td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>₱${item.amount.toFixed(2)}</td>
        `;
        
        const qtyInput = row.querySelector('.qty-input');
        qtyInput.addEventListener('change', function() {
            updateCartItemQuantity(index, parseInt(this.value));
        });
        
        cartItems.appendChild(row);
    });
    
    updateTotals();
}

// Update cart item quantity
function updateCartItemQuantity(index, quantity) {
    if (quantity < 1) quantity = 1;
    
    cart[index].quantity = quantity;
    cart[index].amount = cart[index].price * quantity;
    
    updateCartDisplay();
    saveSessionState();
}

// Remove selected item from cart
function removeCartItem() {
    const selectedRow = document.querySelector('#cart-items tr.selected');
    
    if (!selectedRow) {
        alert('Please select an item to remove by clicking on it.');
        return;
    }
    
    const rowIndex = Array.from(document.querySelectorAll('#cart-items tr')).indexOf(selectedRow);
    cart.splice(rowIndex, 1);
    
    updateCartDisplay();
    saveSessionState();
}

// Clear the entire cart
function clearCart() {
    if (cart.length === 0) {
        alert('Cart is already empty.');
        return;
    }
    
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        discountRate = 0;
        document.getElementById('payment-input').value = '';
        updateCartDisplay();
        saveSessionState();
    }
}

// Update totals and VAT
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
    const discountedTotal = subtotal * (1 - discountRate);
    currentTotal = discountedTotal;
    
    const vatableAmount = currentTotal / (1 + VAT_RATE);
    const vatAmount = currentTotal - vatableAmount;
    
    document.getElementById('vatable-amount').textContent = `₱${vatableAmount.toFixed(2)}`;
    document.getElementById('vat-amount').textContent = `₱${vatAmount.toFixed(2)}`;
    document.getElementById('total-price').textContent = `₱${currentTotal.toFixed(2)}`;
    
    updateChange();
}

// Update change amount based on payment
function updateChange() {
    const paymentInput = document.getElementById('payment-input');
    const payment = parseFloat(paymentInput.value) || 0;
    
    if (payment >= currentTotal) {
        const change = payment - currentTotal;
        document.getElementById('change-amount').textContent = `₱${change.toFixed(2)}`;
    } else {
        document.getElementById('change-amount').textContent = '0.00';
    }
}

// Apply discount to the total
function applyDiscount() {
    if (cart.length === 0) {
        alert('Shopping cart is empty. Cannot apply discount.');
        return;
    }
    
    const discountInput = prompt('Enter discount percentage (e.g., 10 for 10%):');
    
    if (discountInput === null) return;
    
    const discountPercentage = parseFloat(discountInput);
    
    if (isNaN(discountPercentage)) {
        alert('Please enter a valid number.');
        return;
    }
    
    if (discountPercentage < 0 || discountPercentage > 100) {
        alert('Discount must be between 0 and 100.');
        return;
    }
    
    discountRate = discountPercentage / 100;
    alert(`${discountPercentage}% discount applied!`);
    updateTotals();
}

// Process payment
function processPayment() {
    if (cart.length === 0) {
        alert('Shopping cart is empty.');
        return;
    }
    
    const paymentInput = document.getElementById('payment-input');
    const payment = parseFloat(paymentInput.value);
    
    if (isNaN(payment)) {
        alert('Please enter a valid amount for payment.');
        return;
    }
    
    if (payment < currentTotal) {
        alert(`Payment is insufficient. Amount Due: ₱${currentTotal.toFixed(2)}`);
        return;
    }
    
    const change = payment - currentTotal;
    const transactions = getTransactions();
    const transactionId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    
    const transaction = {
        id: transactionId,
        username: currentUser,
        timestamp: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(cart)),
        total: currentTotal,
        vatable: currentTotal / (1 + VAT_RATE),
        vat: currentTotal - (currentTotal / (1 + VAT_RATE)),
        payment: payment,
        change: change,
        discount_rate: discountRate
    };
    
    transactions.push(transaction);
    saveTransactions(transactions);
    
    lastTransaction = transaction;
    showReceipt();
    
    cart = [];
    discountRate = 0;
    paymentInput.value = '';
    updateCartDisplay();
    saveSessionState();
    
    alert(`Payment successful! Change: ₱${change.toFixed(2)}`);
}

// Show receipt popup
function showReceipt() {
    if (!lastTransaction) return;
    
    const receiptContent = document.getElementById('receipt-content');
    let receiptText = '';
    
    // Header
    receiptText += '----------------------------------------\n';
    receiptText += '         Velourè Cosmetics POS\n';
    receiptText += '    Pagadian City, Zamboanga Del Sur\n';
    receiptText += '        Tel: (062) 925-xxxx\n';
    receiptText += `Date: ${new Date().toLocaleDateString()}\n`;
    receiptText += `Time: ${new Date().toLocaleTimeString()}\n`;
    receiptText += `Cashier: ${currentUser}\n`;
    receiptText += '----------------------------------------\n';
    receiptText += 'ITEM          QTY   PRICE     TOTAL\n';
    receiptText += '----------------------------------------\n';
    
    // Items
    lastTransaction.items.forEach(item => {
        const name = item.name.length > 14 ? item.name.substring(0, 11) + '...' : item.name;
        receiptText += `${name.padEnd(14)}${item.quantity.toString().padStart(3)} ${item.price.toFixed(2).padStart(8)} ${item.amount.toFixed(2).padStart(9)}\n`;
    });
    
    receiptText += '----------------------------------------\n';
    
    // Calculate subtotal before discount
    const subtotalBeforeDiscount = lastTransaction.items.reduce((sum, item) => sum + item.amount, 0);
    
    // Discount if applied
    if (lastTransaction.discount_rate > 0) {
        const discountAmount = subtotalBeforeDiscount * lastTransaction.discount_rate;
        receiptText += `Subtotal${':'.padStart(16)} ${subtotalBeforeDiscount.toFixed(2).padStart(16)}\n`;
        receiptText += `Discount (${(lastTransaction.discount_rate * 100).toFixed(0)}%)${':'.padStart(11)} ${discountAmount.toFixed(2).padStart(16)}\n`;
        receiptText += '----------------------------------------\n';
    }
    
    // Totals
    receiptText += `VATable Amount${':'.padStart(10)} ${lastTransaction.vatable.toFixed(2).padStart(16)}\n`;
    receiptText += `VAT (12%)${':'.padStart(14)} ${lastTransaction.vat.toFixed(2).padStart(16)}\n`;
    receiptText += `TOTAL DUE${':'.padStart(14)} ${lastTransaction.total.toFixed(2).padStart(16)}\n`;
    receiptText += '----------------------------------------\n';
    receiptText += `CASH${':'.padStart(18)} ${lastTransaction.payment.toFixed(2).padStart(16)}\n`;
    receiptText += `CHANGE${':'.padStart(16)} ${lastTransaction.change.toFixed(2).padStart(16)}\n`;
    receiptText += '----------------------------------------\n';
    receiptText += '        Thank You for Shopping!\n';
    receiptText += '         Please Come Again!\n';
    
    receiptContent.textContent = receiptText;
    document.getElementById('receipt-popup').style.display = 'flex';
}

// Product Management Functions
function showProductManagement() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('product-management').style.display = 'flex';
    
    loadCategoriesTable();
    loadProductsTable();
    populateCategoryFilter();
}

function loadCategoriesTable() {
    const categoriesTable = document.getElementById('categories-table');
    const categories = getCategories();
    
    categoriesTable.innerHTML = '';
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td>${category.image}</td>
        `;
        categoriesTable.appendChild(row);
    });
}

function loadProductsTable() {
    const productsTable = document.getElementById('products-table');
    const products = getProducts();
    const categoryFilter = document.getElementById('category-filter').value;
    const searchText = document.getElementById('product-search').value.toLowerCase();
    
    const filteredProducts = products.filter(product => {
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSearch = !searchText || product.name.toLowerCase().includes(searchText);
        return matchesCategory && matchesSearch;
    });
    
    productsTable.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.category}</td>
            <td>${product.name}</td>
            <td>₱${product.price.toFixed(2)}</td>
            <td>${product.image}</td>
        `;
        productsTable.appendChild(row);
    });
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    const categories = getCategories();
    
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
    
    categoryFilter.addEventListener('change', loadProductsTable);
    document.getElementById('product-search').addEventListener('input', loadProductsTable);
}

// Product CRUD functions
function addNewProduct() {
    document.getElementById('product-form-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    
    const categorySelect = document.getElementById('form-category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    const categories = getCategories();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    document.getElementById('product-form-modal').style.display = 'flex';
}

function editSelectedProduct() {
    const selectedRow = document.querySelector('#products-table tr.selected');
    
    if (!selectedRow) {
        alert('Please select a product to edit.');
        return;
    }
    
    const rowIndex = Array.from(document.querySelectorAll('#products-table tr')).indexOf(selectedRow);
    const products = getProducts();
    const product = products[rowIndex];
    
    document.getElementById('product-form-title').textContent = 'Edit Product';
    document.getElementById('form-name').value = product.name;
    document.getElementById('form-price').value = product.price;
    document.getElementById('form-image').value = product.image;
    
    const categorySelect = document.getElementById('form-category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    const categories = getCategories();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        option.selected = category.name === product.category;
        categorySelect.appendChild(option);
    });
    
    document.getElementById('product-form').dataset.editIndex = rowIndex;
    document.getElementById('product-form-modal').style.display = 'flex';
}

function deleteSelectedProduct() {
    const selectedRow = document.querySelector('#products-table tr.selected');
    
    if (!selectedRow) {
        alert('Please select a product to delete.');
        return;
    }
    
    const rowIndex = Array.from(document.querySelectorAll('#products-table tr')).indexOf(selectedRow);
    const products = getProducts();
    
    if (confirm(`Are you sure you want to delete "${products[rowIndex].name}"?`)) {
        products.splice(rowIndex, 1);
        saveProducts(products);
        loadProductsTable();
        alert('Product deleted successfully!');
    }
}

function saveProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('form-name').value;
    const price = parseFloat(document.getElementById('form-price').value);
    const image = document.getElementById('form-image').value || 'https://via.placeholder.com/120x120/CCCCCC/666666?text=No+Image'; // Updated default image
    const category = document.getElementById('form-category').value;
    const editIndex = document.getElementById('product-form').dataset.editIndex;
    
    if (!name || !price || !category) {
        alert('Please fill all required fields.');
        return;
    }
    
    const products = getProducts();
    
    if (editIndex !== undefined) {
        // Edit existing product
        products[editIndex] = { name, price, image, category };
        alert('Product updated successfully!');
    } else {
        // Add new product
        products.push({ name, price, image, category });
        alert('Product added successfully!');
    }
    
    saveProducts(products);
    document.getElementById('product-form-modal').style.display = 'none';
    loadProductsTable();
}

// Category CRUD functions
function addNewCategory() {
    document.getElementById('category-form-title').textContent = 'Add New Category';
    document.getElementById('category-form').reset();
    document.getElementById('category-form-modal').style.display = 'flex';
}

function editSelectedCategory() {
    const selectedRow = document.querySelector('#categories-table tr.selected');
    
    if (!selectedRow) {
        alert('Please select a category to edit.');
        return;
    }
    
    const rowIndex = Array.from(document.querySelectorAll('#categories-table tr')).indexOf(selectedRow);
    const categories = getCategories();
    const category = categories[rowIndex];
    
    document.getElementById('category-form-title').textContent = 'Edit Category';
    document.getElementById('form-category-name').value = category.name;
    document.getElementById('form-category-image').value = category.image;
    
    document.getElementById('category-form').dataset.editIndex = rowIndex;
    document.getElementById('category-form-modal').style.display = 'flex';
}

function deleteSelectedCategory() {
    const selectedRow = document.querySelector('#categories-table tr.selected');
    
    if (!selectedRow) {
        alert('Please select a category to delete.');
        return;
    }
    
    const rowIndex = Array.from(document.querySelectorAll('#categories-table tr')).indexOf(selectedRow);
    const categories = getCategories();
    const categoryName = categories[rowIndex].name;
    
    // Check if there are products in this category
    const products = getProducts();
    const categoryProducts = products.filter(p => p.category === categoryName);
    
    if (categoryProducts.length > 0) {
        alert(`Cannot delete "${categoryName}" because it has ${categoryProducts.length} product(s). Delete the products first.`);
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
        categories.splice(rowIndex, 1);
        saveCategories(categories);
        loadCategoriesTable();
        alert('Category deleted successfully!');
    }
}

function viewCategoryProducts() {
    const selectedRow = document.querySelector('#categories-table tr.selected');
    
    if (!selectedRow) {
        alert('Please select a category to view products.');
        return;
    }
    
    const rowIndex = Array.from(document.querySelectorAll('#categories-table tr')).indexOf(selectedRow);
    const categories = getCategories();
    const categoryName = categories[rowIndex].name;
    
    const products = getProducts();
    const categoryProducts = products.filter(p => p.category === categoryName);
    
    if (categoryProducts.length === 0) {
        alert(`No products found in "${categoryName}" category.`);
    } else {
        const productList = categoryProducts.map(p => `• ${p.name} - ₱${p.price.toFixed(2)}`).join('\n');
        alert(`Products in "${categoryName}":\n\n${productList}`);
    }
}

function saveCategory(e) {
    e.preventDefault();
    
    const name = document.getElementById('form-category-name').value;
    const image = document.getElementById('form-category-image').value || 'https://via.placeholder.com/180x180/CCCCCC/666666?text=No+Image'; // Updated default image
    const editIndex = document.getElementById('category-form').dataset.editIndex;
    
    if (!name) {
        alert('Please enter a category name.');
        return;
    }
    
    const categories = getCategories();
    
    if (editIndex !== undefined) {
        // Edit existing category
        categories[editIndex] = { name, image };
        alert('Category updated successfully!');
    } else {
        // Add new category
        if (categories.find(c => c.name === name)) {
            alert('Category already exists!');
            return;
        }
        categories.push({ name, image });
        alert('Category added successfully!');
    }
    
    saveCategories(categories);
    document.getElementById('category-form-modal').style.display = 'none';
    loadCategoriesTable();
    populateCategoryFilter();
    displayCategories(); // Refresh main display
}

// User Management Functions
function showUserManagement() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('user-management').style.display = 'flex';
    loadUsersTable();
}

function loadUsersTable() {
    const usersTableBody = document.getElementById('users-table-body');
    const totalUsersSummary = document.getElementById('total-users-summary');
    const users = getUsers();
    
    let rowsHtml = '';
    
    if (users.length === 0) {
        rowsHtml = `<tr><td colspan="3" style="text-align: center; padding: 20px;">No user accounts found.</td></tr>`;
    } else {
        users.forEach((user, index) => {
            rowsHtml += `
                <tr data-index="${index}">
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="edit-user-btn crud-btn" data-index="${index}">Edit</button>
                        <button class="delete-user-btn crud-btn" data-index="${index}">Delete</button>
                    </td>
                </tr>
            `;
        });
    }
    
    usersTableBody.innerHTML = rowsHtml;
    totalUsersSummary.textContent = `Total users: ${users.length}`;
    
    // Attach event listeners
    document.querySelectorAll('#users-table-body .edit-user-btn').forEach(btn => {
        btn.onclick = function() {
            const index = this.getAttribute('data-index');
            editUser(index);
        };
    });
    
    document.querySelectorAll('#users-table-body .delete-user-btn').forEach(btn => {
        btn.onclick = function() {
            const index = this.getAttribute('data-index');
            deleteUser(index);
        };
    });
    
    // Add user button
    document.getElementById('add-user-btn').onclick = addNewUser;
}

function addNewUser() {
    const username = prompt('Enter new username:');
    if (!username) return;
    
    const password = prompt('Enter password:');
    if (!password) return;
    
    const role = prompt('Enter role (Admin/Cashier):', 'Cashier');
    if (!role || (role !== 'Admin' && role !== 'Cashier')) {
        alert('Role must be Admin or Cashier');
        return;
    }
    
    const users = getUsers();
    
    if (users.find(u => u.username === username)) {
        alert('Username already exists!');
        return;
    }
    
    users.push({ username, password, role });
    saveUsers(users);
    loadUsersTable();
    alert('User added successfully!');
}

function editUser(index) {
    const users = getUsers();
    const user = users[index];
    
    const newUsername = prompt('Enter new username:', user.username);
    if (!newUsername) return;
    
    const newPassword = prompt('Enter new password (leave empty to keep current):');
    const newRole = prompt('Enter new role (Admin/Cashier):', user.role);
    
    if (newRole !== 'Admin' && newRole !== 'Cashier') {
        alert('Role must be Admin or Cashier');
        return;
    }
    
    users[index].username = newUsername;
    if (newPassword) {
        users[index].password = newPassword;
    }
    users[index].role = newRole;
    
    saveUsers(users);
    loadUsersTable();
    alert('User updated successfully!');
}

function deleteUser(index) {
    const users = getUsers();
    const user = users[index];
    
    if (user.username === 'admin') {
        alert('Cannot delete the main admin account!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete user: ${user.username}?`)) {
        users.splice(index, 1);
        saveUsers(users);
        loadUsersTable();
        alert('User deleted successfully!');
    }
}

// Daily Sales Functions
function showDailySales() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('daily-sales').style.display = 'flex';
    loadDailySales();
}

function loadDailySales(filterDate = null) {
    const transactions = getTransactions();
    
    const today = filterDate || new Date().toISOString().split('T')[0];
    const dailyTransactions = transactions.filter(t => t.timestamp.startsWith(today));
    
    const totalRevenue = dailyTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = dailyTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    document.getElementById('date-filter').value = today;
    document.getElementById('summary-date-title').textContent = `Today's Summary (${today})`;
    
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('total-transactions').textContent = totalTransactions;
    document.getElementById('average-transaction').textContent = formatCurrency(averageTransaction);
    
    // Transaction History
    const tbody = document.getElementById('transaction-history-body');
    let transactionHtml = '';
    
    if (dailyTransactions.length === 0) {
        transactionHtml = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No transactions found for ${today}</td></tr>`;
    } else {
        dailyTransactions.forEach(transaction => {
            const time = new Date(transaction.timestamp).toLocaleTimeString();
            transactionHtml += `
                <tr>
                    <td>#${transaction.id.toString().padStart(4, '0')}</td>
                    <td>${time}</td>
                    <td>${transaction.username}</td>
                    <td>${transaction.items.length} items</td>
                    <td>${formatCurrency(transaction.total)}</td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = transactionHtml;
    
    // Best Sellers
    const productSales = {};
    dailyTransactions.forEach(t => {
        t.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
    });
    
    const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const bestSellersList = document.getElementById('best-sellers-list');
    let bestSellersHtml = '';
    
    if (sortedProducts.length === 0) {
        bestSellersHtml = `<li>No sales data available</li>`;
    } else {
        sortedProducts.forEach(([product, quantity]) => {
            bestSellersHtml += `<li>${product}: ${quantity} units sold</li>`;
        });
    }
    
    bestSellersList.innerHTML = bestSellersHtml;
    
    // Add filter event listener
    document.getElementById('apply-filter-btn').onclick = function() {
        const dateFilter = document.getElementById('date-filter').value;
        loadDailySales(dateFilter);
    };
    
    // Add export event listener
    document.getElementById('export-sales-btn').onclick = exportSalesData;
}

function exportSalesData() {
    const transactions = getTransactions();
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Transaction ID,Date,Time,Cashier,Total,Items\n"
        + transactions.map(t => 
            `${t.id},${t.timestamp.split('T')[0]},${new Date(t.timestamp).toLocaleTimeString()},${t.username},${t.total},${t.items.length}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Login History Functions
function showLoginHistory() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('login-history').style.display = 'flex';
    loadLoginHistory();
}

function loadLoginHistory() {
    const logs = getLoginLogs();
    const uniqueUsers = getUniqueUsers(logs);
    
    const userFilterSelect = document.getElementById('user-filter');
    userFilterSelect.innerHTML = '<option value="all">All Users</option>';
    
    uniqueUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userFilterSelect.appendChild(option);
    });
    
    document.getElementById('total-login-records').textContent = logs.length;
    document.getElementById('today-logins').textContent = getTodayLogins(logs);
    document.getElementById('admin-logins').textContent = countAdmins(logs);
    document.getElementById('last-login-time').textContent = getLastLoginTime(logs);
    
    filterLoginHistory('all', 'all');
    
    // Add filter event listener
    document.getElementById('apply-login-filter').onclick = function() {
        const userFilter = document.getElementById('user-filter').value;
        const typeFilter = document.getElementById('type-filter').value;
        filterLoginHistory(userFilter, typeFilter);
    };
    
    // Add clear history listener
    document.getElementById('clear-login-history').onclick = function() {
        if (confirm('Are you sure you want to clear all login history? This action cannot be undone.')) {
            saveLoginLogs([]);
            loadLoginHistory();
            alert('Login history cleared!');
        }
    };
}

function filterLoginHistory(user, type) {
    const logs = getLoginLogs();
    let filtered = logs;
    
    if (user !== 'all') {
        filtered = filtered.filter(log => log.username === user);
    }
    
    if (type !== 'all') {
        filtered = filtered.filter(log => log.login_type === type);
    }
    
    filtered.sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
    
    const tbody = document.getElementById('login-table-body');
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No login records found matching filters</td></tr>`;
    } else {
        const recordsToDisplay = filtered.slice(0, 50);
        
        recordsToDisplay.forEach(log => {
            const date = new Date(log.login_time);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${log.username}</td>
                <td>${log.login_type}</td>
                <td><span class="status-badge">Successful</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    const summaryText = document.getElementById('records-summary');
    summaryText.textContent = `Showing ${Math.min(filtered.length, 50)} of ${filtered.length} records${filtered.length > logs.length ? ' (filtered)' : ''}`;
}

// Helper functions
function getTodayLogins(logs) {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.login_time.startsWith(today)).length;
}

function countAdmins(logs) {
    return logs.filter(log => log.login_type === 'Admin').length;
}

function getLastLoginTime(logs) {
    if (logs.length === 0) return 'N/A';
    const sortedLogs = [...logs].sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
    const last = new Date(sortedLogs[0].login_time);
    return last.toLocaleTimeString();
}

function getUniqueUsers(logs) {
    const users = new Set();
    logs.forEach(log => users.add(log.username));
    return Array.from(users);
}

// Utility function to format currency
function formatCurrency(amount) {
    return '₱' + amount.toFixed(2);
}