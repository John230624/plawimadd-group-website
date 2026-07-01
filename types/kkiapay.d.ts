// types/kkiapay.d.ts

export interface KkiapayOptions {
    amount: number;
    api_key: string;
    callback: string;
    transaction_id: string;
    email?: string;
    phone?: string;
    position?: "center" | "right" | "left";
    sandbox?: boolean;
    data?: string;
    theme?: string;
    paymentmethod?: "momo" | "card";
    name?: string;
    currency?: string;
}

export interface KkiapaySuccessResponse {
    transactionId: string;
    data?: string;
    amount?: number;
    paymentMethod?: string;
    reference?: string;
    status?: string;
    email?: string;
    phone?: string;
}

export interface KkiapayErrorReason {
    code?: string;
    message?: string;
}

export interface KkiapayErrorResponse {
    transactionId?: string;
    reason?: KkiapayErrorReason;
    message?: string;
}

export interface LegacyKkiapayOptions {
    amount: number;
    api_key: string;
    callback: string;
    email?: string;
    phone?: string;
    position?: string;
    sandbox?: boolean;
    data?: string;
}

declare global {
    interface Window {
        openKkiapayWidget?: (options: LegacyKkiapayOptions) => void;
        addSuccessListener?: (callback: (response: KkiapaySuccessResponse) => void) => void;
        removeSuccessListener?: (callback: (response: KkiapaySuccessResponse) => void) => void;
        addFailedListener?: (callback: (error: KkiapayErrorResponse) => void) => void;
        removeFailedListener?: (callback: (error: KkiapayErrorResponse) => void) => void;
        Kkiapay?: { // Seule la nouvelle API Kkiapay est déclarée ici
            open: (options: KkiapayOptions) => void;
            on_success: (callback: (response: KkiapaySuccessResponse) => void) => void;
            on_error: (callback: (error: KkiapayErrorResponse) => void) => void;
            on_close: (callback: () => void) => void;
        };
    }

    namespace JSX {
        interface IntrinsicElements {
            'kkiapay-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & KkiapayOptions;
        }
    }
}

export {};
