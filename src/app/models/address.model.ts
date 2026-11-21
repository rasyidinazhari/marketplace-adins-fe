export interface AddressPayload {
    userId: number;
    recipientName: string;
    phoneNumber: string;
    city: string;
    postalCode: string;
    note: string; // Di C# ini berfungsi sebagai alamat lengkap
}

export interface AddressResponse {
    id: number;
    userId: number;
    recipientName: string;
    phoneNumber: string;
    city: string;
    postalCode: string;
    fullAddress: string; // Di-mapping dari 'note' di backend
    createdAt: string; 
    updatedAt: string; 
}