'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function DirectApiTest() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const testDirectApi = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('===== DIRECT API TEST =====');
      console.log('Session:', JSON.stringify(session, null, 2));
      
      // Make a direct fetch request to the API
      const response = await fetch(`${API_URL}/profiles/user-profiles`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header if we have a token
          ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
        }
      });
      
      console.log('Direct API response status:', response.status);
      console.log('Direct API response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
      
      const data = await response.json();
      console.log('Direct API response data:', JSON.stringify(data, null, 2));
      
      setApiResponse(data);
      
      if (response.ok && data.success) {
        toast.success('API test successful');
      } else {
        setError(data.message || 'API test failed');
        toast.error('API test failed');
      }
    } catch (error) {
      console.error('Error in direct API test:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setApiResponse(null);
      toast.error('API test failed');
    } finally {
      setIsLoading(false);
      console.log('===== END DIRECT API TEST =====');
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Direct API Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testDirectApi}
          disabled={isLoading}
          className="w-full mb-4"
        >
          {isLoading ? 'Testing...' : 'Test API Directly'}
        </Button>
        
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}
        
        {apiResponse && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">API Response:</h4>
            <pre className="text-xs overflow-auto bg-muted p-2 rounded-md max-h-40">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
