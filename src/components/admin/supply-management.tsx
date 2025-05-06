import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// @ts-ignore - Workaround for TypeScript error with react-hook-form
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { myPtsHubApi } from '@/lib/api/mypts-api';
import { toast } from 'sonner';
import { MyPtsHubState } from '@/types/mypts';

interface SupplyManagementProps {
  hubState: MyPtsHubState;
  onSuccess?: () => void;
}

const issueSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  metadata: z.string().optional(),
});

const moveSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  metadata: z.string().optional(),
});

const maxSupplySchema = z.object({
  maxSupply: z.union([
    z.number().positive('Max supply must be positive'),
    z.literal(null)
  ]),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

const valueSchema = z.object({
  value: z.number().positive('Value must be positive'),
});

export function SupplyManagement({ hubState, onSuccess }: SupplyManagementProps) {
  const [activeTab, setActiveTab] = useState('issue');
  const [isLoading, setIsLoading] = useState(false);

  const issueForm = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      amount: 0,
      reason: '',
      metadata: '',
    },
  });

  const moveToCirculationForm = useForm<z.infer<typeof moveSchema>>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      amount: 0,
      reason: '',
      metadata: '',
    },
  });

  const moveToReserveForm = useForm<z.infer<typeof moveSchema>>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      amount: 0,
      reason: '',
      metadata: '',
    },
  });

  const maxSupplyForm = useForm<z.infer<typeof maxSupplySchema>>({
    resolver: zodResolver(maxSupplySchema),
    defaultValues: {
      maxSupply: hubState.maxSupply,
      reason: '',
    },
  });

  const valueForm = useForm<z.infer<typeof valueSchema>>({
    resolver: zodResolver(valueSchema),
    defaultValues: {
      value: hubState.valuePerMyPt,
    },
  });

  const handleIssue = async (values: z.infer<typeof issueSchema>) => {
    setIsLoading(true);
    try {
      let metadata = undefined;
      if (values.metadata) {
        try {
          metadata = JSON.parse(values.metadata);
        } catch (e) {
          metadata = { notes: values.metadata };
        }
      }

      const response = await myPtsHubApi.issueMyPts(values.amount, values.reason, metadata);

      if (response.success && response.data) {
        toast.success('Successfully issued MyPts', {
          description: `Issued ${values.amount.toLocaleString()} MyPts to the reserve.`,
        });
        issueForm.reset();
        if (onSuccess) onSuccess();
      } else {
        toast.error('Failed to issue MyPts', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error issuing MyPts:', error);
      toast.error('Failed to issue MyPts', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToCirculation = async (values: z.infer<typeof moveSchema>) => {
    if (values.amount > hubState.reserveSupply) {
      toast.error('Insufficient reserve supply', {
        description: `Only ${hubState.reserveSupply.toLocaleString()} MyPts available in reserve.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      let metadata = undefined;
      if (values.metadata) {
        try {
          metadata = JSON.parse(values.metadata);
        } catch (e) {
          metadata = { notes: values.metadata };
        }
      }

      const response = await myPtsHubApi.moveToCirculation(values.amount, values.reason, metadata);

      if (response.success && response.data) {
        toast.success('Successfully moved MyPts to circulation', {
          description: `Moved ${values.amount.toLocaleString()} MyPts from reserve to circulation.`,
        });
        moveToCirculationForm.reset();
        if (onSuccess) onSuccess();
      } else {
        toast.error('Failed to move MyPts to circulation', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error moving MyPts to circulation:', error);
      toast.error('Failed to move MyPts to circulation', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToReserve = async (values: z.infer<typeof moveSchema>) => {
    if (values.amount > hubState.circulatingSupply) {
      toast.error('Insufficient circulating supply', {
        description: `Only ${hubState.circulatingSupply.toLocaleString()} MyPts available in circulation.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      let metadata = undefined;
      if (values.metadata) {
        try {
          metadata = JSON.parse(values.metadata);
        } catch (e) {
          metadata = { notes: values.metadata };
        }
      }

      const response = await myPtsHubApi.moveToReserve(values.amount, values.reason, metadata);

      if (response.success && response.data) {
        toast.success('Successfully moved MyPts to reserve', {
          description: `Moved ${values.amount.toLocaleString()} MyPts from circulation to reserve.`,
        });
        moveToReserveForm.reset();
        if (onSuccess) onSuccess();
      } else {
        toast.error('Failed to move MyPts to reserve', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error moving MyPts to reserve:', error);
      toast.error('Failed to move MyPts to reserve', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustMaxSupply = async (values: z.infer<typeof maxSupplySchema>) => {
    if (values.maxSupply !== null && values.maxSupply < hubState.totalSupply) {
      toast.error('Invalid maximum supply', {
        description: `Maximum supply cannot be less than current total supply (${hubState.totalSupply.toLocaleString()}).`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await myPtsHubApi.adjustMaxSupply(values.maxSupply, values.reason);

      if (response.success && response.data) {
        toast.success('Successfully adjusted maximum supply', {
          description: values.maxSupply === null
            ? 'Removed maximum supply limit.'
            : `Set maximum supply to ${values.maxSupply.toLocaleString()} MyPts.`,
        });
        maxSupplyForm.reset({ maxSupply: values.maxSupply, reason: '' });
        if (onSuccess) onSuccess();
      } else {
        toast.error('Failed to adjust maximum supply', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error adjusting maximum supply:', error);
      toast.error('Failed to adjust maximum supply', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateValue = async (values: z.infer<typeof valueSchema>) => {
    setIsLoading(true);
    try {
      const response = await myPtsHubApi.updateValuePerMyPt(values.value);

      if (response.success && response.data) {
        toast.success('Successfully updated MyPts value', {
          description: `Set MyPts value to $${values.value.toFixed(6)}.`,
        });
        if (onSuccess) onSuccess();
      } else {
        toast.error('Failed to update MyPts value', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error updating MyPts value:', error);
      toast.error('Failed to update MyPts value', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply Management</CardTitle>
        <CardDescription>Manage the MyPts supply and value</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="issue">Issue</TabsTrigger>
            <TabsTrigger value="toCirculation">To Circulation</TabsTrigger>
            <TabsTrigger value="toReserve">To Reserve</TabsTrigger>
            <TabsTrigger value="maxSupply">Max Supply</TabsTrigger>
            <TabsTrigger value="value">Value</TabsTrigger>
          </TabsList>

          <TabsContent value="issue">
            <Form {...issueForm}>
              <form onSubmit={issueForm.handleSubmit(handleIssue)} className="space-y-4">
                <FormField
                  control={issueForm.control}
                  name="amount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Amount to Issue</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of new MyPts to create and add to holding
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={issueForm.control}
                  name="reason"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Reason for issuing MyPts" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a clear reason for this operation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={issueForm.control}
                  name="metadata"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional information or JSON metadata"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        JSON format preferred, but plain text is also accepted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current total supply:</span>
                    <span>{hubState.totalSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current holding :</span>
                    <span>{hubState.holdingSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2 mt-2">
                    <span>New total supply after issuance:</span>
                    <span>
                      {(hubState.totalSupply + (issueForm.watch('amount') || 0)).toLocaleString()} MyPts
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || issueForm.watch('amount') <= 0}>
                  {isLoading ? 'Processing...' : 'Issue MyPts'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="toCirculation">
            <Form {...moveToCirculationForm}>
              <form onSubmit={moveToCirculationForm.handleSubmit(handleMoveToCirculation)} className="space-y-4">
                <FormField
                  control={moveToCirculationForm.control}
                  name="amount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Amount to Move</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={hubState.holdingSupply}
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of MyPts to move from holding to circulation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={moveToCirculationForm.control}
                  name="reason"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Reason for moving MyPts from holding to circulation" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a clear reason for this operation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={moveToCirculationForm.control}
                  name="metadata"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional information or JSON metadata"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        JSON format preferred, but plain text is also accepted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current reserve :</span>
                    <span>{hubState.reserveSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current circulating:</span>
                    <span>{hubState.circulatingSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2 mt-2">
                    <span>New circulating :</span>
                    <span>
                      {(hubState.circulatingSupply + (moveToCirculationForm.watch('amount') || 0)).toLocaleString()} MyPts
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    moveToCirculationForm.watch('amount') <= 0 ||
                    moveToCirculationForm.watch('amount') > hubState.reserveSupply
                  }
                >
                  {isLoading ? 'Processing...' : 'Move to Circulation'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="toReserve">
            <Form {...moveToReserveForm}>
              <form onSubmit={moveToReserveForm.handleSubmit(handleMoveToReserve)} className="space-y-4">
                <FormField
                  control={moveToReserveForm.control}
                  name="amount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Amount to Move</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={hubState.circulatingSupply}
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of MyPts to move from circulation to reserve
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={moveToReserveForm.control}
                  name="reason"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Reason for moving MyPts to reserve" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a clear reason for this operation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={moveToReserveForm.control}
                  name="metadata"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional information or JSON metadata"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        JSON format preferred, but plain text is also accepted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current circulating supply:</span>
                    <span>{hubState.circulatingSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current reserve :</span>
                    <span>{hubState.reserveSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2 mt-2">
                    <span>New reserve :</span>
                    <span>
                      {(hubState.reserveSupply + (moveToReserveForm.watch('amount') || 0)).toLocaleString()} MyPts
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    moveToReserveForm.watch('amount') <= 0 ||
                    moveToReserveForm.watch('amount') > hubState.circulatingSupply
                  }
                >
                  {isLoading ? 'Processing...' : 'Move to Reserve'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="maxSupply">
            <Form {...maxSupplyForm}>
              <form onSubmit={maxSupplyForm.handleSubmit(handleAdjustMaxSupply)} className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="unlimited"
                    checked={maxSupplyForm.watch('maxSupply') === null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        maxSupplyForm.setValue('maxSupply', null);
                      } else {
                        maxSupplyForm.setValue('maxSupply', hubState.totalSupply);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="unlimited" className="text-sm font-medium">
                    Unlimited supply (no maximum)
                  </label>
                </div>

                {maxSupplyForm.watch('maxSupply') !== null && (
                  <FormField
                    control={maxSupplyForm.control}
                    name="maxSupply"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Maximum Supply</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={hubState.totalSupply}
                            placeholder="0"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of MyPts that can exist (must be at least {hubState.totalSupply.toLocaleString()})
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={maxSupplyForm.control}
                  name="reason"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Reason for adjusting maximum supply" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a clear reason for this operation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current total supply:</span>
                    <span>{hubState.totalSupply.toLocaleString()} MyPts</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current maximum supply:</span>
                    <span>{hubState.maxSupply === null ? 'Unlimited' : hubState.maxSupply.toLocaleString() + ' MyPts'}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2 mt-2">
                    <span>New maximum supply:</span>
                    <span>
                      {maxSupplyForm.watch('maxSupply') === null
                        ? 'Unlimited'
                        : (maxSupplyForm.watch('maxSupply') ?? 0).toLocaleString() + ' MyPts'}
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Adjust Maximum Supply'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="value">
            <Form {...valueForm}>
              <form onSubmit={valueForm.handleSubmit(handleUpdateValue)} className="space-y-4">
                <FormField
                  control={valueForm.control}
                  name="value"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Value per MyPt (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            min="0.000001"
                            step="0.000001"
                            className="pl-8"
                            placeholder="0.000000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Value of one MyPt in USD
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current value per MyPt:</span>
                    <span>${hubState.valuePerMyPt.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Current total value:</span>
                    <span>${(hubState.totalSupply * hubState.valuePerMyPt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2 mt-2">
                    <span>New total value:</span>
                    <span>
                      ${(hubState.totalSupply * (valueForm.watch('value') || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || valueForm.watch('value') <= 0}>
                  {isLoading ? 'Processing...' : 'Update Value'}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
