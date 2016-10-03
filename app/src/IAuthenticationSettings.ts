export interface IAuthenticationSettings
{
    authority: string;
    client_id: string;
    scope?: string;
    response_type?: string;
    
    client_url?: string;

    max_retry_renew?: number;

    authorization_url? : string;
    token_url? : string;
    userinfo_url? : string;
}