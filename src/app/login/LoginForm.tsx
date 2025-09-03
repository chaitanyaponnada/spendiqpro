
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import SpendIQLogo from '@/components/SpendIQLogo';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emailLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const phoneLoginSchema = z.object({
    countryCode: z.string().min(1, 'Country code is required'),
    nationalPhone: z.string().min(1, 'Phone number is required'),
    otp: z.string().optional(),
})

const countryCodes = [
    { name: 'India', code: '+91' },
    { name: 'USA', code: '+1' },
    { name: 'UK', code: '+44' },
];

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M21.35 11.1h-9.35v2.8h5.3c-.5 2.1-2.3 3.4-4.5 3.4-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9c1.2 0 2.3.5 3.1 1.2l2.2-2.2C17.2 4.6 15 3.5 12 3.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5c4.7 0 8.5-3.8 8.5-8.5 0-.7-.1-1.4-.2-2z"/>
    </svg>
)

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('customer');

  const [phoneLoading, setPhoneLoading] = React.useState(false);
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);
  const cooldownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  React.useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);
  
  React.useEffect(() => {
    if (resendCooldown > 0) {
        cooldownIntervalRef.current = setInterval(() => {
            setResendCooldown(prev => prev - 1);
        }, 1000);
    } else {
        if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
        }
    }
    return () => {
        if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
        }
    }
  }, [resendCooldown]);


  const emailForm = useForm<z.infer<typeof emailLoginSchema>>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const phoneForm = useForm<z.infer<typeof phoneLoginSchema>>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { countryCode: '+91', nationalPhone: '', otp: '' },
  });


  const onEmailSubmit = async (values: z.infer<typeof emailLoginSchema>) => {
    setIsLoading(true);
    const roleToLoginAs = activeTab === 'store-owner' ? 'store-owner' : 'customer';

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === roleToLoginAs) {
          toast({ title: 'Login Successful!', description: 'Welcome back!' });
          router.push(roleToLoginAs === 'store-owner' ? '/admin/dashboard' : '/');
        } else {
          await auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: `Your account is not registered as a ${roleToLoginAs}. Please use the correct tab.`,
            duration: 7000,
          });
        }
      } else {
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'User data not found. Please contact support.',
        });
      }
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.code === 'auth/invalid-credential' ? 'Incorrect email or password. Please try again.' : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (values: z.infer<typeof phoneLoginSchema>) => {
    setPhoneLoading(true);
    try {
        const phoneNumber = `${values.countryCode}${values.nationalPhone}`;
        
        // Initialize reCAPTCHA only when sending OTP
        if (!recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response: any) => {},
                'expired-callback': () => {}
            });
        }
        
        const recaptchaVerifier = recaptchaVerifierRef.current;
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setResendCooldown(30); // Start 30-second cooldown
        toast({ title: "OTP Sent!", description: `A verification code has been sent to ${phoneNumber}.` });
    } catch(err: any) {
        console.error("Phone auth error", err);
        let description = 'Could not send OTP. Please check the phone number or try again.';
        if (err.code === 'auth/too-many-requests') {
            description = 'Too many requests. Please wait a while before trying again.';
        } else if (err.code === 'auth/billing-not-enabled') {
            description = 'Phone sign-in is not enabled for this project. Please contact the administrator.';
        } else if (err.code === 'auth/invalid-phone-number') {
            description = 'The phone number you entered is not valid. Please check and try again.';
        } else if (err.code === 'auth/internal-error') {
            description = 'An internal auth error occurred. Please ensure your project is configured correctly for reCAPTCHA.';
        }
        toast({ variant: 'destructive', title: 'Failed to Send OTP', description, duration: 9000 });
    } finally {
        setPhoneLoading(false);
    }
  }

  const handleVerifyOtp = async (values: z.infer<typeof phoneLoginSchema>) => {
    if (!confirmationResult || !values.otp) return;
    setPhoneLoading(true);
    try {
        const userCredential = await confirmationResult.confirm(values.otp);
        const user = userCredential.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data()?.role === 'store-owner') {
             await auth.signOut();
             toast({
                variant: 'destructive',
                title: 'Login Method Incorrect',
                description: 'Store owners must log in with their email and password.',
                duration: 7000,
            });
            setOtpSent(false);
            setConfirmationResult(null);
        } else if (userDoc.exists()) {
             toast({ title: "Login Successful!", description: "Welcome back!"});
             router.push('/');
        } else {
            await setDoc(userDocRef, {
                uid: user.uid,
                displayName: user.phoneNumber,
                email: null,
                phoneNumber: user.phoneNumber,
                role: 'customer',
            });
            toast({ title: "Account Created!", description: "Welcome to SpendWise!"});
            router.push('/');
        }

    } catch(err: any) {
        console.error("OTP verification error", err);
        const description = err.code === 'auth/invalid-verification-code' 
            ? 'The code you entered is incorrect. Please try again.'
            : 'Failed to verify OTP. Please try again later.';
        toast({ variant: 'destructive', title: 'Invalid OTP', description });
    } finally {
        setPhoneLoading(false);
    }
  }


   const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'store-owner') {
                 await auth.signOut();
                 toast({
                    variant: 'destructive',
                    title: 'Login Method Incorrect',
                    description: 'Store owners must use email/password to log in.',
                    duration: 7000
                 });
            } else {
                toast({ title: 'Login Successful!', description: `Welcome back, ${user.displayName || 'user'}!` });
                router.push('/');
            }
        } else {
            await setDoc(userDocRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: 'customer',
            });
            toast({ title: 'Sign Up Successful!', description: `Welcome, ${user.displayName || 'user'}!` });
            router.push('/');
        }
    } catch(error: any) {
        console.error("Google Sign-In Error:", error);
        toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: error.message || 'An unexpected error occurred.'
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const currentLoading = isLoading || isGoogleLoading || phoneLoading;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <SpendIQLogo />
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome</CardTitle>
          <CardDescription>
            Sign in or create an account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="store-owner">Store Owner</TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="mt-6 space-y-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={currentLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 animate-spin"/> : <GoogleIcon />}
                    Continue with Google
                </Button>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                </div>

                {!otpSent ? (
                    <Form {...phoneForm}>
                        <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                            <FormField
                                control={phoneForm.control}
                                name="nationalPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Continue with Phone</FormLabel>
                                        <div className="flex gap-2">
                                            <FormField
                                                control={phoneForm.control}
                                                name="countryCode"
                                                render={({ field: selectField }) => (
                                                    <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-[100px]">
                                                                <SelectValue placeholder="Code" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {countryCodes.map(c => (
                                                                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            <FormControl>
                                                <Input placeholder="98765 43210" {...field} disabled={currentLoading} />
                                            </FormControl>
                                        </div>
                                        <FormMessage>{phoneForm.formState.errors.nationalPhone?.message || phoneForm.formState.errors.countryCode?.message}</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={currentLoading}>
                                {phoneLoading && <Loader2 className="mr-2 animate-spin" />}
                                Send OTP
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <Form {...phoneForm}>
                         <form onSubmit={phoneForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                             <p className="text-sm text-center text-muted-foreground">
                                Enter the 6-digit code sent to {' '}
                                <span className="font-semibold text-foreground">
                                {phoneForm.getValues('countryCode')}{phoneForm.getValues('nationalPhone')}
                                </span>.
                            </p>
                             <FormField
                                control={phoneForm.control}
                                name="otp"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Enter OTP</FormLabel>
                                    <FormControl>
                                    <Input placeholder="123456" {...field} disabled={currentLoading} autoFocus/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={currentLoading}>
                                {phoneLoading && <Loader2 className="mr-2 animate-spin" />}
                                Verify & Continue
                            </Button>
                            <div className="flex justify-between items-center text-sm">
                                <Button variant="link" size="sm" onClick={() => setOtpSent(false)} disabled={currentLoading}>
                                    Wrong number?
                                </Button>
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleSendOtp(phoneForm.getValues())}
                                    disabled={resendCooldown > 0 || currentLoading}
                                >
                                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                                </Button>
                            </div>
                         </form>
                    </Form>
                )}

                 <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                 </div>

                 <details>
                    <summary className="text-sm text-center cursor-pointer text-muted-foreground hover:text-foreground">
                        Continue with Email
                    </summary>
                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input placeholder="name@example.com" {...field} disabled={currentLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={emailForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} disabled={currentLoading}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={currentLoading}>
                            {isLoading && <Loader2 className="mr-2 animate-spin" />}
                            Sign In
                        </Button>
                        </form>
                    </Form>
                 </details>
            </TabsContent>
            

            <TabsContent value="store-owner" className="mt-6">
               <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@store.com" {...field} disabled={currentLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={currentLoading}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={currentLoading}>
                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                    Login as Store Owner
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to SpendIQ?{' '}
            <a href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

    