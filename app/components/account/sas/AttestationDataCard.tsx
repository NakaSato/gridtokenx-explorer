import { Account, useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import { Card, CardHeader, CardContent, CardTitle } from '@components/shared/ui/card';
import React from 'react';
import {
    Attestation as SasAttestation,
    convertSasSchemaToBorshSchema,
    decodeSchema,
    Schema as SasSchema,
} from 'sas-lib';

import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import {
    decodeAccount,
    decodeWithType,
    deserializeAttestationDataWithBorsh200,
    isAttestationAccount,
} from '@/app/utils/attestation-service';
import { mapToPublicKey } from '@/app/utils/kit-wrapper';

export function AttestationDataCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    if (!account || !isAttestationAccount(account)) {
        return onNotFound();
    }

    const decoded = decodeAccount(account);
    if (decoded?.type === 'attestation') {
        return <AttestationCard attestation={decoded.data.data} />;
    } else if (decoded?.type === 'schema') {
        return <SchemaCard schema={decoded.data.data} />;
    }

    return onNotFound();
}

function SchemaCard({ schema }: { schema: SasSchema }) {
    const borshSchema = convertSasSchemaToBorshSchema(schema);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Schema Layout (Borsh)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="card metadata-json-viewer m-4">
                    <ReactJson src={borshSchema['schema']} style={{ padding: 25 }} name={false} />
                </div>
            </CardContent>
        </Card>
    );
}

function AttestationCard({ attestation }: { attestation: SasAttestation }) {
    const schemaAccountInfo = useAccountInfo(mapToPublicKey(attestation.schema).toBase58());
    const fetchAccountInfo = useFetchAccountInfo();
    React.useEffect(() => {
        if (!schemaAccountInfo?.data) {
            fetchAccountInfo(mapToPublicKey(attestation.schema), 'parsed');
        }
    }, [schemaAccountInfo?.data, fetchAccountInfo, attestation.schema]);

    let decoded: any | null = null;
    try {
        if (schemaAccountInfo?.data) {
            const schema: SasSchema = decodeWithType(schemaAccountInfo.data, 'schema', decodeSchema)?.data.data;
            decoded = deserializeAttestationDataWithBorsh200(schema, Uint8Array.from(attestation.data));
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Attestation Data {decoded ? '' : 'Raw (Base64)'}</CardTitle>
            </CardHeader>
            <CardContent>
                {decoded ? (
                    <div className="card metadata-json-viewer m-4">
                        <ReactJson src={decoded} style={{ padding: 25 }} name={false} />
                    </div>
                ) : (
                    <div
                        className="font-mono"
                        style={{
                            fontSize: '0.85rem',
                            lineHeight: '1.2',
                            maxWidth: '100%',
                            overflowWrap: 'break-word',
                            padding: '1rem',
                            whiteSpace: 'normal',
                            wordBreak: 'break-all',
                        }}
                    >
                        {Buffer.from(attestation.data).toString('base64') || '(empty)'}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
