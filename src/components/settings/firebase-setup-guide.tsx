import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';

export function FirebaseSetupGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <InfoIcon className="h-4 w-4 mr-2" />
          Firebase Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Firebase Setup Guide for Push Notifications</DialogTitle>
          <DialogDescription>
            Follow these steps to set up Firebase Cloud Messaging for push notifications
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <h3 className="text-lg font-medium">1. Create a Firebase Project</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a> and create a new project or use an existing one.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">2. Generate a Service Account Key</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground mt-1 space-y-2">
              <li>In the Firebase Console, go to Project Settings (gear icon)</li>
              <li>Select the "Service accounts" tab</li>
              <li>Click "Generate new private key" button</li>
              <li>Save the JSON file securely</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">3. Configure Backend Environment Variables</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add one of the following to your backend .env file:
            </p>
            <div className="bg-muted p-3 rounded-md mt-2 font-mono text-xs">
              <p># Option 1: Path to the service account file</p>
              <p>FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json</p>
              <p className="mt-2"># Option 2: Service account JSON as string</p>
              <p>FIREBASE_SERVICE_ACCOUNT_JSON=&#123;"type":"service_account","project_id":"...",...&#125;</p>
              <p className="mt-2"># Option 3: Individual credentials</p>
              <p>FIREBASE_PROJECT_ID=your-project-id</p>
              <p>FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com</p>
              <p>FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----\\n"</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">4. Restart Your Backend Server</h3>
            <p className="text-sm text-muted-foreground mt-1">
              After adding the environment variables, restart your backend server to apply the changes.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">5. Test Push Notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Once configured, you should be able to send test push notifications from the dashboard.
            </p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800">
            <h3 className="text-amber-800 dark:text-amber-300 font-medium">Note</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Until the backend is configured with Firebase credentials, the "Test" button will show local browser notifications instead of actual push notifications.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
