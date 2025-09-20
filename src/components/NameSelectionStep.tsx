"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Sparkles } from 'lucide-react';

const nameSchema = z.object({
  displayName: z.string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(30, { message: "Name must be less than 30 characters." })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes." })
});

interface NameSelectionStepProps {
  onNext: (displayName: string) => void;
  currentName?: string;
}

export function NameSelectionStep({ onNext, currentName }: NameSelectionStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState([
    "Alex",
    "Jordan", 
    "Sam",
    "Casey",
    "Riley",
    "Taylor",
    "Morgan",
    "Quinn"
  ]);

  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      displayName: currentName || ""
    }
  });

  const onSubmit = async (values: z.infer<typeof nameSchema>) => {
    setIsLoading(true);
    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onNext(values.displayName.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('displayName', suggestion);
    form.trigger('displayName');
  };

  return (
    <div className="p-6 text-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ delay: 0.2, type: 'spring' }}
        className="mb-6"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
      </motion.div>
      
      <h2 className="text-2xl font-bold mb-2">What should we call you?</h2>
      <p className="text-muted-foreground mb-6">
        Choose a name that will appear to other users. You can always change this later.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-left block mb-2">Display Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your preferred name"
                    className="text-center text-lg font-medium"
                    {...field}
                    disabled={isLoading}
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Or choose from our suggestions:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="text-sm"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !form.watch('displayName')?.trim()}
          >
            {isLoading ? "Setting up..." : "Continue"}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-xs text-muted-foreground">
        <p>This name will be visible to other users in the app.</p>
      </div>
    </div>
  );
} 