

'use client';

import * as React from 'react';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import AdminWrapper from '@/components/auth/AdminWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SpendIQLogo from '@/components/SpendIQLogo';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, LogOut, Upload, Store as StoreIcon, Image as ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageProducts } from './ManageProducts';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { FeedbackAndSupport } from './ViewFeedback';
import { Badge } from '@/components/ui/badge';
import { CategoryProvider } from './CategoryContext';
import { ManageCategories } from './ManageCategories';
import { useStore } from '@/hooks/use-store';
import type { Store } from '@/types';
import Image from 'next/image';
import { Input } from '@/components/ui/input';


function StoreSettings() {
    const { toast } = useToast();
    const { storeId } = useStore();
    const [store, setStore] = React.useState<Store | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!storeId) {
            setIsLoading(false);
            return;
        }

        const fetchStoreData = async () => {
            const storeDocRef = doc(db, 'stores', storeId);
            const docSnap = await getDoc(storeDocRef);
            if (docSnap.exists()) {
                setStore({ id: docSnap.id, ...docSnap.data() } as Store);
            } else {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not find store data.' });
            }
            setIsLoading(false);
        };
        
        fetchStoreData();
    }, [storeId, toast]);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !storeId) return;

        setIsUploading(true);
        try {
            // Define storage path
            const storageRef = ref(storage, `store-logos/${storeId}/${file.name}`);
            
            // Upload file
            const uploadResult = await uploadBytes(storageRef, file);
            
            // Get download URL
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // Update Firestore
            const storeDocRef = doc(db, 'stores', storeId);
            await updateDoc(storeDocRef, { logoUrl: downloadURL });

            setStore(prevStore => prevStore ? { ...prevStore, logoUrl: downloadURL } : null);

            toast({ title: "Logo Updated!", description: "Your new store logo is now live." });
        } catch (error) {
            console.error("Error uploading logo: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the new logo.' });
        } finally {
            setIsUploading(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    if (!store) {
        return <p>Store data not found.</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>Manage your store's branding and information.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{store.name}</h3>
                    <p className="text-muted-foreground">{store.address}</p>
                    {/* Future fields for editing name/address can go here */}
                </div>
                <div className="space-y-4 flex flex-col items-center">
                    <Card className="w-48 h-48 flex items-center justify-center bg-muted">
                        {store.logoUrl ? (
                            <Image src={store.logoUrl} alt={`${store.name} logo`} width={192} height={192} className="object-contain rounded-md" />
                        ) : (
                            <div className="text-center text-muted-foreground p-4">
                                <ImageIcon className="h-12 w-12 mx-auto" />
                                <p className="text-sm mt-2">No Logo</p>
                            </div>
                        )}
                    </Card>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Button onClick={handleFileSelect} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload Logo
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


function AdminDashboard() {
  const { user } = useAuth();
  const { storeId } = useStore();
  const router = useRouter();
  const { toast } = useToast();
  const [unreadFeedbackCount, setUnreadFeedbackCount] = React.useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = React.useState(0);

  React.useEffect(() => {
    if (!storeId) return;

    // Simplified query for feedback
    const feedbackQuery = query(
        collection(db, 'feedback'), 
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc')
    );
    const feedbackUnsubscribe = onSnapshot(feedbackQuery, (querySnapshot) => {
      const unreadCount = querySnapshot.docs.filter(doc => !doc.data().read).length;
      setUnreadFeedbackCount(unreadCount);
    });

    // Simplified query for support tickets
    const supportQuery = query(
        collection(db, 'supportTickets'), 
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc')
    );
    const supportUnsubscribe = onSnapshot(supportQuery, (querySnapshot) => {
        const unreadCount = querySnapshot.docs.filter(doc => !doc.data().read).length;
        setUnreadSupportCount(unreadCount);
    });

    return () => {
        feedbackUnsubscribe();
        supportUnsubscribe();
    };
  }, [storeId]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login'; // Use standard navigation for logout
  };

  const totalUnread = unreadFeedbackCount + unreadSupportCount;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40 p-4 md:p-8">
        <div className="w-full max-w-7xl mx-auto">
            <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <SpendIQLogo />
                    <h1 className="text-xl font-bold text-foreground hidden sm:block">
                        Store Owner Dashboard
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden md:inline">
                        Welcome, {user?.displayName || 'Admin'}
                    </span>
                    <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Logout">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="feedback">
                        Feedback & Support
                        {totalUnread > 0 && (
                            <Badge variant="destructive" className="ml-2">{totalUnread}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="products">Product Management</TabsTrigger>
                    <TabsTrigger value="categories">Category Management</TabsTrigger>
                    <TabsTrigger value="settings">Store Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="mt-6">
                   <AnalyticsDashboard />
                </TabsContent>

                <TabsContent value="feedback" className="mt-6">
                    <FeedbackAndSupport />
                </TabsContent>
                
                <TabsContent value="products" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Management</CardTitle>
                            <CardDescription>Add new products to your inventory or search by barcode to edit existing ones.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManageProducts />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="categories" className="mt-6">
                    <ManageCategories />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <StoreSettings />
                </TabsContent>

            </Tabs>
        </div>
    </div>
  );
}

export default function WrappedAdminDashboard() {
    return (
        <AdminWrapper>
            <CategoryProvider>
                <AdminDashboard />
            </CategoryProvider>
        </AdminWrapper>
    )
}
