'use client';

import { Button } from '@components/shared/ui/button';
import { useCluster, useClusterModal } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'react-feather';

function getCustomUrlClusterName(customUrl: string) {
    try {
        const url = new URL(customUrl);
        if (url.hostname === 'localhost') {
            return customUrl;
        }
        return `${url.protocol}//${url.hostname}`;
    } catch (e) {
        return customUrl;
    }
}

export const ClusterStatusButton = () => {
    const { status, cluster, name, customUrl } = useCluster();
    const [, setShow] = useClusterModal();

    const onClickHandler = useCallback(() => setShow(true), [setShow]);
    const statusName = cluster !== Cluster.Custom ? `${name}` : getCustomUrlClusterName(customUrl);

    switch (status) {
        case ClusterStatus.Connected:
            return (
                <Button variant="default" size="sm" onClick={onClickHandler} className="relative z-50">
                    <CheckCircle size={14} className="mr-2" />
                    {statusName}
                </Button>
            );

        case ClusterStatus.Connecting:
            return (
                <Button variant="secondary" size="sm" onClick={onClickHandler} disabled className="relative z-50">
                    <Loader size={14} className="mr-2 animate-spin" />
                    {statusName}
                </Button>
            );

        case ClusterStatus.Failure:
            return (
                <Button variant="destructive" size="sm" onClick={onClickHandler} className="relative z-50">
                    <AlertCircle size={14} className="mr-2" />
                    {statusName}
                </Button>
            );
    }
};
