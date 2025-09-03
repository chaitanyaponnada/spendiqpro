
'use client';

import * as React from 'react';
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';
import { Camera, X, Loader2, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { useStore } from '@/hooks/use-store';

interface BarcodeScannerProps {
  onProductScanned: (product: Product) => void;
}

export default function BarcodeScanner({ onProductScanned }: BarcodeScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const codeReaderRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();
  const { storeId } = useStore();
  
  const [isScanning, setIsScanning] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [scanSuccess, setScanSuccess] = React.useState(false);
  const [manualBarcode, setManualBarcode] = React.useState('');
  const [isManualEntryOpen, setIsManualEntryOpen] = React.useState(false);

  const findProductInFirestore = React.useCallback(async (barcode: string): Promise<Product | null> => {
    if(!barcode || !storeId) return null;
    setIsFetching(true);
    try {
      const productsCol = collection(db, 'products');
      const q = query(productsCol, where('barcode', '==', barcode), where('storeId', '==', storeId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }
      
      const productDoc = querySnapshot.docs[0];
      const productData = productDoc.data();
      
      return {
        id: productDoc.id,
        ...productData,
      } as Product;

    } catch (error) {
      console.error("Error fetching product from Firestore:", error);
      toast({ variant: 'destructive', title: 'Database Error', description: 'Could not connect to the product database.' });
      return null;
    } finally {
        setIsFetching(false);
    }
  }, [toast, storeId]);

  const handleSuccessfulScan = React.useCallback(async (barcode: string) => {
    const product = await findProductInFirestore(barcode);
    
    if (product) {
      setScanSuccess(true);
      onProductScanned(product);
      setTimeout(() => {
         setScanSuccess(false);
      }, 1500)
    } else {
      toast({ variant: 'destructive', title: 'Product Not Found', description: `No product with this barcode was found in the current store.` });
    }
  }, [onProductScanned, findProductInFirestore, toast]);
  
  const handleManualSubmit = () => {
    handleSuccessfulScan(manualBarcode);
    setIsManualEntryOpen(false);
    setManualBarcode('');
  }
  
  const stopScanner = React.useCallback(() => {
    if (codeReaderRef.current) {
        codeReaderRef.current.reset();
    }
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const startScanner = React.useCallback(async () => {
    if (isScanning || isFetching) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Camera access is not supported by your browser.' });
      return;
    }
    
    setIsScanning(true);
    setScanSuccess(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      const hints = new Map();
      const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      
      codeReaderRef.current = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 200, 
        delayBetweenScanSuccess: 1500,
      });

      codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current!, (result, error) => {
        if (result && !isFetching && !scanSuccess) {
          handleSuccessfulScan(result.getText());
        }
        if (error && !(error instanceof NotFoundException)) {
            console.error('Barcode scan error:', error);
        }
      });
    } catch (err: any) {
      console.error("Camera access error:", err);
      toast({ variant: 'destructive', title: 'Camera Permission Denied', description: 'Please allow camera access in your browser settings.' });
      setIsScanning(false);
    }
  }, [toast, stopScanner, handleSuccessfulScan, isScanning, isFetching, scanSuccess]);

  const handleScannerClick = () => {
    if (!isScanning) {
      startScanner();
    }
  };

  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <Card>
      <CardContent className="p-2 space-y-2">
         <div
            className={cn(
                'rounded-lg p-[2px] transition-all duration-300',
                isScanning && !scanSuccess && 'scanner-active',
                scanSuccess && 'scanner-success'
            )}
        >
            <div
            className={cn(
                'relative w-full h-24 bg-muted rounded-[calc(var(--radius)-2px)] overflow-hidden flex items-center justify-center transition-all duration-300 ease-in-out',
                !isScanning && 'cursor-pointer hover:bg-muted/80'
            )}
            onClick={handleScannerClick}
            >
                <video
                ref={videoRef}
                className={cn(
                    'absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500',
                    isScanning ? 'opacity-100' : 'opacity-0'
                )}
                />

                <div
                className={cn(
                    'absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground p-4 transition-opacity duration-500',
                    isScanning ? 'opacity-0' : 'opacity-100'
                )}
                >
                <Camera className="h-8 w-8 text-primary" />
                <span className="mt-2 text-sm font-medium">Tap to Scan</span>
                </div>

                {isFetching && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
                )}

                {isScanning && !isFetching && (
                <Button
                    onClick={(e) => {
                    e.stopPropagation();
                    stopScanner();
                    }}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-20"
                >
                    <X className="h-5 w-5" />
                </Button>
                )}
            </div>
        </div>
         <AlertDialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" className="w-full text-muted-foreground">
                    <Keyboard className="h-4 w-4 mr-2" />
                    Manual Barcode Entry
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Enter Barcode Manually</AlertDialogTitle>
                <AlertDialogDescription>
                    If the scanner isn't working, type the product's barcode number below.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                    placeholder="Enter barcode number..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleManualSubmit} disabled={!manualBarcode}>Add to Cart</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
