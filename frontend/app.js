// app.js - Main store homepage JavaScript
let allProducts = [];
let darkMode = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛍️ Aloeglow Store loaded');
    
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        darkMode = true;
        document.body.classList.add('dark-mode');
        updateDarkModeButton();
    }
    
    // Load products from API
    loadProducts();
    
    // Setup search and filter events
    document.getElementById('search').addEventListener('input', filterProducts);
    document.getElementById('category').addEventListener('change', filterProducts);
    document.getElementById('sort').addEventListener('change', sortProducts);
});

// Load products from backend
async function loadProducts() {
    try {
        console.log('📡 Fetching products from API...');
        showLoadingState();
        
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        allProducts = result.products || result;
        
        if (!Array.isArray(allProducts)) {
            throw new Error('Invalid data received from server');
        }
        
        displayProducts(allProducts);
        updateCategoryFilter();
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showErrorState(error.message);
    }
}

// Display products in grid
function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.7;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px; color: var(--primary);"></i>
                <h3 style="font-size: 1.5rem; margin-bottom: 10px;">No Products Found</h3>
                <p>Try a different search or check back soon!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    products.forEach((product, index) => {
        const formattedPrice = product.price.toFixed(2);
        const stars = createStarRating(product.rating);
        const displayName = product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name;
        
        html += `
            <div class="product-card" data-category="${product.category}">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}" onclick="viewProduct('${product._id}')">
                    <span class="category-tag">${product.category}</span>
                    ${product.rating >= 4.5 ? '<span class="featured-tag">Featured</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 onclick="viewProduct('${product._id}')">${displayName}</h3>
                    <div class="rating">
                        ${stars}
                        <span>${product.rating}/5</span>
                    </div>
                    <p class="description">${product.description || 'Natural handmade product'}</p>
                    <div class="price-section">
                        <span class="price">₹${formattedPrice}</span>
                        <div class="product-actions">
                            <button class="btn-view" onclick="viewProduct('${product._id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-buy" onclick="buyProduct('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.whatsappLink || ''}')" title="Order via WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsGrid.innerHTML = html;
}

// Sort products
function sortProducts() {
    const sortBy = document.getElementById('sort').value;
    let sortedProducts = [...allProducts];
    
    switch(sortBy) {
        case 'price-low': sortedProducts.sort((a, b) => a.price - b.price); break;
        case 'price-high': sortedProducts.sort((a, b) => b.price - a.price); break;
        case 'rating': sortedProducts.sort((a, b) => b.rating - a.rating); break;
        case 'newest': default: break; // Already newest first
    }
    displayProducts(sortedProducts);
}

// Filter products by search and category
function filterProducts() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const selectedCategory = document.getElementById('category').value;
    
    let filtered = allProducts;
    
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(product => product.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    
    if (searchTerm.trim() !== '') {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    displayProducts(filtered);
}

// Update category filter options
function updateCategoryFilter() {
    const categorySelect = document.getElementById('category');
    const currentVal = categorySelect.value;
    const categories = [...new Set(allProducts.map(p => p.category.toLowerCase()))];
    
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
        const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
        categorySelect.innerHTML += `<option value="${category}">${formattedCategory}</option>`;
    });
    categorySelect.value = currentVal || 'all';
}

// View product details
function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Buy product (WhatsApp)
function buyProduct(productId, productName, productPrice, customLink) {
    if (customLink && customLink.trim() !== '') {
        const newWindow = window.open(customLink, '_blank');
        if (!newWindow || newWindow.closed) {
            alert(`Please click this link to purchase "${productName}":\n\n${customLink}`);
        }
        return;
    }
    
    const whatsappNumber = "919847101761";
    const formattedPrice = productPrice.toFixed(2);
    
    const message = encodeURIComponent(
        `Hello Aloeglow Store! 👋\n\nI want to purchase this product:\n\n📦 *Product:* ${productName}\n💰 *Price:* ₹${formattedPrice}\n\nPlease provide payment details and delivery information.`
    );
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    const newWindow = window.open(whatsappUrl, '_blank');
    
    if (!newWindow || newWindow.closed) {
        alert(`To purchase "${productName}":\n\n1. Open WhatsApp\n2. Send message to ${whatsappNumber}\n\nOur team will contact you!`);
    }
}

// Create star rating HTML
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
    if (hasHalfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';
    
    return starsHTML;
}

// Toggle dark mode
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const darkBtn = document.querySelector('.dark-toggle i');
    if (darkBtn) {
        darkBtn.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Show loading state
function showLoadingState() {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Summoning products from nature's database...</p>
            </div>
        `;
    }
}

// Show error state
function showErrorState(errorMessage) {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Connection Interrupted</h3>
                <p>${errorMessage || 'Failed to connect to nature. Please try again.'}</p>
                <button onclick="loadProducts()" class="cta-button" style="margin-top: 20px; border: none;">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}