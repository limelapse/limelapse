from PIL import Image, ImageFilter
import io
import cv2
import numpy as np
from .detection_service import DetectionService

class BlurringService:
    def __init__(self):
        """Initialize the blurring service with the detection service"""
        self.detection_service = DetectionService()
    
    def full(self, image_file):
        """
        Apply full image blurring
        
        Args:
            image_file: File-like object containing the image
            
        Returns:
            PIL Image with blur applied to the entire image
        """
        image = self._get_image(image_file)
        return image.filter(ImageFilter.GaussianBlur(radius=25))
    
    def blur_faces(self, image_file):
        """
        Detect and blur all faces in the image
        
        Args:
            image_file: File-like object containing the image
            
        Returns:
            PIL Image with blur applied to detected faces
        """
        image_np = np.array(self._get_image(image_file))
        
        regions = self.detection_service.detect_faces(image_np)
        
        return self._blur_regions(image_np, regions)
    
        
    def blur_all_sensitive(self, image_file):
        """
        Detect and blur all sensitive content: faces, license plates, and text
        
        Args:
            image_file: File-like object containing the image
            
        Returns:
            PIL Image with blur applied to all detected sensitive regions
        """
        image_np = np.array(self._get_image(image_file))
        
        face_regions = self.detection_service.detect_faces(image_np)
        # TODO: add other sensitive content detection methods here
        
        all_regions = face_regions
        
        return self._blur_regions(image_np, all_regions)
    
    def _blur_regions(self, image_np, regions, blur_kernel=(51, 51), sigma=30):
        """
        Apply Gaussian blur to specific regions of an image
        
        Args:
            image_np: NumPy array of the image
            regions: List of tuples (x1, y1, x2, y2) defining regions to blur
            blur_kernel: Tuple defining the blur kernel size
            sigma: Standard deviation for Gaussian blur
            
        Returns:
            PIL Image with blur applied to specified regions
        """
        # Make a copy to avoid modifying the original
        result_img = image_np.copy()
        
        for (x1, y1, x2, y2) in regions:
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(image_np.shape[1], x2), min(image_np.shape[0], y2)
            
            if x2 <= x1 or y2 <= y1:
                continue # -> invalid region
                
            roi = result_img[y1:y2, x1:x2]
            
            region_size = min(x2-x1, y2-y1)
            adaptive_ksize = min(99, max(11, int(region_size * 0.15)))
            adaptive_ksize = adaptive_ksize if adaptive_ksize % 2 == 1 else adaptive_ksize + 1
            
            blurred_roi = cv2.GaussianBlur(roi, (adaptive_ksize, adaptive_ksize), sigma)
            result_img[y1:y2, x1:x2] = blurred_roi
        
        return Image.fromarray(result_img)
    
    def _get_image(self, image_file):
        return Image.open(io.BytesIO(image_file.read()))
    