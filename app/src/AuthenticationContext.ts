import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import { IAuthenticationSettings } from './IAuthenticationSettings';


/**
 * AuthenticationInitializer
 */
export class AuthenticationContext 
{
    
    private static _current: AuthenticationContext = null;

    private callbacksTokenObtained :Array<(user: User) => void> = new Array<(user: User) => void>();

    private callbacksTokenRenewFailedRetryMax :Array<() => void> = new Array<() => void>();

    public static get Current(): AuthenticationContext 
    {
        if(AuthenticationContext._current === null)
        {
            AuthenticationContext._current =  new AuthenticationContext();
        }
        return AuthenticationContext._current;
    }
    
    public get IsInitialized()
    {
        if(this.AuthenticationManagerSettings != null)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    
    public static Reset()
    {
        AuthenticationContext._current = null;
    }

    public AddOnTokenObtained(callback: (user: User) => void)
    {
        this.callbacksTokenObtained.push(callback);
        this.oidcTokenManager.events.addUserLoaded(callback);
    }

    public AddOnTokenRenewFailedMaxRetry(callback: () => void)
    {
        this.callbacksTokenRenewFailedRetryMax.push(callback);
        //this.oidcTokenManager.addOnSilentTokenRenewFailed(callback);
    }

    private oidcTokenManager: UserManager;
        
    constructor() 
    {
        let authenticationSettingsLoadedFromStorage = this.AuthenticationManagerSettings;
        if(authenticationSettingsLoadedFromStorage != null)
        {
            this.oidcTokenManager = new UserManager( authenticationSettingsLoadedFromStorage );
        }
    }
    
    protected get AuthenticationManagerSettings(): IAuthenticationManagerSettings 
    {
        let authenticationSettingsFromLocalStorage: IAuthenticationManagerSettings = null;
        let authenticationSettingsFromLocalStorageStringify = localStorage.getItem('AuthenticationManagerSettings');
        if(authenticationSettingsFromLocalStorageStringify != null)
        {
            authenticationSettingsFromLocalStorage = JSON.parse(authenticationSettingsFromLocalStorageStringify);
        }
        return authenticationSettingsFromLocalStorage;
    }
    
    protected set AuthenticationManagerSettings(value: IAuthenticationManagerSettings)
    {
        localStorage.setItem('AuthenticationManagerSettings', JSON.stringify(value));
    }
    
    protected Initialize(authenticationSettings: IAuthenticationSettings)
    {
        if(authenticationSettings.authority == null || authenticationSettings.client_id == null || authenticationSettings.client_url == null)
        {
            throw "Should be informed at least 'authority', 'client_id' and 'client_url'!";
        }
        
        if(authenticationSettings.use_ietf_pattern == null)
        {
            authenticationSettings.use_ietf_pattern = true;
        }

        if(authenticationSettings.use_ietf_pattern != null && authenticationSettings.use_ietf_pattern === true)
        {
            if(authenticationSettings.client_url.indexOf('file:') > -1 || ((location.href.indexOf('file:') > -1) || location.protocol.indexOf('file') > -1))
            {
                authenticationSettings.client_url = 'urn:ietf:wg:oauth:2.0:oob:auto';
            }
        }
        
        //Set default values if not informed
        authenticationSettings.client_url = authenticationSettings.client_url; //Self uri
        console.debug('ClientUrl: ' + authenticationSettings.client_url);

        authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access'; //OpenId default scopes
        authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token'; //Hybrid flow at default
        authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false; //Redirect for default

        authenticationSettings.max_retry_renew = authenticationSettings.max_retry_renew || 35;
        console.debug('Max retry setted to: ' + authenticationSettings.max_retry_renew);
        authenticationSettings.silent_renew_timeout = authenticationSettings.silent_renew_timeout || 40 * 1000; //40 seconds to timeout
        console.debug('Silent renew timeout setted to: ' + authenticationSettings.silent_renew_timeout + ' miliseconds');

        //Convert to the more complete IAuthenticationManagerSettings
        this.AuthenticationManagerSettings = 
        {
            authority: authenticationSettings.authority,
            client_id: authenticationSettings.client_id,
            client_url: authenticationSettings.client_url,

            max_retry_renew: authenticationSettings.max_retry_renew, 
            silent_renew_timeout: authenticationSettings.silent_renew_timeout,
            
            response_type: authenticationSettings.response_type,
            scope: authenticationSettings.scope,
            
            redirect_uri : authenticationSettings.client_url,
            silent_redirect_uri: authenticationSettings.client_url,
            post_logout_redirect_uri: authenticationSettings.client_url,
            
            authorization_url : authenticationSettings.authorization_url || authenticationSettings.authority + "/connect/authorize",
            token_url : authenticationSettings.token_url || authenticationSettings.authority + "/connect/token",
            userinfo_url: authenticationSettings.userinfo_url || authenticationSettings.authority + "/connect/userinfo",
            
            load_user_profile: true,
            silent_renew: true,
        };
        
        this.oidcTokenManager = new UserManager(this.AuthenticationManagerSettings);

        this.oidcTokenManager.events.addUserLoaded(() => {
            this.AuthenticationManagerSettings.is_authenticated = true;
            this.AuthenticationManagerSettings = this.AuthenticationManagerSettings;
        });
        //Retry indefinitly for renew
        // this.oidcTokenManager.events.addSilentRenewError(() => {
        //     let count = 1;

        //     this.oidcTokenManager.signinSilent();

        //     let success = () => {
        //         console.debug('Renewed after ' + count.toString() + ' fails!');
        //     };
        //     let fail = (error) => {
        //         count++;
        //         console.debug('Token not renewed! Trying again after ' + count.toString() + ' fails! Max retry set to ' + this.AuthenticationManagerSettings.max_retry_renew + '!');

        //         if(count < this.AuthenticationManagerSettings.max_retry_renew)
        //         {
        //             return this.oidcTokenManager.renewTokenSilentAsync().then(success, fail);
        //         }else{
        //             console.error('Token not renewed!');
        //             this.callbacksTokenRenewFailedRetryMax.forEach((callback)=> {
        //                 callback();
        //             });
        //             return promise;
        //         }
        //     };

        //     let childPromise = promise.then(success, fail);
        //     return childPromise;
        // });

        
    }
    




    protected ProcessTokenIfNeeded() : PromiseLike<User>
    {
        if (location.href.indexOf('access_token=') > -1 && (this.oidcTokenManager.querySessionStatus() != null || location.href.indexOf('prompt=none') > -1)) {
            console.debug('Processing token! (silently)');
            this.oidcTokenManager.signinSilentCallback();
            console.debug('Token processed! (silently)');
        } else 

        //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
        //if(location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri)
        if(location.href.indexOf('access_token=') > -1)
        {
            console.debug('Processing token!');
            return this.ProcessTokenCallback();
        }
        // //if the actual page is the 'silent_redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'
        // else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri)
        // {
        //     this.RenewTokenSilent();
        // }
        //Go Horse
    }
    
    public Init(authenticationSettings?: IAuthenticationSettings) : PromiseLike<User>
    {
        if(authenticationSettings != null)
        {
            this.Initialize(authenticationSettings);
        }
        
        return this.ProcessTokenIfNeeded();
    }
    
    public ProcessTokenCallback() : PromiseLike<any>
    {
        this.ValidateInitialization();
               
        let promise: PromiseLike<any> = null;

        if(this.AuthenticationManagerSettings.open_on_popup)
        {
            promise = this.oidcTokenManager.signinPopupCallback();
        }
        else
        {
            promise = this.oidcTokenManager.signinRedirectCallback();
        }

        let promiseRedirect = promise
        .then(
            () => {
                this.RedirectToInitialPage(this.AuthenticationManagerSettings.redirect_uri);
            },
            (error) => {
                let message = "Problem Getting Token : " + (error.message || error);
                console.error(message);
                throw message;
            }
        );

        return promiseRedirect;
    }
    
    // public RenewTokenSilent() : Q.IPromise<void>
    // {
    //     this.ValidateInitialization();
        
    //     let defer = Q.defer<void>();
    //     this.oidcTokenManager.renewTokenSilentAsync().then(
    //         () => {
    //             defer.resolve();
    //         },
    //         (error) => {
    //             let message = "Problem Getting Token : " + (error.message || error); 
    //             console.error(message);
    //             defer.reject(message);
    //         }
    //     );
    //     return defer.promise;
    // }
    

    protected RedirectToInitialPage(uri :string)
    {
        location.assign(uri);
    }


    
    protected ValidateInitialization()
    {
        if(this.AuthenticationManagerSettings == null)
        {
            throw "AuthenticationContext uninitialized!";
        }
    }
    
    
    /**
     * Make the login at the current URI, and process the received tokens.
     * OBS: The Redirect URI [callback_url] (to receive the token) and Silent Refresh Frame URI [silent_redirect_uri] (to auto renew when expired) if not informed is auto generated based on the 'client_url' informed at 'Init' method with the followin strategy:
     * `redirect_url = client_url + '?callback=true'`
     * `silent_redirect_uri = client_url + '?silentrefreshframe=true'` 
     * 
     * @param {boolean} [openOnPopUp] (description)
     */
    // public LoginAndProcessToken(openOnPopUp?: boolean)
    // {
    //     this.ValidateInitialization();
        
    //     let shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
        
    //     //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
    //     if(location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri)
    //     {
    //         this.ProcessTokenCallback();
    //     }
    //     //if the actual page is the 'silent_redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'
    //     else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri)
    //     {
    //         this.RenewTokenSilent();
    //     }
    //     //if the actual page is the 'client_url', then i consider to make the 'login'
    //     else if(location.href.substring(0, this.AuthenticationManagerSettings.client_url.length) === this.AuthenticationManagerSettings.client_url)
    //     {
    //         if(this.IsAuthenticated === false)
    //         {
    //             this.Login(shouldOpenOnPopUp);
    //         }
    //     }
    // }
    
    public Login(openOnPopUp?: boolean) : PromiseLike<any>
    {
        if(this.IsAuthenticated === false)
        {
            this.ValidateInitialization();
            
            //TODO: Treat when in mobile browser to not support popup
            let shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
            
            if (shouldOpenOnPopUp)
            {
                return this.oidcTokenManager.signinPopup();
            }
            else
            {
                return this.oidcTokenManager.signinRedirect();
            }
        }
        else
        {
            console.warn('Already authenticated');
            // this.callbacksTokenObtained.forEach((callback) => {
            //     callback();
            // });
        }
    }

    public get IsAuthenticated() :boolean
    {
        return this.AuthenticationManagerSettings.is_authenticated;
    }

    // public get TokensContents() : TokensContents
    // {
    //     let tokenContents = new TokensContents();
        
    //     tokenContents.AccessToken = this.AccessToken;
    //     tokenContents.IdentityToken = this.IdentityToken;
        
    //     tokenContents.AccessTokenContent = this.AccessTokenContent;
    //     tokenContents.IdentityTokenContent = this.IdentityTokenContent;
    //     tokenContents.ProfileContent = this.ProfileContent;
        
    //     return tokenContents;
    // }

    // protected get AccessToken(): string 
    // {
    //     if (this.oidcTokenManager != null)
    //     {
    //         let id_token = this.oidcTokenManager.access_token;
    //         return id_token;
    //     }
    //     return null;
    // }


    // protected get AccessTokenContent(): any 
    // {
    //     if(this.oidcTokenManager != null)
    //     {
    //         if(this.oidcTokenManager.access_token != null)
    //         {
    //             let accessTokenContent = this.oidcTokenManager.access_token.split('.')[1];
    //             if(accessTokenContent != null)
    //             {
    //                 let valor =  JSON.parse(atob(accessTokenContent));
    //                 return valor;
    //             }
    //         }
    //     }
    //     return null;
    // }
    
    // protected get IdentityToken(): string 
    // {
    //     if (this.oidcTokenManager != null)
    //     {
    //         let id_token = this.oidcTokenManager.id_token;
    //         return id_token;
    //     }
    //     return null;
    // }

    
    // protected get IdentityTokenContent(): any
    // {
    //     if(this.oidcTokenManager != null)
    //     {
    //         if(this.oidcTokenManager.id_token != null)
    //         {
    //             let identityTokenContent = this.oidcTokenManager.id_token.split('.')[1];
    //             if(identityTokenContent != null)
    //             {
    //                 let valor = JSON.parse(atob(identityTokenContent));
    //                 return valor;
    //             }
    //         }
    //     }
    // }
    
    // protected get ProfileContent(): any
    // {
    //     if(this.oidcTokenManager != null)
    //     {
    //         if(this.oidcTokenManager.profile != null)
    //         {
    //             let valor = this.oidcTokenManager.profile;
    //             return valor;
    //         }
    //     }
    //     return null;
    // }
}

// export class TokensContents
// {
//     public get IsAuthenticated() :boolean
//     {
//         if(this.AccessTokenContent == null)
//         {
//             return false;
//         }
//         else
//         {
//             return true;
//         }
//     }
    
//     private _profileContent: any;
//     public get ProfileContent(): any
//     {
//         return this._profileContent;
//     }
//     public set ProfileContent(value: any)
//     {
//         this._profileContent = value;
//     }
    
    
    
//     private _accessToken: string;
//     public get AccessToken(): string
//     {
//         return this._accessToken;
//     }
//     public set AccessToken(value: string)
//     {
//         this._accessToken = value;
//     }
    
    
//     private _accessTokenContent: any;
//     public get AccessTokenContent(): any
//     {
//         return this._accessTokenContent;
//     }
//     public set AccessTokenContent(value: any)
//     {
//         this._accessTokenContent = value;
//     }
    
    
    
    
    
//     private _identityToken: string;
//     public get IdentityToken(): string
//     {
//         return this._identityToken;
//     }
//     public set IdentityToken(value: string)
//     {
//         this._identityToken = value;
//     }
    
    
//     private _identityTokenContent: any;
//     public get IdentityTokenContent(): any
//     {
//         return this._identityTokenContent;
//     }
//     public set IdentityTokenContent(value: any)
//     {
//         this._identityTokenContent = value;
//     }
    
    
    
//     public tokensContentsToArray(includeEncodedTokens:boolean = true) : Array<any>
//     {
//         let tokensContents = new Array<any>();

//         tokensContents.push(this.IdentityTokenContent);
//         tokensContents.push(this.AccessTokenContent);
//         tokensContents.push(this.ProfileContent);

//         if(includeEncodedTokens)
//         {
//             let accessTokenEncoded = { 'access_token': AuthenticationContext.Current.TokensContents.AccessToken };
//             tokensContents.push(accessTokenEncoded);

//             let identityTokenEncoded = { 'id_token': AuthenticationContext.Current.TokensContents.IdentityToken };
//             tokensContents.push(identityTokenEncoded); 
//         }

//         return tokensContents;
//     }
    
//     public encodedTokensToArray() : Array<any>
//     {
//         return [ this.IdentityToken, this.AccessToken ];
//     }
// }




declare interface Logger  {
    error(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
}
declare interface AccessTokenEvents {

    load(container: User): void;

    unload(): void;

    addAccessTokenExpiring(callback: (...ev: any[]) => void): void;
    removeAccessTokenExpiring(callback: (...ev: any[]) => void): void;

    addAccessTokenExpired(callback: (...ev: any[]) => void): void;
    removeAccessTokenExpired(callback: (...ev: any[]) => void): void;
}
declare interface InMemoryWebStorage {
    getItem(key: string): any;

    setItem(key: string, value: any): any;

    removeItem(key: string): any;

    key(index: number): any;

    length?: number;
}
declare class Log {
    static NONE: number;
    static ERROR: number;
    static WARN: number;
    static INFO: number;
    // For when TypeScript 2.0 compiler is more widely used
    // static readonly NONE: number;
    // static readonly ERROR: number;
    // static readonly WARN: number;
    // static readonly INFO: number;

    static reset(): void;

    static level: number;

    static logger: Logger;

    static info(message?: any, ...optionalParams: any[]): void;
    static warn(message?: any, ...optionalParams: any[]): void;
    static error(message?: any, ...optionalParams: any[]): void;
}

declare interface MetadataService {
    new (settings: OidcClientSettings): MetadataService;

    getMetadata(): PromiseLike<any>;

    getIssuer(): PromiseLike<any>;

    getAuthorizationEndpoint(): PromiseLike<any>;

    getUserInfoEndpoint(): PromiseLike<any>;

    getCheckSessionIframe(): PromiseLike<any>;

    getEndSessionEndpoint(): PromiseLike<any>;

    getSigningKeys(): PromiseLike<any>;
}
declare interface MetadataServiceCtor {
    (settings: OidcClientSettings, jsonServiceCtor?: any): MetadataService;
}
declare interface ResponseValidator {
    validateSigninResponse(state: any, response: any): PromiseLike<any>;
    validateSignoutResponse(state: any, response: any): PromiseLike<any>;
}
declare interface ResponseValidatorCtor {
    (settings: OidcClientSettings, metadataServiceCtor?: MetadataServiceCtor, userInfoServiceCtor?: any): ResponseValidator;
}

declare class OidcClient {
    constructor(settings: OidcClientSettings);

    createSigninRequest(args?: any): PromiseLike<any>;
    processSigninResponse(): PromiseLike<any>;

    createSignoutRequest(args?: any): PromiseLike<any>;
    processSignoutResponse(): PromiseLike<any>;

    clearStaleState(stateStore: any): PromiseLike<any>;
}

declare interface OidcClientSettings {
    authority?: string;
    metadataUrl?: string;
    metadata?: any;
    signingKeys?: string;
    client_id?: string;
    response_type?: string;
    scope?: string;
    redirect_uri?: string;
    post_logout_redirect_uri?: string;
    prompt?: string;
    display?: string;
    max_age?: number;
    ui_locales?: string;
    acr_values?: string;
    filterProtocolClaims?: boolean;
    loadUserInfo?: boolean;
    staleStateAge?: number;
    clockSkew?: number;
    stateStore?: WebStorageStateStore;
    ResponseValidatorCtor?: ResponseValidatorCtor;
    MetadataServiceCtor?: MetadataServiceCtor;
}

declare class UserManager extends OidcClient {
    constructor(settings: UserManagerSettings);

    clearStaleState(): PromiseLike<void>;

    getUser(): PromiseLike<User>;
    removeUser(): PromiseLike<void>;

    signinPopup(args?: any): PromiseLike<User>;
    signinPopupCallback(url?: string): PromiseLike<any>;

    signinSilent(args?: any): PromiseLike<User>;
    signinSilentCallback(url?: string): PromiseLike<any>;

    signinRedirect(args?: any): PromiseLike<any>;
    signinRedirectCallback(url?: string): PromiseLike<User>;

    signoutRedirect(args?: any): PromiseLike<any>;
    signoutRedirectCallback(url?: string): PromiseLike<any>;

    querySessionStatus(args?: any): PromiseLike<any>;

    events: UserManagerEvents;
}
declare interface UserManagerEvents extends AccessTokenEvents {
    load(user: User): any;
    unload(): any;

    addUserLoaded(callback: (...ev: any[]) => void): void;
    removeUserLoaded(callback: (...ev: any[]) => void): void;

    addUserUnloaded(callback: (...ev: any[]) => void): void;
    removeUserUnloaded(callback: (...ev: any[]) => void): void;

    addSilentRenewError(callback: (...ev: any[]) => void): void;
    removeSilentRenewError(callback: (...ev: any[]) => void): void;

    addUserSignedOut(callback: (...ev: any[]) => void): void;
    removeUserSignedOut(callback: (...ev: any[]) => void): void;
}
declare interface UserManagerSettings extends OidcClientSettings {
    popup_redirect_uri?: string;
    popupWindowFeatures?: string;
    popupWindowTarget?: any;
    silent_redirect_uri?: any;
    automaticSilentRenew?: any;
    accessTokenExpiringNotificationTime?: string;
    redirectNavigator?: any;
    popupNavigator?: any;
    iframeNavigator?: any;
    userStore?: any;
}
declare interface WebStorageStateStore {
    set(key: string, value: any): PromiseLike<void>;

    get(key: string): PromiseLike<any>;

    remove(key: string): PromiseLike<any>;

    getAllKeys(): PromiseLike<string[]>;
}
export declare interface User {
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

    // For when TypeScript 2.0 compiler is more widely used
    // readonly expires_in: number;
    // readonly expired: boolean;
    // readonly scopes: string[];
}


    