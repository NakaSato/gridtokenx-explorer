'use client';

import { useCluster, useClusterModal } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'react-feather';

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

    const btnClasses = (variant: string) => {
        return `btn d-block btn-${variant}`;
    };

    const spinnerClasses =
        'inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin align-text-top mr-2';

    switch (status) {
        case ClusterStatus.Connected:
            return (
                <span className={btnClasses('primary')} onClick={onClickHandler}>
                    <CheckCircle className="fe mr-2" size={15} />
                    {statusName}
                </span>
            );

        case ClusterStatus.Connecting:
            return (
                <span className={btnClasses('warning')} onClick={onClickHandler}>
                    <span className={spinnerClasses} role="status" aria-hidden="true"></span>
                    {statusName}
                </span>
            );

        case ClusterStatus.Failure:
            return (
                <span className={btnClasses('danger')} onClick={onClickHandler}>
                    <AlertCircle className="mr-2" size={15} />
                    {statusName}
                </span>
            );
    }
};
