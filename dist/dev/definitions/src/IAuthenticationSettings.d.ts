import { Pattern } from './Pattern';
export interface IAuthenticationSettings {
    authority: string;
    client_id: string;
    scope?: string;
    response_type?: string;
    client_url?: string;
    pattern?: Pattern;
    acr_values?: string;
    max_retry_renew?: number;
    silent_renew_timeout?: number;
    open_on_popup?: boolean;
}
