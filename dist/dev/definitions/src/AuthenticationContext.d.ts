import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import 'oidc-token-manager';
/**
 * AuthenticationInitializer
 */
export declare class AuthenticationContext {
    private static _current;
    static Current: AuthenticationContext;
    static Reset(): void;
    private oidcTokenManager;
    constructor();
    protected AuthenticationManagerSettings: IAuthenticationManagerSettings;
    Init(authenticationSettings: IAuthenticationSettings): void;
    ProcessTokenCallback(): void;
    RenewTokenSilent(): void;
    protected ValidateInitialization(): void;
    LoginAndProcessToken(openOnPopUp?: boolean): void;
    Login(openOnPopUp?: boolean): void;
    IsAuthenticated: boolean;
    AccessTokenContent: any;
    IdentityTokenContent: any;
    ProfileContent: any;
}
