import numpy as np
import mediapipe as mp
import torch
import cv2
from ..config import Config

class DetectionService:
    """Service responsible for detecting objects in images"""
    
    def __init__(self):
        self.face_detector = mp.solutions.face_detection.FaceDetection(
            model_selection=1,  # 0 for close-range, 1 for mid-range detection
            min_detection_confidence=0.5
        )

        self.padding = 0.1 # 10% padding
    
    def detect_faces(self, image_np):
        """
        Detect faces in the image
        
        Args:
            image_np: NumPy array of the image
            
        Returns:
            List of regions (x1, y1, x2, y2) of detected faces
        """
        # ensure RGB for MediaPipe
        if len(image_np.shape) == 2:  # Grayscale
            image_rgb = cv2.cvtColor(image_np, cv2.COLOR_GRAY2RGB)
        elif image_np.shape[2] == 4:  # RGBA
            image_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGBA2RGB)
        else:
            image_rgb = image_np  # -> already RGB
        
        regions = []
        results = self.face_detector.process(image_rgb)
        
        if results.detections:
            h, w = image_np.shape[:2] # dimensions
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                
                x = max(0, int(bbox.xmin * w))
                y = max(0, int(bbox.ymin * h))
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                x2 = min(w, x + width)
                y2 = min(h, y + height)
                
                padding = int(min(width, height) * self.padding)
                x1_padded = max(0, x - padding)
                y1_padded = max(0, y - padding)
                x2_padded = min(w, x2 + padding)
                y2_padded = min(h, y2 + padding)
                
                regions.append((x1_padded, y1_padded, x2_padded, y2_padded))
        
        return regions