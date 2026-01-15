import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Extension OAuth callback page
 * Sends token to extension via postMessage
 */
const ExtensionCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const token = searchParams.get('token');

  useEffect(() => {
    const sendTokenToExtension = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        // Try to communicate with extension
        // The extension should be listening for this message
        window.postMessage(
          {
            type: 'CONTEXT_HUB_AUTH',
            token: token,
          },
          '*'
        );

        // Also store in localStorage as backup
        localStorage.setItem('token', token);
        localStorage.setItem('extensionAuthComplete', 'true');

        setStatus('success');
      } catch (error) {
        console.error('Error sending token to extension:', error);
        setStatus('error');
      }
    };

    sendTokenToExtension();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">Setting up your extension...</h2>
          <p className="text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't complete the setup. Please try logging in directly from the extension.
          </p>
          <Button onClick={() => window.close()}>Close This Tab</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md glass-card p-8 rounded-xl">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-3">All Set!</h2>
        <p className="text-muted-foreground mb-6">
          Your extension is now connected. You can close this tab and start using youtopical!
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => {
              // Try to close the tab
              window.close();
              // If that doesn't work (some browsers block it), show message
              setTimeout(() => {
                alert('You can now close this tab and use the extension!');
              }, 500);
            }}
            className="w-full"
          >
            Close This Tab
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            className="w-full"
          >
            Go to Web App
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2 text-sm">Next steps:</h3>
          <ol className="text-sm text-left space-y-1 text-muted-foreground">
            <li>1. Click the extension icon in your browser</li>
            <li>2. Start capturing content</li>
            <li>3. Organize into topics</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ExtensionCallback;
