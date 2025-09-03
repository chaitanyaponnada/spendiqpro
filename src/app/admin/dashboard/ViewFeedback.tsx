
'use client';

import * as React from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Star, MessageSquare, LifeBuoy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ViewSupportTickets } from './ViewSupportTickets';
import { useStore } from '@/hooks/use-store';

interface Feedback {
  id: string;
  displayName: string;
  rating: number;
  comment?: string;
  createdAt: { seconds: number, nanoseconds: number };
  read: boolean;
  storeId: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

const formatDate = (timestamp: { seconds: number, nanoseconds: number }) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp.seconds * 1000).toLocaleString();
}

export function ViewFeedback() {
  const { toast } = useToast();
  const { storeId } = useStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedbackList, setFeedbackList] = React.useState<Feedback[]>([]);

  React.useEffect(() => {
    if (!storeId) {
        setIsLoading(false);
        return;
    };

    const q = query(
        collection(db, 'feedback'), 
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const feedbacks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Feedback));
      setFeedbackList(feedbacks);
      setIsLoading(false);
      
      // Mark new feedback as read
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" && !change.doc.data().read) {
          try {
            await updateDoc(doc(db, "feedback", change.doc.id), {
              read: true
            });
          } catch(err) {
            console.error("Failed to mark feedback as read:", err);
          }
        }
      });

    }, (error) => {
      console.error("Error fetching feedback: ", error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Feedback',
        description: 'Could not fetch customer feedback. The required index might be deploying.',
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
  
  if (feedbackList.length === 0) {
      return (
        <Alert>
          <MessageSquare className="h-4 w-4"/>
          <AlertTitle>No Feedback Yet</AlertTitle>
          <AlertDescription>
            You haven't received any customer feedback for your store yet. Check back later!
          </AlertDescription>
        </Alert>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Feedback</CardTitle>
        <CardDescription>
          Here's what your customers are saying about their experience in your store.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
            {feedbackList.map((feedback) => (
                <Card key={feedback.id} className="bg-muted/50">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{feedback.displayName}</CardTitle>
                                <CardDescription>{formatDate(feedback.createdAt)}</CardDescription>
                            </div>
                            <StarRating rating={feedback.rating} />
                        </div>
                    </CardHeader>
                    {feedback.comment && (
                        <CardContent>
                            <p className="text-sm italic">"{feedback.comment}"</p>
                        </CardContent>
                    )}
                </Card>
            ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function FeedbackAndSupport() {
    return (
        <div className="grid md:grid-cols-2 gap-8">
            <ViewFeedback />
            <ViewSupportTickets />
        </div>
    )
}
