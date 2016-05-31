import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import * as Q from 'q';
import 'oidc-token-manager';
export declare class AuthenticationContext {
    private static _current;
    static Current: AuthenticationContext;
    IsInitialized: boolean;
    static Reset(): void;
    private oidcTokenManager;
    constructor();
    protected AuthenticationManagerSettings: IAuthenticationManagerSettings;
    protected Initialize(authenticationSettings: IAuthenticationSettings): void;
    protected ProcessTokenIfNeeded(): Q.IPromise<void>;
    Init(authenticationSettings?: IAuthenticationSettings, force?: boolean): Q.IPromise<void>;
    ProcessTokenCallback(): Q.IPromise<void>;
    RenewTokenSilent(): Q.IPromise<void>;
    protected RedirectToInitialPage(): void;
    protected ValidateInitialization(): void;
    Login(openOnPopUp?: boolean): void;
    IsAuthenticated: boolean;
    TokensContents: {
        AccessTokenContent: any;
        IdentityTokenContent: any;
        ProfileContent: any;
    };
    protected AccessTokenContent: any;
    protected IdentityTokenContent: any;
    protected ProfileContent: any;
}
