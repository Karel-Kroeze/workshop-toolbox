import { css } from "@emotion/react";
import { ReactElement } from "react";
import { IconType } from "react-icons";
import { RiAlertFill, RiCheckFill, RiErrorWarningFill, RiInformationFill, RiLoaderLine } from "react-icons/ri";
import { toast, ToastOptions } from "react-toastify";
import { browser } from "webextension-polyfill-ts";

import { ACTIONS, IResponse, RESPONSE_ACTIONS } from "./types";
import { statusColors } from "./utils";

const defaultToastOptions: ToastOptions = {
    position: "bottom-right",
    autoClose: 1000,
    progressClassName: "toast-progress",
};

export const toastContainerStyles = css`
    .toast-content {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        gap: 1rem;
    }

    .toast-info {
        .toast-icon {
            color: ${statusColors.info};
        }
        .toast-progress {
            background-color: ${statusColors.info} !important;
        }
    }
    .toast-success {
        .toast-icon {
            color: ${statusColors.success};
        }
        .toast-progress {
            background-color: ${statusColors.success} !important;
        }
    }
    .toast-danger {
        .toast-icon {
            color: ${statusColors.danger};
        }
        .toast-progress {
            background-color: ${statusColors.danger} !important;
        }
    }
    .toast-warning {
        .toast-icon {
            color: ${statusColors.warning};
        }
        .toast-progress {
            background-color: ${statusColors.warning} !important;
        }
    }
`;

export const Toast = ({
    message,
    Icon,
}: {
    message: string | ReactElement;
    Icon: IconType;
}) => {
    return (
        <div className="toast-content">
            <Icon size="36px" className="toast-icon" />
            <div className="toast-message">{message}</div>
        </div>
    );
};

export function toastLoading(
    message: string | ReactElement,
    Icon: IconType = RiLoaderLine,
    options?: ToastOptions
) {
    const _toast = toast.dark(<Toast message={message} Icon={Icon} />, {
        ...defaultToastOptions,
        autoClose: false,
        hideProgressBar: true,
        className: "toast toast-info toast-loading",
        ...options,
    });

    return {
        success: (
            message: string | ReactElement,
            Icon: IconType = RiCheckFill,
            options?: ToastOptions
        ) => {
            toast.update(_toast, {
                render: <Toast message={message} Icon={Icon} />,
                className: "toast toast-success",
                autoClose: 2000,
                hideProgressBar: false,
                ...options,
            });
        },
        failure: (
            message: string | ReactElement,
            Icon: IconType = RiErrorWarningFill
        ) => {
            toast.update(_toast, {
                render: <Toast message={message} Icon={Icon} />,
                className: "toast toast-danger",
                autoClose: 5000,
                hideProgressBar: false,
                ...options,
            });
        },
        cancel: () => {
            toast.dismiss(_toast);
        },
    };
}

export function toastResponse(response: IResponse) {
    if (response.update?.message) {
        let onClick = undefined;
        let message: string | ReactElement = response.update.message;
        if (response.action === RESPONSE_ACTIONS.OPEN_OPTIONS) {
            onClick = () => {
                browser.runtime.sendMessage({ action: ACTIONS.OPEN_OPTIONS });
            };
            message = (
                <div>
                    <div>{response.update.message}</div>
                    <div
                        css={css`
                            font-style: italic;
                        `}
                    >
                        Click to open options page
                    </div>
                </div>
            );
        } else {
            message = response.update.message;
        }
        switch (response.update.status) {
            case "info":
                toastInfo(message, undefined, onClick);
                break;
            case "success":
                toastSuccess(message, undefined, onClick);
                break;
            case "danger":
                toastDanger(message, undefined, onClick);
                break;
            case "warning":
                toastWarning(message, undefined, onClick);
                break;
        }
    }
}

export function toastInfo(
    message: string | ReactElement,
    link?: string,
    onClick?: () => void
) {
    if (link && !onClick) {
        onClick = () => {
            window.open(link, "_blank");
        };
    }
    console.log({ message, link, status: "info" });
    toast.dark(<Toast message={message} Icon={RiInformationFill} />, {
        ...defaultToastOptions,
        onClick,
        className: "toast toast-info",
    });
}

export function toastSuccess(
    message: string | ReactElement,
    link?: string,
    onClick?: () => void
) {
    if (link && !onClick) {
        onClick = () => {
            window.open(link, "_blank");
        };
    }
    console.log({ message, link, status: "success" });
    toast.dark(<Toast message={message} Icon={RiCheckFill} />, {
        ...defaultToastOptions,
        onClick,
        className: "toast toast-success",
    });
}
export function toastDanger(
    message: string | ReactElement,
    link?: string,
    onClick?: () => void
) {
    if (link && !onClick) {
        onClick = () => {
            window.open(link, "_blank");
        };
    }
    console.log({ message, link, status: "danger" });
    toast.dark(<Toast message={message} Icon={RiErrorWarningFill} />, {
        ...defaultToastOptions,
        onClick,
        autoClose: 5000,
        className: "toast toast-danger",
    });
}
export function toastWarning(
    message: string | ReactElement,
    link?: string,
    onClick?: () => void
) {
    if (link && !onClick) {
        onClick = () => {
            window.open(link, "_blank");
        };
    }
    console.log({ message, link, status: "warning" });
    toast.dark(<Toast message={message} Icon={RiAlertFill} />, {
        ...defaultToastOptions,
        onClick,
        autoClose: 5000,
        className: "toast toast-warning",
    });
}
