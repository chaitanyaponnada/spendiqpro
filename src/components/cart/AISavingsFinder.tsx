
'use client';

import * as React from 'react';
import Image from 'next/image';
import { suggestCheaperAlternatives, SuggestCheaperAlternativesOutput } from '@/ai/flows/suggest-cheaper-alternatives';
import { findDeals, FindDealsOutput } from '@/ai/flows/find-deals-flow';
import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, Loader2, Sparkles, ArrowRight, Gem, Percent, PlusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as gtag from '@/lib/gtag';
import { getValidImageUrl } from '@/lib/utils';
import { useStore } from '@/hooks/use-store';

type Suggestion = SuggestCheaperAlternativesOutput[0];

export default function AISavingsFinder() {
  const { cart, addToCart, removeFromCart, isHydrated } = useCart();
  const { toast } = useToast();
  const { storeId } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('savings');
  
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [deals, setDeals] = React.useState<FindDealsOutput>([]);
  const [availableProducts, setAvailableProducts] = React.useState<Product[]>([]);
  const [hasFetchedProducts, setHasFetchedProducts] = React.useState(false);


  const fetchAllProducts = React.useCallback(async () => {
    if (!storeId) {
        toast({ title: 'Store Not Selected', description: 'Cannot find savings without a selected store.', variant: 'destructive' });
        return [];
    }
    if (hasFetchedProducts) return availableProducts;

    setIsLoading(true);
    try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, where('storeId', '==', storeId));
        const productSnapshot = await getDocs(q);
        const productList = productSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Product));
        setAvailableProducts(productList);
        setHasFetchedProducts(true);
        return productList;
    } catch (error) {
        console.error("Error fetching products from Firestore:", error);
        toast({ title: 'Database Error', description: 'Could not fetch product list for AI analysis.', variant: 'destructive' });
        return [];
    } finally {
        setIsLoading(false);
    }
  }, [storeId, hasFetchedProducts, availableProducts, toast]);


  const fetchSavings = React.useCallback(async (products: Product[]) => {
    if (cart.length === 0) {
      setSuggestions([]);
      return;
    }
    if (products.length === 0) return;

    setIsLoading(true);
    try {
      const result = await suggestCheaperAlternatives({
        cartItems: cart, // Pass the full CartItem object
        availableProducts: products,
      });
      setSuggestions(result);
    } catch (error) {
       console.error("Error fetching AI savings:", error);
       toast({ title: 'AI Error', description: 'Could not get savings suggestions at this time.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [cart, toast]);

  const fetchDeals = React.useCallback(async (products: Product[]) => {
    if (products.length === 0) return;
    setIsLoading(true);
    try {
      const result = await findDeals({ availableProducts: products });
      setDeals(result);
    } catch (error) {
       console.error("Error fetching AI deals:", error);
       toast({ title: 'AI Error', description: 'Could not find deals at this time.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const handleTabChange = async (tab: string) => {
      setActiveTab(tab);
      // Ensure products are fetched before calling AI flows
      const products = await fetchAllProducts();
      if (!products || products.length === 0) return;

      if (tab === 'savings') {
        fetchSavings(products);
      } else if (tab === 'deals') {
        fetchDeals(products);
      }
  }
  
  const handleOpenDialog = async () => {
    setIsOpen(true);
    gtag.event({ action: 'view_savings_finder', category: 'engagement', label: 'AI Savings', value: 1 });
    // Reset state on open
    setSuggestions([]);
    setDeals([]);
    
    // Fetch products if not already fetched, then fetch data for the initially active tab
    const products = await fetchAllProducts();
    if (!products) return;

    if (activeTab === 'savings') {
        fetchSavings(products);
    } else if (activeTab === 'deals') {
        fetchDeals(products);
    }
  }


  const handleSwapItem = (originalItemName: string, alternative: Product) => {
    const originalItem = cart.find(item => item.name === originalItemName);
    if (!originalItem) return;

    // Remove original item, then add the new one
    removeFromCart(originalItem.id);
    const success = addToCart(alternative);

    if (success) {
      gtag.event({
        action: 'swap_item',
        category: 'ai_interaction',
        label: alternative.name,
        value: (originalItem.price - alternative.price)
      });
      toast({
        title: 'Item Swapped!',
        description: `"${originalItemName}" was replaced with "${alternative.name}".`,
      });
      // Refresh suggestions as the cart has changed
      fetchSavings(availableProducts);
    } else {
      // If adding the alternative fails (e.g., budget), re-add the original item
      addToCart(originalItem);
    }
  };
  
  const handleAddToCart = (productData: Product) => {
    const success = addToCart(productData);
    if (success) {
      toast({
        title: 'Item Added!',
        description: `"${productData.name}" has been added to your cart.`,
      });
    }
  };


  const renderSavingsContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    
    if (cart.length === 0) {
        return (
            <Alert>
                <ShoppingCart className="h-4 w-4" />
                <AlertTitle>Cart is Empty</AlertTitle>
                <AlertDescription>
                    Add items to your cart to let the AI find cheaper alternatives.
                </AlertDescription>
            </Alert>
        );
    }
    
    if (suggestions.length === 0) {
      return (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>All Good!</AlertTitle>
          <AlertDescription>
            No cheaper alternatives found for your current cart. You've got the best deals!
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <Card key={index} className="overflow-hidden bg-background/50">
            <CardContent className="p-4 space-y-3">
              <p className="text-base font-semibold leading-tight text-center">"{suggestion.reason}"</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col items-center flex-1 space-y-1 text-center">
                  <Image src={getValidImageUrl(cart.find(i => i.name === suggestion.originalItemName)?.imageUrl)} alt={suggestion.originalItemName} width={60} height={60} className="rounded-md" data-ai-hint="product image"/>
                  <p className="text-sm font-medium line-through text-muted-foreground">₹{cart.find(i => i.name === suggestion.originalItemName)?.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground truncate w-full">{suggestion.originalItemName}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary flex-shrink-0 mx-1"/>
                <div className="flex flex-col items-center flex-1 space-y-1 text-center">
                  <Image src={getValidImageUrl(suggestion.suggestedAlternative.imageUrl)} alt={suggestion.suggestedAlternative.name} width={60} height={60} className="rounded-md border-2 border-green-500" data-ai-hint="product image"/>
                  <p className="text-sm font-bold text-green-500">₹{suggestion.suggestedAlternative.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground truncate w-full">{suggestion.suggestedAlternative.name}</p>
                </div>
              </div>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleSwapItem(suggestion.originalItemName, suggestion.suggestedAlternative)}>
                Swap & Save ₹{((cart.find(i => i.name === suggestion.originalItemName)?.price || 0) - suggestion.suggestedAlternative.price).toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderDealsContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (deals.length === 0) {
      return (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>No Special Deals Today</AlertTitle>
          <AlertDescription>Check back later for exclusive SpendIQ Treasures! No discounts are currently available.</AlertDescription>
        </Alert>
      );
    }
    return (
      <div className="space-y-4">
        {deals.map((deal, index) => (
          <Card key={index} className="overflow-hidden bg-gradient-to-tr from-yellow-50 via-red-50 to-blue-50 dark:from-yellow-900/20 dark:via-red-900/20 dark:to-blue-900/20">
            <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <Image src={getValidImageUrl(deal.product.imageUrl)} alt={deal.product.name} width={80} height={80} className="rounded-lg border-2 border-yellow-400" data-ai-hint="product image"/>
                  <div className="flex-grow space-y-1">
                    <p className="font-bold leading-tight">{deal.product.name}</p>
                    <p className="text-xs text-muted-foreground">{deal.reason}</p>
                    <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-lg font-bold text-red-500">₹{deal.product.price.toFixed(2)}</span>
                        {deal.product.originalPrice && (
                            <span className="text-sm line-through text-muted-foreground">₹{deal.product.originalPrice?.toFixed(2)}</span>
                        )}
                        {deal.product.originalPrice && deal.product.price < deal.product.originalPrice && (
                            <div className="flex items-center gap-1 text-green-600 font-semibold text-xs bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-900/50 dark:text-green-300">
                                <Percent className="h-3 w-3"/>
                                <span>{(((deal.product.originalPrice - deal.product.price) / deal.product.originalPrice) * 100).toFixed(0)}% OFF</span>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
                 <Button size="sm" className="w-full mt-3" onClick={() => handleAddToCart(deal.product)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add to Cart
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" disabled={!isHydrated} onClick={handleOpenDialog}>
          <Sparkles className="mr-2 h-4 w-4 text-primary" />
          Find Savings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Savings Finder
          </DialogTitle>
          <DialogDescription>
            Let our AI help you find cheaper alternatives and the best deals available in this store.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="savings">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Smart Savings
                </TabsTrigger>
                <TabsTrigger value="deals">
                    <Gem className="mr-2 h-4 w-4"/>
                    SpendIQ Treasures
                </TabsTrigger>
            </TabsList>
            <ScrollArea className="max-h-[60vh] mt-4 pr-4">
              <TabsContent value="savings">
                {renderSavingsContent()}
              </TabsContent>
              <TabsContent value="deals">
                {renderDealsContent()}
              </TabsContent>
            </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
