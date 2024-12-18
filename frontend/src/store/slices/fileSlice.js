import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Generate a random encryption key
export const generateEncryptionKey = async () => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  
  // Export the key to raw format
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exportedKey))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Encrypt file data
export const encryptFile = async (file, keyHex) => {
  try {
    const fileBuffer = await file.arrayBuffer();
    
    // Convert hex key back to Uint8Array
    const keyArray = new Uint8Array(
      keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    
    // Import the key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyArray,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Generate IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      fileBuffer
    );

    // Combine IV and encrypted data
    const encryptedContent = new Uint8Array(iv.length + encryptedData.byteLength);
    encryptedContent.set(iv);
    encryptedContent.set(new Uint8Array(encryptedData), iv.length);

    return new File([encryptedContent], file.name, {
      type: 'application/octet-stream'
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

// Decrypt file data
export const decryptFile = async (encryptedFile, keyHex) => {
  try {
    const encryptedBuffer = await encryptedFile.arrayBuffer();
    
    // Extract IV and data
    const iv = new Uint8Array(encryptedBuffer.slice(0, 12));
    const data = new Uint8Array(encryptedBuffer.slice(12));
    
    // Convert hex key back to Uint8Array
    const keyArray = new Uint8Array(
      keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    
    // Import the key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyArray,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      data
    );

    return new Blob([decryptedData]);
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

export const uploadFile = createAsyncThunk(
  'files/upload',
  async ({ file, encryptedKey }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('encrypted_key', encryptedKey);
      formData.append('name', file.name);

      const response = await axios.post(`${API_URL}/files/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const shareFile = createAsyncThunk(
  'files/shareFile',
  async ({ fileId, username, permission, expiresAt, encryptedKey }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      // Re-encrypt the file key for the recipient
      const response = await axios.post(
        `${API_URL}/files/share/`,
        {
          file: fileId,
          shared_with_username: username,
          permission,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          encrypted_key: encryptedKey
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          }
        }
      );
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({
          error: 'Network Error',
          message: 'Unable to connect to the server. Please check your connection and try again.',
          details: error.message
        });
      }
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchSharedFiles = createAsyncThunk(
  'files/fetchSharedFiles',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/files/shared-with-me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  files: [],
  sharedFiles: [],
  loading: false,
  error: null,
  currentFile: null,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentFile: (state, action) => {
      state.currentFile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files.push(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch files
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Share file
      .addCase(shareFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shareFile.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(shareFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch shared files
      .addCase(fetchSharedFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.sharedFiles = action.payload;
      })
      .addCase(fetchSharedFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentFile } = fileSlice.actions;

export default fileSlice.reducer; 