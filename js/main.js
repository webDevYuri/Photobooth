/**
 * Digital Photobooth - Main JavaScript
 * Handles webcam access, photo capture, and session gallery
 */

// Global namespace for our app
window.photoboothApp = {
    settings: {
      cameraResolution: "hd",
      mirrorMode: true,
      imageQuality: 0.9,
      defaultFormat: "jpg",
      autoSave: false,
    },
    processingStatus: null,
    canvas: null,
  }
  
  // DOM Elements
  const startCameraBtn = document.getElementById("start-camera")
  const capturePhotoBtn = document.getElementById("capture-photo")
  const webcamVideo = document.getElementById("webcam")
  const webcamContainer = document.getElementById("webcam-container")
  const webcamPlaceholder = document.getElementById("webcam-placeholder")
  const webcamError = document.getElementById("webcam-error")
  const canvas = document.getElementById("canvas")
  const processingStatus = document.getElementById("processing-status")
  const lastCaptureContainer = document.getElementById("last-capture-container")
  const lastCaptureImg = document.getElementById("last-capture")
  const savePhotoBtn = document.getElementById("save-photo")
  const sharePhotoBtn = document.getElementById("share-photo")
  const retakePhotoBtn = document.getElementById("retake-photo")
  const sessionGallery = document.getElementById("session-gallery")
  const saveAllBtn = document.getElementById("save-all")
  const photoTitleInput = document.getElementById("photo-title-input")
  const photoDescInput = document.getElementById("photo-description-input")
  
  // State variables
  let stream = null
  let currentPhoto = null
  const sessionPhotos = []
  
  // Assign to global object for sharing between files
  window.photoboothApp.canvas = canvas
  window.photoboothApp.processingStatus = processingStatus
  
  // Load settings from localStorage
  function loadSettings() {
    const savedSettings = localStorage.getItem("photobooth-settings")
    if (savedSettings) {
      try {
        window.photoboothApp.settings = {
          ...window.photoboothApp.settings,
          ...JSON.parse(savedSettings),
        }
      } catch (e) {
        console.error("Error parsing settings:", e)
        // Continue with default settings
      }
    }
  }
  
  // Initialize the application
  function init() {
    console.log("Initializing photobooth app...")
    loadSettings()
  
    // Event listeners
    if (startCameraBtn) {
      startCameraBtn.addEventListener("click", startCamera)
    }
  
    if (capturePhotoBtn) {
      capturePhotoBtn.addEventListener("click", capturePhoto)
    }
  
    if (savePhotoBtn) {
      savePhotoBtn.addEventListener("click", savePhoto)
    }
  
    if (sharePhotoBtn) {
      sharePhotoBtn.addEventListener("click", sharePhoto)
    }
  
    if (retakePhotoBtn) {
      retakePhotoBtn.addEventListener("click", retakePhoto)
    }
  
    if (saveAllBtn) {
      saveAllBtn.addEventListener("click", saveAllPhotos)
    }
  
    // Check if camera should be started automatically
    if (window.photoboothApp.settings.autoStartCamera && startCameraBtn) {
      startCamera()
    }
  
    console.log("Photobooth app initialized")
  }
  
  // Start the webcam
  async function startCamera() {
    console.log("Starting camera...")
    try {
      // Get camera resolution constraints based on settings
      const constraints = getCameraConstraints()
  
      // Request camera access
      stream = await navigator.mediaDevices.getUserMedia(constraints)
  
      // Set up video element
      webcamVideo.srcObject = stream
      webcamVideo.classList.remove("hidden")
      webcamPlaceholder.classList.add("hidden")
  
      // Apply mirror mode if enabled
      if (window.photoboothApp.settings.mirrorMode) {
        webcamVideo.style.transform = "scaleX(-1)"
      }
  
      // Enable capture button once camera is ready
      webcamVideo.onloadedmetadata = () => {
        capturePhotoBtn.disabled = false
        capturePhotoBtn.classList.remove("opacity-50", "cursor-not-allowed")
        startCameraBtn.disabled = true
        startCameraBtn.classList.add("opacity-50", "cursor-not-allowed")
  
        // Set canvas dimensions to match video
        canvas.width = webcamVideo.videoWidth
        canvas.height = webcamVideo.videoHeight
  
        console.log(`Camera started with resolution: ${webcamVideo.videoWidth}x${webcamVideo.videoHeight}`)
  
        // Show success notification
        showNotification("Camera started successfully!", "success")
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      webcamPlaceholder.classList.add("hidden")
      webcamError.classList.remove("hidden")
  
      // Show error notification
      showNotification("Could not access camera. Please check permissions.", "error")
    }
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
  
  // Get camera constraints based on settings
  // Get camera constraints based on settings
function getCameraConstraints() {
  let width, height;

  switch (window.photoboothApp.settings.cameraResolution) {
    case "4k":
      width = 3840;
      height = 2160;
      break;
    case "full-hd":
      width = 1920;
      height = 1080;
      break;
    case "hd":
    default:
      width = 1280;
      height = 720;
      break;
  }

  // Ensure landscape orientation
  if (window.innerWidth < window.innerHeight) {
    [width, height] = [height, width];
  }

  // If a specific camera device is selected in settings
  const deviceId = window.photoboothApp.settings.cameraDevice;
  const videoConstraints = {
    width: { ideal: width },
    height: { ideal: height },
  };

  if (deviceId) {
    videoConstraints.deviceId = { exact: deviceId };
  }

  return {
    video: videoConstraints,
    audio: false,
  };
}
  
  // Capture photo from webcam
  function capturePhoto() {
    if (!webcamVideo.srcObject) {
      showNotification("Camera not started", "error")
      return
    }
  
    // Create flash effect
    createFlashEffect()
  
    // Draw video frame to canvas
    const ctx = canvas.getContext("2d")
  
    // Apply mirror effect to canvas if enabled
    if (window.photoboothApp.settings.mirrorMode) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
  
    ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height)
  
    // Reset transform if mirrored
    if (window.photoboothApp.settings.mirrorMode) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
  
    // Get image data
    const imageType = "image/jpeg"
    const imageQuality = window.photoboothApp.settings.imageQuality
    currentPhoto = canvas.toDataURL(imageType, imageQuality)
  
    // Display captured photo
    lastCaptureImg.src = currentPhoto
    lastCaptureContainer.classList.remove("hidden")
  
    // Auto-save if enabled
    if (window.photoboothApp.settings.autoSave) {
      savePhoto()
    }
  
    showNotification("Photo captured!", "success")
  }
  
  // Create flash effect when taking photo
  function createFlashEffect() {
    const flash = document.createElement("div")
    flash.className = "flash"
    document.body.appendChild(flash)
  
    // Remove flash element after animation completes
    setTimeout(() => {
      if (document.body.contains(flash)) {
        document.body.removeChild(flash)
      }
    }, 500)
  }
  
  // Save photo to session gallery and localStorage
  function savePhoto() {
    if (!currentPhoto) {
      showNotification("No photo to save", "error")
      return
    }
  
    // Get title and description if available
    const title = photoTitleInput && photoTitleInput.value ? photoTitleInput.value : `Photo ${sessionPhotos.length + 1}`
  
    const description = photoDescInput && photoDescInput.value ? photoDescInput.value : ""
  
    // Create photo object with metadata
    const photo = {
      id: Date.now().toString(),
      dataUrl: currentPhoto,
      timestamp: new Date(),
      title: title,
      description: description,
      type: "JPG",
    }
  
    // Add to session photos array
    sessionPhotos.push(photo)
  
    // Update session gallery UI
    updateSessionGallery()
  
    // Save to localStorage for gallery page
    savePhotoToStorage(photo)
  
    // Enable save all button
    if (saveAllBtn) {
      saveAllBtn.disabled = false
      saveAllBtn.classList.remove("opacity-50", "cursor-not-allowed")
    }
  
    // Reset title and description inputs if they exist
    if (photoTitleInput) photoTitleInput.value = ""
    if (photoDescInput) photoDescInput.value = ""
  
    showNotification("Photo saved to gallery", "success")
  }
  
  // Save photo to localStorage with unlimited storage
  // Save photo to localStorage with fallback to IndexedDB
function savePhotoToStorage(photo) {
    try {
      // Check if we've already switched to IndexedDB mode
      const usingIndexedDB = localStorage.getItem("photobooth-using-indexeddb") === "true";
      
      if (usingIndexedDB) {
        // If we're already using IndexedDB, skip localStorage entirely
        saveToIndexedDB([photo], true);
        return;
      }
      
      // Get existing photos from localStorage
      let savedPhotos = [];
      const storedPhotos = localStorage.getItem("photobooth-saved-photos");
      if (storedPhotos) {
        savedPhotos = JSON.parse(storedPhotos);
      }
  
      // Add new photo
      savedPhotos.push({
        ...photo,
        timestamp: photo.timestamp.toISOString(), // Convert Date to string for storage
      });
  
      // Try to save to localStorage
      try {
        const jsonData = JSON.stringify(savedPhotos);
        localStorage.setItem("photobooth-saved-photos", jsonData);
        console.log("Photo saved to localStorage");
      } catch (storageError) {
        console.error("Error saving to localStorage:", storageError);
        
        // Set flag that we're switching to IndexedDB
        localStorage.setItem("photobooth-using-indexeddb", "true");
        
        // Try to clear some space in localStorage
        localStorage.removeItem("photobooth-saved-photos");
        
        // Save all photos to IndexedDB
        saveToIndexedDB(savedPhotos, false);
      }
    } catch (error) {
      console.error("Error processing photo for storage:", error);
      showNotification("Error saving photo. Please try again.", "error");
    }
  }
  
  // Save photos to IndexedDB as a fallback for larger storage
  // Save photos to IndexedDB as a fallback for larger storage
function saveToIndexedDB(photos, appendMode) {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      console.error("IndexedDB not supported");
      showNotification("Your browser does not support large photo storage.", "error");
      return;
    }
  
    // Open (or create) the database
    const request = indexedDB.open("photoboothDB", 1);
  
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      showNotification("Could not access storage. Some photos may not be saved.", "error");
    };
  
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
  
      // Create an object store if it doesn't exist
      if (!db.objectStoreNames.contains("photos")) {
        const store = db.createObjectStore("photos", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["photos"], "readwrite");
      const store = transaction.objectStore("photos");
  
      // If not appending mode and we're migrating all data, clear existing first
      if (!appendMode) {
        // We're migrating all photos
        store.clear();
        
        // Add all photos
        photos.forEach((photo) => {
          store.add(photo);
        });
        
        showNotification("Your photos have been moved to enhanced storage due to size", "info");
      } else {
        // We're just adding the new photo
        if (Array.isArray(photos) && photos.length > 0) {
          store.add(photos[0]);
        }
      }
  
      transaction.oncomplete = () => {
        console.log(appendMode ? "Photo saved to IndexedDB" : "All photos migrated to IndexedDB");
        if (!appendMode) {
          showNotification("Photos saved to browser storage", "success");
        }
      };
  
      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        showNotification("Error saving some photos", "error");
      };
    };
  }
  
  // Load photos from IndexedDB if localStorage fails
  // Load photos from localStorage or IndexedDB
function loadPhotosFromStorage(callback) {
    try {
      // Check if we've switched to IndexedDB mode
      const usingIndexedDB = localStorage.getItem("photobooth-using-indexeddb") === "true";
      
      if (!usingIndexedDB) {
        // Try localStorage first
        const storedPhotos = localStorage.getItem("photobooth-saved-photos");
        if (storedPhotos) {
          const photos = JSON.parse(storedPhotos);
          callback(photos);
          return;
        }
      }
  
      // If localStorage is empty or we're using IndexedDB, try IndexedDB
      if (window.indexedDB) {
        const request = indexedDB.open("photoboothDB", 1);
  
        request.onerror = (event) => {
          console.error("IndexedDB error:", event.target.error);
          callback([]);
        };
  
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(["photos"], "readonly");
          const store = transaction.objectStore("photos");
          const getAllRequest = store.getAll();
  
          getAllRequest.onsuccess = () => {
            callback(getAllRequest.result || []);
          };
  
          getAllRequest.onerror = () => {
            console.error("Error getting photos from IndexedDB");
            callback([]);
          };
        };
      } else {
        callback([]);
      }
    } catch (error) {
      console.error("Error loading photos:", error);
      callback([]);
    }
  }
  
  // Update session gallery with current photos
  function updateSessionGallery() {
    if (!sessionGallery) return
  
    // Clear existing gallery
    sessionGallery.innerHTML = ""
  
    if (sessionPhotos.length === 0) {
      sessionGallery.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <div class="w-16 h-16 bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3">
            <i class="fas fa-camera text-2xl"></i>
          </div>
          <p class="font-medium">No photos captured in this session yet</p>
          <p class="text-sm text-gray-400 mt-1">Photos you capture will appear here</p>
        </div>
      `
      return
    }
  
    // Add each photo to the gallery
    sessionPhotos.forEach((photo, index) => {
      const photoElement = document.createElement("div")
      photoElement.className =
        "bg-white p-3 flex items-center shadow-sm hover:shadow-md transition-shadow duration-300 mb-3 border border-gray-100"
      photoElement.innerHTML = `
        <div class="w-24 h-24 flex-shrink-0 mr-4 overflow-hidden shadow-sm">
          <img src="${photo.dataUrl}" alt="${photo.title}" class="w-full h-full object-cover">
        </div>
        <div class="flex-grow">
          <h4 class="font-medium text-gray-800 truncate">${photo.title}</h4>
          <p class="text-sm text-gray-500">${formatTimestamp(photo.timestamp)}</p>
        </div>
        <div class="flex space-x-2">
          <button class="btn-icon text-indigo-600 hover:text-white hover:bg-indigo-600" data-action="share" data-id="${photo.id}" aria-label="Share photo">
            <i class="fas fa-share-alt"></i>
          </button>
          <button class="btn-icon text-indigo-600 hover:text-white hover:bg-indigo-600" data-action="download" data-id="${photo.id}" aria-label="Download photo">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon text-purple-600 hover:text-white hover:bg-purple-600" data-action="delete" data-id="${photo.id}" aria-label="Delete photo">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `
  
      // Add event listeners for buttons
      const buttons = photoElement.querySelectorAll("button")
      buttons.forEach((button) => {
        const action = button.getAttribute("data-action")
        const photoId = button.getAttribute("data-id")
  
        button.addEventListener("click", () => {
          handleGalleryAction(action, photoId)
        })
      })
  
      sessionGallery.appendChild(photoElement)
    })
  }
  
  // Handle gallery item actions (share, download, delete)
  function handleGalleryAction(action, photoId) {
    const photoIndex = sessionPhotos.findIndex((photo) => photo.id === photoId)
    if (photoIndex === -1) return
  
    const photo = sessionPhotos[photoIndex]
  
    switch (action) {
      case "share":
        sharePhotoById(photoId)
        break
      case "download":
        downloadPhoto(photo)
        break
      case "delete":
        // Remove photo from array
        sessionPhotos.splice(photoIndex, 1)
  
        // Remove from storage
        removePhotoFromStorage(photoId)
  
        // Update gallery UI
        updateSessionGallery()
  
        // Disable save all button if no photos left
        if (sessionPhotos.length === 0 && saveAllBtn) {
          saveAllBtn.disabled = true
          saveAllBtn.classList.add("opacity-50", "cursor-not-allowed")
        }
  
        showNotification("Photo removed from session", "info")
        break
    }
  }
  
  // Remove photo from storage
  function removePhotoFromStorage(photoId) {
    try {
      // Try to remove from localStorage first
      const storedPhotos = localStorage.getItem("photobooth-saved-photos")
      if (storedPhotos) {
        let savedPhotos = JSON.parse(storedPhotos)
        savedPhotos = savedPhotos.filter((photo) => photo.id !== photoId)
        localStorage.setItem("photobooth-saved-photos", JSON.stringify(savedPhotos))
        return
      }
  
      // If not in localStorage, try IndexedDB
      if (window.indexedDB) {
        const request = indexedDB.open("photoboothDB", 1)
  
        request.onsuccess = (event) => {
          const db = event.target.result
          const transaction = db.transaction(["photos"], "readwrite")
          const store = transaction.objectStore("photos")
  
          // Delete the photo
          store.delete(photoId)
        }
      }
    } catch (error) {
      console.error("Error removing photo from storage:", error)
    }
  }
  
  // Format timestamp for display
  function formatTimestamp(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  
  // Share photo
  function sharePhoto() {
    if (!currentPhoto) {
      showNotification("No photo to share", "error")
      return
    }
  
    // Use Web Share API if available
    if (navigator.share) {
      // Convert data URL to Blob
      fetch(currentPhoto)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "photobooth-photo.jpg", { type: blob.type })
  
          navigator
            .share({
              title: "My Photobooth Photo",
              files: [file],
            })
            .catch((error) => {
              console.error("Error sharing photo:", error)
              showNotification("Could not share the photo. Try downloading it instead.", "error")
            })
        })
    } else {
      // Fallback for browsers that don't support Web Share API
      showNotification("Sharing is not supported in this browser. Please download the photo instead.", "info")
    }
  }
  
  // Share photo by ID
  function sharePhotoById(photoId) {
    const photo = sessionPhotos.find((photo) => photo.id === photoId)
    if (!photo) return
  
    // Use Web Share API if available
    if (navigator.share) {
      // Convert data URL to Blob
      fetch(photo.dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `photobooth-${photo.id}.jpg`, { type: blob.type })
  
          navigator
            .share({
              title: photo.title || "My Photobooth Photo",
              files: [file],
            })
            .catch((error) => {
              console.error("Error sharing photo:", error)
              showNotification("Could not share the photo. Try downloading it instead.", "error")
            })
        })
    } else {
      // Fallback for browsers that don't support Web Share API
      showNotification("Sharing is not supported in this browser. Please download the photo instead.", "info")
    }
  }
  
  // Download a photo
  function downloadPhoto(photo) {
    const link = document.createElement("a")
    link.href = photo.dataUrl
    link.download = `${photo.title.replace(/\s+/g, "-").toLowerCase()}-${photo.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  
    showNotification("Photo downloaded", "success")
  }
  
  // Retake photo
  function retakePhoto() {
    currentPhoto = null
    lastCaptureContainer.classList.add("hidden")
  }
  
  // Save all photos as a ZIP file
  function saveAllPhotos() {
    if (sessionPhotos.length === 0) {
      showNotification("No photos to save", "error")
      return
    }
  
    // Check if JSZip is available
    if (typeof JSZip === "undefined") {
      console.error("JSZip library not available")
      showNotification("ZIP functionality is not available. Please download photos individually.", "error")
      return
    }
  
    // Create a new ZIP file
    const zip = new JSZip()
  
    // Add each photo to the ZIP
    sessionPhotos.forEach((photo) => {
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
  
        showNotification("All photos downloaded as ZIP", "success")
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
  
  // Initialize the app when DOM is loaded
  document.addEventListener("DOMContentLoaded", init)
  
  // Declare JSZip and saveAs to avoid errors
  var JSZip
  var saveAs
  
  