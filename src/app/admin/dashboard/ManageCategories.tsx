
'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from './CategoryContext';
import { Loader2, Tag, List, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function ManageCategories() {
  const { categories, addCategory, loading } = useCategories();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    await addCategory(values.name);
    form.reset();
    setIsSubmitting(false);
  };
  
  const filteredCategories = categories.filter(category => 
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>
            Create a new category for your products. It will be available immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Organic Goods" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Category
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <CardDescription>
            Here is a list of all current product categories in your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                 />
            </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length > 0 ? (
            <ScrollArea className="h-52 pr-4">
               {filteredCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {filteredCategories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-base px-3 py-1">
                            <Tag className="mr-2 h-4 w-4" />
                            {category}
                        </Badge>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground pt-10">
                        <p>No results found for "{searchTerm}".</p>
                    </div>
                )}
            </ScrollArea>
          ) : (
             <Alert>
                <List className="h-4 w-4"/>
                <AlertTitle>No Categories Found</AlertTitle>
                <AlertDescription>
                    Your store does not have any categories yet. Add one using the form on the left to get started.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
