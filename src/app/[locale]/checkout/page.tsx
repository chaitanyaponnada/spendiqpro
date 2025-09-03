
'use client';

import * as React from 'react';
import { useRouter } from '@/lib/navigation';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, PartyPopper } from 'lucide-react';
import SpendIQLogo from '@/components/SpendIQLogo';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CartItem, ShoppingListItem, Product } from '@/types';
import { cn, getValidImageUrl } from '@/lib/utils';
import { useShoppingList } from '@/hooks/use-shopping-list';
import * as gtag from '@/lib/gtag';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import { useStore } from '@/hooks/use-store';


const upiApps = [
    { name: 'Google Pay', icon: 'https://placehold.co/40x40/FFFFFF/000000/png?text=G', hint: 'google pay logo' },
    { name: 'PhonePe', icon: 'https://placehold.co/40x40/7F00FF/FFFFFF/png?text=P', hint: 'phonepe logo' },
    { name: 'Paytm', icon: 'https://placehold.co/40x40/00308F/FFFFFF/png?text=P', hint: 'paytm logo' },
    { name: 'BHIM', icon: 'https://placehold.co/40x40/FF6D00/FFFFFF/png?text=B', hint: 'bhim upi logo' },
];

const savePurchaseHistory = async (userId: string, storeId: string, cart: CartItem[], totalPrice: number) => {
    try {
      await addDoc(collection(db, 'purchaseHistory'), {
        userId,
        storeId,
        items: cart.map(item => {
            // Create a sanitized object to send to Firestore, ensuring no undefined fields.
            const sanitizedItem = {
                productId: item.id || '', 
                name: item.name || '',
                price: item.price || 0,
                quantity: item.quantity || 0,
                brand: item.brand || '',
                category: item.category || '',
                imageUrl: item.imageUrl || null,
                originalPrice: item.originalPrice || null,
                description: item.description || null,
                barcode: item.barcode || '',
                storeId: item.storeId || '',
            };
            // Remove 'id' from the object to be saved, as productId is used.
            const { id, ...rest } = item;
            return {
              ...rest,
              ...sanitizedItem
            };
        }),
        totalPrice,
        purchaseDate: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error writing document: ", error);
      throw new Error("Could not save purchase history.");
    }
  };
  
const saveShoppingList = async (userId: string, storeId: string, list: ShoppingListItem[]) => {
    if (list.length === 0) return; // Don't save empty lists
    try {
        await addDoc(collection(db, 'shoppingLists'), {
            userId,
            storeId,
            items: list.map(item => ({ name: item.name, checked: item.checked })),
            savedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error saving shopping list: ", error);
        // We don't throw here as it's not a critical failure for the checkout process
    }
}


function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeId, setStoreId } = useStore();
  const { cart, totalPrice, clearAllData } = useCart();
  const { todayList, clearTodayList } = useShoppingList();
  const { toast } = useToast();
  const [step, setStep] = React.useState<'summary' | 'payment' | 'complete'>('summary');
  const [isPopping, setIsPopping] = React.useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (cart.length === 0 && step !== 'complete') {
      router.replace('/');
    }
  }, [cart, router, step]);
  
  const handlePayment = async (method: string) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to make a purchase.',
        });
        return;
    }
     if (!storeId) {
        toast({
            variant: 'destructive',
            title: 'Store Error',
            description: 'No store selected. Please go back and select a store.',
        });
        return;
    }
    
    try {
        await savePurchaseHistory(user.uid, storeId, cart, totalPrice);
        await saveShoppingList(user.uid, storeId, todayList);
        
        gtag.event({
            action: 'purchase',
            category: 'ecommerce',
            label: method,
            value: totalPrice,
        })
        
        toast({
          title: 'Payment Successful!',
          description: `Your purchase of ₹${totalPrice.toFixed(2)} is complete.`,
        });
        
        setStep('complete');
        clearTodayList(); // Clear the list after saving it
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 1000); // Animation duration
    } catch (error) {
        toast({
            title: 'Payment Failed',
            description: 'There was an error processing your payment.',
            variant: 'destructive'
        });
    }
  };

  const handleProceedToPay = () => {
    setStep('payment');
  }

  const handleSetNewBudget = () => {
    clearAllData();
    setStoreId(null); // Clear the selected store
    router.push('/'); // This will now force the StoreSelectionGate to appear
  }

  const renderContent = () => {
    switch (step) {
      case 'complete':
        return (
          <>
          <div className="text-center space-y-4">
             <div className="relative w-full h-24 flex justify-center items-center">
                <PartyPopper className={cn("h-16 w-16 text-primary transition-all duration-500", isPopping && "animate-bounce")} />
             </div>
             <h2 className="text-2xl font-bold">Thanks for using SpendWise!</h2>
             <p className="text-muted-foreground">Your purchase has been recorded.</p>
             <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => setIsFeedbackDialogOpen(true)}>
                    <MessageSquare className="mr-2 h-4 w-4"/>
                    Share Your Experience
                </Button>
                <Button className="w-full" variant="secondary" onClick={handleSetNewBudget}>Start New Budget</Button>
             </div>
          </div>
          <FeedbackDialog 
            isOpen={isFeedbackDialogOpen}
            onOpenChange={setIsFeedbackDialogOpen}
           />
          </>
        );
      case 'payment':
        return (
          <div className="space-y-4">
            {upiApps.map((app) => (
                <Button
                    key={app.name}
                    variant="outline"
                    className="w-full justify-start h-14 text-lg gap-4"
                    onClick={() => handlePayment(app.name)}
                >
                    <Image src={app.icon} alt={app.name} width={40} height={40} data-ai-hint={app.hint} className="rounded-full" />
                    <span>{app.name}</span>
                </Button>
            ))}
          </div>
        );
      case 'summary':
      default:
        return (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                          {item.quantity} x ₹{item.price.toFixed(2)}
                      </p>
                  </div>
                  <p className="font-semibold">₹{(item.quantity * item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold text-primary">
              <span>Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        );
    }
  }


  const getTitle = () => {
    switch (step) {
        case 'complete': return "Purchase Complete";
        case 'payment': return "Select Payment Method";
        case 'summary':
        default: return "Checkout Summary"
    }
  }

  const getDescription = () => {
     switch (step) {
        case 'complete': return " ";
        case 'payment': return "Choose your preferred UPI app";
        case 'summary':
        default: return "Review your items before payment."
    }
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => step === 'summary' ? router.back() : setStep('summary')} disabled={step === 'complete'}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-grow text-center">
              <SpendIQLogo />
            </div>
            <div className="w-10"></div>
          </div>
          <CardTitle className="text-center text-2xl">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-center">
             {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        {step === 'summary' && (
            <CardFooter>
                <Button className="w-full" onClick={handleProceedToPay} disabled={cart.length === 0}>
                    Proceed to Pay
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}


export default function WrappedCheckoutPage() {
    return (
        <AuthWrapper nav={false}>
            <CheckoutPage />
        </AuthWrapper>
    )
}
