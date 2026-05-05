/// ========================================
// BARISHOP - FIREBASE SERVICE
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOdFfDX5pJGXPrbj4HBibdakEiLmLZ4bA",
  authDomain: "barishop-27fdf.firebaseapp.com",
  projectId: "barishop-27fdf",
  storageBucket: "barishop-27fdf.firebasestorage.app",
  messagingSenderId: "434603534493",
  appId: "1:434603534493:web:9326066133cf1d58908c74",
  measurementId: "G-XZ2WGRE94S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

// Allowed admin emails (stored in Firebase Firestore collection 'admins')
const ADMIN_EMAILS = ['lawanibarizath@gmail.com', 'angehlekpe664@gmail.com', 'devmia411@gmail.com']; // Fallback if Firestore fails

// Sign in with email and password
export async function signIn(email, password) {
    try {
        console.log('Firebase: Attempting sign in with', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Firebase: User logged in', user.email);
        
        // Allow any authenticated user to access admin
        return { 
            success: true, 
            message: "Connexion réussie", 
            user: { email: user.email, uid: user.uid }
        };
    } catch (error) {
        console.error("Firebase login error:", error);
        let message = "Erreur de connexion";
        
        if (error.code === 'auth/invalid-email') {
            message = "Email invalide";
        } else if (error.code === 'auth/user-not-found') {
            message = "Aucun compte avec cet email";
        } else if (error.code === 'auth/wrong-password') {
            message = "Mot de passe incorrect";
        } else if (error.code === 'auth/invalid-credential') {
            message = "Email ou mot de passe incorrect";
        } else if (error.code === 'auth/too-many-requests') {
            message = "Trop de tentatives. Veuillez réessayer plus tard";
        } else if (error.message) {
            message = error.message;
        }
        
        return { success: false, message: message };
    }
}

// Sign out
export async function logOut() {
    try {
        await signOut(auth);
        return { success: true, message: "Déconnexion réussie" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Check if user is authenticated
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const isAllowed = await checkAdminAccess(user.email);
            callback({ 
                isAuthenticated: true, 
                isAllowed: isAllowed,
                user: { email: user.email, uid: user.uid }
            });
        } else {
            callback({ 
                isAuthenticated: false, 
                isAllowed: false,
                user: null
            });
        }
    });
}

// Check admin access
async function checkAdminAccess(email) {
    if (!email) return false;
    
    // Normalize email to lowercase for comparison
    const normalizedEmail = email.toLowerCase();
    
    // First check local list (case-insensitive)
    const allowedEmails = ADMIN_EMAILS.map(e => e.toLowerCase());
    if (allowedEmails.includes(normalizedEmail)) {
        return true;
    }
    
    // Then check Firestore
    try {
        const adminsRef = collection(db, "admins");
        const q = query(adminsRef);
        const querySnapshot = await getDocs(q);
        
        let allowed = false;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.email && data.email.toLowerCase() === normalizedEmail) {
                allowed = true;
            }
        });
        
        return allowed;
    } catch (error) {
        console.error("Error checking admin access:", error);
        return allowedEmails.includes(normalizedEmail);
    }
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// ========================================
// IMAGE UPLOAD FUNCTION (Base64 only - avoids CORS issues)
// ========================================
export async function uploadImage(file) {
    if (!file) return null;
    
    try {
        // Convert file to base64 directly
        // This avoids CORS issues with Firebase Storage
        const base64 = await fileToBase64(file);
        return base64;
    } catch (error) {
        console.error("Error converting image to base64:", error);
        return null;
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ========================================
// ARTICLES (BLOG) FUNCTIONS
// ========================================

// Get all articles
export async function getArticles() {
    try {
        const q = query(collection(db, "articles"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const articles = [];
        querySnapshot.forEach((doc) => {
            articles.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, articles };
    } catch (error) {
        console.error("Error getting articles:", error);
        return { success: false, message: error.message };
    }
}

// Get single article
export async function getArticle(id) {
    try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, article: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, message: "Article non trouvé" };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Add article
export async function addArticle(articleData) {
    try {
        const docRef = await addDoc(collection(db, "articles"), {
            ...articleData,
            date: new Date().toISOString()
        });
        return { success: true, message: "Article ajouté avec succès", id: docRef.id };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Update article
export async function updateArticle(id, articleData) {
    try {
        const docRef = doc(db, "articles", id);
        await updateDoc(docRef, articleData);
        return { success: true, message: "Article mis à jour avec succès" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Delete article
export async function deleteArticle(id) {
    try {
        await deleteDoc(doc(db, "articles", id));
        return { success: true, message: "Article supprimé avec succès" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ========================================
// PRODUCTS FUNCTIONS
// ========================================

// Get all products
export async function getProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, products };
    } catch (error) {
        console.error("Error getting products:", error);
        return { success: false, message: error.message };
    }
}

// Get single product
export async function getProduct(id) {
    try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, product: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, message: "Produit non trouvé" };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Add product
export async function addProduct(productData) {
    try {
        const docRef = await addDoc(collection(db, "products"), {
            ...productData,
            date: new Date().toISOString()
        });
        return { success: true, message: "Produit ajouté avec succès", id: docRef.id };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Update product
export async function updateProduct(id, productData) {
    try {
        const docRef = doc(db, "products", id);
        await updateDoc(docRef, productData);
        return { success: true, message: "Produit mis à jour avec succès" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Delete product
export async function deleteProduct(id) {
    try {
        await deleteDoc(doc(db, "products", id));
        return { success: true, message: "Produit supprimé avec succès" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ========================================
// MESSAGES FUNCTIONS
// ========================================

// Get all messages
export async function getMessages() {
    try {
        const q = query(collection(db, "messages"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, messages };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Add message (contact form)
export async function addMessage(messageData) {
    try {
        const docRef = await addDoc(collection(db, "messages"), {
            ...messageData,
            date: new Date().toISOString()
        });
        return { success: true, message: "Message envoyé avec succès" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Delete message
export async function deleteMessage(id) {
    try {
        await deleteDoc(doc(db, "messages", id));
        return { success: true, message: "Message supprimé avec succès" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ========================================
// CARTS / ORDERS (ADMIN VIEW)
// ========================================

export async function getCarts() {
    try {
        const q = query(collection(db, "carts"), orderBy("lastUpdated", "desc"));
        const querySnapshot = await getDocs(q);
        const carts = [];
        querySnapshot.forEach((doc) => {
            carts.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, carts };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function saveCart(uid, cartData) {
    try {
        if (!uid) throw new Error("UID manquant");
        const cartRef = doc(db, "carts", uid);
        await setDoc(cartRef, {
            uid,
            ...cartData,
            lastUpdated: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("Error saving cart:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteCart(uid) {
    try {
        if (!uid) throw new Error("UID manquant");
        await deleteDoc(doc(db, "carts", uid));
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ========================================
// NEWSLETTER FUNCTIONS
// ========================================

export async function getNewsletters() {
    try {
        const q = query(collection(db, "newsletters"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const newsletters = [];
        querySnapshot.forEach((doc) => {
            newsletters.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, newsletters };
    } catch (error) {
        console.error("Error getting newsletters:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteNewsletter(id) {
    try {
        await deleteDoc(doc(db, "newsletters", id));
        return { success: true, message: "Abonné supprimé avec succès" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}
