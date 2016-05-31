import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import * as Q from 'q';
import 'oidc-token-manager';
/**
 * AuthenticationInitializer
 */
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
    /**
     * Make the login at the current URI, and process the received tokens.
     * OBS: The Redirect URI [callback_url] (to receive the token) and Silent Refresh Frame URI [silent_redirect_uri] (to auto renew when expired) if not informed is auto generated based on the 'client_url' informed at 'Init' method with the followin strategy:
     * `redirect_url = client_url + '?callback=true'`
     * `silent_redirect_uri = client_url + '?silentrefreshframe=true'`
     *
     * @param {boolean} [openOnPopUp] (description)
     */
    Login(openOnPopUp?: boolean): void;
    IsAuthenticated: boolean;
    TokensContents: TokensContents;
    protected AccessTokenContent: any;
    protected IdentityTokenContent: any;
    protected ProfileContent: any;
}
export declare class TokensContents {
    private _profileContent;
    ProfileContent: any;
    private _accessTokenContent;
    AccessTokenContent: any;
    private _identityTokenContent;
    IdentityTokenContent: any;
    ToArray(): Array<any>;
}
