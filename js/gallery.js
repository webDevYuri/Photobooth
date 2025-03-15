/**
 * Digital Photobooth - Gallery JavaScript
 * Handles saved photos gallery and metadata editing
 */

// DOM Elements
const galleryGrid = document.getElementById("gallery-grid")
const emptyGallery = document.getElementById("empty-gallery")
const sortGallery = document.getElementById("sort-gallery")
const deleteSelectedBtn = document.getElementById("delete-selected")
const downloadSelectedBtn = document.getElementById("download-selected")
const photoModal = document.getElementById("photo-modal")
const modalImage = document.getElementById("modal-image")
const photoTitle = document.getElementById("photo-title")
const photoDescription = document.getElementById("photo-description")
const photoDate = document.getElementById("photo-date")
const photoType = document.getElementById("photo-type")
const photoDetailsForm = document.getElementById("photo-details-form")
const closeModal = document.getElementById("close-modal")
const modalDownload = document.getElementById("modal-download")
const modalDelete = document.getElementById("modal-delete")
const searchInput = document.getElementById("search-gallery")
const filterType = document.getElementById("filter-type")
const photoCount = document.getElementById("photo-count")

// State variables
let savedPhotos = []
let currentPhotoId = null
const selectedPhotos = new Set()
let filteredPhotos = []

// Declare loadPhotosFromStorage (assuming it's defined elsewhere, e.g., in main.js)
let loadPhotosFromStorage

// Initialize the gallery
function init() {
  console.log("Initializing gallery...")

  // Load saved photos from storage
  loadSavedPhotos()

  // Event listeners
  if (sortGallery) {
    sortGallery.addEventListener("change", sortPhotos)
  }

  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", deleteSelectedPhotos)
  }

  if (downloadSelectedBtn) {
    downloadSelectedBtn.addEventListener("click", downloadSelectedPhotos)
  }

  if (closeModal) {
    closeModal.addEventListener("click", closePhotoModal)
  }

  if (photoDetailsForm) {
    photoDetailsForm.addEventListener("submit", savePhotoDetails)
  }

  if (modalDownload) {
    modalDownload.addEventListener("click", downloadCurrentPhoto)
  }

  if (modalDelete) {
    modalDelete.addEventListener("click", deleteCurrentPhoto)
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterPhotos)
  }

  if (filterType) {
    filterType.addEventListener("change", filterPhotos)
  }

  console.log("Gallery initialized")
}

// Load saved photos from storage
function loadSavedPhotos() {
  // Use the loadPhotosFromStorage function from main.js
  if (typeof loadPhotosFromStorage === "function") {
    loadPhotosFromStorage((photos) => {
      savedPhotos = photos.map((photo) => ({
        ...photo,
        timestamp: new Date(photo.timestamp),
      }))

      // Initialize filtered photos
      filteredPhotos = [...savedPhotos]

      // Update photo count
      updatePhotoCount()

      // Initial render
      renderGallery()

      console.log(`Loaded ${savedPhotos.length} photos from storage`)
    })
  } else {
    // Fallback to localStorage only if the function is not available
    try {
      const photos = localStorage.getItem("photobooth-saved-photos")
      if (photos) {
        // Parse the JSON string and convert date strings back to Date objects
        savedPhotos = JSON.parse(photos).map((photo) => ({
          ...photo,
          timestamp: new Date(photo.timestamp),
        }))

        // Initialize filtered photos
        filteredPhotos = [...savedPhotos]

        // Update photo count
        updatePhotoCount()

        console.log(`Loaded ${savedPhotos.length} photos from localStorage`)
      } else {
        console.log("No saved photos found in localStorage")
      }
    } catch (error) {
      console.error("Error loading photos from localStorage:", error)
      savedPhotos = []
      filteredPhotos = []
    }

    // Initial render
    renderGallery()
  }
}

// Update photo count display
function updatePhotoCount() {
  if (photoCount) {
    photoCount.textContent = `${filteredPhotos.length} photo${filteredPhotos.length !== 1 ? "s" : ""}`
  }
}

// Save photos to storage
function savePhotosToStorage() {
  try {
    localStorage.setItem(
      "photobooth-saved-photos",
      JSON.stringify(
        savedPhotos.map((photo) => ({
          ...photo,
          timestamp: photo.timestamp.toISOString(), // Convert Date to string for storage
        })),
      ),
    )
    console.log("Photos saved to localStorage")
  } catch (error) {
    console.error("Error saving photos to localStorage:", error)

    // Try to save to IndexedDB if available
    if (window.indexedDB) {
      saveToIndexedDB(savedPhotos)
    } else {
      showNotification("Error saving photos. Storage might be full.", "error")
    }
  }
}

// Save to IndexedDB as fallback
function saveToIndexedDB(photos) {
  // Check if IndexedDB is supported
  if (!window.indexedDB) {
    console.error("IndexedDB not supported")
    return
  }

  // Open (or create) the database
  const request = indexedDB.open("photoboothDB", 1)

  request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.error)
    showNotification("Could not access storage. Some photos may not be saved.", "error")
  }

  request.onupgradeneeded = (event) => {
    const db = event.target.result

    // Create an object store if it doesn't exist
    if (!db.objectStoreNames.contains("photos")) {
      const store = db.createObjectStore("photos", { keyPath: "id" })
      store.createIndex("timestamp", "timestamp", { unique: false })
    }
  }

  request.onsuccess = (event) => {
    const db = event.target.result
    const transaction = db.transaction(["photos"], "readwrite")
    const store = transaction.objectStore("photos")

    // Clear existing photos
    store.clear()

    // Add all photos
    photos.forEach((photo) => {
      store.add({
        ...photo,
        timestamp: photo.timestamp.toISOString(),
      })
    })

    transaction.oncomplete = () => {
      console.log("All photos saved to IndexedDB")
      showNotification("Photos saved to browser storage", "success")
    }

    transaction.onerror = (event) => {
      console.error("Transaction error:", event.target.error)
      showNotification("Error saving some photos", "error")
    }
  }
}

// Filter photos based on search and type filter
function filterPhotos() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : ""
  const typeFilter = filterType ? filterType.value : "all"

  filteredPhotos = savedPhotos.filter((photo) => {
    const matchesSearch =
      photo.title.toLowerCase().includes(searchTerm) ||
      (photo.description && photo.description.toLowerCase().includes(searchTerm))

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "png" && photo.type === "PNG") ||
      (typeFilter === "jpg" && photo.type === "JPG")

    return matchesSearch && matchesType
  })

  // Update photo count
  updatePhotoCount()

  // Render the filtered gallery
  renderGallery()
}

// Render the gallery
function renderGallery() {
  if (!galleryGrid) return

  if (filteredPhotos.length === 0) {
    if (galleryGrid) galleryGrid.classList.add("hidden")
    if (emptyGallery) emptyGallery.classList.remove("hidden")
    if (deleteSelectedBtn) deleteSelectedBtn.disabled = true
    if (downloadSelectedBtn) downloadSelectedBtn.disabled = true
    return
  }

  if (galleryGrid) galleryGrid.classList.remove("hidden")
  if (emptyGallery) emptyGallery.classList.add("hidden")

  // Clear the gallery
  galleryGrid.innerHTML = ""

  // Add each photo to the gallery
  filteredPhotos.forEach((photo) => {
    const photoElement = document.createElement("div")
    photoElement.className =
      "gallery-item bg-white shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
    photoElement.innerHTML = `
      <div class="relative group">
        <img src="${photo.dataUrl}" alt="${photo.title}" class="w-full h-48 object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <h3 class="font-semibold text-white truncate">${photo.title}</h3>
        </div>
        <div class="absolute top-2 left-2">
          <input type="checkbox" class="custom-checkbox" data-id="${photo.id}">
        </div>
        <div class="absolute top-2 right-2 bg-white/80 text-xs font-medium px-2 py-1">
          ${photo.type}
        </div>
      </div>
      <div class="p-4">
        <p class="text-sm text-gray-500 mb-3">${formatDate(photo.timestamp)}</p>
        <div class="flex justify-between">
          <button class="btn-icon text-indigo-600 hover:text-white hover:bg-indigo-600" data-action="view" data-id="${photo.id}" aria-label="View photo">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon text-indigo-600 hover:text-white hover:bg-indigo-600" data-action="download" data-id="${photo.id}" aria-label="Download photo">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon text-purple-600 hover:text-white hover:bg-purple-600" data-action="delete" data-id="${photo.id}" aria-label="Delete photo">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `

    // Add event listeners
    const viewBtn = photoElement.querySelector('[data-action="view"]')
    const deleteBtn = photoElement.querySelector('[data-action="delete"]')
    const downloadBtn = photoElement.querySelector('[data-action="download"]')
    const checkbox = photoElement.querySelector(".custom-checkbox")

    if (viewBtn) viewBtn.addEventListener("click", () => openPhotoModal(photo.id))
    if (deleteBtn) deleteBtn.addEventListener("click", () => deletePhoto(photo.id))
    if (downloadBtn) downloadBtn.addEventListener("click", () => downloadPhotoById(photo.id))
    if (checkbox) checkbox.addEventListener("change", (e) => togglePhotoSelection(photo.id, e.target.checked))

    galleryGrid.appendChild(photoElement)
  })

  // Update selection buttons state
  updateSelectionButtons()
}

// Format date for display
function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Sort photos based on selected option
function sortPhotos() {
  const sortOption = sortGallery.value

  switch (sortOption) {
    case "newest":
      filteredPhotos.sort((a, b) => b.timestamp - a.timestamp)
      break
    case "oldest":
      filteredPhotos.sort((a, b) => a.timestamp - b.timestamp)
      break
    case "title":
      filteredPhotos.sort((a, b) => a.title.localeCompare(b.title))
      break
  }

  renderGallery()
}

// Toggle photo selection
function togglePhotoSelection(photoId, isSelected) {
  if (isSelected) {
    selectedPhotos.add(photoId)
  } else {
    selectedPhotos.delete(photoId)
  }

  updateSelectionButtons()
}

// Update selection buttons state
function updateSelectionButtons() {
  const hasSelection = selectedPhotos.size > 0
  if (deleteSelectedBtn) deleteSelectedBtn.disabled = !hasSelection
  if (downloadSelectedBtn) downloadSelectedBtn.disabled = !hasSelection
}

// Delete selected photos
function deleteSelectedPhotos() {
  if (selectedPhotos.size === 0) return

  const confirmDelete = confirm(`Are you sure you want to delete ${selectedPhotos.size} photo(s)?`)
  if (!confirmDelete) return

  // Remove selected photos
  savedPhotos = savedPhotos.filter((photo) => !selectedPhotos.has(photo.id))
  filteredPhotos = filteredPhotos.filter((photo) => !selectedPhotos.has(photo.id))

  // Clear selection
  selectedPhotos.clear()

  // Save changes
  savePhotosToStorage()

  // Update UI
  updatePhotoCount()
  renderGallery()

  showNotification(`${selectedPhotos.size} photos deleted`, "success")
}

// Download selected photos
function downloadSelectedPhotos() {
  if (selectedPhotos.size === 0) return

  if (selectedPhotos.size === 1) {
    // Download single photo
    const photoId = Array.from(selectedPhotos)[0]
    downloadPhotoById(photoId)
  } else {
    // Download multiple photos as ZIP
    downloadPhotosAsZip(Array.from(selectedPhotos))
  }
}

// Download a photo by ID
function downloadPhotoById(photoId) {
  const photo = savedPhotos.find((p) => p.id === photoId)
  if (photo) {
    downloadPhoto(photo)
  }
}

// Download a single photo
function downloadPhoto(photo) {
  const link = document.createElement("a")
  link.href = photo.dataUrl
  link.download = `${photo.title.replace(/\s+/g, "-").toLowerCase()}-${photo.id}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showNotification("Photo downloaded", "success")
}

// Download multiple photos as ZIP
function downloadPhotosAsZip(photoIds) {
  // Check if JSZip is available
  if (typeof JSZip === "undefined") {
    console.error("JSZip library not available")
    showNotification("ZIP functionality is not available. Please download photos individually.", "error")
    return
  }

  // Create a new ZIP file
  const zip = new JSZip()

  // Add each selected photo to the ZIP
  photoIds.forEach((photoId) => {
    const photo = savedPhotos.find((p) => p.id === photoId)
    if (!photo) return

    // Convert data URL to blob
    const imageData = photo.dataUrl.split(",")[1]
    const mimeType = "image/jpeg"
    const blob = b64toBlob(imageData, mimeType)

    // Add to ZIP
    const filename = `${photo.title.replace(/\s+/g, "-").toLowerCase()}-${photo.id}.jpg`
    zip.file(filename, blob)
  })

  // Generate ZIP file and trigger download
  zip
    .generateAsync({ type: "blob" })
    .then((content) => {
      // Check if saveAs is available
      if (typeof saveAs === "function") {
        saveAs(content, `photobooth-photos-${Date.now()}.zip`)
      } else {
        // Fallback if saveAs is not available
        const url = URL.createObjectURL(content)
        const link = document.createElement("a")
        link.href = url
        link.download = `photobooth-photos-${Date.now()}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      showNotification(`${photoIds.length} photos downloaded as ZIP`, "success")
    })
    .catch((error) => {
      console.error("Error creating ZIP file:", error)
      showNotification("Failed to create ZIP file. Please try downloading photos individually.", "error")
    })
}

// Convert base64 to Blob
function b64toBlob(b64Data, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize)
    const byteNumbers = new Array(slice.length)

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: contentType })
}

// Open photo modal
function openPhotoModal(photoId) {
  const photo = savedPhotos.find((p) => p.id === photoId)
  if (!photo) return

  // Set current photo ID
  currentPhotoId = photoId

  // Populate modal
  modalImage.src = photo.dataUrl
  photoTitle.value = photo.title
  photoDescription.value = photo.description || ""
  photoDate.textContent = formatDate(photo.timestamp)
  photoType.textContent = photo.type

  // Show modal
  photoModal.classList.remove("hidden")

  // Prevent scrolling on body
  document.body.style.overflow = "hidden"
}

// Close photo modal
function closePhotoModal() {
  photoModal.classList.add("hidden")
  currentPhotoId = null

  // Restore scrolling
  document.body.style.overflow = ""
}

// Save photo details
function savePhotoDetails(e) {
  e.preventDefault()

  if (!currentPhotoId) return

  const photoIndex = savedPhotos.findIndex((p) => p.id === currentPhotoId)
  if (photoIndex === -1) return

  // Update photo details
  savedPhotos[photoIndex].title = photoTitle.value.trim() || "Untitled Photo"
  savedPhotos[photoIndex].description = photoDescription.value.trim()

  // Update filtered photos as well
  const filteredIndex = filteredPhotos.findIndex((p) => p.id === currentPhotoId)
  if (filteredIndex !== -1) {
    filteredPhotos[filteredIndex].title = savedPhotos[photoIndex].title
    filteredPhotos[filteredIndex].description = savedPhotos[photoIndex].description
  }

  // Save changes
  savePhotosToStorage()

  // Close modal
  closePhotoModal()

  // Update gallery
  renderGallery()

  showNotification("Photo details updated", "success")
}

// Download current photo
function downloadCurrentPhoto() {
  if (!currentPhotoId) return

  const photo = savedPhotos.find((p) => p.id === currentPhotoId)
  if (photo) {
    downloadPhoto(photo)
  }
}

// Delete current photo
function deleteCurrentPhoto() {
  if (!currentPhotoId) return

  const confirmDelete = confirm("Are you sure you want to delete this photo?")
  if (!confirmDelete) return

  // Remove photo
  deletePhoto(currentPhotoId)

  // Close modal
  closePhotoModal()
}

// Delete a photo
function deletePhoto(photoId) {
  // Remove photo from arrays
  savedPhotos = savedPhotos.filter((photo) => photo.id !== photoId)
  filteredPhotos = filteredPhotos.filter((photo) => photo.id !== photoId)

  // Remove from selection if selected
  if (selectedPhotos.has(photoId)) {
    selectedPhotos.delete(photoId)
  }

  // Save changes
  savePhotosToStorage()

  // Update UI
  updatePhotoCount()
  renderGallery()

  showNotification("Photo deleted", "success")
}

// Show notification
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `fixed bottom-4 right-4 px-6 py-3 shadow-lg notification-enter z-50 ${
    type === "success" ? "bg-blue-600" : type === "error" ? "bg-purple-600" : "bg-indigo-600"
  } text-white`

  // Add icon based on type
  const icon = type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "information-circle"

  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${icon} mr-2"></i>
      <span>${message}</span>
    </div>
  `

  // Add to document
  document.body.appendChild(notification)

  // Remove after delay
  setTimeout(() => {
    notification.classList.remove("notification-enter")
    notification.classList.add("notification-exit")
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 500)
  }, 3000)
}

// Initialize the gallery when DOM is loaded
document.addEventListener("DOMContentLoaded", init)

// Declare JSZip and saveAs to avoid errors
var JSZip
var saveAs

