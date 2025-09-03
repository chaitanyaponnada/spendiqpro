
'use client';

import * as React from 'react';
import Image from 'next/image';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Edit, BadgePercent, PackageSearch } from 'lucide-react';
import { EditProductDialog } from './EditProductDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getValidImageUrl } from '@/lib/utils';
import { StandardProductForm } from './StandardProductForm';
import { DiscountedProductForm } from './DiscountedProductForm';
import { Label } from '@/components/ui/label';
import { useStore } from '@/hooks/use-store';

export function ManageProducts() {
  const { toast } = useToast();
  const { storeId } = useStore();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [hasSearched, setHasSearched] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  const [formToShow, setFormToShow] = React.useState<'standard' | 'discounted'>('standard');
  const [formKey, setFormKey] = React.useState(Date.now());


  const fetchProduct = React.useCallback(async (barcode: string) => {
    if (!barcode || !storeId) {
        setProduct(null);
        setHasSearched(false);
        return;
    }
    setIsLoading(true);
    setProduct(null);
    setHasSearched(true);
    try {
      const productsQuery = query(
        collection(db, 'products'), 
        where('barcode', '==', barcode),
        where('storeId', '==', storeId)
      );
      const querySnapshot = await getDocs(productsQuery);
      
      if (querySnapshot.empty) {
        setProduct(null);
      } else {
        const productDoc = querySnapshot.docs[0];
        setProduct({ id: productDoc.id, ...productDoc.data() } as Product);
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Fetching Product',
        description: error.message,
      });
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast, storeId]);
  
  // Debounce search term
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        if(searchTerm) fetchProduct(searchTerm);
    }, 500) // 500ms delay

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, fetchProduct])

  const handleProductUpdated = () => {
    if (product?.barcode) {
        fetchProduct(product.barcode);
    }
  };

  const onProductAdded = (productName: string) => {
     toast({
        title: 'Product Added!',
        description: `"${productName}" has been successfully added to your store.`,
      });
      // Change the key to force a re-render of the form component with fresh state
      setFormKey(Date.now());
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Edit Existing Product</h3>
           <div className="flex w-full items-center space-x-2">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by barcode to find a product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && hasSearched && !product && (
            <Alert>
              <PackageSearch className="h-4 w-4"/>
              <AlertTitle>No Product Found</AlertTitle>
              <AlertDescription>
                The barcode you searched for did not return any results in your store. Please check the number or add it as a new product.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !hasSearched && (
             <Alert variant="default" className="text-center">
                <PackageSearch className="h-4 w-4"/>
                <AlertTitle>Ready to Search</AlertTitle>
                <AlertDescription>
                    Enter a product's barcode above to find and edit it.
                </AlertDescription>
            </Alert>
          )}

          {!isLoading && product && (
            <div className="border rounded-lg p-4">
                 <div className="flex items-center gap-4">
                    <Image
                    src={getValidImageUrl(product.imageUrl)}
                    alt={product.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                    data-ai-hint="product image"
                    />
                    <div className="flex-grow">
                    <p className="font-semibold text-lg">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {product.brand}
                    </p>
                     <p className="text-xs text-muted-foreground">
                        Barcode: {product.barcode}
                    </p>
                    </div>
                    <div className="flex items-center gap-2">
                    {product.originalPrice && product.originalPrice > product.price && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold text-xs bg-green-100 px-2 py-0.5 rounded-full">
                        <BadgePercent className="h-3 w-3"/>
                        <span>On Sale</span>
                        </div>
                    )}
                    <span className="font-bold text-xl">₹{product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                        <span className="text-md line-through text-muted-foreground">
                            ₹{product.originalPrice.toFixed(2)}
                        </span>
                    )}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setEditingProduct(product)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          )}

          {editingProduct && (
            <EditProductDialog
              product={editingProduct}
              isOpen={!!editingProduct}
              onOpenChange={() => setEditingProduct(null)}
              onProductUpdated={handleProductUpdated}
            />
          )}
        </div>

         <div className="space-y-6">
            <h3 className="text-lg font-medium">Add New Product</h3>
            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant={formToShow === 'standard' ? 'default' : 'outline'}
                    onClick={() => setFormToShow('standard')}
                >
                    Standard Item
                </Button>
                <Button
                     variant={formToShow === 'discounted' ? 'default' : 'outline'}
                     onClick={() => setFormToShow('discounted')}
                >
                    Discounted Item
                </Button>
            </div>
            
            {formToShow === 'standard' ? (
                <StandardProductForm key={formKey} onProductAdded={onProductAdded} />
            ) : (
                <DiscountedProductForm key={formKey} onProductAdded={onProductAdded} />
            )}
        </div>
    </div>
  );
}
