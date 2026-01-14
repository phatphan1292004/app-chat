// Cloudinary upload service
const CLOUDINARY_CLOUD_NAME = 'dptmqc8lj';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'chat_uploads'; 

interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

export const uploadToCloudinary = async (
  file: File,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Xác định URL endpoint dựa vào loại file
    const uploadUrl = resourceType === 'image' 
      ? CLOUDINARY_UPLOAD_URL 
      : `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: UploadResponse = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

