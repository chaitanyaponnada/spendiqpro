
'use client';

import * as React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface VoiceInputProps {
  onItemAdded: (item: string) => void;
}

// Declare the SpeechRecognition types for browsers that support it
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceInput({ onItemAdded }: VoiceInputProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  const stopListening = React.useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onItemAdded(transcript);
        stopListening();
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Microphone access is required for voice input.'})
        } else {
            toast({ variant: 'destructive', title: 'Voice Error', description: 'Something went wrong with speech recognition.' });
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;

    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onItemAdded, toast, stopListening]);
  
  const startListening = () => {
    if (isListening || !recognitionRef.current) return;
    try {
        recognitionRef.current.start();
        setIsListening(true);
    } catch(e) {
        console.error("Could not start recognition service: ", e);
        toast({ variant: 'destructive', title: 'Voice Error', description: 'Could not start the voice recognition service.' });
        setIsListening(false);
    }
  }
  
  const handleOpenChange = (open: boolean) => {
      if(open) {
          startListening();
      } else {
          stopListening();
      }
  }

  if (!isSupported) {
    return (
        <Button variant="outline" size="icon" disabled title="Voice recognition is not supported in your browser.">
            <MicOff />
        </Button>
    );
  }

  return (
    <Dialog open={isListening} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="icon" onClick={startListening} title="Add item by voice">
        <Mic />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Listening...</DialogTitle>
          <DialogDescription className="text-center">Say the item you want to add to your list.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center h-32">
            <div className="relative h-24 w-24">
                <div className="absolute inset-0 bg-primary rounded-full animate-ping"></div>
                <div className="relative flex items-center justify-center h-full w-full bg-primary rounded-full">
                    <Mic className="h-12 w-12 text-primary-foreground" />
                </div>
            </div>
        </div>
        <Button onClick={stopListening} variant="destructive">
            <Square className="mr-2 h-4 w-4"/>
            Stop Listening
        </Button>
      </DialogContent>
    </Dialog>
  );
}
