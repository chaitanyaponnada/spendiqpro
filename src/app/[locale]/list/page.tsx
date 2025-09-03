
'use client';

import * as React from 'react';
import { Camera, Check, Image as ImageIcon, Loader2, Sparkles, X, History, Upload, ArrowLeft, RotateCw, ListPlus, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { extractShoppingList } from '@/ai/flows/extract-shopping-list-flow';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useAuth } from '@/hooks/use-auth';
import type { ShoppingListItem } from '@/types';
import { Input } from '@/components/ui/input';
import { VoiceInput } from './VoiceInput';
import { useUIStore } from '@/hooks/use-ui-store';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import BottomNav from '@/components/layout/BottomNav';


function dataURIToFile(dataURI: string, fileName: string): File {
    const splitDataURI = dataURI.split(',');
    const byteString = atob(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    return new File([blob], fileName, { type: mimeString });
}


function ListGenerator({ onListGenerated }: { onListGenerated: (items: string[]) => void }) {
  const { toast } = useToast();
  const { setIsCameraActive } = useUIStore();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('');
  const [isCameraOn, setIsCameraOn] = React.useState(false);

  const handleAISuccess = (result: { items: string[] }) => {
    if (result.items.length === 0) {
      toast({
        title: 'No Items Found',
        description: 'The AI could not find any items in the image. Please try a clearer picture.',
        variant: 'destructive'
      });
      return;
    }
    onListGenerated(result.items);
    toast({
      title: 'List Extracted!',
      description: 'Your shopping list is ready.',
    });
  };

  const handleError = (error: any, context: string) => {
    console.error(`Error ${context}:`, error);
    toast({
      variant: 'destructive',
      title: `AI Error: ${context}`,
      description: error.message || 'Could not process the image. Please try again.',
    });
  };
  
  const stopCamera = React.useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setIsCameraActive(false);
  }, [setIsCameraActive]);

  const processImage = React.useCallback(async (imageDataUri: string) => {
    setIsLoading(true);
    setLoadingMessage('AI is reading your list...');

    try {
        const result = await extractShoppingList({ photoDataUri: imageDataUri });

        if (result && result.items) {
            handleAISuccess(result);
        } else {
            handleError(new Error('AI did not return items.'), 'extracting list');
        }
    } catch (error) {
        handleError(error, 'processing image');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [toast]);


  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Camera access is not supported.' });
      return;
    }
    stopCamera(); // Stop any existing stream
    setIsCameraActive(true); // Hide nav
    setIsCameraOn(true); // Show camera UI
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 } 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let description = 'Please allow camera access in your browser settings.';
      if (err.name === 'NotAllowedError') {
        description = 'Camera permission was denied. Please enable it in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        description = 'No camera was found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        description = 'Your camera may be in use by another application.'
      }
      toast({ variant: 'destructive', title: 'Camera Error', description });
      stopCamera();
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/jpeg');
      
      stopCamera();
      processImage(dataUri);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        if (dataUri) {
          processImage(dataUri);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (isCameraOn) {
    return (
      <div className="bg-black fixed inset-0 z-50 flex flex-col items-center justify-center bottom-0">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <Button onClick={stopCamera} variant="ghost" size="icon" className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-10 flex justify-center w-full">
          <Button onClick={takePicture} size="lg" className="rounded-full h-20 w-20 border-4 border-white/50 bg-black/30 backdrop-blur-sm">
            <Camera className="h-10 w-10 text-white" />
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Generate a new list from a photo or by uploading an image.</p>
       <div className="grid grid-cols-2 gap-4">
          <Card onClick={startCamera} className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                <Camera className="h-8 w-8 text-primary mb-2"/>
                <p className="font-semibold text-center text-sm">Take Photo</p>
            </CardContent>
          </Card>
          <Card onClick={() => fileInputRef.current?.click()} className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                <Upload className="h-8 w-8 text-primary mb-2"/>
                <p className="font-semibold text-center text-sm">Upload Image</p>
            </CardContent>
          </Card>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>
       {isLoading && (
        <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">{loadingMessage}</p>
        </div>
      )}
    </div>
  );
}

function TodaysList() {
    const { todayList, setTodayList, toggleItemChecked, addManualItem, deleteItem, updateItemName, clearTodayList } = useShoppingList();
    const { toast } = useToast();
    const [manualItem, setManualItem] = React.useState('');
    const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
    const [editingItemName, setEditingItemName] = React.useState('');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualItem.trim()) {
            addManualItem(manualItem.trim());
            setManualItem('');
        }
    }
    
    const handleVoiceItemAdded = (item: string) => {
        if (item.trim()) {
            addManualItem(item.trim());
            toast({
                title: "Item Added",
                description: `"${item}" was added to your list.`
            })
        }
    }
    
    const handleEditClick = (item: ShoppingListItem) => {
        setEditingItemId(item.id);
        setEditingItemName(item.name);
    }
    
    const handleSaveEdit = (itemId: string) => {
        if (editingItemName.trim()) {
            updateItemName(itemId, editingItemName.trim());
            setEditingItemId(null);
            setEditingItemName('');
        }
    }
    
    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditingItemName('');
    }
    
    const handleClearList = () => {
        clearTodayList();
        toast({
            title: "List Cleared",
            description: "All items have been removed from your list."
        });
    }

    return (
        <div>
            <ListGenerator onListGenerated={(items) => setTodayList(items)} />
             <Separator className="my-6" />
             <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                    <form onSubmit={handleAddItem} className="flex-grow flex gap-2">
                        <Input 
                            value={manualItem}
                            onChange={(e) => setManualItem(e.target.value)}
                            placeholder="Type an item..."
                        />
                        <Button type="submit" variant="outline">Add</Button>
                    </form>
                    <VoiceInput onItemAdded={handleVoiceItemAdded} />
                </div>
             </div>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="text-primary" />
                            Today's List
                        </CardTitle>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={todayList.length === 0}>
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Clear
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete all items from your current shopping list.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearList}>Clear List</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <CardDescription>
                        Items you need to buy for this shopping trip.
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    {todayList.length > 0 ? (
                        <ScrollArea className="h-64">
                            <div className="space-y-1 pr-4">
                            {todayList.map((item, index) => (
                                <React.Fragment key={item.id}>
                                    <div className="flex items-center space-x-3 py-1 text-sm">
                                        <Checkbox 
                                            id={item.id} 
                                            checked={item.checked} 
                                            onCheckedChange={() => toggleItemChecked(item.id)}
                                            disabled={!!editingItemId}
                                        />
                                        {editingItemId === item.id ? (
                                            <Input 
                                                value={editingItemName}
                                                onChange={(e) => setEditingItemName(e.target.value)}
                                                className="h-8 flex-grow"
                                                autoFocus
                                            />
                                        ) : (
                                            <Label 
                                                htmlFor={item.id} 
                                                className={cn("flex-grow", item.checked && "line-through text-muted-foreground")}
                                            >
                                               <span className="font-semibold text-primary mr-2">{index + 1}.</span> 
                                               {item.name}
                                            </Label>
                                        )}

                                        <div className="flex items-center gap-1 ml-auto">
                                            {editingItemId === item.id ? (
                                                <>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveEdit(item.id)}>
                                                        <Save className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(item)} disabled={!!editingItemId}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)} disabled={!!editingItemId}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {index < todayList.length - 1 && <Separator />}
                                </React.Fragment>
                            ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <ListPlus className="mx-auto h-8 w-8 mb-2"/>
                            <p>Your current list is empty.</p>
                            <p>Generate one above or add items manually!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function PastLists() {
    const { user } = useAuth();
    const { pastLists, fetchPastLists, setTodayList, isPastListLoading } = useShoppingList();
    const { toast } = useToast();
    
    React.useEffect(() => {
        if(user) {
            fetchPastLists(user.uid);
        }
    }, [user, fetchPastLists]);

    const handleReuseList = (list: ShoppingListItem[]) => {
        setTodayList(list.map(item => item.name));
        toast({
            title: "List Loaded!",
            description: "The past list items have been added to your Today's List."
        })
        // Potentially switch tab to 'today' after this
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Invalid Date';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    if (isPastListLoading) {
         return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (pastLists.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <History className="mx-auto h-8 w-8 mb-2"/>
                <p>No past shopping lists found.</p>
                <p>Complete a purchase to save a list here.</p>
            </div>
        );
    }

    return (
         <Accordion type="single" collapsible className="w-full">
            {pastLists.map((record) => (
                <AccordionItem value={record.id} key={record.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <span>{formatDate(record.savedAt)}</span>
                            <span className="text-sm text-muted-foreground">{record.items.length} items</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4">
                            <div className="space-y-2 pl-2">
                                {record.items.map((item, index) => (
                                     <p key={index} className={cn("text-muted-foreground", item.checked && "line-through")}>- {item.name}</p>
                                ))}
                            </div>
                           <Button size="sm" className="w-full" onClick={() => handleReuseList(record.items)}>
                                <RotateCw className="mr-2 h-4 w-4"/>
                                Use This List Again
                           </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

function ShoppingListPage() {
  const [activeTab, setActiveTab] = React.useState("today");
  const { isCameraActive } = useUIStore();

  return (
    <div className={cn("flex flex-col min-h-screen bg-background font-body", !isCameraActive && "pb-20")}>
        <div className="flex flex-col items-center p-4 flex-grow">
        <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-center mb-1">My Lists</h1>
            <p className="text-muted-foreground text-center mb-6">Create, manage, and reuse your shopping lists.</p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="today">Today's List</TabsTrigger>
                    <TabsTrigger value="past">
                        <History className="mr-2 h-4 w-4" />
                        Past Lists
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="mt-6">
                    <TodaysList />
                </TabsContent>
                <TabsContent value="past" className="mt-6">
                    <PastLists />
                </TabsContent>
            </Tabs>
        </div>
        </div>
        {!isCameraActive && <BottomNav />}
    </div>
  );
}

export default function WrappedShoppingListPage() {
  return (
    <AuthWrapper>
      <ShoppingListPage />
    </AuthWrapper>
  );
}
