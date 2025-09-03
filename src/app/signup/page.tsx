
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { initialProductCategories } from '@/app/admin/dashboard/categories';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import SpendIQLogo from '@/components/SpendIQLogo';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const customerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
});

const storeOwnerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeAddress: z.string().min(10, 'Please enter a complete address'),
});


type CustomerFormValues = z.infer<typeof customerSchema>;
type StoreOwnerFormValues = z.infer<typeof storeOwnerSchema>;


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'customer' | 'store-owner'>('customer');
  
  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
        email: '',
        password: '',
        username: '',
    },
  });

  const storeOwnerForm = useForm<StoreOwnerFormValues>({
    resolver: zodResolver(storeOwnerSchema),
    defaultValues: { email: '', password: '', storeName: '', storeAddress: '' },
  });

  const onStoreOwnerSubmit = async (values: StoreOwnerFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      if (!user) throw new Error("User creation failed.");

      const storeDocRef = doc(db, 'stores', user.uid);
      await setDoc(storeDocRef, {
         name: values.storeName,
         address: values.storeAddress,
         ownerId: user.uid,
         categories: initialProductCategories,
      });

      const userDocRef = doc(db, 'users', user.uid);
       await setDoc(userDocRef, {
            uid: user.uid,
            displayName: values.storeName,
            email: values.email,
            role: 'store-owner',
            storeId: storeDocRef.id,
      });
      
      await updateProfile(user, { displayName: values.storeName });
      
      toast({ title: 'Account Created!', description: "You're all set. Redirecting to login..." });
      router.push('/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.code === 'auth/email-already-in-use' ? 'This email is already in use.' : error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const onCustomerSubmit = async (values: CustomerFormValues) => {
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: values.username });
        
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            displayName: values.username,
            role: 'customer',
            email: values.email,
        });

        toast({ title: 'Account Created!', description: "You're all set. Redirecting to login..." });
        router.push('/login');
    } catch (error: any) {
      console.error("Signup error:", error);
      let description = "An unexpected error occurred.";
      if (error.code) {
          switch (error.code) {
              case 'auth/email-already-in-use':
                  description = 'This email is already registered. Please log in instead.';
                  break;
              default:
                  description = error.message;
          }
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description,
      });
    } finally {
        setIsLoading(false);
    }
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <SpendIQLogo />
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Join SpendWise to start managing your budget or your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" disabled={isLoading}>Customer</TabsTrigger>
              <TabsTrigger value="store-owner" disabled={isLoading}>Store Owner</TabsTrigger>
            </TabsList>
            <TabsContent value="customer">
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4 pt-6">
                    <FormField
                        control={customerForm.control}
                        name="username"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                            <Input placeholder="Choose a username" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={customerForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input placeholder="name@example.com" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={customerForm.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Customer Account
                    </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="store-owner">
              <Form {...storeOwnerForm}>
                <form onSubmit={storeOwnerForm.handleSubmit(onStoreOwnerSubmit)} className="space-y-4 pt-6">
                   <FormField
                        control={storeOwnerForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem><FormLabel>Admin Email</FormLabel><FormControl><Input placeholder="admin@store.com" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={storeOwnerForm.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Create a strong password" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={storeOwnerForm.control}
                        name="storeName"
                        render={({ field }) => (
                        <FormItem><FormLabel>Store Name</FormLabel><FormControl><Input placeholder="Your store's official name" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={storeOwnerForm.control}
                        name="storeAddress"
                        render={({ field }) => (
                        <FormItem><FormLabel>Store Address</FormLabel><FormControl><Textarea placeholder="Enter the full physical address of your store" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       Create Store Account
                    </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
         <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <a href="/login" className="font-semibold text-primary hover:underline">
                Login
                </a>
            </p>
         </CardFooter>
      </Card>
    </main>
  );
}
