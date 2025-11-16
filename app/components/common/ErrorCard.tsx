import React from 'react';
import { Card, CardContent } from '@components/shared/ui/card';
import { Button } from '@components/shared/ui/button';
import { Separator } from '@components/shared/ui/separator';

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
                        <Button 
                            variant="outline"
                            className="ml-3 mt-3 hidden md:inline-flex"
                            onClick={retry}
                        >
                            {buttonText}
                        </Button>
                        <div className="block md:hidden mt-4">
                            <Button 
                                variant="outline"
                                className="w-full"
                                onClick={retry}
                            >
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
