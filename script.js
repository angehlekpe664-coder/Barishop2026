// ========================================
// BARISHOP - JAVASCRIPT MODERNE
// Animations, Panier, Auth, Modal Produit, Livraison
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des fonctionnalités
    initNavigation();
    initContactForm();
    initScrollAnimations();
    initPlaceholders();
    initTypingAnimation();
    initBlogFilters();
    loadDynamicContent();
    loadBlogDetail();
    initNewsletterForm();
    initScrollProgress();
    initParallax();
    initSmoothScroll();
    initHoverEffects();
    initAOS();
    initCart();
    initAuth();
    initProductModal();
    initDeliveryCalculator();
    initWishlist();
    initProductSearch();
});

// ========================================
// FIREBASE IMPORTS
// ========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOdFfDX5pJGXPrbj4HBibdakEiLmLZ4bA",
  authDomain: "barishop-27fdf.firebaseapp.com",
  projectId: "barishop-27fdf",
  storageBucket: "barishop-27fdf.firebasestorage.app",
  messagingSenderId: "434603534493",
  appId: "1:434603534493:web:9326066133cf1d58908c74",
  measurementId: "G-XZ2WGRE94S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ========================================
// CART + WISHLIST SYSTEM
// ========================================
let cart = JSON.parse(localStorage.getItem('barishop_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('barishop_wishlist')) || [];
let allProducts = []; // used for searching/filtering

function initCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');
    const continueShopping = document.getElementById('continueShopping');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartBtn || !cartSidebar) return;
    
    // Open cart
    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Close cart functions
    const closeCart = () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
    continueShopping?.addEventListener('click', closeCart);
    
    // Checkout
    checkoutBtn?.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Votre panier est vide', 'error');
            return;
        }
        showNotification('Redirection vers le paiement...', 'info');
    });
    
    // Update cart display
    updateCartDisplay();
}

function addToCart(product, quantity = 1, size = '50ml') {
    const existingItem = cart.find(item => item.id === product.id && item.size === size);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image,
            quantity: quantity,
            size: size
        });
    }
    
    saveCart();
    updateCartDisplay();
    showNotification(`${product.name} ajouté au panier !`, 'success');
}

function removeFromCart(productId, size) {
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    saveCart();
    updateCartDisplay();
}

function updateQuantity(productId, size, change) {
    const item = cart.find(item => item.id === productId && item.size === size);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId, size);
        } else {
            saveCart();
            updateCartDisplay();
        }
    }
}

function saveCart() {
    localStorage.setItem('barishop_cart', JSON.stringify(cart));
    syncCartToFirestore();
}

function saveWishlist() {
    localStorage.setItem('barishop_wishlist', JSON.stringify(wishlist));
    updateWishlistDisplay();
}

async function syncCartToFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await setDoc(doc(db, "carts", user.uid), {
            uid: user.uid,
            email: user.email || null,
            items: cart,
            total,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur lors de la synchronisation du panier :', error);
    }
}

async function loadCartFromFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const cartDoc = await getDoc(doc(db, "carts", user.uid));
        if (cartDoc.exists()) {
            const data = cartDoc.data();
            if (data && Array.isArray(data.items)) {
                cart = data.items;
                localStorage.setItem('barishop_cart', JSON.stringify(cart));
                updateCartDisplay();
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement du panier :', error);
    }
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.textContent = total.toFixed(2) + '€';
    
    // Update items
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="cart-empty">Votre panier est vide</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://via.placeholder.com/80x80?text=Parfum'}" alt="${escapeHtml(item.name)}">
                    </div>
                    <div class="cart-item-details">
                        <div>
                            <h4 class="cart-item-name">${escapeHtml(item.name)}</h4>
                            <p class="cart-item-price">${item.price.toFixed(2)}€</p>
                        </div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', '${item.size}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', '${item.size}', 1)">+</button>
                            <button class="cart-item-remove" onclick="removeFromCart('${item.id}', '${item.size}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Make functions globally available
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleWishlistItem = toggleWishlistItem;

// ========================================
// WISHLIST
// ========================================
function initWishlist() {
    const wishlistBtn = document.getElementById('wishlistBtn');
    const wishlistSidebar = document.getElementById('wishlistSidebar');
    const wishlistOverlay = document.getElementById('wishlistOverlay');
    const wishlistClose = document.getElementById('wishlistClose');
    const wishlistContinue = document.getElementById('wishlistContinue');

    updateWishlistDisplay();
    renderWishlistItems();

    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            openWishlist();
        });
    }

    const closeWishlist = () => {
        wishlistSidebar.classList.remove('active');
        wishlistOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    wishlistClose?.addEventListener('click', closeWishlist);
    wishlistOverlay?.addEventListener('click', closeWishlist);
    wishlistContinue?.addEventListener('click', closeWishlist);

}

function openWishlist() {
    const wishlistSidebar = document.getElementById('wishlistSidebar');
    const wishlistOverlay = document.getElementById('wishlistOverlay');
    if (!wishlistSidebar || !wishlistOverlay) return;
    wishlistSidebar.classList.add('active');
    wishlistOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderWishlistItems();
}

function toggleWishlistItem(id, name, price, image) {
    const index = wishlist.findIndex(item => item.id === id);
    if (index > -1) {
        wishlist.splice(index, 1);
        showNotification(`${name} retiré de vos favoris`, 'info');
    } else {
        wishlist.push({ id, name, price: parseFloat(price), image });
        showNotification(`${name} ajouté à vos favoris`, 'success');
    }
    saveWishlist();
    renderWishlistItems();
}

function initProductSearch() {
    const searchInput = document.getElementById('productSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            displayProducts(allProducts);
            return;
        }

        const filtered = allProducts.filter(product => {
            const name = (product.name || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            return name.includes(query) || description.includes(query);
        });

        displayProducts(filtered);
    });
}

function isInWishlist(id) {
    return wishlist.some(item => item.id === id);
}

function updateWishlistDisplay() {
    const wishlistCount = document.getElementById('wishlistCount');
    const previewCount = document.getElementById('wishlistPreviewCount');
    const count = wishlist.length;
    if (wishlistCount) wishlistCount.textContent = count;
    if (previewCount) previewCount.textContent = count;
}

function renderWishlistItems() {
    const wishlistItems = document.getElementById('wishlistItems');
    if (!wishlistItems) return;

    if (wishlist.length === 0) {
        wishlistItems.innerHTML = '<p class="cart-empty">Votre liste de favoris est vide</p>';
        return;
    }

    wishlistItems.innerHTML = wishlist.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image || 'https://via.placeholder.com/80x80?text=Parfum'}" alt="${escapeHtml(item.name)}">
            </div>
            <div class="cart-item-details">
                <div>
                    <h4 class="cart-item-name">${escapeHtml(item.name)}</h4>
                    <p class="cart-item-price">${parseFloat(item.price).toFixed(2)}€</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="cart-item-remove" data-item-id="${item.id}">
                        <i class="fas fa-heart-broken"></i>
                    </button>
                    <button class="btn btn-primary" data-item-id="${item.id}">
                        Ajouter au panier
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Attach event listeners after rendering
    wishlistItems.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.itemId;
            const item = wishlist.find(i => i.id === id);
            if (!item) return;
            toggleWishlistItem(item.id, item.name, item.price, item.image);
        });
    });

    wishlistItems.querySelectorAll('.btn.btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.itemId;
            const item = wishlist.find(i => i.id === id);
            if (!item) return;
            addToCart({ id: item.id, name: item.name, price: item.price, image: item.image }, 1, '50ml');
            openWishlist();
        });
    });
}

// ========================================
// AUTHENTICATION
// ========================================
function initAuth() {
    const userBtn = document.getElementById('userBtn');
    const authModal = document.getElementById('authModal');
    const authModalOverlay = document.getElementById('authModalOverlay');
    const authModalClose = document.getElementById('authModalClose');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authSwitchLinks = document.querySelectorAll('.auth-switch a');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (!userBtn || !authModal) return;
    
    // Open auth modal
    userBtn.addEventListener('click', () => {
        authModal.classList.add('active');
        authModalOverlay.classList.add('active');
    });
    
    // Close auth modal
    const closeAuthModal = () => {
        authModal.classList.remove('active');
        authModalOverlay.classList.remove('active');
    };
    
    authModalClose?.addEventListener('click', closeAuthModal);
    authModalOverlay?.addEventListener('click', closeAuthModal);
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Switch links
    authSwitchLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab(link.dataset.tab);
        });
    });
    
    function switchAuthTab(tabName) {
        authTabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        if (tabName === 'login') {
            loginForm?.classList.remove('hidden');
            registerForm?.classList.add('hidden');
        } else {
            loginForm?.classList.add('hidden');
            registerForm?.classList.remove('hidden');
        }
    }
    
    // Login form
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            showNotification('Connexion réussie ! Bienvenue.', 'success');
            closeAuthModal();
            loginForm.reset();
        } catch (error) {
            console.error('Login error:', error);
            showNotification(getAuthErrorMessage(error.code), 'error');
        }
    });
    
    // Register form
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prenom = document.getElementById('registerPrenom').value;
        const nom = document.getElementById('registerNom').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Save user info to Firestore
            await addDoc(collection(db, "users"), {
                uid: userCredential.user.uid,
                prenom: prenom,
                nom: nom,
                email: email,
                createdAt: new Date().toISOString()
            });
            
            showNotification('Compte créé avec succès ! Bienvenue chez Barishop.', 'success');
            closeAuthModal();
            registerForm.reset();
        } catch (error) {
            console.error('Register error:', error);
            showNotification(getAuthErrorMessage(error.code), 'error');
        }
    });
    
    // Check auth state
    onAuthStateChanged(auth, async (user) => {
        const userBtn = document.getElementById('userBtn');
        if (userBtn) {
            if (user) {
                userBtn.innerHTML = '<i class="fas fa-user-check"></i>';
                userBtn.title = 'Déconnexion';
                userBtn.onclick = () => signOut(auth).then(() => {
                    showNotification('Déconnexion réussie', 'info');
                });

                // Load the saved cart for the user (if found)
                await loadCartFromFirestore();
                // Sync the local cart to Firestore (ensures latest data)
                syncCartToFirestore();
            } else {
                userBtn.innerHTML = '<i class="fas fa-user"></i>';
                userBtn.title = 'Mon compte';
            }
        }
    });
}

function getAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'Cette email est déjà utilisé',
        'auth/invalid-email': 'Adresse email invalide',
        'auth/operation-not-allowed': 'Opération non autorisée',
        'auth/weak-password': 'Mot de passe trop faible',
        'auth/user-disabled': 'Compte désactivé',
        'auth/user-not-found': 'Aucun compte trouvé avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-credential': 'Email ou mot de passe incorrect',
        'auth/invalid-api-key': 'Clé API invalide',
        'auth/app-deleted': 'Application supprimée',
        'auth/app-not-authorized': 'Application non autorisée',
        'auth/argument-error': 'Erreur d\'argument',
        'auth/internal-error': 'Erreur interne'
    };
    return messages[code] || 'Une erreur est survenue. Veuillez réessayer.';
}

// ========================================
// PRODUCT MODAL
// ========================================
function initProductModal() {
    const productModal = document.getElementById('productModal');
    const productModalOverlay = document.getElementById('productModalOverlay');
    const productModalClose = document.getElementById('productModalClose');
    const productModalBody = document.getElementById('productModalBody');
    
    // Add click event to product cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (card && !e.target.closest('.product-footer')) {
            const product = {
                id: card.dataset.id || 'static-' + Date.now(),
                name: card.querySelector('h3')?.textContent || 'Parfum',
                price: card.querySelector('.price')?.textContent?.replace('€', '') || '0',
                image: card.querySelector('.product-image img')?.src || '',
                description: card.querySelector('.product-description')?.textContent || '',
                notes: ['Boisée', 'Florale', 'Fruité'],
                sizes: ['30ml', '50ml', '100ml']
            };
            openProductModal(product);
        }
    });
    
    // Close modal
    const closeProductModal = () => {
        productModal?.classList.remove('active');
        productModalOverlay?.classList.remove('active');
    };
    
    productModalClose?.addEventListener('click', closeProductModal);
    productModalOverlay?.addEventListener('click', closeProductModal);
    
    function openProductModal(product) {
        if (!productModalBody) return;
        
        productModalBody.innerHTML = `
            <div class="product-modal-image">
                <img src="${product.image}" alt="${escapeHtml(product.name)}">
            </div>
            <div class="product-modal-info">
                <h2>${escapeHtml(product.name)}</h2>
                <p class="product-modal-price">${parseFloat(product.price).toFixed(2)}€</p>
                <p class="product-modal-description">${escapeHtml(product.description)}</p>
                
                <div class="product-olfactory-notes">
                    <h4>Notes olfactives</h4>
                    <div class="notes-grid">
                        ${product.notes.map(note => `<span class="note-tag">${note}</span>`).join('')}
                    </div>
                </div>
                
                <div class="product-size-selection">
                    <h4>Taille</h4>
                    <div class="size-options">
                        ${product.sizes.map((size, i) => `
                            <button class="size-btn ${i === 1 ? 'active' : ''}" data-size="${size}">${size}</button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="product-modal-actions">
                    <button class="btn-add-cart" id="addToCartBtn">
                        <i class="fas fa-shopping-bag"></i>
                        Ajouter au panier
                    </button>
                    <button class="btn-wishlist ${isInWishlist(product.id) ? 'active' : ''}" id="productModalWishlistBtn" data-product-id="${product.id}" data-product-name="${escapeHtml(product.name)}" data-product-price="${product.price}" data-product-image="${product.image || ''}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Size selection
        const sizeBtns = productModalBody.querySelectorAll('.size-btn');
        let selectedSize = '50ml';
        
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = btn.dataset.size;
            });
        });
        
        // Add to cart
        const addToCartBtn = document.getElementById('addToCartBtn');
        addToCartBtn?.addEventListener('click', () => {
            addToCart(product, 1, selectedSize);
            closeProductModal();
        });

        // Wishlist button (inside modal)
        const modalWishlistBtn = document.getElementById('productModalWishlistBtn');
        modalWishlistBtn?.addEventListener('click', () => {
            const id = modalWishlistBtn.dataset.productId;
            const name = modalWishlistBtn.dataset.productName;
            const price = modalWishlistBtn.dataset.productPrice;
            const image = modalWishlistBtn.dataset.productImage;
            toggleWishlistItem(id, name, price, image);
            modalWishlistBtn.classList.toggle('active', isInWishlist(id));
        });
        
        productModal?.classList.add('active');
        productModalOverlay?.classList.add('active');
    }
}

let cartTotal = 0;

// ========================================
// DELIVERY CALCULATOR
// ========================================
function initDeliveryCalculator() {
    const deliveryForm = document.getElementById('deliveryForm');
    const deliveryResult = document.getElementById('deliveryResult');
    
    if (!deliveryForm || !deliveryResult) return;
    
    deliveryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get actual cart total
        const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const zone = document.getElementById('deliveryZone').value;
        const FREE_SHIPPING_THRESHOLD = 100;
        
        let result = '';
        
        switch(zone) {
            case 'local':
                if (cartTotal >= FREE_SHIPPING_THRESHOLD) {
                    result = `
                        <div class="delivery-result active free">
                            <h5><i class="fas fa-truck"></i> Livraison gratuite !</h5>
                            <p>Vous bénéficier de la livraison gratuite car votre commande dépasse ${FREE_SHIPPING_THRESHOLD}€</p>
                        </div>
                    `;
                } else {
                    const shippingCost = 5;
                    const remaining = FREE_SHIPPING_THRESHOLD - cartTotal;
                    result = `
                        <div class="delivery-result active paid">
                            <h5><i class="fas fa-truck"></i> ${shippingCost}€</h5>
                            <p>Plus que ${remaining.toFixed(2)}€ pour bénéficier de la livraison gratuite !</p>
                        </div>
                    `;
                }
                break;
            case 'region':
                if (cartTotal >= FREE_SHIPPING_THRESHOLD) {
                    result = `
                        <div class="delivery-result active free">
                            <h5><i class="fas fa-truck"></i> Livraison gratuite !</h5>
                            <p>Vous bénéficier de la livraison gratuite car votre commande dépasse ${FREE_SHIPPING_THRESHOLD}€</p>
                        </div>
                    `;
                } else {
                    const shippingCost = 10;
                    const remaining = FREE_SHIPPING_THRESHOLD - cartTotal;
                    result = `
                        <div class="delivery-result active paid">
                            <h5><i class="fas fa-truck"></i> ${shippingCost}€</h5>
                            <p>Plus que ${remaining.toFixed(2)}€ pour bénéficier de la livraison gratuite !</p>
                        </div>
                    `;
                }
                break;
            case 'international':
                const shippingCost = 25;
                result = `
                    <div class="delivery-result active paid">
                        <h5><i class="fas fa-plane"></i> ${shippingCost}€</h5>
                        <p>Livraison internationale. Délai de 7 à 14 jours ouvrés.</p>
                    </div>
                `;
                break;
        }
        
        deliveryResult.innerHTML = result;
    });
}

// ========================================
// SCROLL PROGRESS BAR
// ========================================
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// ========================================
// PARALLAX EFFECT
// ========================================
function initParallax() {
    const heroSection = document.querySelector('.hero');
    const floatingImages = document.querySelectorAll('.parfum-float');
    const orbs = document.querySelectorAll('.decoration-orbe');

    if (!heroSection) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        floatingImages.forEach((img, index) => {
            const speed = 0.05 + (index * 0.01);
            img.style.transform = `translateY(${scrollY * speed}px)`;
        });

        orbs.forEach((orb, index) => {
            const speed = 0.02 + (index * 0.01);
            orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });

    heroSection.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        floatingImages.forEach((img, index) => {
            const depth = 0.1 + (index * 0.05);
            img.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        });
    });
}

// ========================================
// AOS ANIMATION LIBRARY
// ========================================
function initAOS() {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/aos@2.3.1/dist/aos.js';
    script.onload = () => {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100,
            delay: 100,
            disable: window.innerWidth < 768
        });
    };
    document.head.appendChild(script);
}

// ========================================
// DYNAMIC CONTENT LOADING
// ========================================
async function loadDynamicContent() {
    await loadProducts();
    await loadArticles();
}

async function loadProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    try {
        const q = query(collection(db, "products"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const products = [];
            querySnapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            allProducts = products;
            displayProducts(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = products.map((product, index) => `
        <div class="product-card" data-id="${product.id}" data-aos="fade-up" data-aos-delay="${index * 100}">
            <div class="product-image">
                <img src="${product.image || 'https://via.placeholder.com/600x400?text=Parfum'}" alt="${escapeHtml(product.name)}" onerror="this.src='https://via.placeholder.com/600x400?text=Parfum'" loading="lazy">
                <div class="product-badge">Nouveau</div>
            </div>
            <div class="product-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="product-description">${escapeHtml(product.description || '')}</p>
                <div class="product-footer">
                    <span class="price">${parseFloat(product.price || 0).toFixed(2)}€</span>
                    <button class="btn-wishlist ${isInWishlist(product.id) ? 'active' : ''}" data-product-id="${product.id}" data-product-name="${escapeHtml(product.name)}" data-product-price="${product.price}" data-product-image="${product.image || ''}" aria-label="Ajouter aux favoris">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn-quick-add" onclick="event.stopPropagation(); quickAddToCart('${product.id}', '${escapeHtml(product.name)}', '${product.price}', '${product.image}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    setTimeout(() => {
        initHoverEffects();
        bindWishlistButtons();
    }, 100);
}

function bindWishlistButtons() {
    const wishlistButtons = document.querySelectorAll('.btn-wishlist');
    wishlistButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const id = btn.dataset.productId;
            const name = btn.dataset.productName;
            const price = btn.dataset.productPrice;
            const image = btn.dataset.productImage;
            toggleWishlistItem(id, name, price, image);
            btn.classList.toggle('active', isInWishlist(id));
        });
    });
}

function quickAddToCart(id, name, price, image) {
    addToCart({ id, name, price, image }, 1, '50ml');
}

// Make function globally available
window.quickAddToCart = quickAddToCart;

async function loadArticles() {
    const blogsGrid = document.getElementById('blogsGrid');
    if (!blogsGrid) return;

    try {
        const q = query(collection(db, "articles"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const articles = [];
            querySnapshot.forEach((doc) => {
                articles.push({ id: doc.id, ...doc.data() });
            });
            displayArticles(articles);
        }
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

async function loadBlogDetail() {
    const detailWrapper = document.getElementById('blogDetailWrapper');
    if (!detailWrapper) return;

    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    if (!articleId) {
        detailWrapper.innerHTML = `<p>Article introuvable. <a href="index.html">Retour au blog</a></p>`;
        return;
    }

    // Support for built-in demo articles when Firestore is not configured or the ID is missing.
    const defaultArticles = {
        'default-1': {
            title: '3 parfums must-have pour le printemps',
            category: 'Nouveautés',
            date: '2026-03-11',
            image: 'https://images.unsplash.com/photo-1529312266894-4b271b4ff4c4?auto=format&fit=crop&w=1200&q=80',
            excerpt: 'Découvrez les nouvelles fragrances à porter dès maintenant, entre notes florales et accords frais.',
            content: `
                <p>Le printemps est la saison idéale pour explorer de nouvelles fragrances. Nous avons sélectionné trois parfums qui éveillent les sens et s'adaptent à toutes les occasions :</p>
                <ul>
                    <li><strong>Évasion florale</strong> : un esprit tendre avec des notes de rose et jasmin.</li>
                    <li><strong>Fraîcheur citronnée</strong> : une élégance pétillante qui réveille l'humeur.</li>
                    <li><strong>Boisé doux</strong> : une base chaleureuse parfaite pour les soirées plus fraîches.</li>
                </ul>
                <p>Chaque parfum s'exprime différemment selon la peau. N'hésitez pas à tester plusieurs senteurs pour trouver votre signature.</p>
            `
        },
        'default-2': {
            title: 'Comment faire durer votre parfum toute la journée',
            category: 'Conseils',
            date: '2026-02-28',
            image: 'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?auto=format&fit=crop&w=1200&q=80',
            excerpt: 'Quelques astuces simples pour fixer les notes et profiter de votre parfum plus longtemps.',
            content: `
                <p>Quelques gestes simples suffisent pour prolonger la tenue de votre parfum :</p>
                <ol>
                    <li><strong>Hydratez votre peau</strong> : un corps bien hydraté retient mieux les molécules de parfum.</li>
                    <li><strong>Appliquez sur les points chauds</strong> : poignets, derrière les oreilles, pli des coudes.</li>
                    <li><strong>Ne frottez pas</strong> : frotter écrase les notes de tête et raccourcit la durée de vie.</li>
                </ol>
                <p>Enfin, conservez votre parfum à l’abri de la lumière et de la chaleur pour préserver son équilibre olfactif.</p>
            `
        },
        'default-3': {
            title: 'Tendances parfum 2026 : notes rares et packaging éco',
            category: 'Inspirations',
            date: '2026-01-14',
            image: 'https://images.unsplash.com/photo-1495125520140-4e1e17a25f17?auto=format&fit=crop&w=1200&q=80',
            excerpt: 'Les grandes tendances à suivre cette année pour choisir des parfums à la fois modernes et responsables.',
            content: `
                <p>En 2026, le monde du parfum se recentre sur l'authenticité et la durabilité :</p>
                <ul>
                    <li><strong>Notes rares</strong> : bois précieux, ambre gris recréé et notes d'herbes sauvages.</li>
                    <li><strong>Packaging éco</strong> : flacons rechargeables, matières recyclées et designs minimalistes.</li>
                    <li><strong>Personnalisation</strong> : blends sur mesure et parfums modulaires pour créer sa signature.</li>
                </ul>
                <p>Le futur du parfum est à la fois créatif et responsable. Explorez ces tendances pour affiner votre style.</p>
            `
        }
    };

    if (defaultArticles[articleId]) {
        const article = defaultArticles[articleId];
        document.title = `${article.title} - Barishop`;

        detailWrapper.innerHTML = `
            <article class="blog-detail">
                <div class="blog-detail-hero">
                    <img src="${article.image || 'https://via.placeholder.com/1200x600?text=Article'}" alt="${escapeHtml(article.title)}">
                    <div class="blog-detail-overlay">
                        <span class="blog-detail-category">${escapeHtml(article.category || 'Nouveautés')}</span>
                        <div class="blog-detail-meta">
                            <span>${formatDateFR(article.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="blog-detail-content">
                    <h1 class="blog-detail-title">${escapeHtml(article.title)}</h1>
                    <p class="blog-detail-excerpt">${escapeHtml(article.excerpt || '')}</p>
                    <div class="blog-detail-body">${article.content || '<p>Contenu à venir...</p>'}</div>
                    <div class="blog-detail-actions">
                        <a href="index.html#blog" class="btn btn-secondary">Retour au blog</a>
                    </div>
                </div>
            </article>
        `;

        initHoverEffects();
        return;
    }

    try {
        const docRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            detailWrapper.innerHTML = `<p>Article introuvable. <a href="index.html">Retour au blog</a></p>`;
            return;
        }

        const article = { id: docSnap.id, ...docSnap.data() };

        document.title = `${article.title} - Barishop`;

        detailWrapper.innerHTML = `
            <article class="blog-detail">
                <div class="blog-detail-hero">
                    <img src="${article.image || 'https://via.placeholder.com/1200x600?text=Article'}" alt="${escapeHtml(article.title)}">
                    <div class="blog-detail-overlay">
                        <span class="blog-detail-category">${escapeHtml(article.category || 'Nouveautés')}</span>
                        <div class="blog-detail-meta">
                            <span>${formatDateFR(article.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="blog-detail-content">
                    <h1 class="blog-detail-title">${escapeHtml(article.title)}</h1>
                    <p class="blog-detail-excerpt">${escapeHtml(article.excerpt || '')}</p>
                    <div class="blog-detail-body">${article.content || '<p>Contenu à venir...</p>'}</div>
                    <div class="blog-detail-actions">
                        <a href="index.html#blog" class="btn btn-secondary">Retour au blog</a>
                    </div>
                </div>
            </article>
        `;

        initHoverEffects();
    } catch (error) {
        console.error('Error loading article:', error);
        detailWrapper.innerHTML = `<p>Impossible de charger l'article. <a href="index.html">Retour</a></p>`;
    }
}

function displayArticles(articles) {
    const blogsGrid = document.getElementById('blogsGrid');
    if (!blogsGrid) return;

    blogsGrid.innerHTML = articles.map((article, index) => `
        <article class="blog-card" data-category="${escapeHtml(article.category || 'Nouveautés')}" data-aos="fade-up" data-aos-delay="${index * 100}">
            <div class="blog-image">
                <img src="${article.image || 'https://via.placeholder.com/600x400?text=Article'}" alt="${escapeHtml(article.title)}" onerror="this.src='https://via.placeholder.com/600x400?text=Article'" loading="lazy">
                <span class="blog-category">${escapeHtml(article.category || 'Nouveautés')}</span>
            </div>
            <div class="blog-content">
                <div class="blog-date">
                    <i class="far fa-calendar"></i>
                    <span>${formatDateFR(article.date)}</span>
                </div>
                <h3 class="blog-title">${escapeHtml(article.title)}</h3>
                <p class="blog-excerpt">${escapeHtml(article.excerpt || '')}</p>
                ${parseFloat(article.price || 0) > 0 ? `
                    <div class="blog-price-display">
                        <span class="price">${parseFloat(article.price).toFixed(2)}€</span>
                    </div>
                ` : ''}
                <a href="blog.html?id=${article.id}" class="blog-link">Lire la suite <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `).join('');

    initBlogFilters();
    initHoverEffects();
}

function formatDateFR(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function initNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenuContainer = document.querySelector('.nav-menu-container');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');
    
    if (menuToggle && navMenuContainer) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenuContainer.classList.toggle('active');
            document.body.style.overflow = navMenuContainer.classList.contains('active') ? 'hidden' : '';
        });
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navMenuContainer.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = navMenuContainer.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideMenu && !isClickOnToggle && navMenuContainer.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navMenuContainer.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && navMenuContainer.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navMenuContainer.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    window.addEventListener('scroll', function() {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
        
        const sections = document.querySelectorAll('section');
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + section.clientHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ========================================
// CONTACT FORM
// ========================================
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const messageData = {
            prenom: formData.get('prenom'),
            nom: formData.get('nom'),
            email: formData.get('email'),
            message: formData.get('message')
        };

        try {
            await addDoc(collection(db, "messages"), {
                ...messageData,
                date: new Date().toISOString()
            });
            
            showNotification("Merci ! Votre message a bien été envoyé.", "success");
            form.reset();
        } catch (error) {
            console.error('Error sending message:', error);
            showNotification("Erreur lors de l'envoi du message.", "error");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initPlaceholders() {}

// ========================================
// SCROLL ANIMATIONS
// ========================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.product-card, .collection-card, .feature-card, .testimonial-card, .blog-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// ========================================
// TYPING ANIMATION
// ========================================
function initTypingAnimation() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const texts = [
        "Découvrez notre collection exclusive de parfums créés avec des ingrédients d'exception. Chaque fragrance raconte une histoire unique.",
        "Nos parfums sont élaborés avec les essences les plus rares du monde. Des notes de tête vibrantes aux fonds profonds envoûtants.",
        "Laissez-vous séduire par nos fragrances uniques, mêlant tradition artisanale et innovation contemporaine. L'excellence à votre portée.",
        "Chaque parfum Barishop est le fruit d'un savoir-faire centenaire. Nos nez experts sélectionnent avec passion les matières premières précieuses.",
        "Des senteurs envoûtantes qui évoluent avec vous tout au long de la journée. L'art de la parfumerie dans sa forme la plus pure."
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isEnd = false;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            isEnd = true;
            setTimeout(type, 3000);
            return;
        }
        
        if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            setTimeout(type, 500);
            return;
        }
        
        const timeout = isDeleting ? 30 : isEnd ? 2000 : 60;
        
        if (isEnd) {
            isEnd = false;
            isDeleting = true;
        }
        
        setTimeout(type, timeout);
    }
    
    setTimeout(type, 1500);
    
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    typingElement.parentNode.insertBefore(cursor, typingElement.nextSibling);
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.animation = 'notifSlideIn 0.4s ease forwards';
    });
    
    setTimeout(() => {
        notification.style.animation = 'notifSlideOut 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// ========================================
// SMOOTH SCROLL
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                const navMenuContainer = document.querySelector('.nav-menu-container');
                const menuToggle = document.getElementById('menuToggle');
                if (navMenuContainer?.classList.contains('active')) {
                    navMenuContainer.classList.remove('active');
                    menuToggle?.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });
}

// ========================================
// HOVER EFFECTS
// ========================================
function initHoverEffects() {
    const cards = document.querySelectorAll('.product-card, .blog-card, .feature-card, .testimonial-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
    
    const logo = document.querySelector('.logo-svg');
    if (logo) {
        logo.addEventListener('mouseenter', function() {
            this.style.transform = 'rotate(360deg) scale(1.1)';
        });
        
        logo.addEventListener('mouseleave', function() {
            this.style.transform = 'rotate(0) scale(1)';
        });
    }
}

// ========================================
// BLOG FILTERS
// ========================================
function initBlogFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const blogCards = document.querySelectorAll('.blog-card');

    if (filterBtns.length === 0 || blogCards.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');

            blogCards.forEach((card, index) => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'none';
                    card.offsetHeight;
                    card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s both`;
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// ========================================
// NEWSLETTER FORM
// ========================================
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('newsletterEmail').value;
        const submitBtn = form.querySelector('.btn-newsletter');
        
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            showNotification("Merci ! Votre inscription à la newsletter est confirmée.", "success");
            form.reset();
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }, 1500);
    });
}

// ========================================
// WINDOW LOAD EVENT
// ========================================
window.addEventListener('load', function() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
    
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
});

// ========================================
// RESIZE HANDLER
// ========================================
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        initHoverEffects();
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }, 250);
});
