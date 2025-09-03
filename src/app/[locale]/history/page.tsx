
'use client';

import * as React from 'react';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { CartItem } from '@/types';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getValidImageUrl } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface PurchaseRecord {
  id: string;
  items: CartItem[];
  totalPrice: number;
  purchaseDate: Timestamp;
}

function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = React.useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const historyCol = collection(db, 'purchaseHistory');
        const q = query(historyCol, where('userId', '==', user.uid), orderBy('purchaseDate', 'desc'));
        const querySnapshot = await getDocs(q);

        const purchaseHistory = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PurchaseRecord));

        setHistory(purchaseHistory);
      } catch (error) {
        console.error("Error fetching purchase history: ", error);
        toast({
            variant: 'destructive',
            title: "Error Fetching History",
            description: "Could not fetch your purchase history. The required database index might still be deploying. Please try again in a few minutes.",
            duration: 9000,
        })
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        fetchHistory();
    } else {
        setIsLoading(false);
    }
  }, [user, toast]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !(timestamp instanceof Timestamp)) {
        return 'Invalid Date';
    }
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
  }


  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-start mb-4 relative">
            <Link href="/" className="absolute">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h1 className="text-2xl font-bold text-center flex-grow">Purchase History</h1>
        </div>
        <Card>
          <CardHeader>
            <CardDescription>View your past purchases. Click on an entry to see the items.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : history.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {history.map((record) => (
                        <AccordionItem value={record.id} key={record.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span>{formatDate(record.purchaseDate)}</span>
                                    <span className="font-bold text-primary">₹{record.totalPrice.toFixed(2)}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4">
                                {record.items.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="flex items-center gap-4 text-sm pl-2">
                                         <Image 
                                            src={getValidImageUrl(item.imageUrl)} 
                                            alt={item.name} 
                                            width={40} 
                                            height={40} 
                                            className="rounded-md object-cover"
                                            data-ai-hint="product image"
                                          />
                                        <div className="flex-grow">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-muted-foreground">
                                                {item.quantity} x ₹{item.price.toFixed(2)}
                                            </p>
                                        </div>
                                        <p className="font-semibold">₹{(item.quantity * item.price).toFixed(2)}</p>
                                    </div>
                                ))}
                                <Separator className='my-2'/>
                                 <div className="flex justify-between items-center text-sm font-bold pl-2">
                                     <span>Total</span>
                                     <span>₹{record.totalPrice.toFixed(2)}</span>
                                 </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
              <Alert>
                <ShoppingBag className="h-4 w-4" />
                <AlertTitle>No Purchases Yet</AlertTitle>
                <AlertDescription>
                  Your purchase history is empty. Start shopping to see your orders here!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WrappedHistoryPage() {
    return (
        <AuthWrapper>
            <HistoryPage />
        </AuthWrapper>
    )
}
