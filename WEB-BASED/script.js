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

// Session timeout in minutes (adjust as needed)
const SESSION_TIMEOUT = 30; // 30 minutes
// At the beginning of DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed'); // Debug log
    
    // Show login screen by default
    const loginScreen = document.getElementById('login-screen');
    const posScreen = document.getElementById('pos-screen');
    
    if (loginScreen) {
        loginScreen.classList.add('active');
        loginScreen.style.display = 'flex';
    }
    
    if (posScreen) {
        posScreen.style.display = 'none';
    }
    
    // Rest of your initialization code...
    initializeData();
    checkExistingSession();
    setupEventListeners();
    displayCategories(); // Make sure this is called!
    updateCartDisplay();
    
    window.addEventListener('beforeunload', saveSessionState);
    setInterval(checkSessionValidity, 60000);
    
    console.log('Initialization complete'); // Debug log
});
// In the initializeData() function, add:
if (!localStorage.getItem('posLoginLogs')) {
    const sampleLogs = [
        { username: 'admin', login_time: new Date().toISOString(), login_type: 'Admin' },
        { username: 'cashier', login_time: new Date(Date.now() - 3600000).toISOString(), login_type: 'Main' },
        { username: 'admin', login_time: new Date(Date.now() - 7200000).toISOString(), login_type: 'Admin' },
    ];
    localStorage.setItem('posLoginLogs', JSON.stringify(sampleLogs));
}

if (!localStorage.getItem('posTransactions')) {
    const sampleTransactions = [
        {
            id: 1,
            username: 'cashier',
            timestamp: new Date().toISOString(),
            items: [
                { name: 'Velvet Matte Lipstick', price: 299.99, quantity: 2, amount: 599.98 }
            ],
            total: 599.98,
            vatable: 535.70,
            vat: 64.28,
            payment: 600.00,
            change: 0.02,
            discount_rate: 0
        }
    ];
    localStorage.setItem('posTransactions', JSON.stringify(sampleTransactions));
}
// Sample data for the POS system
const sampleUsers = [
    { username: 'admin', password: 'admin', role: 'Admin' },
    { username: 'cashier', password: 'cashier', role: 'Cashier' }
];

// Update your sampleCategories to include the images folder path
const sampleCategories = [
    { name: 'Lipstick', image: 'images/1.jpg' },
    { name: 'Foundation', image: 'images/2.jpg' },
    { name: 'Mascara', image: 'images/3.jpg' },
    { name: 'Blush', image: 'images/4.jpg' },
    { name: 'Eyeshadow', image: 'images/5.jpg' },
    { name: 'Skincare', image: 'images/6.jpg' }
];

// Update your sampleProducts too
const sampleProducts = [
    { category: 'Lipstick', name: 'Velvet Matte Lipstick', price: 299.99, image: 'images/7.jpg' },
    { category: 'Lipstick', name: 'Glossy Lip Gloss', price: 199.99, image: 'images/8.jpg' },
    { category: 'Foundation', name: 'Full Coverage Foundation', price: 599.99, image: 'images/9.jpg' },
    { category: 'Foundation', name: 'Lightweight BB Cream', price: 399.99, image: 'images/10.jpg' },
    { category: 'Mascara', name: 'Volume Mascara', price: 349.99, image: 'images/11.jpg' },
    { category: 'Mascara', name: 'Lengthening Mascara', price: 329.99, image: 'images/12.jpg' },
    { category: 'Blush', name: 'Powder Blush', price: 249.99, image: 'images/13.jpg' },
    { category: 'Blush', name: 'Cream Blush', price: 279.99, image: 'images/14.jpg' },
    { category: 'Eyeshadow', name: 'Neutral Palette', price: 699.99, image: 'images/15.jpg' },
    { category: 'Eyeshadow', name: 'Colorful Palette', price: 799.99, image: 'images/16.jpg' },
    { category: 'Skincare', name: 'Moisturizer', price: 499.99, image: 'images/17.jpg' },
    { category: 'Skincare', name: 'Cleanser', price: 349.99, image: 'images/18.jpg' }
];


// Check if user already has a valid session
function checkExistingSession() {
    const sessionData = JSON.parse(localStorage.getItem('posSession') || 'null');
    
    if (sessionData) {
        const now = new Date().getTime();
        const sessionAge = now - sessionData.loginTime;
        const sessionAgeMinutes = sessionAge / (1000 * 60);
        
        // Check if session is still valid (not expired)
        if (sessionAgeMinutes < SESSION_TIMEOUT) {
            currentUser = sessionData.username;
            currentScreen = sessionData.screen || 'pos';
            
            // Restore cart if available
            if (sessionData.cart) {
                cart = sessionData.cart;
            }
            
            // Restore current category if available
            if (sessionData.currentCategory) {
                currentCategory = sessionData.currentCategory;
            }
            
            // Show appropriate screen
            if (currentScreen === 'pos') {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('pos-screen').style.display = 'flex';
                
                // If we have a current category, show products for that category
                if (currentCategory) {
                    setTimeout(() => {
                        showProductsByCategory(currentCategory);
                    }, 100);
                }
            }
            
            console.log('Session restored for user:', currentUser);
        } else {
            // Session expired, clear it
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
            // Session expired, log out user
            logoutUser();
            alert('Your session has expired. Please log in again.');
        }
    }
}

// Logout function
function logoutUser() {
    // Clear session
    localStorage.removeItem('posSession');
    
    // Reset variables
    currentUser = null;
    currentScreen = 'login';
    cart = [];
    currentCategory = null;
    discountRate = 0;
    
    // Show login screen
    document.getElementById('pos-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    
    // Clear login fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    // Hide any open modals
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
        'receipt-popup'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
        }
    });
}

// Initialize data in localStorage
function initializeData() {
    if (!localStorage.getItem('posUsers')) {
        localStorage.setItem('posUsers', JSON.stringify(sampleUsers));
    }
    
    if (!localStorage.getItem('posCategories')) {
        localStorage.setItem('posCategories', JSON.stringify(sampleCategories));
    }
    
    if (!localStorage.getItem('posProducts')) {
        localStorage.setItem('posProducts', JSON.stringify(sampleProducts));
    }
    
    if (!localStorage.getItem('posTransactions')) {
        localStorage.setItem('posTransactions', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('posLoginLogs')) {
        localStorage.setItem('posLoginLogs', JSON.stringify([]));
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

// Set up all event listeners
function setupEventListeners() {
    // Login button
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    
    // Admin panel button
    document.getElementById('admin-panel-btn').addEventListener('click', showAdminLogin);
    
    
    // Admin login
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
    document.getElementById('cancel-admin-login').addEventListener('click', function() {
        document.getElementById('admin-login-dialog').classList.remove('visible');
    });
    
    // Admin panel buttons
    document.getElementById('product-management-btn').addEventListener('click', showProductManagement);
    document.getElementById('user-management-btn').addEventListener('click', showUserManagement);
    document.getElementById('daily-sales-btn').addEventListener('click', showDailySales);
    document.getElementById('login-history-btn').addEventListener('click', showLoginHistory);
    document.getElementById('close-admin-btn').addEventListener('click', function() {
        document.getElementById('admin-panel').classList.remove('visible');
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
        document.getElementById('product-management').classList.remove('visible');
    });
    
    // Tabs in product management
       document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
} 

// Close buttons for modals
document.getElementById('close-daily-sales').addEventListener('click', function() {
    document.getElementById('daily-sales').classList.remove('visible');
    // Show admin panel again when closing daily sales
    document.getElementById('admin-panel').classList.add('visible');
});

document.getElementById('close-user-management').addEventListener('click', function() {
    document.getElementById('user-management').classList.remove('visible');
    // Show admin panel again when closing user management
    document.getElementById('admin-panel').classList.add('visible');
});

document.getElementById('close-user-management').addEventListener('click', function() {
    document.getElementById('user-management').classList.remove('visible');
    // Show admin panel again when closing user management
    document.getElementById('admin-panel').classList.add('visible');
});

document.getElementById('close-login-history').addEventListener('click', function() {
    document.getElementById('login-history').classList.remove('visible');
    // Show admin panel again when closing login history
    document.getElementById('admin-panel').classList.add('visible');
});

// For product management close button
document.getElementById('close-product-management').addEventListener('click', function() {
    document.getElementById('product-management').classList.remove('visible');
    // Show admin panel again when closing product management
    document.getElementById('admin-panel').classList.add('visible');
});

// Receipt popup (unchanged - this doesn't affect admin panel)
document.getElementById('close-receipt-btn').addEventListener('click', function() {
    document.getElementById('receipt-popup').classList.remove('visible');
});

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
        
        // Create session
        const sessionData = {
            username: username,
            loginTime: new Date().getTime(),
            screen: currentScreen,
            cart: [],
            currentCategory: null
        };
        
        localStorage.setItem('posSession', JSON.stringify(sessionData));
        
        // Record login
        const logs = getLoginLogs();
        logs.push({
            username: username,
            login_time: new Date().toISOString(),
            login_type: 'Main'
        });
        saveLoginLogs(logs);
        
        // Show POS screen
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('pos-screen').style.display = 'flex';
        
        alert('Login successful!');
    } else {
        alert('Invalid username or password!');
    }
}

// Show admin login dialog
function showAdminLogin() {
    document.getElementById('admin-login-dialog').classList.add('visible');
}

// Handle admin login
function handleAdminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password && u.role === 'Admin');
    
    if (user) {
        currentUser = username;
        
        // Record login
        const logs = getLoginLogs();
        logs.push({
            username: username,
            login_time: new Date().toISOString(),
            login_type: 'Admin'
        });
        saveLoginLogs(logs);
        
        // Close login dialog and show admin panel
        document.getElementById('admin-login-dialog').classList.remove('visible');
        document.getElementById('admin-panel').classList.add('visible');
        
        // Clear fields
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
    } else {
        alert('Only administrators are authorized to log in.');
    }
}
function displayCategories() {
    console.log('displayCategories called'); // Debug log
    
    const categoriesGrid = document.getElementById('categories-grid');
    if (!categoriesGrid) {
        console.error('categories-grid element not found!');
        return;
    }
    
    const categories = getCategories();
    console.log('Categories loaded:', categories); // Debug log
    
    categoriesGrid.innerHTML = '';
    
    categories.forEach(category => {
        console.log('Creating category:', category.name, 'Image:', category.image); // Debug log
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        
        // Use simpler image structure first
        categoryCard.innerHTML = `
            <div class="category-image">
                <img src="${category.image}" alt="${category.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 10px;">
            </div>
            <div class="category-name">${category.name}</div>
        `;
        
        categoryCard.addEventListener('click', function() {
            console.log('Clicked category:', category.name);
            showProductsByCategory(category.name);
        });
        
        categoriesGrid.appendChild(categoryCard);
    });
    
    console.log('Categories displayed:', categoriesGrid.children.length); // Debug log
}
// Show products by category
function showProductsByCategory(categoryName) {
    currentCategory = categoryName;
    
    // Update session with current category
    updateSessionCategory(categoryName);
    
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
    
    // Add event listener to back button
    document.getElementById('back-to-categories').addEventListener('click', function() {
        productsView.classList.add('hidden');
        productsGrid.classList.remove('hidden');
        currentCategory = null;
        updateSessionCategory(null);
    });
    
    // Add event listener to search bar
    document.getElementById('product-search-pos').addEventListener('input', function() {
        displayProducts(categoryName, this.value);
    });
    
    // Display products
    displayProducts(categoryName);
}

// Update session with current category
function updateSessionCategory(categoryName) {
    const sessionData = JSON.parse(localStorage.getItem('posSession') || 'null');
    if (sessionData && currentUser) {
        sessionData.currentCategory = categoryName;
        localStorage.setItem('posSession', JSON.stringify(sessionData));
    }
}

// Display products for a category
function displayProducts(categoryName, searchText = '') {
    const productsGrid = document.getElementById('products-grid');
    const products = getProducts();
    
    // Filter products by category and search text
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
  // Inside the displayProducts function where productCard is created:
productCard.innerHTML = `
    <div class="product-image">
        <img src="${product.image}" alt="${product.name}"
             onerror="this.onerror=null; this.src='https://via.placeholder.com/150x150/CCCCCC/666666?text=No+Image'; this.style.opacity='0.7'">
    </div>
    <div class="product-name">${product.name}</div>
    <div class="product-price">₱${product.price.toFixed(2)}</div>
    <button class="add-to-cart-btn" data-product='${JSON.stringify(product)}'>Add to Cart</button>
`;
        // Add event listener to add to cart button
        productCard.querySelector('.add-to-cart-btn').addEventListener('click', function() {
            const productData = JSON.parse(this.getAttribute('data-product'));
            addToCart(productData);
        });
        
        productsGrid.appendChild(productCard);
    });
}

// Add product to cart
function addToCart(product) {
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.name === product.name);
    
    if (existingItemIndex !== -1) {
        // Increase quantity
        cart[existingItemIndex].quantity += 1;
        cart[existingItemIndex].amount = cart[existingItemIndex].quantity * cart[existingItemIndex].price;
    } else {
        // Add new item
        cart.push({
            name: product.name,
            price: product.price,
            quantity: 1,
            amount: product.price
        });
    }
    
    updateCartDisplay();
    updateSessionCart();
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Cart is empty</td></tr>';
        updateTotals();
        return;
    }
    
    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td><input type="number" class="qty-input" value="${item.quantity}" min="1" data-index="${index}"></td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>₱${item.amount.toFixed(2)}</td>
        `;
        
        // Add event listener to quantity input
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
    if (quantity < 1) {
        quantity = 1;
    }
    
    cart[index].quantity = quantity;
    cart[index].amount = cart[index].price * quantity;
    
    updateCartDisplay();
    updateSessionCart();
}

// Update session with current cart
function updateSessionCart() {
    const sessionData = JSON.parse(localStorage.getItem('posSession') || 'null');
    if (sessionData && currentUser) {
        sessionData.cart = cart;
        localStorage.setItem('posSession', JSON.stringify(sessionData));
    }
}

// Remove selected item from cart
function removeCartItem() {
    const selectedRow = document.querySelector('#cart-items tr.selected');
    
    if (!selectedRow) {
        alert('Please select an item to remove by clicking on it.');
        return;
    }
    
    const index = parseInt(selectedRow.getAttribute('data-index'));
    cart.splice(index, 1);
    
    updateCartDisplay();
    updateSessionCart();
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
        updateSessionCart();
    }
}

// Update totals and VAT
function updateTotals() {
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
    
    // Apply discount
    const discountedTotal = subtotal * (1 - discountRate);
    currentTotal = discountedTotal;
    
    // Calculate VAT
    const vatableAmount = currentTotal / (1 + VAT_RATE);
    const vatAmount = currentTotal - vatableAmount;
    
    // Update display
    document.getElementById('vatable-amount').textContent = `₱${vatableAmount.toFixed(2)}`;
    document.getElementById('vat-amount').textContent = `₱${vatAmount.toFixed(2)}`;
    document.getElementById('total-price').textContent = `₱${currentTotal.toFixed(2)}`;
    
    // Update change
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
    
    if (discountInput === null) return; // User cancelled
    
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
    
    // Calculate change
    const change = payment - currentTotal;
    
    // Save transaction
    const transactions = getTransactions();
    const transactionId = transactions.length + 1;
    
    const transaction = {
        id: transactionId,
        username: currentUser,
        timestamp: new Date().toISOString(),
        items: [...cart],
        total: currentTotal,
        vatable: currentTotal / (1 + VAT_RATE),
        vat: currentTotal - (currentTotal / (1 + VAT_RATE)),
        payment: payment,
        change: change,
        discount_rate: discountRate
    };
    
    transactions.push(transaction);
    saveTransactions(transactions);
    
    // Store last transaction for receipt
    lastTransaction = transaction;
    
    // Show receipt
    showReceipt();
    
    // Clear cart but keep session
    cart = [];
    discountRate = 0;
    paymentInput.value = '';
    updateCartDisplay();
    updateSessionCart();
    
    alert(`Payment successful! Change: ₱${change.toFixed(2)}`);
}

// Show receipt popup
function showReceipt() {
    if (!lastTransaction) return;
    
    const receiptContent = document.getElementById('receipt-content');
    let receiptText = '';
    
    // Header
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
    receiptText += 'Thank You!\n'.padStart(31);
    
    receiptContent.textContent = receiptText;
    
    // Show receipt popup
    document.getElementById('receipt-popup').classList.add('visible');
}

function showProductManagement() {
    // Hide admin panel but don't close it completely
    document.getElementById('admin-panel').classList.remove('visible');
    
    // Show product management
    document.getElementById('product-management').classList.add('visible');
    
    // Load data
    loadCategoriesTable();
    loadProductsTable();
    populateCategoryFilter();
}

// Load categories table
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

// Load products table
function loadProductsTable() {
    const productsTable = document.getElementById('products-table');
    const products = getProducts();
    const categoryFilter = document.getElementById('category-filter').value;
    const searchText = document.getElementById('product-search').value.toLowerCase();
    
    // Filter products
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

// Populate category filter dropdown
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    const categories = getCategories();
    
    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add categories
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
    
    // Add event listener to filter
    categoryFilter.addEventListener('change', loadProductsTable);
    document.getElementById('product-search').addEventListener('input', loadProductsTable);
}

// In script.js, replace the current showUserManagement function
function showUserManagement() {
    // Hide admin panel but don't close it completely
    document.getElementById('admin-panel').classList.remove('visible');
    document.getElementById('user-management').classList.add('visible');
    
    // Load user data
    loadUsersTable();

    // Set up static listeners (or ensure they are set up elsewhere)
    document.getElementById('close-user-management').addEventListener('click', function() {
        document.getElementById('user-management').classList.remove('visible');
        document.getElementById('admin-panel').classList.add('visible');
    }, { once: true });
    
    document.getElementById('add-user-btn')?.addEventListener('click', addNewUser, { once: true });
}

// Add this new function after showUserManagement
function loadUsersTable() {
    // We now target the table body directly by ID instead of building the whole modal content
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
    
    // Populate the static HTML elements
    usersTableBody.innerHTML = rowsHtml;
    totalUsersSummary.textContent = `Total users: ${users.length}`;
    
    // Attach event listeners for dynamic buttons
    // The previous implementation was good, but we ensure it runs every time the table is loaded.
    
    // 1. Edit buttons
    document.querySelectorAll('#users-table-body .edit-user-btn').forEach(btn => {
        // Remove existing listener before adding a new one (or use event delegation)
        btn.onclick = function() {
            const index = this.getAttribute('data-index');
            editUser(index);
        };
    });
    
    // 2. Delete buttons
    document.querySelectorAll('#users-table-body .delete-user-btn').forEach(btn => {
        // Remove existing listener before adding a new one
        btn.onclick = function() {
            const index = this.getAttribute('data-index');
            deleteUser(index);
        };
    });
}

// NOTE: addNewUser, editUser, and deleteUser remain UNCHANGED
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
    
    // Check if username already exists
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
    
    // Update user
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

function showDailySales() {
    // Hide admin panel but don't close it completely
    document.getElementById('admin-panel').classList.remove('visible');
    document.getElementById('daily-sales').classList.add('visible');
    
    // Load sales data (this function now populates the static HTML structure)
    loadDailySales();

    // Setup initial event listeners (moved from loadDailySales)
    document.getElementById('close-daily-sales').addEventListener('click', function() {
        document.getElementById('daily-sales').classList.remove('visible');
        document.getElementById('admin-panel').classList.add('visible');
    }, { once: true }); // Use { once: true } or similar logic to prevent multiple listeners
    
    document.getElementById('apply-filter-btn')?.addEventListener('click', function() {
        const dateFilter = document.getElementById('date-filter').value;
        // You would implement date filtering logic here (and call loadDailySales(dateFilter))
        alert(`Filtering for ${dateFilter} - Implement date filtering logic`);
        // Example: loadDailySales(dateFilter);
    });
    
    document.getElementById('export-sales-btn')?.addEventListener('click', function() {
        exportSalesData();
    });
}

// Pass a date parameter if you implement filtering
function loadDailySales(filterDate = null) {
    // No need for dailySalesDiv.innerHTML = html; anymore

    // 1. Get data
    const transactions = getTransactions();
    
    // 2. Calculate totals
    const today = filterDate || new Date().toISOString().split('T')[0];
    const dailyTransactions = transactions.filter(t => t.timestamp.startsWith(today));
    
    const totalRevenue = dailyTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = dailyTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // 3. Populate Summary Cards and Controls
    document.getElementById('date-filter').value = today;
    document.getElementById('summary-date-title').textContent = `Today's Summary (${today})`;

    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('total-transactions').textContent = totalTransactions;
    document.getElementById('average-transaction').textContent = formatCurrency(averageTransaction);
    
    // 4. Build Transaction History Table Body
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
    
    // 5. Calculate and Populate Best Sellers
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
    
    // NOTE: Event listeners for Close/Filter/Export were moved to showDailySales
}

function exportSalesData() {
    // ... (This function remains unchanged as it doesn't modify the report's structure)
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
function showLoginHistory() {
    // Hide admin panel but don't close it completely
    document.getElementById('admin-panel').classList.remove('visible');
    document.getElementById('login-history').classList.add('visible');
    
    // Load login history
    loadLoginHistory();
    
    // Add event listeners (moved from loadLoginHistory to prevent duplicates on subsequent calls)
    // Note: Use { once: true } or ensure listeners are only added once if showLoginHistory is called multiple times.
    document.getElementById('close-login-history').addEventListener('click', function() {
        document.getElementById('login-history').classList.remove('visible');
        document.getElementById('admin-panel').classList.add('visible');
    }, { once: true }); // Adding once for simplicity
    
    document.getElementById('apply-login-filter')?.addEventListener('click', function() {
        const userFilter = document.getElementById('user-filter').value;
        const typeFilter = document.getElementById('type-filter').value;
        // The filter function is now the main renderer
        filterLoginHistory(userFilter, typeFilter); 
    });
    
    document.getElementById('clear-login-history')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all login history? This action cannot be undone.')) {
            // Assuming saveLoginLogs and getLoginLogs are available globally
            saveLoginLogs([]); 
            loadLoginHistory();
            alert('Login history cleared!');
        }
    });
}

function loadLoginHistory() {
    // We no longer need to find the div and set innerHTML on it.
    // Instead, we just execute the filtering/rendering logic with default filters.
    
    // 1. Get initial data and set up user filter options
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

    // 2. Populate stats
    document.getElementById('total-login-records').textContent = logs.length;
    document.getElementById('today-logins').textContent = getTodayLogins(logs);
    document.getElementById('admin-logins').textContent = countAdmins(logs);
    document.getElementById('last-login-time').textContent = getLastLoginTime(logs);

    // 3. Render the initial table (by calling the filter function with default values)
    filterLoginHistory('all', 'all'); 
}

// Helper functions for login history (these remain unchanged)
function getTodayLogins(logs) {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => log.login_time.startsWith(today)).length;
}

function countAdmins(logs) {
    return logs.filter(log => log.login_type === 'Admin').length;
}

function getLastLoginTime(logs) {
    if (logs.length === 0) return 'N/A';
    // Must sort first to get the true last login time, although the logs array is often sorted on retrieval.
    const sortedLogs = [...logs].sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
    const last = new Date(sortedLogs[0].login_time);
    return last.toLocaleTimeString();
}

function getUniqueUsers(logs) {
    const users = new Set();
    logs.forEach(log => users.add(log.username));
    return Array.from(users);
}

// The main rendering function now handles filtering and table population
function filterLoginHistory(user, type) {
    const logs = getLoginLogs();
    let filtered = logs;
    
    if (user !== 'all') {
        filtered = filtered.filter(log => log.username === user);
    }
    
    if (type !== 'all') {
        filtered = filtered.filter(log => log.login_type === type);
    }
    
    // Sort filtered results by most recent
    filtered.sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
    
    // Update the table body
    const tbody = document.getElementById('login-table-body');
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No login records found matching filters</td></tr>`;
    } else {
        // Limit to, for example, 50 records for display performance
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

    // Update records summary text
    const summaryText = document.getElementById('records-summary');
    summaryText.textContent = `Showing ${Math.min(filtered.length, 50)} of ${filtered.length} records${filtered.length > logs.length ? ' (filtered)' : ''}`;
}
// Utility function to format currency
function formatCurrency(amount) {
    return '₱' + amount.toFixed(2);
}

// Add row selection to cart table
document.addEventListener('click', function(e) {
    if (e.target && e.target.tagName === 'TD' && e.target.closest('#cart-items')) {
        const row = e.target.closest('tr');
        
        // Remove selected class from all rows
        document.querySelectorAll('#cart-items tr').forEach(r => {
            r.classList.remove('selected');
            r.style.backgroundColor = '';
        });
        
        // Add selected class to clicked row
        row.classList.add('selected');
        row.style.backgroundColor = '#f0f0f0';
        
        // Store index in row attribute
        const rows = Array.from(document.querySelectorAll('#cart-items tr'));
        const index = rows.indexOf(row);
        row.setAttribute('data-index', index);
    }
});
// Logout button
document.getElementById('logout-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to log out?')) {
        logoutUser();
    }
});