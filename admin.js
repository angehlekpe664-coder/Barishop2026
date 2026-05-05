/// ========================================
// BARISHOP - ADMIN JAVASCRIPT (FIREBASE VERSION)
// ========================================

// Import Firebase functions
import { signIn, logOut, onAuthChange, getArticles, getArticle, addArticle, updateArticle, deleteArticle, getProducts, getProduct, addProduct, updateProduct, deleteProduct, getMessages, deleteMessage, getCarts, deleteCart, getNewsletters, deleteNewsletter } from './firebase-service.js';

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

// ========================================
// AUTHENTICATION
// ========================================
function initAuth() {
    // Listen for auth state changes
    onAuthChange((authState) => {
        if (authState.isAuthenticated && authState.isAllowed) {
            showAdminContent(authState.user);
        } else {
            showLoginScreen();
        }
    });
    
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    if (!email || !password) {
        loginError.textContent = 'Veuillez entrer votre email et mot de passe';
        loginError.style.display = 'block';
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    loginError.style.display = 'none';
    
    try {
        console.log('Attempting login with:', email);
        const result = await signIn(email, password);
        console.log('Login result:', result);
        
        if (result.success) {
            // Auth listener will handle showing admin content
            showNotification('Connexion réussie!', 'success');
        } else {
            loginError.textContent = result.message;
            loginError.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Erreur de connexion: ' + error.message;
        loginError.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Se connecter</span><i class="fas fa-arrow-right"></i>';
    }
}

async function handleLogout() {
    const result = await logOut();
    if (result.success) {
        showNotification('Déconnexion réussie', 'success');
        showLoginScreen();
    } else {
        showNotification('Erreur lors de la déconnexion', 'error');
    }
}

function showAdminContent(user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    
    // Show user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `<i class="fas fa-user-circle"></i> ${user.email}`;
    }
    
    // Initialize admin features
    initSidebar();
    initDate();
    loadMessages();
    loadOrders();
    loadProducts();
    loadArticles();
    loadNewsletters();
    initSettingsForm();
    
    // Setup button event listeners AFTER admin content is shown
    setupButtonListeners();
}

// Setup button event listeners
function setupButtonListeners() {
    // Add product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        console.log('Add product button found');
        addProductBtn.addEventListener('click', function() {
            console.log('Add product clicked');
            showProductModal();
        });
    } else {
        console.error('Add product button not found');
    }
    
    // Add blog button
    const addBlogBtn = document.getElementById('addBlogBtn');
    if (addBlogBtn) {
        console.log('Add blog button found');
        addBlogBtn.addEventListener('click', function() {
            console.log('Add blog clicked');
            showArticleModal();
        });
    } else {
        console.error('Add blog button not found');
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminContent').style.display = 'none';
    
    // Clear form
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

// Password toggle
window.togglePassword = function() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
};

// ========================================
// SIDEBAR NAVIGATION
// ========================================
function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.querySelector('.page-title');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    const titles = {
        'dashboard': 'Tableau de bord',
        'messages': 'Messages',
        'orders': 'Commandes',
        'products': 'Produits',
        'blogs': 'Blog',
        'settings': 'Paramètres',
        'newsletters': 'Newsletter'
    };

    // Navigation items click
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            const sectionId = this.getAttribute('data-section');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');

            pageTitle.textContent = titles[sectionId];
            
            // Close mobile menu after selection
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    });
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }
    
    // Close menu when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
}

// ========================================
// DATE DISPLAY
// ========================================
function initDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('fr-FR', options);
}

// ========================================
// MESSAGES MANAGEMENT
// ========================================
async function loadMessages() {
    const result = await getMessages();
    if (result.success) {
        displayMessages(result.messages);
        updateMessageBadge(result.messages.length);
        const totalMessagesEl = document.getElementById('totalMessages');
        if (totalMessagesEl) totalMessagesEl.textContent = result.messages.length;
    } else {
        displayNoMessages();
    }
}

function displayMessages(messages) {
    const tbody = document.getElementById('messagesTableBody');
    const allMessagesBody = document.getElementById('allMessagesTableBody');
    
    if (!messages || messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Aucun message</td></tr>';
        allMessagesBody.innerHTML = '<tr><td colspan="6" class="loading">Aucun message</td></tr>';
        return;
    }

    const recentMessages = messages.slice(0, 5);
    
    tbody.innerHTML = recentMessages.map(msg => `
        <tr>
            <td><strong>${escapeHtml(msg.prenom || '')} ${escapeHtml(msg.nom || '')}</strong></td>
            <td>${escapeHtml(msg.email || '')}</td>
            <td>${escapeHtml(truncate(msg.message || '', 50))}</td>
            <td>${formatDate(msg.date)}</td>
            <td><button class="btn-delete" onclick="deleteMessageById('${msg.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');

    allMessagesBody.innerHTML = messages.map(msg => `
        <tr>
            <td>${escapeHtml(msg.prenom || '')}</td>
            <td>${escapeHtml(msg.nom || '')}</td>
            <td>${escapeHtml(msg.email || '')}</td>
            <td>${escapeHtml(truncate(msg.message || '', 80))}</td>
            <td>${formatDate(msg.date)}</td>
            <td>
                <button class="btn-edit" onclick="viewMessage('${msg.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn-delete" onclick="deleteMessageById('${msg.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function displayNoMessages() {
    const tbody = document.getElementById('messagesTableBody');
    const allMessagesBody = document.getElementById('allMessagesTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Aucun message</td></tr>';
    allMessagesBody.innerHTML = '<tr><td colspan="6" class="loading">Aucun message</td></tr>';
}

function updateMessageBadge(count) {
    const badge = document.getElementById('messageBadge');
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

function viewMessage(id) {
    getMessages().then(result => {
        if (result.success) {
            const msg = result.messages.find(m => m.id === id);
            if (msg) {
                alert(`De: ${msg.prenom} ${msg.nom}\nEmail: ${msg.email}\n\nMessage:\n${msg.message}`);
            }
        }
    });
}

async function deleteMessageById(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        const result = await deleteMessage(id);
        if (result.success) {
            showNotification('Message supprimé avec succès', 'success');
            loadMessages();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// ========================================
// ORDERS / CARTS MANAGEMENT
// ========================================

async function loadOrders() {
    const result = await getCarts();
    if (result.success) {
        displayOrders(result.carts);
        updateOrdersBadge(result.carts.length);
        const totalOrdersEl = document.getElementById('totalOrders');
        if (totalOrdersEl) totalOrdersEl.textContent = result.carts.length;
    } else {
        displayNoOrders();
    }
}

function displayOrders(carts) {
    const tbody = document.getElementById('ordersTableBody');
    if (!carts || carts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Aucune commande</td></tr>';
        return;
    }

    tbody.innerHTML = carts.map(cart => {
        const userName = cart.name || cart.uid || '-';
        const email = cart.email || '-';
        const total = parseFloat(cart.total || 0).toFixed(2);
        const updated = formatDate(cart.lastUpdated);
        const itemsList = Array.isArray(cart.items) ? cart.items.map(i => `${i.name} (${i.quantity})`).join(', ') : '-';

        return `
            <tr>
                <td>${escapeHtml(userName)}</td>
                <td>${escapeHtml(email)}</td>
                <td>${total}€</td>
                <td>${escapeHtml(itemsList)}</td>
                <td>${updated}</td>
                <td>
                    <button class="btn-delete" onclick="deleteOrderById('${cart.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function displayNoOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Aucune commande</td></tr>';
}

function updateOrdersBadge(count) {
    const badge = document.getElementById('ordersBadge');
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

async function deleteOrderById(uid) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
        const result = await deleteCart(uid);
        if (result.success) {
            showNotification('Commande supprimée', 'success');
            loadOrders();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// ========================================
// PRODUCTS MANAGEMENT
// ========================================
async function loadProducts() {
    const result = await getProducts();
    if (result.success) {
        displayProducts(result.products);
        const totalProductsEl = document.getElementById('totalProducts');
        if (totalProductsEl) totalProductsEl.textContent = result.products.length;
    } else {
        displayNoProducts();
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (!products || products.length === 0) {
        grid.innerHTML = '<p class="no-items">Aucun produit. Ajoutez votre premier produit!</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-admin-card">
            <div class="product-admin-image">
                <img src="${product.image || 'https://via.placeholder.com/300x200?text=Produit'}" alt="${escapeHtml(product.name)}" onerror="this.src='https://via.placeholder.com/300x200?text=Produit'">
            </div>
            <div class="product-admin-info">
                <h3>${escapeHtml(product.name || '')}</h3>
                <p>${escapeHtml(product.description || '')}</p>
                <div class="product-price">${parseFloat(product.price || 0).toFixed(2)}€</div>
            </div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i> Modifier</button>
                <button class="btn-delete" onclick="deleteProductById('${product.id}')"><i class="fas fa-trash"></i> Supprimer</button>
            </div>
        </div>
    `).join('');
}

function displayNoProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<p class="no-items">Aucun produit. Ajoutez votre premier produit!</p>';
}

function showProductModal(product = null) {
    const isEdit = product !== null;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = isEdit ? 'Modifier le produit' : 'Ajouter un produit';
    
    // Store existing image for edit mode
    const existingImage = product ? product.image : null;
    
    modalBody.innerHTML = `
        <form id="productForm">
            <input type="hidden" name="id" value="${product ? product.id : ''}">
            
            <div class="form-group">
                <label>Nom du produit *</label>
                <input type="text" name="name" value="${product ? escapeHtml(product.name) : ''}" required>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3">${product ? escapeHtml(product.description || '') : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Prix (€) *</label>
                <input type="number" name="price" value="${product ? product.price : ''}" step="0.01" min="0" required>
            </div>
            
            <div class="form-group">
                <label>Image du produit</label>
                ${product && product.image ? `
                    <div class="image-preview-container">
                        <img src="${product.image}" class="image-preview" alt="Preview" onerror="this.src='https://via.placeholder.com/300x200?text=Produit'">
                        <button type="button" class="remove-image-btn" onclick="removeProductImage()">×</button>
                    </div>
                ` : ''}
                <div class="file-upload-wrapper">
                    <input type="file" name="imageFile" id="productImageFile" accept="image/*" class="file-input">
                    <label for="productImageFile" class="file-label">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Choisir une image</span>
                    </label>
                    <span class="file-name" id="productFileName"></span>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn-save">${isEdit ? 'Mettre à jour' : 'Ajouter'}</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
    
    // File input event
    const fileInput = document.getElementById('productImageFile');
    const fileNameSpan = document.getElementById('productFileName');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileNameSpan.textContent = this.files[0].name;
            }
        });
    }
    
    document.getElementById('productForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const form = e.target;
        let imageUrl = existingImage || null;
        
        // Upload image if file selected
        const fileInput = form.imageFile;
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const { uploadImage } = await import('./firebase-service.js');
            const uploadedUrl = await uploadImage(fileInput.files[0]);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            }
        }
        
        const productData = {
            name: form.name.value,
            description: form.description.value,
            price: parseFloat(form.price.value) || 0,
            image: imageUrl || 'https://via.placeholder.com/600x400?text=Produit'
        };
        
        let result;
        if (isEdit) {
            result = await updateProduct(product.id, productData);
        } else {
            result = await addProduct(productData);
        }
        
        if (result.success) {
            showNotification(result.message, 'success');
            closeModal();
            loadProducts();
        } else {
            showNotification(result.message || 'Erreur', 'error');
        }
    });
}

window.removeProductImage = function() {
    const preview = document.querySelector('.image-preview-container');
    if (preview) preview.remove();
};

async function editProduct(id) {
    const result = await getProduct(id);
    if (result.success && result.product) {
        showProductModal(result.product);
    }
}

async function deleteProductById(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        const result = await deleteProduct(id);
        if (result.success) {
            showNotification('Produit supprimé avec succès', 'success');
            loadProducts();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// ========================================
// ARTICLES (BLOG) MANAGEMENT
// ========================================
async function loadArticles() {
    const result = await getArticles();
    if (result.success) {
        displayArticles(result.articles);
        const totalBlogsEl = document.getElementById('totalBlogs');
        if (totalBlogsEl) totalBlogsEl.textContent = result.articles.length;
    } else {
        displayNoArticles();
    }
}

function displayArticles(articles) {
    const grid = document.getElementById('blogsGrid');
    
    if (!articles || articles.length === 0) {
        grid.innerHTML = '<p class="no-items">Aucun article. Ajoutez votre premier article!</p>';
        return;
    }
    
    grid.innerHTML = articles.map(article => `
        <div class="blog-admin-card">
            <div class="blog-admin-image">
                <img src="${article.image || 'https://via.placeholder.com/300x200?text=Article'}" alt="${escapeHtml(article.title)}" onerror="this.src='https://via.placeholder.com/300x200?text=Article'">
            </div>
            <div class="blog-admin-info">
                <span class="blog-category-tag">${escapeHtml(article.category || 'Nouveautés')}</span>
                <h3>${escapeHtml(article.title || '')}</h3>
                <p>${escapeHtml(article.excerpt || '')}</p>
                ${parseFloat(article.price || 0) > 0 ? `<div class="blog-price">${parseFloat(article.price).toFixed(2)}€</div>` : ''}
                <div class="blog-date">${formatDate(article.date)}</div>
            </div>
            <div class="blog-actions">
                <button class="btn-edit" onclick="editArticleById('${article.id}')"><i class="fas fa-edit"></i> Modifier</button>
                <button class="btn-delete" onclick="deleteArticleById('${article.id}')"><i class="fas fa-trash"></i> Supprimer</button>
            </div>
        </div>
    `).join('');
}

function displayNoArticles() {
    const grid = document.getElementById('blogsGrid');
    grid.innerHTML = '<p class="no-items">Aucun article. Ajoutez votre premier article!</p>';
}

function showArticleModal(article = null) {
    const isEdit = article !== null;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = isEdit ? 'Modifier l\'article' : 'Ajouter un article';
    
    // Store existing image for edit mode
    const existingImage = article ? article.image : null;
    
    modalBody.innerHTML = `
        <form id="articleForm">
            <input type="hidden" name="id" value="${article ? article.id : ''}">
            
            <div class="form-group">
                <label>Titre *</label>
                <input type="text" name="title" value="${article ? escapeHtml(article.title) : ''}" required>
            </div>
            
            <div class="form-group">
                <label>Extrait (description courte) *</label>
                <textarea name="excerpt" rows="2" required>${article ? escapeHtml(article.excerpt || '') : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Contenu</label>
                <textarea name="content" rows="4">${article ? escapeHtml(article.content || '') : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Catégorie</label>
                <select name="category">
                    <option value="Nouveautés" ${article && article.category === 'Nouveautés' ? 'selected' : ''}>Nouveautés</option>
                    <option value="Conseils" ${article && article.category === 'Conseils' ? 'selected' : ''}>Conseils</option>
                    <option value="Actualités" ${article && article.category === 'Actualités' ? 'selected' : ''}>Actualités</option>
                    <option value="Produits" ${article && article.category === 'Produits' ? 'selected' : ''}>Produits</option>
                    <option value="Événements" ${article && article.category === 'Événements' ? 'selected' : ''}>Événements</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Prix (€) - Mettre 0 pour un article gratuit</label>
                <input type="number" name="price" value="${article ? article.price : 0}" step="0.01" min="0">
            </div>
            
            <div class="form-group">
                <label>Image de l'article</label>
                ${article && article.image ? `
                    <div class="image-preview-container">
                        <img src="${article.image}" class="image-preview" alt="Preview" onerror="this.src='https://via.placeholder.com/300x200?text=Article'">
                        <button type="button" class="remove-image-btn" onclick="removeArticleImage()">×</button>
                    </div>
                ` : ''}
                <div class="file-upload-wrapper">
                    <input type="file" name="imageFile" id="articleImageFile" accept="image/*" class="file-input">
                    <label for="articleImageFile" class="file-label">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Choisir une image</span>
                    </label>
                    <span class="file-name" id="articleFileName"></span>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn-save">${isEdit ? 'Mettre à jour' : 'Ajouter'}</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
    
    // File input event
    const fileInput = document.getElementById('articleImageFile');
    const fileNameSpan = document.getElementById('articleFileName');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileNameSpan.textContent = this.files[0].name;
            }
        });
    }
    
    document.getElementById('articleForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const form = e.target;
        let imageUrl = existingImage || null;
        
        // Upload image if file selected
        const fileInput = form.imageFile;
        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                const { uploadImage } = await import('./firebase-service.js');
                const uploadedUrl = await uploadImage(fileInput.files[0]);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
            }
        }
        
        const articleData = {
            title: form.title.value,
            excerpt: form.excerpt.value,
            content: form.content.value,
            category: form.category.value,
            price: parseFloat(form.price.value) || 0,
            image: imageUrl || 'https://via.placeholder.com/600x400?text=Article'
        };
        
        let result;
        if (isEdit) {
            result = await updateArticle(article.id, articleData);
        } else {
            result = await addArticle(articleData);
        }
        
        if (result.success) {
            showNotification(result.message, 'success');
            closeModal();
            loadArticles();
        } else {
            showNotification(result.message || 'Erreur', 'error');
        }
    });
}

window.removeArticleImage = function() {
    const preview = document.querySelector('.image-preview-container');
    if (preview) preview.remove();
};

async function editArticleById(id) {
    const result = await getArticle(id);
    if (result.success && result.article) {
        showArticleModal(result.article);
    }
}

async function deleteArticleById(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
        const result = await deleteArticle(id);
        if (result.success) {
            showNotification('Article supprimé avec succès', 'success');
            loadArticles();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// ========================================
// MODAL FUNCTIONS
// ========================================
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

document.getElementById('modalClose')?.addEventListener('click', closeModal);

// ========================================
// SETTINGS FORM
// ========================================
function initSettingsForm() {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const settings = {};
        formData.forEach((value, key) => {
            settings[key] = value;
        });

        localStorage.setItem('barishop_settings', JSON.stringify(settings));
        showNotification('Paramètres enregistrés avec succès', 'success');
    });

    const savedSettings = localStorage.getItem('barishop_settings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        Object.keys(settings).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = settings[key];
        });
    }
}

// ========================================
// EXPOSE FUNCTIONS TO WINDOW (for onclick handlers)
// ========================================
window.editArticleById = editArticleById;
window.deleteArticleById = deleteArticleById;
window.editProduct = editProduct;
window.deleteProductById = deleteProductById;
window.deleteMessageById = deleteMessageById;
window.deleteOrderById = deleteOrderById;
window.viewMessage = viewMessage;
window.closeModal = closeModal;
window.removeProductImage = removeProductImage;
window.removeArticleImage = removeArticleImage;
window.deleteNewsletterById = deleteNewsletterById;

// ========================================
// NEWSLETTER SUBSCRIBERS
// ========================================
async function loadNewsletters() {
    try {
        const result = await getNewsletters();
        if (result.success) {
            displayNewsletters(result.newsletters);
            const badge = document.getElementById('newsletterBadge');
            if (badge) {
                badge.textContent = result.newsletters.length;
                badge.style.display = result.newsletters.length > 0 ? 'inline-block' : 'none';
            }
            const count = document.getElementById('newsletterCount');
            if (count) count.textContent = `${result.newsletters.length} abonné(s)`;
        }
    } catch(e) {
        console.error('Error loading newsletters:', e);
    }
}

function displayNewsletters(newsletters) {
    const tbody = document.getElementById('newsletterTableBody');
    if (!newsletters || newsletters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Aucun abonné pour le moment.</td></tr>';
        return;
    }
    tbody.innerHTML = newsletters.map((sub, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(sub.email)}</strong></td>
            <td>${formatDate(sub.date)}</td>
            <td><button class="btn-delete" onclick="deleteNewsletterById('${sub.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

async function deleteNewsletterById(id) {
    if (confirm('Supprimer cet abonné de la newsletter ?')) {
        const result = await deleteNewsletter(id);
        if (result.success) {
            showNotification('Abonné supprimé', 'success');
            loadNewsletters();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}


// ========================================
// UTILITY FUNCTIONS
// ========================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, length) {
    if (!text) return '';
    return text.length <= length ? text : text.substring(0, length) + '...';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    const colors = { success: '#28a745', error: '#dc3545', info: '#17a2b8' };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .blog-category-tag {
        display: inline-block;
        background: linear-gradient(135deg, #8a4baf 0%, #6a11cb 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    .blog-price {
        font-size: 1.2rem;
        font-weight: 700;
        color: #8a4baf;
        margin: 8px 0;
    }
    .no-items {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 1.1rem;
    }
    .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
    }
    .btn-cancel {
        padding: 10px 20px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    .btn-cancel:hover { background: #5a6268; }
    
    /* File Upload Styles */
    .file-upload-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }
    .file-input {
        display: none;
    }
    .file-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #8a4baf 0%, #6a11cb 100%);
        color: white;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    .file-label:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(106, 17, 203, 0.3);
    }
    .file-label i {
        font-size: 1.1rem;
    }
    .file-name {
        color: #666;
        font-size: 0.85rem;
    }
    .input-hint {
        color: #888;
        font-size: 0.8rem;
        margin: 5px 0;
    }
    .image-preview-container {
        position: relative;
        display: inline-block;
        margin-bottom: 15px;
    }
    .image-preview {
        max-width: 200px;
        max-height: 150px;
        border-radius: 8px;
        object-fit: cover;
    }
    .remove-image-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 25px;
        height: 25px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
    }
    .remove-image-btn:hover {
        background: #c82333;
    }
`;
document.head.appendChild(style);

