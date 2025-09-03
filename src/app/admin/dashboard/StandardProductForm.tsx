
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
import { standardProductSchema, type StandardProductFormValues } from './schemas';
import { Loader2 } from 'lucide-react';
import { useCategories } from './CategoryContext';
import { useStore } from '@/hooks/use-store';

interface StandardProductFormProps {
    onProductAdded: (productName: string) => void;
}

export function StandardProductForm({ onProductAdded }: StandardProductFormProps) {
  const { toast } = useToast();
  const { storeId } = useStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const { categories } = useCategories();

  const form = useForm<StandardProductFormValues>({
    resolver: zodResolver(standardProductSchema),
    defaultValues: {
      name: '',
      brand: '',
      price: '' as any,
      category: '',
      barcode: '',
      description: '',
      imageUrl: '',
    },
  });

  const onSubmit = async (values: StandardProductFormValues) => {
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
        originalPrice: null, // Ensure no original price for standard products
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
                        <Input placeholder="e.g., Organic Milk 1L" {...field} />
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
                        <Input placeholder="e.g., DairyPure" {...field} />
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
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 150.50" {...field} />
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
                    <FormItem className="md:col-span-2">
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
            Add Standard Product
        </Button>
        </form>
    </Form>
  );
}
