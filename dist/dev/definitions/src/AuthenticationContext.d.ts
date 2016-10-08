import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import { IAuthenticationSettings } from './IAuthenticationSettings';
export declare class AuthenticationContext {
    private static _current;
    private callbacksTokenObtained;
    private callbacksTokenRenewFailedRetryMax;
    static Current: AuthenticationContext;
    IsInitialized: boolean;
    static Reset(): void;
    AddOnTokenObtained(callback: (user: User) => void): void;
    AddOnTokenRenewFailedMaxRetry(callback: () => void): void;
    private oidcTokenManager;
    constructor();
    protected AuthenticationManagerSettings: IAuthenticationManagerSettings;
    protected Initialize(authenticationSettings: IAuthenticationSettings): void;
    protected ProcessTokenIfNeeded(): PromiseLike<User>;
    Init(authenticationSettings?: IAuthenticationSettings): PromiseLike<User>;
    ProcessTokenCallback(): PromiseLike<any>;
    protected RedirectToInitialPage(uri: string): void;
    protected ValidateInitialization(): void;
    Login(openOnPopUp?: boolean): PromiseLike<any>;
    IsAuthenticated: boolean;
}
export interface User {
    id_token: string;
    session_state: any;
    access_token: string;
    token_type: string;
    scope: string;
    profile: any;
    expires_at: number;
    state: any;
    toStorageString(): string;
    expires_in: number;
    expired: boolean;
    scopes: string[];
}
