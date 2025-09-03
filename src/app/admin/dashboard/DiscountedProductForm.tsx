
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { discountedProductSchema, type DiscountedProductFormValues } from './schemas';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useCategories } from './CategoryContext';
import { useStore } from '@/hooks/use-store';

interface DiscountedProductFormProps {
    onProductAdded: (productName: string) => void;
}

export function DiscountedProductForm({ onProductAdded }: DiscountedProductFormProps) {
  const { toast } = useToast();
  const { storeId } = useStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const { categories } = useCategories();

  const form = useForm<DiscountedProductFormValues>({
    resolver: zodResolver(discountedProductSchema),
    defaultValues: {
      name: '',
      brand: '',
      category: '',
      originalPrice: '' as any,
      price: '' as any,
      barcode: '',
      description: '',
      imageUrl: '',
    },
  });

  const onSubmit = async (values: DiscountedProductFormValues) => {
    if (!storeId) {
        toast({
            variant: 'destructive',
            title: 'Store Not Found',
            description: 'Cannot add product without a valid store context.'
        });
        return;
    }
    setIsLoading(true);
    try {
      const productsRef = collection(db, 'products');
      await addDoc(productsRef, {
        ...values,
        storeId: storeId,
      });
      onProductAdded(values.name);
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Adding Product',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
    <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Creating a Discount</AlertTitle>
        <AlertDescription>
            Provide the product's original price and the new, lower discounted price. This will appear as a sale to customers.
        </AlertDescription>
    </Alert>
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Premium Basmati Rice 1kg" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., India Gate" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Original Price (₹)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 200.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Discounted Price (₹)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 150.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Barcode (GTIN)</FormLabel>
                    <FormControl>
                        <Input placeholder="Scan or enter barcode" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
            <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                    <Textarea placeholder="A short description of the product" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
            <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Image URL (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Discounted Product
        </Button>
        </form>
    </Form>
    </>
  );
}
