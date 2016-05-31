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
    protected ProcessTokenIfNeeded(): Q.IPromise<TokensContents>;
    Init(authenticationSettings?: IAuthenticationSettings, force?: boolean): Q.IPromise<TokensContents>;
    ProcessTokenCallback(): Q.IPromise<TokensContents>;
    RenewTokenSilent(): Q.IPromise<void>;
    protected RedirectToInitialPage(): void;
    protected ValidateInitialization(): void;
    Login(openOnPopUp?: boolean): void;
    IsAuthenticated: boolean;
    TokensContents: TokensContents;
    protected AccessTokenContent: any;
    protected IdentityTokenContent: any;
    protected ProfileContent: any;
}
export declare class TokensContents {
    IsAuthenticated: boolean;
    private _profileContent;
    ProfileContent: any;
    private _accessTokenContent;
    AccessTokenContent: any;
    private _identityTokenContent;
    IdentityTokenContent: any;
    ToArray(): Array<any>;
}
