import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { Button } from '@/app/(shared)/components/ui/button';
import { Separator } from '@/app/(shared)/components/ui/separator';

export function ErrorCard({
  retry,
  retryText,
  text,
  subtext,
}: {
  retry?: () => void;
  retryText?: string;
  text: string;
  subtext?: string;
}) {
  const buttonText = retryText || 'Try Again';
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className="text-foreground">{text}</p>
        {retry && (
          <>
            <Button variant="outline" className="mt-3 ml-3 hidden md:inline-flex" onClick={retry}>
              {buttonText}
            </Button>
            <div className="mt-4 block md:hidden">
              <Button variant="outline" className="w-full" onClick={retry}>
                {buttonText}
              </Button>
            </div>
            {subtext && (
              <div className="text-muted-foreground mt-4">
                <Separator className="my-2" />
                <p className="text-sm">{subtext}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
