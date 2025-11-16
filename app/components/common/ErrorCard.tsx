import React from 'react';

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
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 text-center">
                {text}
                {retry && (
                    <>
                        <button 
                            className="ml-3 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hidden md:inline-block"
                            onClick={retry}
                        >
                            {buttonText}
                        </button>
                        <div className="block md:hidden mt-4">
                            <button 
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={retry}
                            >
                                {buttonText}
                            </button>
                        </div>
                        {subtext && (
                            <div className="text-gray-500 mt-4">
                                <hr className="my-2 border-gray-300" />
                                {subtext}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
