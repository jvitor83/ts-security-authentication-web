export interface IAuthenticationSettings {
    authority: string;
    client_id: string;
    scope?: string;
    response_type?: string;
    client_url?: string;
    authorization_url?: string;
    token_url?: string;
    userinfo_url?: string;
}
