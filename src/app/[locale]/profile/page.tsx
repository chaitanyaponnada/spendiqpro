

'use client';

import * as React from 'react';
import { Link } from '@/lib/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import AuthWrapper from '@/components/auth/AuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const profileSchema = z.object({
  displayName: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username cannot exceed 30 characters'),
  birthDate: z.date().optional(),
  photoFile: z.instanceof(File).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      birthDate: user?.birthDate ? new Date(user.birthDate) : undefined,
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        birthDate: user.birthDate ? new Date(user.birthDate) : undefined,
      });
      setPreviewImage(user.photoURL || null);
    }
  }, [user, form]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('photoFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user || !auth.currentUser) return;
    setIsLoading(true);

    try {
      let photoURL = user.photoURL;

      // 1. Upload new image if one was selected
      if (values.photoFile) {
        const filePath = `profile-pics/${user.uid}/${values.photoFile.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, values.photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      // 2. Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: values.displayName,
        photoURL: photoURL,
      });

      // 3. Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      const userDataToUpdate: any = {
        displayName: values.displayName,
        photoURL: photoURL,
      };
      if (values.birthDate) {
        userDataToUpdate.birthDate = values.birthDate.toISOString();
      }

      await setDoc(userDocRef, userDataToUpdate, { merge: true });
      
      // 4. Refetch user data to update UI across the app
      await refetchUser();

      toast({
        title: 'Profile Updated!',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    // Handle phone numbers by taking the last two digits
    if (name.startsWith('+')) {
      return name.slice(-2);
    }
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
            <h1 className="text-2xl font-bold text-center flex-grow">Edit Profile</h1>
        </div>
        <Card>
          <CardHeader>
            <CardDescription>Update your account details below.</CardDescription>
          </CardHeader>
          <CardContent>
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="photoFile"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                       <FormLabel>Profile Picture</FormLabel>
                       <FormControl>
                          <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={previewImage || undefined} alt={user?.displayName || 'User'}/>
                                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                            </Avatar>
                             <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                id="photo-upload"
                                disabled={isLoading}
                              />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                <Upload className="mr-2 h-4 w-4" /> Change Picture
                            </Button>
                          </div>
                       </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                 />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your new username" {...field} disabled={isLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date of birth</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                disabled={isLoading}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormDescription>
                            Your date of birth is used to personalize your experience.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <p className="text-sm text-muted-foreground">Email: {user?.email || "Not provided"}</p>
                <p className="text-sm text-muted-foreground">Phone: {user?.phoneNumber || "Not provided"}</p>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WrappedProfilePage() {
    return (
        <AuthWrapper>
            <ProfilePage />
        </AuthWrapper>
    )
}
