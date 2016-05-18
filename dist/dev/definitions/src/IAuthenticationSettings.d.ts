export interface IAuthenticationSettings {
    authority: string;
    client_id: string;
    scopes?: string;
    response_type?: string;
    client_url?: string;
    open_on_popup?: boolean;
}
