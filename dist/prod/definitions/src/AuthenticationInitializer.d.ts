import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import 'oidc-token-manager';
export declare class AuthenticationInitializer {
    private static _current;
    static Current: AuthenticationInitializer;
    static Reset(): void;
    private oidcTokenManager;
    constructor();
    protected AuthenticationManagerSettings: IAuthenticationManagerSettings;
    Init(authenticationSettings: IAuthenticationSettings): void;
    Callback(): void;
    RenewTokenSilent(): void;
    Login(openOnPopUp?: boolean): void;
    AccessToken: any;
    IdentityToken: any;
    Profile: any;
    protected GenerateTokens(): void;
}
