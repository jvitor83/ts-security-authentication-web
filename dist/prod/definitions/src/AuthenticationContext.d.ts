import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import { IAuthenticationSettings } from './IAuthenticationSettings';
import * as Oidc from 'oidc-client';
export declare class AuthenticationContext {
    private static _current;
    private callbacksTokenObtained;
    private callbacksTokenRenewFailedRetryMax;
    static Current: AuthenticationContext;
    IsInitialized: boolean;
    static Reset(): void;
    AddOnTokenObtained(callback: (user: Oidc.User) => void): void;
    AddOnTokenRenewFailedMaxRetry(callback: () => void): void;
    private oidcTokenManager;
    constructor();
    protected AuthenticationManagerSettings: IAuthenticationManagerSettings;
    protected Initialize(authenticationSettings: IAuthenticationSettings): void;
    protected ProcessTokenIfNeeded(): PromiseLike<Oidc.User>;
    Init(authenticationSettings?: IAuthenticationSettings): PromiseLike<Oidc.User>;
    ProcessTokenCallback(): PromiseLike<any>;
    protected RedirectToInitialPage(uri: string): void;
    protected ValidateInitialization(): void;
    Login(openOnPopUp?: boolean): PromiseLike<any>;
    IsAuthenticated: PromiseLike<boolean>;
}
