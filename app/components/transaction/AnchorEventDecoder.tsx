'use client';

import React from 'react';

interface AnchorEventDecoderProps {
    logs: string[];
    programId?: string;
}

export function AnchorEventDecoder({ logs, programId }: AnchorEventDecoderProps) {
    const [decodedEvents, setDecodedEvents] = React.useState<any[]>([]);

    React.useEffect(() => {
        // Extract Anchor events from logs
        const events: any[] = [];
        let currentEvent: any = null;

        logs.forEach((log, idx) => {
            // Anchor events typically have "Program log: " prefix
            if (log.includes('Program log:')) {
                const logContent = log.replace('Program log:', '').trim();

                // Check if it's an event emission
                if (logContent.startsWith('Instruction:')) {
                    const instruction = logContent.replace('Instruction:', '').trim();
                    events.push({
                        data: instruction,
                        index: idx,
                        type: 'instruction',
                    });
                } else if (logContent.startsWith('Event:')) {
                    // Anchor event
                    const eventData = logContent.replace('Event:', '').trim();
                    try {
                        const parsed = JSON.parse(eventData);
                        events.push({
                            data: parsed,
                            index: idx,
                            type: 'event',
                        });
                    } catch {
                        events.push({
                            data: eventData,
                            index: idx,
                            type: 'event',
                        });
                    }
                } else if (logContent.includes('Trade') || logContent.includes('Energy')) {
                    // Custom energy trading events
                    events.push({
                        data: logContent,
                        index: idx,
                        type: 'custom',
                    });
                }
            } else if (log.includes('Program data:')) {
                // Could be base64 encoded event data
                const data = log.replace('Program data:', '').trim();
                events.push({
                    data,
                    index: idx,
                    type: 'data',
                });
            }
        });

        setDecodedEvents(events);
    }, [logs]);

    if (decodedEvents.length === 0) {
        return null;
    }

    return (
        <div className="mb-4">
            <h5 className="border-bottom pb-2">Decoded Events & Instructions ({decodedEvents.length})</h5>
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
                <strong>Energy Trading Events:</strong> Monitor your platform's energy trades, settlements, and user
                actions
            </div>

            {decodedEvents.map((event, idx) => (
                <div key={idx} className="card mb-2">
                    <div className="p-6">
                        <div className="mb-2 flex items-start justify-between">
                            <div>
                                {event.type === 'instruction' && (
                                    <span className="mr-2 inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                        Instruction
                                    </span>
                                )}
                                {event.type === 'event' && (
                                    <span className="mr-2 inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                                        Event
                                    </span>
                                )}
                                {event.type === 'custom' && (
                                    <span className="mr-2 inline-flex items-center rounded-full bg-yellow-600 px-2 py-0.5 text-xs font-medium text-white">
                                        Custom Log
                                    </span>
                                )}
                                {event.type === 'data' && (
                                    <span className="mr-2 inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                                        Data
                                    </span>
                                )}
                                <small className="text-muted-foreground">Log #{event.index}</small>
                            </div>
                        </div>

                        {typeof event.data === 'object' ? (
                            <pre className="bg-light mb-0 rounded p-2">{JSON.stringify(event.data, null, 2)}</pre>
                        ) : (
                            <div className="small font-mono">
                                <code>{event.data}</code>
                            </div>
                        )}

                        {/* Energy Trading Specific Interpretation */}
                        {(event.data.toString().toLowerCase().includes('energy') ||
                            event.data.toString().toLowerCase().includes('trade') ||
                            event.data.toString().toLowerCase().includes('kwh') ||
                            event.data.toString().toLowerCase().includes('seller') ||
                            event.data.toString().toLowerCase().includes('buyer')) && (
                            <div className="mt-2 mb-0 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                                <small>
                                    <strong>Energy Trading Event Detected!</strong> This log likely represents a trade,
                                    settlement, or platform action in your P2P energy marketplace.
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800">
                <h6 className="alert-heading">Tips for Energy Trading Developers:</h6>
                <ul className="small mb-0">
                    <li>
                        Use <code>msg!</code> macro in Rust to emit custom logs
                    </li>
                    <li>
                        Emit events with <code>#[event]</code> attribute for structured data
                    </li>
                    <li>Include trade details: buyer, seller, amount, price, timestamp</li>
                    <li>Log settlement confirmations and escrow releases</li>
                    <li>Track energy meter readings and verification events</li>
                </ul>
            </div>
        </div>
    );
}
