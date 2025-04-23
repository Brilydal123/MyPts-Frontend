'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { profileApi } from '@/lib/api/profile-api';
import { userApi } from '@/lib/api/user-api';
import { toast } from 'sonner';

export function ApiDebug() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  if (!session) {
    return null;
  }

  const testGetProfiles = async () => {
    setIsLoading(true);
    try {
      console.log('===== API DEBUG TEST =====');
      console.log('Session in API Debug:', JSON.stringify(session, null, 2));

      const response = await profileApi.getUserProfiles();
      console.log('API Debug response:', JSON.stringify(response, null, 2));
      setApiResponse(response);

      if (response.success) {
        toast.success('Profiles fetched successfully');
        console.log('Profiles data:', response.data);
      } else {
        toast.error('Failed to fetch profiles');
        console.error('Error message:', response.message);
      }
      console.log('===== END API DEBUG TEST =====');
    } catch (error) {
      console.error('Error testing API:', error);
      setApiResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('API test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2"
      >
        {isVisible ? 'Hide' : 'Show'} API Debug
      </Button>

      {isVisible && (
        <Card className="w-96 max-h-96 overflow-auto bg-background/95 backdrop-blur">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">API Debug Tools</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <Button
                size="sm"
                onClick={testGetProfiles}
                disabled={isLoading}
                className="w-full mb-2"
              >
                {isLoading ? 'Testing...' : 'Test Get Profiles API'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    console.log('===== DIRECT API TEST =====');
                    // Make a direct fetch request to the API
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                    const response = await fetch(`${API_URL}/profiles/user-profiles`, {
                      headers: {
                        'Authorization': `Bearer ${session?.accessToken || ''}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    console.log('Direct API response status:', response.status);
                    console.log('Direct API response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));

                    const data = await response.json();
                    console.log('Direct API response data:', JSON.stringify(data, null, 2));
                    console.log('===== END DIRECT API TEST =====');

                    setApiResponse({
                      success: response.ok,
                      data: data,
                      directTest: true
                    });

                    if (response.ok) {
                      toast.success('Direct API test successful');
                    } else {
                      toast.error('Direct API test failed');
                    }
                  } catch (error) {
                    console.error('Error in direct API test:', error);
                    setApiResponse({ error: error instanceof Error ? error.message : 'Unknown error', directTest: true });
                    toast.error('Direct API test failed');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {isLoading ? 'Testing...' : 'Direct API Test'}
              </Button>
            </div>

            {apiResponse && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">API Response:</h4>
                <pre className="text-xs overflow-auto bg-muted p-2 rounded-md max-h-40">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Session Info:</h4>
              <pre className="text-xs overflow-auto bg-muted p-2 rounded-md max-h-40">
                {JSON.stringify({
                  accessToken: session.accessToken ? 'Present' : 'Missing',
                  profileToken: session.profileToken ? 'Present' : 'Missing',
                  profileId: session.profileId,
                  userId: session.user?.id
                }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
