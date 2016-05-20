import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
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
    Init(authenticationSettings: IAuthenticationSettings, force?: boolean): void;
    ProcessTokenCallback(): void;
    RenewTokenSilent(): void;
    protected RedirectToInitialPage(): void;
    protected ValidateInitialization(): void;
    LoginAndProcessToken(openOnPopUp?: boolean): void;
    Login(openOnPopUp?: boolean): void;
    IsAuthenticated: boolean;
    AccessTokenContent: any;
    IdentityTokenContent: any;
    ProfileContent: any;
}
