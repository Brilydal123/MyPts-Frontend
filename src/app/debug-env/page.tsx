"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Collect all NEXT_PUBLIC_ environment variables
    const publicEnvVars: Record<string, string> = {};
    
    // Add specific environment variables we're interested in
    publicEnvVars['NEXT_PUBLIC_API_URL'] = process.env.NEXT_PUBLIC_API_URL || 'Not set';
    publicEnvVars['NEXT_PUBLIC_FRONTEND_URL'] = process.env.NEXT_PUBLIC_FRONTEND_URL || 'Not set';
    publicEnvVars['API_URL from constants'] = require('@/lib/constants').API_URL;
    publicEnvVars['window.location.origin'] = typeof window !== 'undefined' ? window.location.origin : 'Not available (SSR)';
    publicEnvVars['window.location.href'] = typeof window !== 'undefined' ? window.location.href : 'Not available (SSR)';
    
    // Get all NEXT_PUBLIC_ environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicEnvVars[key] = process.env[key] || 'Not set';
      }
    });
    
    setEnvVars(publicEnvVars);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Public Environment Variables</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variable
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(envVars).map(([key, value]) => (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
