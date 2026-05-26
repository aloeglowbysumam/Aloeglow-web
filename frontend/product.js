// product.js - Product details page JavaScript
let currentProduct = null;
let whatsappNumber = "919847101761";
let selectedSize = null;
let selectedPrice = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Product Details Page loaded');
    
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        updateDarkModeButton();
    }
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showErrorMessage('No product specified', 'Please select a product from the store page.');
        return;
    }
    
    // Load product details
    loadProductDetails(productId);
});

// Load product details from API
async function loadProductDetails(productId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        const products = result.products || result;
        
        if (!Array.isArray(products)) {
            throw new Error('Invalid data received');
        }
        
        // Find the product by ID
        currentProduct = products.find(p => p._id === productId);
        
        if (!currentProduct) {
            throw new Error('Product not found in database');
        }

        // Default size selection
        if (currentProduct.sizes && currentProduct.sizes.length > 0) {
            selectedSize = currentProduct.sizes[0].weight;
            selectedPrice = currentProduct.sizes[0].price;
        } else {
            selectedSize = null;
            selectedPrice = currentProduct.price;
        }
        
        // Display product
        displayProduct(currentProduct);
        
    } catch (error) {
        console.error('❌ Error loading product:', error);
        showErrorMessage('Product Not Found', error.message);
    }
}

// Display product details
function displayProduct(product) {
    const detailsContainer = document.getElementById('product-details');
    
    // Generate star rating
    const stars = generateStars(product.rating);
    let displayPrice = product.price;
    if (product.sizes && product.sizes.length > 0) {
        displayPrice = product.sizes[0].price; // default to first size
    }
    const formattedPrice = displayPrice.toFixed(2);
    
    let galleryHtml = '';
    const allImages = [product.imageUrl];
    if (product.additionalImages && product.additionalImages.length > 0) {
        allImages.push(...product.additionalImages);
        
        galleryHtml = '<div class="product-gallery">';
        allImages.forEach((imgUrl, idx) => {
            galleryHtml += `
                <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="changeMainImage('${imgUrl}', this)">
                    <img src="${imgUrl}" alt="${product.name} - view ${idx+1}">
                </div>
            `;
        });
        galleryHtml += '</div>';
    }

    const html = `
        <div class="product-details" style="animation: fadeInUp 0.6s ease">
            <!-- Product Images -->
            <div>
                <div class="product-image-large">
                    <img src="${product.imageUrl}" alt="${product.name}" id="mainProductImage">
                    <div class="category-tag" style="top:20px; left:20px;">${product.category.toUpperCase()}</div>
                    ${product.rating >= 4.5 ? '<div class="featured-tag" style="top:20px; right:20px;">TOP RATED</div>' : ''}
                </div>
                ${galleryHtml}
            </div>
            
            <!-- Product Info -->
            <div class="product-info-detailed">
                <!-- Breadcrumb -->
                <div class="breadcrumb">
                    <a href="index.html"><i class="fas fa-home"></i> Home</a> &gt;
                    <a href="index.html#products">Products</a> &gt;
                    <span>${product.name}</span>
                </div>
                
                <!-- Product Title -->
                <h1 class="product-title">${product.name}</h1>
                
                <!-- Rating -->
                <div class="rating" style="margin-bottom: 20px; font-size: 1.1rem;">
                    ${stars}
                    <span>${product.rating} / 5</span>
                </div>
                
                <!-- Price -->
                <div class="product-price">
                    <span class="price-main" id="displayPriceMain">₹${formattedPrice}</span>
                    <span class="price-note">Inclusive of all taxes</span>
                </div>
                
                ${product.sizes && product.sizes.length > 0 ? `
                <!-- Sizes -->
                <div class="product-sizes" style="margin-top: 15px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">Select Size:</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${product.sizes.map((size, idx) => `
                            <label class="size-option" style="cursor: pointer; border: 1px solid var(--border-color); padding: 8px 15px; border-radius: var(--border-radius); ${idx === 0 ? 'border-color: var(--primary); background: var(--primary-light); color: var(--primary); font-weight: bold;' : ''}" onclick="selectSize(this, ${size.price}, '${size.weight}')">
                                <input type="radio" name="size" value="${size.weight}" style="display:none;" ${idx === 0 ? 'checked' : ''}>
                                ${size.weight}
                            </label>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Description -->
                ${product.description ? `
                    <div class="product-description">
                        <h3><i class="fas fa-info-circle"></i> Description</h3>
                        <p>${product.description}</p>
                    </div>
                ` : ''}
                
                <!-- Features -->
                <div class="product-features">
                    <h3><i class="fas fa-check-circle"></i> Key Features</h3>
                    <ul>
                        <li><i class="fas fa-leaf"></i> 100% Natural Ingredients</li>
                        <li><i class="fas fa-hand-holding-heart"></i> Handmade with Care</li>
                        <li><i class="fas fa-recycle"></i> Eco-Friendly Packaging</li>
                        <li><i class="fas fa-ban"></i> No Harmful Chemicals</li>
                    </ul>
                </div>
                
                <!-- Action Buttons -->
                <div class="action-buttons">
                    <button class="btn-whatsapp" onclick="orderOnWhatsApp()">
                        <i class="fab fa-whatsapp"></i> Order via WhatsApp
                    </button>
                    <button class="btn-call" onclick="callForOrder()">
                        <i class="fas fa-phone"></i> Call to Order
                    </button>
                    <button class="btn-share" onclick="shareProduct()">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
                
                <!-- Delivery Info -->
                <div class="delivery-info">
                    <h3><i class="fas fa-truck"></i> Delivery Information</h3>
                    <div class="delivery-options">
                        <div class="option">
                            <i class="fas fa-shipping-fast"></i>
                            <div>
                                <strong>Free Shipping</strong>
                                <p>On orders above ₹500</p>
                            </div>
                        </div>
                        <div class="option">
                            <i class="fas fa-clock"></i>
                            <div>
                                <strong>3-5 Business Days</strong>
                                <p>Delivery across India</p>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    `;
    
    detailsContainer.innerHTML = html;
    detailsContainer.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    
    document.title = `${product.name} - Aloeglow Store`;
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
    if (hasHalfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';
    
    return starsHTML;
}

// Select size
function selectSize(element, price, weight) {
    selectedSize = weight;
    selectedPrice = price;
    
    // Update active UI
    document.querySelectorAll('.size-option').forEach(el => {
        el.style.borderColor = 'var(--border-color)';
        el.style.background = 'transparent';
        el.style.color = 'inherit';
        el.style.fontWeight = 'normal';
    });
    
    element.style.borderColor = 'var(--primary)';
    element.style.background = 'var(--primary-light)';
    element.style.color = 'var(--primary)';
    element.style.fontWeight = 'bold';
    
    // Update price
    document.getElementById('displayPriceMain').textContent = '₹' + price.toFixed(2);
}

// Order on WhatsApp
function orderOnWhatsApp() {
    if (!currentProduct) return;
    
    if (currentProduct.whatsappLink && currentProduct.whatsappLink.trim() !== '') {
        const newWindow = window.open(currentProduct.whatsappLink, '_blank');
        if (!newWindow || newWindow.closed) {
            alert(`Please click this link to purchase "${currentProduct.name}":\n\n${currentProduct.whatsappLink}`);
        }
        return;
    }
    
    const sizeText = selectedSize ? `\n⚖️ *Size:* ${selectedSize}` : '';
    const message = encodeURIComponent(
        `Hello Aloeglow Store! 👋\n\n*ORDER REQUEST*\n━━━━━━━━━━━━━━━━\n📦 *Product:* ${currentProduct.name}${sizeText}\n💰 *Price:* ₹${selectedPrice.toFixed(2)}\n\nI would like to purchase this product. Please provide:\n1️⃣ Payment details\n2️⃣ Delivery options\n\nLooking forward to your response! 🙏`
    );
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    const newWindow = window.open(whatsappUrl, '_blank');
    
    if (!newWindow || newWindow.closed) {
        alert(`To place your order:\n\n1. Open WhatsApp\n2. Message ${whatsappNumber}\n\nOur team will contact you!`);
    }
}

// Call for order
function callForOrder() {
    window.location.href = `tel:${whatsappNumber}`;
}

// Share product
function shareProduct() {
    const shareData = {
        title: `${currentProduct.name} - Aloeglow Store`,
        text: `Check out ${currentProduct.name} for ₹${selectedPrice.toFixed(2)} on Aloeglow Store!`,
        url: window.location.href,
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(err => console.log('❌ Sharing failed:', err));
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => alert('✅ Product link copied to clipboard!'))
            .catch(() => prompt('Copy this link:', window.location.href));
    }
}

// Show loading state
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('product-details').style.display = 'none';
}

// Show error message
function showErrorMessage(title, message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('product-details').style.display = 'none';
    const errorContainer = document.getElementById('error');
    if (errorContainer) {
        errorContainer.querySelector('p').textContent = message || 'Failed to load the product. Please try again.';
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    localStorage.setItem('darkMode', !darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const darkBtn = document.querySelector('.dark-toggle i');
    if (darkBtn) {
        const isDark = localStorage.getItem('darkMode') === 'true';
        darkBtn.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Change main image from gallery
function changeMainImage(imgUrl, thumbElement) {
    document.getElementById('mainProductImage').src = imgUrl;
    
    // Update active class
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbElement.classList.add('active');
}