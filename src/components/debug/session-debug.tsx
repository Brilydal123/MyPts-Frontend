'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SessionDebug() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2"
      >
        {isVisible ? 'Hide' : 'Show'} Session Debug
      </Button>

      {isVisible && (
        <Card className="w-96 max-h-96 overflow-auto bg-background/95 backdrop-blur">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Session Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
