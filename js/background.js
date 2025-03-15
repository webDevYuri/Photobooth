/**
 * Digital Photobooth - Background Removal
 * Handles background removal using TensorFlow.js and BodyPix
 */

// Remove background from an image using BodyPix
async function removeBackground(ctx) {
    if (!window.photoboothApp.bodyPixModel) {
      console.error("BodyPix model not loaded")
      return
    }
  
    // Show processing status
    window.photoboothApp.processingStatus.textContent = "Removing background..."
    window.photoboothApp.processingStatus.classList.remove("hidden")
  
    try {
      // Get canvas image data
      const imageData = ctx.getImageData(0, 0, window.photoboothApp.canvas.width, window.photoboothApp.canvas.height)
  
      // Segment person from image
      const segmentation = await window.photoboothApp.bodyPixModel.segmentPerson(imageData, {
        flipHorizontal: false,
        internalResolution: window.photoboothApp.settings.bgModel === "accurate" ? "high" : "medium",
        segmentationThreshold: 0.7,
        maxDetections: 1,
      })
  
      // Create mask
      const mask = bodyPix.toMask(
        segmentation,
        { r: 0, g: 0, b: 0, a: 0 }, // Background color (transparent)
        { r: 255, g: 255, b: 255, a: 255 }, // Foreground color (white)
      )
  
      // Clear canvas
      ctx.clearRect(0, 0, window.photoboothApp.canvas.width, window.photoboothApp.canvas.height)
  
      // Draw original image
      ctx.putImageData(imageData, 0, 0)
  
      // Apply mask to create transparent background
      ctx.globalCompositeOperation = "destination-in"
      ctx.drawImage(createImageFromMask(mask), 0, 0)
  
      // Reset composite operation
      ctx.globalCompositeOperation = "source-over"
  
      // Hide processing status
      window.photoboothApp.processingStatus.classList.add("hidden")
    } catch (error) {
      console.error("Error removing background:", error)
      window.photoboothApp.processingStatus.classList.add("hidden")
      alert("Failed to remove background. Please try again.")
    }
  }
  
  // Create an image from a mask
  function createImageFromMask(mask) {
    const maskCanvas = document.createElement("canvas")
    maskCanvas.width = mask.width
    maskCanvas.height = mask.height
  
    const maskCtx = maskCanvas.getContext("2d")
    maskCtx.putImageData(mask, 0, 0)
  
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = maskCanvas.toDataURL()
  
    return image
  }
  
  