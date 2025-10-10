// Shared cache for MemoryPalace instances across API routes
// In production, this should be Redis or similar

export const palaceCache = new Map();
export const adapterCache = new Map();
