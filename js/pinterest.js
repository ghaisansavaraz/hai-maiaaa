/* Pinterest Board Viewer - Category and Image Management */

import { PINTEREST_STORAGE_KEY, debugLog, debugError } from './config.js';

// State
let pinterestData = {
  categories: [],
  activeCategory: null
};

// Generate unique ID
function generateId() {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load Pinterest data from localStorage
export function loadPinterestData() {
  try {
    const stored = localStorage.getItem(PINTEREST_STORAGE_KEY);
    if (stored) {
      pinterestData = JSON.parse(stored);
      debugLog('Pinterest data loaded:', pinterestData);
    } else {
      // Initialize with default category
      pinterestData = {
        categories: [],
        activeCategory: null
      };
      debugLog('Pinterest data initialized with defaults');
    }
    return pinterestData;
  } catch (error) {
    debugError('Error loading Pinterest data:', error);
    pinterestData = {
      categories: [],
      activeCategory: null
    };
    return pinterestData;
  }
}

// Save Pinterest data to localStorage
export function savePinterestData() {
  try {
    localStorage.setItem(PINTEREST_STORAGE_KEY, JSON.stringify(pinterestData));
    debugLog('Pinterest data saved');
  } catch (error) {
    debugError('Error saving Pinterest data:', error);
  }
}

// Create a new category
export function createCategory(name, notes = '') {
  if (!name || !name.trim()) {
    debugError('Category name is required');
    return null;
  }

  const category = {
    id: generateId(),
    name: name.trim(),
    notes: notes.trim(),
    images: [],
    createdAt: Date.now()
  };

  pinterestData.categories.push(category);
  
  // Set as active if it's the first category
  if (pinterestData.categories.length === 1) {
    pinterestData.activeCategory = category.id;
  }
  
  savePinterestData();
  debugLog('Category created:', category);
  return category;
}

// Update category
export function updateCategory(id, updates) {
  const category = pinterestData.categories.find(cat => cat.id === id);
  if (!category) {
    debugError('Category not found:', id);
    return false;
  }

  if (updates.name !== undefined) category.name = updates.name.trim();
  if (updates.notes !== undefined) category.notes = updates.notes.trim();
  
  savePinterestData();
  debugLog('Category updated:', category);
  return true;
}

// Delete category
export function deleteCategory(id) {
  const index = pinterestData.categories.findIndex(cat => cat.id === id);
  if (index === -1) {
    debugError('Category not found:', id);
    return false;
  }

  pinterestData.categories.splice(index, 1);
  
  // Update active category if needed
  if (pinterestData.activeCategory === id) {
    pinterestData.activeCategory = pinterestData.categories.length > 0 
      ? pinterestData.categories[0].id 
      : null;
  }
  
  savePinterestData();
  debugLog('Category deleted:', id);
  return true;
}

// Add image to category
export function addImageToCategory(categoryId, imageUrl) {
  if (!imageUrl || !imageUrl.trim()) {
    debugError('Image URL is required');
    return false;
  }

  const category = pinterestData.categories.find(cat => cat.id === categoryId);
  if (!category) {
    debugError('Category not found:', categoryId);
    return false;
  }

  const url = imageUrl.trim();
  
  // Check for duplicates
  if (category.images.includes(url)) {
    debugLog('Image URL already exists in category');
    return false;
  }

  category.images.push(url);
  savePinterestData();
  debugLog('Image added to category:', url);
  return true;
}

// Remove image from category
export function removeImageFromCategory(categoryId, imageUrl) {
  const category = pinterestData.categories.find(cat => cat.id === categoryId);
  if (!category) {
    debugError('Category not found:', categoryId);
    return false;
  }

  const index = category.images.indexOf(imageUrl);
  if (index === -1) {
    debugError('Image not found in category:', imageUrl);
    return false;
  }

  category.images.splice(index, 1);
  savePinterestData();
  debugLog('Image removed from category');
  return true;
}

// Set active category
export function setActiveCategory(categoryId) {
  const category = pinterestData.categories.find(cat => cat.id === categoryId);
  if (!category) {
    debugError('Category not found:', categoryId);
    return false;
  }

  pinterestData.activeCategory = categoryId;
  savePinterestData();
  debugLog('Active category set:', categoryId);
  return true;
}

// Get active category
export function getActiveCategory() {
  if (!pinterestData.activeCategory) return null;
  return pinterestData.categories.find(cat => cat.id === pinterestData.activeCategory);
}

// Render categories in sidebar
export function renderCategories() {
  const sidebar = document.getElementById('pinterestSidebar');
  if (!sidebar) return;

  const categoriesHtml = pinterestData.categories.map(category => {
    const isActive = category.id === pinterestData.activeCategory;
    return `
      <div class="pinterest-category-tab ${isActive ? 'active' : ''}" 
           data-category-id="${category.id}"
           role="button"
           tabindex="0">
        <div class="category-tab-content">
          <span class="category-name">${escapeHtml(category.name)}</span>
          <span class="category-count">${category.images.length}</span>
        </div>
        <button class="category-delete-btn" 
                data-category-id="${category.id}"
                aria-label="Delete category"
                title="Delete category">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M7 7v4M9 7v4M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  sidebar.innerHTML = categoriesHtml || '<div class="no-categories">No categories yet. Click + to add one.</div>';

  // Attach event listeners
  sidebar.querySelectorAll('.pinterest-category-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      if (e.target.closest('.category-delete-btn')) return; // Don't switch category when deleting
      const categoryId = tab.dataset.categoryId;
      setActiveCategory(categoryId);
      renderCategories();
      renderImageGrid(categoryId);
    });
  });

  sidebar.querySelectorAll('.category-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const categoryId = btn.dataset.categoryId;
      const category = pinterestData.categories.find(cat => cat.id === categoryId);
      if (confirm(`Delete "${category.name}"? This will remove all images in this category.`)) {
        deleteCategory(categoryId);
        renderCategories();
        const activeCategory = getActiveCategory();
        if (activeCategory) {
          renderImageGrid(activeCategory.id);
        } else {
          renderImageGrid(null);
        }
      }
    });
  });
}

// Render image grid for a category
export function renderImageGrid(categoryId) {
  const grid = document.getElementById('pinterestImageGrid');
  const notesContainer = document.getElementById('categoryNotes');
  
  if (!grid) return;

  if (!categoryId) {
    grid.innerHTML = '<div class="no-content">Select a category to view images</div>';
    if (notesContainer) notesContainer.innerHTML = '';
    return;
  }

  const category = pinterestData.categories.find(cat => cat.id === categoryId);
  if (!category) {
    grid.innerHTML = '<div class="no-content">Category not found</div>';
    if (notesContainer) notesContainer.innerHTML = '';
    return;
  }

  // Render category notes
  if (notesContainer) {
    if (category.notes) {
      notesContainer.innerHTML = `
        <div class="pinterest-category-notes">
          <h3>${escapeHtml(category.name)}</h3>
          <p>${escapeHtml(category.notes)}</p>
        </div>
      `;
    } else {
      notesContainer.innerHTML = `<div class="pinterest-category-notes"><h3>${escapeHtml(category.name)}</h3></div>`;
    }
  }

  // Render images
  if (category.images.length === 0) {
    grid.innerHTML = '<div class="no-content">No images yet. Click + to add images.</div>';
    return;
  }

  const imagesHtml = category.images.map((imageUrl, index) => {
    // Determine if we should use CORS (only for known safe hosts)
    const safeCorsHosts = /imgur\.com|cloudinary\.com|unsplash\.com|pexels\.com|pixabay\.com/i;
    const useCors = safeCorsHosts.test(imageUrl);
    const corsAttr = useCors ? 'crossorigin="anonymous"' : '';
    
    return `
      <div class="pinterest-image-card" data-image-index="${index}">
        <img src="${escapeHtml(imageUrl)}" 
             alt="Image ${index + 1}" 
             loading="lazy"
             ${corsAttr}
             onerror="this.parentElement.classList.add('image-error');" />
        <button class="image-delete-btn" 
                data-image-url="${escapeHtml(imageUrl)}"
                aria-label="Delete image"
                title="Delete image">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M7 7v4M9 7v4M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  grid.innerHTML = imagesHtml;

  // Attach event listeners
  grid.querySelectorAll('.pinterest-image-card img').forEach(img => {
    img.addEventListener('click', () => {
      showImagePreview(img.src);
    });
  });

  grid.querySelectorAll('.image-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const imageUrl = btn.dataset.imageUrl;
      if (confirm('Delete this image?')) {
        removeImageFromCategory(categoryId, imageUrl);
        renderImageGrid(categoryId);
      }
    });
  });
}

// Show image preview modal
export function showImagePreview(imageUrl) {
  let modal = document.getElementById('imagePreviewModal');
  
  if (!modal) {
    debugError('Image preview modal not found');
    return;
  }

  const img = modal.querySelector('.preview-image');
  if (img) {
    img.src = imageUrl;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Close handlers
  const closeModal = () => hideImagePreview();
  
  modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
  
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// Hide image preview modal
export function hideImagePreview() {
  const modal = document.getElementById('imagePreviewModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Toggle add form
export function toggleAddForm(show = null) {
  const form = document.getElementById('addPinterestForm');
  const button = document.getElementById('addPinterestButton');
  
  if (!form || !button) return;

  const shouldShow = show !== null ? show : !form.classList.contains('active');

  if (shouldShow) {
    form.classList.add('active');
    button.classList.add('hidden');
    form.querySelector('input[name="categoryName"]')?.focus();
  } else {
    form.classList.remove('active');
    button.classList.remove('hidden');
    form.reset();
  }
}

// Validate URL
function isValidImageUrl(url) {
  if (!url || !url.trim()) return false;
  
  const trimmedUrl = url.trim();
  
  // Check if it's a data URL (base64)
  if (trimmedUrl.startsWith('data:image/')) return true;
  
  // Check if it looks like a URL (has protocol or starts with //)
  const urlPattern = /^(https?:\/\/|\/\/)/i;
  if (!urlPattern.test(trimmedUrl)) {
    // Try to help by adding https://
    return false;
  }
  
  // Check if it has common image extensions or is from known image hosts
  const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  const knownHosts = /imgur\.com|cloudinary\.com|unsplash\.com|pexels\.com|pixabay\.com|ibb\.co|postimg\.cc|i\.redd\.it/i;
  
  return imagePattern.test(trimmedUrl) || knownHosts.test(trimmedUrl);
}

// Handle form submission
export function handleAddFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const categoryName = form.querySelector('input[name="categoryName"]')?.value;
  let imageUrl = form.querySelector('input[name="imageUrl"]')?.value;
  const categoryNotes = form.querySelector('textarea[name="categoryNotes"]')?.value;
  
  // Validate and clean URL
  if (imageUrl && imageUrl.trim()) {
    imageUrl = imageUrl.trim();
    
    // Auto-add https:// if missing
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
      imageUrl = 'https://' + imageUrl;
    }
    
    // Validate URL
    if (!isValidImageUrl(imageUrl)) {
      alert('Please enter a valid image URL. Make sure it:\n• Starts with https://\n• Ends with an image extension (.jpg, .png, etc.)\n• Or is from a known image hosting service (Imgur, Cloudinary, etc.)');
      return;
    }
  }
  
  // Check if we're adding to existing category or creating new one
  let activeCategory = getActiveCategory();
  
  if (categoryName && categoryName.trim()) {
    // Create new category
    const newCategory = createCategory(categoryName, categoryNotes);
    if (newCategory && imageUrl) {
      addImageToCategory(newCategory.id, imageUrl);
    }
    if (newCategory) {
      setActiveCategory(newCategory.id);
      activeCategory = newCategory;
    }
  } else if (activeCategory && imageUrl) {
    // Add to active category
    addImageToCategory(activeCategory.id, imageUrl);
  } else {
    alert('Please provide either a category name or select an existing category, and provide an image URL.');
    return;
  }
  
  // Refresh UI
  renderCategories();
  if (activeCategory) {
    renderImageGrid(activeCategory.id);
  }
  
  // Reset and close form
  toggleAddForm(false);
}

// Update Pinterest clock
function updatePinterestClock() {
  const clockElement = document.getElementById('pinterestClockTime');
  if (!clockElement) return;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Initialize Pinterest board
export function initPinterestBoard() {
  loadPinterestData();
  renderCategories();
  
  const activeCategory = getActiveCategory();
  if (activeCategory) {
    renderImageGrid(activeCategory.id);
  }
  
  // Set up add button
  const addButton = document.getElementById('addPinterestButton');
  if (addButton) {
    addButton.addEventListener('click', () => toggleAddForm(true));
  }
  
  // Set up form
  const form = document.getElementById('addPinterestForm');
  if (form) {
    form.addEventListener('submit', handleAddFormSubmit);
    
    const cancelBtn = form.querySelector('.form-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => toggleAddForm(false));
    }
  }
  
  // Start clock update
  updatePinterestClock();
  setInterval(updatePinterestClock, 1000);
  
  debugLog('Pinterest board initialized');
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

