export interface StoreRequest {
    userId: number;
    storeName: string;
  }
  
  export interface StoreResponse {
    id: number;
    storeName: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  }