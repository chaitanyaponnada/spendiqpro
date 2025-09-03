

export interface Product {
  id: string; // Changed to string to match Firestore document IDs
  barcode: string;
  name:string;
  price: number; // This will now be the CURRENT price (discounted if applicable)
  originalPrice?: number | null; // The price before discount
  description?: string | null;
  imageUrl?: string | null;
  brand: string;
  category: string;
  storeId: string; // To associate product with a store
}

export interface CartItem extends Product {
  quantity: number;
}

export type ShoppingListItem = {
    id: string;
    name: string;
    checked: boolean;
};

export interface Store {
    id: string;
    name: string;
    address: string;
    logoUrl?: string;
}

export interface UserProfileData {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    photoURL?: string | null;
    role: 'customer' | 'store-owner';
    storeId?: string;
    birthDate?: string | null;
}
