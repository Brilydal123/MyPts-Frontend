import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { myPtsApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';
import { MyPtsBalance } from '@/types/mypts';
import { Search } from 'lucide-react';

const formSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  toProfileId: z.string().min(1, 'Recipient profile is required'),
  message: z.string().optional(),
});

interface DonateFormProps {
  balance: MyPtsBalance;
  onSuccess?: () => void;
}

// Mock profile search results - replace with actual API call
const mockProfiles = [
  { id: 'profile1', name: 'John Doe', avatar: '/avatars/01.png' },
  { id: 'profile2', name: 'Jane Smith', avatar: '/avatars/02.png' },
  { id: 'profile3', name: 'Bob Johnson', avatar: '/avatars/03.png' },
];

export function DonateForm({ balance, onSuccess }: DonateFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      toProfileId: '',
      message: '',
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      // Mock search - replace with actual API call
      const results = mockProfiles.filter(profile => 
        profile.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const selectProfile = (profile: any) => {
    setSelectedProfile(profile);
    form.setValue('toProfileId', profile.id);
    setSearchResults([]);
    setSearchQuery('');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.amount > balance.balance) {
      toast.error('Insufficient balance', {
        description: `You only have ${balance.balance.toLocaleString()} MyPts available.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await myPtsApi.donateMyPts(values.amount, values.toProfileId, values.message);
      
      if (response.success && response.data) {
        toast.success('Successfully donated MyPts!', {
          description: `You donated ${values.amount.toLocaleString()} MyPts to ${selectedProfile?.name || 'the recipient'}.`,
        });
        form.reset();
        setSelectedProfile(null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to donate MyPts', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error donating MyPts:', error);
      toast.error('Failed to donate MyPts', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donate MyPts</CardTitle>
        <CardDescription>Send MyPts to another profile</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Recipient</FormLabel>
                {selectedProfile ? (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {selectedProfile.avatar ? (
                          <img src={selectedProfile.avatar} alt={selectedProfile.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-semibold">{selectedProfile.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{selectedProfile.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {selectedProfile.id}</p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedProfile(null);
                        form.setValue('toProfileId', '');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for a profile"
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full max-w-md bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                        {searchResults.map((profile) => (
                          <div
                            key={profile.id}
                            className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer"
                            onClick={() => selectProfile(profile)}
                          >
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-semibold">{profile.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{profile.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {profile.id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.formState.errors.toProfileId && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.toProfileId.message}
                      </p>
                    )}
                  </div>
                )}
                <FormDescription>
                  Search for a profile to donate MyPts to
                </FormDescription>
              </div>
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={balance.balance}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Available balance: {balance.balance.toLocaleString()} MyPts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a message to your donation"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add a personal message to the recipient
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Recipient:</span>
                <span>{selectedProfile?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Amount:</span>
                <span>{form.watch('amount') || 0} MyPts</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>Value:</span>
                <span>{balance.value.symbol}{(form.watch('amount') || 0) * balance.value.valuePerMyPt}</span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !form.watch('toProfileId') || form.watch('amount') <= 0}
            >
              {isLoading ? 'Processing...' : 'Donate MyPts'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
