import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import 'oidc-token-manager';
/**
 * AuthenticationInitializer
 */
export declare class AuthenticationContextInitializer {
    private static _current;
    static Current: AuthenticationContextInitializer;
    static Reset(): void;
    private oidcTokenManager;
    constructor();
    protected AuthenticationManagerSettings: IAuthenticationManagerSettings;
    Init(authenticationSettings: IAuthenticationSettings): void;
    ProcessTokenCallback(): void;
    RenewTokenSilent(): void;
    LoginAndProcessToken(openOnPopUp?: boolean): void;
    Login(openOnPopUp?: boolean): void;
    IsAuthenticated: boolean;
    AccessTokenContent: any;
    IdentityTokenContent: any;
    ProfileContent: any;
    protected GenerateTokens(): void;
}
