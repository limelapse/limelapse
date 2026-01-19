import io
import requests
from urllib.parse import urlparse

class ImageUploadError(Exception):
    """Exception raised when an image upload operation fails."""
    def __init__(self, url, status_code=None, response_text=None, original_exception=None):
        self.url = url
        self.status_code = status_code
        self.response_text = response_text
        self.original_exception = original_exception
        
        # Create an appropriate error message based on available information
        if status_code is not None:
            message = f"Failed to upload image to {url}. Status code: {status_code}"
            if response_text:
                message += f", Response: {response_text}"
        elif original_exception is not None:
            message = f"Error uploading image to {url}: {str(original_exception)}"
        else:
            message = f"Unknown error uploading image to {url}"
            
        super().__init__(message)

class ImageDownloadError(Exception):
    """Exception raised when an image download operation fails."""
    def __init__(self, url, status_code=None, response_text=None, original_exception=None):
        self.url = url
        self.status_code = status_code
        self.response_text = response_text
        self.original_exception = original_exception
        
        # Create an appropriate error message based on available information
        if status_code is not None:
            message = f"Failed to download image from {url}. Status code: {status_code}"
            if response_text:
                message += f", Response: {response_text}"
        elif original_exception is not None:
            message = f"Error downloading image from {url}: {str(original_exception)}"
        else:
            message = f"Unknown error downloading image from {url}"
            
        super().__init__(message)

class ImageLoadingService:
    def __init__(self):
        """
        Initialize the image service.
        No credentials needed as we'll be using pre-signed URLs.
        """
        self.session = requests.Session()
    
    def upload_image(self, url, file_obj):
        """
        Upload an image using the provided HTTP URL (likely a pre-signed URL).
        
        Args:
            url (str): HTTP URL for upload (pre-signed Minio URL)
            file_obj: File-like object containing the image data
            
        Returns:
            bool: True if upload was successful
            
        Raises:
            ImageUploadError: If the upload operation fails
        """
        try:
            # Read file content
            file_obj.seek(0)
            file_content = file_obj.read()
            
            # Use PUT request for uploading to pre-signed URL
            response = self.session.put(
                url,
                data=file_content,
                headers={
                    'Content-Type': 'application/octet-stream'
                }
            )
            
            # Check if the upload was successful
            if response.status_code in (200, 201, 204):
                return True
            else:
                print(f"Upload failed with status code: {response.status_code}")
                print(f"Response: {response.text}")
                raise ImageUploadError(
                    url=url,
                    status_code=response.status_code,
                    response_text=response.text
                )
                
        except ImageUploadError:
            # Re-raise if it's already our custom exception
            raise
        except Exception as e:
            print(f"Error uploading image: {str(e)}")
            raise ImageUploadError(url=url, original_exception=e) from e
    
    def download_image(self, url):
        """
        Download an image from the specified HTTP URL.
        
        Args:
            url (str): HTTP URL of the image to download (pre-signed Minio URL)
            
        Returns:
            io.BytesIO: File-like object containing the downloaded image
            
        Raises:
            ImageDownloadError: If the download operation fails
        """
        try:
            # Use GET request to download from URL
            response = self.session.get(url, stream=True)
            
            # Check if the download was successful
            if response.status_code == 200:
                # Create a file-like object to store the downloaded image
                file_obj = io.BytesIO()
                
                # Write the content to the file-like object
                for chunk in response.iter_content(chunk_size=8192):
                    file_obj.write(chunk)
                
                # Reset the file pointer to the beginning of the file
                file_obj.seek(0)
                return file_obj
            else:
                print(f"Download failed with status code: {response.status_code}")
                print(f"Response: {response.text}")
                raise ImageDownloadError(
                    url=url,
                    status_code=response.status_code,
                    response_text=response.text
                )
                
        except ImageDownloadError:
            # Re-raise if it's already our custom exception
            raise
        except Exception as e:
            print(f"Error downloading image: {str(e)}")
            raise ImageDownloadError(url=url, original_exception=e) from e