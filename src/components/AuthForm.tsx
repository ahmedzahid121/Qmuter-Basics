
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FirebaseEmailVerification } from "@/components/FirebaseEmailVerification";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/lib/countries";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Please enter your full name." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phoneNumber: z.string().min(9, { message: "Please enter a valid phone number." }),
  country: z.string({ required_error: "Please select a country." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type AuthFormProps = {
  mode: "login" | "signup";
};

type SignupStep = "form" | "verification";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [signupData, setSignupData] = useState<z.infer<typeof signupSchema> | null>(null);

  const formSchema = mode === 'login' ? loginSchema : signupSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === 'signup' && {
        fullName: "",
        phoneNumber: "",
        confirmPassword: "",
      })
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (mode === "login") {
        await signIn(values.email, values.password);
        router.push("/dashboard");
      } else {
        // For signup, create account and send verification email
        const signupValues = values as z.infer<typeof signupSchema>;
        setSignupData(signupValues);
        
        await signUp(signupValues);
        
        toast({
          title: "📧 Verification email sent!",
          description: "Please check your email and click the verification link.",
        });
        
        setSignupStep("verification");
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Email Already Registered",
          description: "This email is already in use. Please try logging in instead.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleVerificationComplete = async () => {
    if (!signupData) return;
    
    toast({
      title: "✅ Account created successfully!",
      description: "Your email has been verified. Let's set up your profile.",
    });
    
    router.push("/onboarding");
  };

  const handleBackToSignup = () => {
    setSignupStep("form");
    setSignupData(null);
  };
  
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "This email is registered with a different sign-in method. Please use that method to log in.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: error instanceof Error ? error.message : "Could not sign in with Google.",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setIsAppleLoading(true);
    try {
      await signInWithApple();
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "This email is registered with a different sign-in method. Please use that method to log in.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Apple Sign-In Failed",
          description: error instanceof Error ? error.message : "Could not sign in with Apple.",
        });
      }
    } finally {
      setIsAppleLoading(false);
    }
  }

  const anyLoading = isLoading || isGoogleLoading || isAppleLoading;

  // Show verification step for signup
  if (mode === "signup" && signupStep === "verification" && signupData) {
    return (
      <FirebaseEmailVerification
        email={signupData.email}
        onVerificationComplete={handleVerificationComplete}
        onBack={handleBackToSignup}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome Back!" : "Create an Account"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to find your ride."
            : "Join Qmuter to start sharing commutes."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} disabled={anyLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} disabled={anyLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === 'signup' && (
              <>
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} disabled={anyLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={anyLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.name}>{country.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={anyLoading}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {mode === 'signup' && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={anyLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full" disabled={anyLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Log In" : "Create Account"}
            </Button>
          </form>
        </Form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={anyLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 74.7C309 98.2 281.7 88 248 88c-73.2 0-133.1 59.9-133.1 133.1s59.9 133.1 133.1 133.1c76.9 0 115.7-52.6 124.1-82.6H248v-96.9h239.9c5.1 28.5 8.1 58.9 8.1 92.9z"></path></svg>}
            Google
          </Button>
          <Button variant="outline" className="w-full" onClick={handleAppleSignIn} disabled={anyLoading}>
            {isAppleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.486 16.142c-.833.485-1.623.885-2.522.885-.883 0-1.55-.382-2.316-.948-.68-.517-1.338-1.282-1.956-2.037-.533-.648-.962-1.29-1.464-1.821-.527-.555-1.123-1.049-1.764-1.393-.56-.307-1.08-.433-1.74-.433-.823 0-1.55.3-2.203.9-.64.587-1.012 1.345-1.012 2.195 0 1.05.485 2.012 1.18 2.722.713.72 1.513 1.25 2.454 1.638.94.388 1.91.565 2.92.565.87 0 1.74-.194 2.51-.555.787-.372 1.58-1.035 2.22-1.68s.99-1.493 1.08-2.378c.01-.138.015-.28.015-.42h-3.36v.002zm1.04-10.45s-.433-.99-1.24-1.75c-.837-.784-1.833-1.23-2.91-1.23-1.31 0-2.47.53-3.44 1.52-.77.77-1.34 1.75-1.77 2.8-.42.98-.67 2.05-.67 3.15 0 1.27.31 2.46.88 3.44.51.87 1.25 1.63 2.15 2.17.1-.03.18-.06.27-.1.88-.33 1.66-.9 2.4-1.63.69-.67 1.25-1.53 1.63-2.56.09-.23.15-.48.19-.71h3.42c0 1.68-.53 3.19-1.43 4.41-.93 1.23-2.17 2.07-3.58 2.37-1.32.28-2.73.04-4.04-.63-1.33-.68-2.39-1.69-3.04-2.88-.64-1.18-.94-2.52-.94-3.92s.3-2.74.94-3.92c.65-1.19 1.71-2.2 3.04-2.88 1.31-.67 2.72-.91 4.04-.64 1.41.3 2.65 1.14 3.58 2.37.45.62.8 1.37 1.02 2.21z"/></svg>}
            Apple
          </Button>
        </div>
      </CardContent>
      <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <Button variant="link" className="px-1" onClick={() => router.push(mode === 'login' ? '/signup' : '/login')}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </Button>
          </p>
      </CardFooter>
    </Card>
  );
}
