import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
import { IAuthenticationSettings } from './IAuthenticationSettings';
import { Pattern } from './Pattern';

import * as Q from 'q';

import * as Oidc from 'oidc-client';


/**
 * AuthenticationInitializer
 */
export class AuthenticationContext 
{
    
    private static _current: AuthenticationContext = null;

    private callbacksTokenObtained :Array<(user: Oidc.User) => void> = new Array<(user: Oidc.User) => void>();

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

    public AddOnTokenObtained(callback: (user: Oidc.User) => void)
    {
        this.callbacksTokenObtained.push(callback);
        this.oidcTokenManager.events.addUserLoaded(callback);
    }

    public AddOnTokenRenewFailedMaxRetry(callback: () => void)
    {
        this.callbacksTokenRenewFailedRetryMax.push(callback);
        //this.oidcTokenManager.addOnSilentTokenRenewFailed(callback);
    }

    private oidcTokenManager: Oidc.UserManager;
        
    constructor() 
    {
        let authenticationSettingsLoadedFromStorage = this.AuthenticationManagerSettings;
        if(authenticationSettingsLoadedFromStorage != null)
        {
            this.oidcTokenManager = new Oidc.UserManager( authenticationSettingsLoadedFromStorage );
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
        
        if(authenticationSettings.pattern == null)
        {
            authenticationSettings.pattern = Pattern.none;
        }


        
        //Set default values if not informed
        authenticationSettings.client_url = authenticationSettings.client_url; //Self uri

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

            pattern: authenticationSettings.pattern,
            
            redirect_uri : authenticationSettings.client_url,
            silent_redirect_uri: authenticationSettings.client_url,
            post_logout_redirect_uri: authenticationSettings.client_url,
            
            authorization_url : authenticationSettings.authorization_url || authenticationSettings.authority + "/connect/authorize",
            token_url : authenticationSettings.token_url || authenticationSettings.authority + "/connect/token",
            userinfo_url: authenticationSettings.userinfo_url || authenticationSettings.authority + "/connect/userinfo",
            
            loadUserInfo: true,
            automaticSilentRenew: true,
        };


        let pattern = this.AuthenticationManagerSettings.pattern;
        console.debug('User pattern: ' + Pattern[pattern]);
        if(this.AuthenticationManagerSettings.pattern == Pattern.auto)
        {
            let environment :any = null;

            try{
                environment = (<any>window);
            }
            catch(error)
            {
                console.debug('Should not be an environment with a window global (nativescript/node maybe?)');
                console.debug(error);
            }

            if(environment != null)
            {
                if(!!environment.cordova)
                {
                    pattern = Pattern.cordova;
                }
                else if(environment && environment.process && environment.process.type)
                {
                    pattern = Pattern.electron;
                }
                else if((<Window>environment).location.href.indexOf('file:') > -1)
                {
                    pattern = Pattern.ietf;
                }
                else
                {
                    pattern = Pattern.none;
                }
            }
            else
            {
                //TODO: check against node?
                pattern = Pattern.nativescript;
            }
        }

        console.debug('Environment pattern: ' + Pattern[pattern]);

        if(pattern == Pattern.ietf || pattern == Pattern.electron || pattern == Pattern.nativescript)
        {
            let settings = this.AuthenticationManagerSettings;

            settings.client_url = 'urn:ietf:wg:oauth:2.0:oob:auto';

            this.AuthenticationManagerSettings = settings;
        }

        if(pattern == Pattern.cordova)
        {
            let settings = this.AuthenticationManagerSettings;
            
            settings.client_url = 'https://localhost/oidc';
            (<any>settings).popupNavigator = new (<any>Oidc).CordovaPopupNavigator();
            (<any>settings).iframeNavigator = new (<any>Oidc).CordovaIFrameNavigator();

            this.AuthenticationManagerSettings = settings;
        }

        console.debug('ClientUrl: ' + authenticationSettings.client_url);

        let userManagerSettings :Oidc.UserManagerSettings = this.AuthenticationManagerSettings;

        this.oidcTokenManager = new Oidc.UserManager(userManagerSettings);

        // this.oidcTokenManager.events.addUserLoaded(() => {
        //     this.AuthenticationManagerSettings.is_authenticated = true;
        //     this.AuthenticationManagerSettings = this.AuthenticationManagerSettings;
        // });
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
    




    protected ProcessTokenIfNeeded() : PromiseLike<Oidc.User>
    {
        return this.IsAuthenticated.then(isAuthenticated => {

            if (location.href.indexOf('access_token=') > -1 && (isAuthenticated || location.href.indexOf('prompt=none') > -1)) {
                console.debug('Processing token! (silently)');
                return this.oidcTokenManager.signinSilentCallback();
            } else 

            //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
            //if(location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri)
            if(location.href.indexOf('access_token=') > -1)
            {
                console.debug('Processing token!');
                return this.ProcessTokenCallback();
            }

            let qPromise = Q.resolve(null);
            return qPromise;
        });
        

        
        // //if the actual page is the 'silent_redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'
        // else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri)
        // {
        //     this.RenewTokenSilent();
        // }

    }
    
    public Init(authenticationSettings?: IAuthenticationSettings) : PromiseLike<Oidc.User>
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

        return this.IsAuthenticated.then((isAuthenticated) => {

            if(isAuthenticated === false)
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
                return this.oidcTokenManager.getUser().then((user) => {
                    this.callbacksTokenObtained.forEach((callback) => {
                        callback(user);
                    });
                });
            }

        });
        

    }

    public get IsAuthenticated() :PromiseLike<boolean>
    {
        return this.oidcTokenManager.getUser().then(user => user != null);
        
        // let isAuthenticated : boolean = false;

        // if(this.AuthenticationManagerSettings != null && this.AuthenticationManagerSettings.is_authenticated != null)
        // {
        //     isAuthenticated = this.AuthenticationManagerSettings.is_authenticated;
        // }

        // return isAuthenticated;



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

