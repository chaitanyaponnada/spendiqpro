
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Paperclip } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/hooks/use-store';

interface SupportFormProps {
  onTicketSubmitted: () => void;
}

const supportSchema = z.object({
  description: z.string().min(10, 'Please provide at least 10 characters.').max(1000, 'Description cannot exceed 1000 characters.'),
  image: z.instanceof(File).optional(),
});

type SupportFormValues = z.infer<typeof supportSchema>;

export function SupportForm({ onTicketSubmitted }: SupportFormProps) {
  const { user } = useAuth();
  const { storeId } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      description: '',
      image: undefined,
    },
  });

  const onSubmit = async (values: SupportFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to submit a ticket.'})
        return;
    }
     if (!storeId) {
        toast({ variant: 'destructive', title: 'No Store Selected', description: 'Cannot submit a ticket without a store context.'})
        return;
    }
    setIsLoading(true);
    try {
        let imageUrl: string | null = null;

        if (values.image) {
            const storageRef = ref(storage, `support-tickets/${user.uid}/${Date.now()}_${values.image.name}`);
            const uploadResult = await uploadBytes(storageRef, values.image);
            imageUrl = await getDownloadURL(uploadResult.ref);
        }
        
        await addDoc(collection(db, 'supportTickets'), {
            userId: user.uid,
            storeId: storeId,
            displayName: user.displayName || 'Anonymous',
            email: user.email,
            description: values.description,
            imageUrl: imageUrl, // Use null if no image was uploaded
            createdAt: serverTimestamp(),
            read: false,
        });

        toast({ title: 'Ticket Submitted!', description: "We've received your request and will get back to you soon." });
        onTicketSubmitted();

    } catch(err) {
        console.error("Error submitting ticket: ", err);
        toast({ variant: 'destructive', title: 'Submission Error', description: 'There was a problem submitting your ticket. Please try again.'});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
    <Alert className="mb-6">
        <Paperclip className="h-4 w-4" />
        <AlertTitle>Describe Your Issue</AlertTitle>
        <AlertDescription>
            Please provide as much detail as possible. You can also attach a screenshot if it helps explain the problem.
        </AlertDescription>
    </Alert>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe the issue you're facing with the app."
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                    <FormLabel>Attach a Photo (Optional)</FormLabel>
                    <FormControl>
                        <div>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    onChange(file);
                                }}
                                {...rest}
                            />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit Ticket
        </Button>
      </form>
    </Form>
    </>
  );
}
