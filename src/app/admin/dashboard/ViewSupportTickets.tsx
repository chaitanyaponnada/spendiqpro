
'use client';

import * as React from 'react';
import Image from 'next/image';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, LifeBuoy, MessageSquare, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/use-store';


interface SupportTicket {
  id: string;
  displayName: string;
  email: string;
  description: string;
  imageUrl?: string;
  createdAt: { seconds: number, nanoseconds: number };
  read: boolean;
  storeId: string;
}

const formatDate = (timestamp: { seconds: number, nanoseconds: number }) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp.seconds * 1000).toLocaleString();
}

export function ViewSupportTickets() {
  const { toast } = useToast();
  const { storeId } = useStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);

  React.useEffect(() => {
    if (!storeId) {
        setIsLoading(false);
        return;
    }

    const q = query(
        collection(db, 'supportTickets'), 
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SupportTicket));
      setTickets(ticketList);
      setIsLoading(false);
      
      // Mark new tickets as read
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" && !change.doc.data().read) {
          try {
            await updateDoc(doc(db, "supportTickets", change.doc.id), {
              read: true
            });
          } catch(err) {
            console.error("Failed to mark ticket as read:", err);
          }
        }
      });

    }, (error) => {
      console.error("Error fetching support tickets: ", error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Tickets',
        description: 'Could not fetch support tickets. The required index might be deploying.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [storeId, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (tickets.length === 0) {
      return (
        <Alert>
          <LifeBuoy className="h-4 w-4"/>
          <AlertTitle>No Support Tickets</AlertTitle>
          <AlertDescription>
            You haven't received any support requests for your store yet.
          </AlertDescription>
        </Alert>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Support Tickets</CardTitle>
        <CardDescription>
          Review and respond to customer support requests for your store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
            {tickets.map((ticket) => (
                <Card key={ticket.id} className="bg-muted/50">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{ticket.displayName}</CardTitle>
                                <CardDescription>Submitted: {formatDate(ticket.createdAt)}</CardDescription>
                            </div>
                            <a href={`mailto:${ticket.email}`} className="text-sm text-primary hover:underline">
                                {ticket.email}
                            </a>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm mb-4">{ticket.description}</p>
                        {ticket.imageUrl && (
                             <div className="mt-4">
                                <p className="text-sm font-semibold mb-2">Attached Image:</p>
                                <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer">
                                <Image
                                    src={ticket.imageUrl}
                                    alt="Support ticket attachment"
                                    width={200}
                                    height={200}
                                    className="rounded-md object-cover border"
                                />
                                </a>
                            </div>
                        )}
                    </CardContent>
                     <CardFooter>
                        <a href={`mailto:${ticket.email}?subject=RE: Your Support Request for ${storeId}`} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full">
                                <MessageSquare className="mr-2 h-4 w-4"/>
                                Reply via Email
                            </Button>
                        </a>
                     </CardFooter>
                </Card>
            ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
