import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
//require('oidc-token-manager');
//import 'oidc-token-manager/dist/oidc-token-manager.js';
import * as Q from 'q';
import 'oidc-token-manager';


/**
 * AuthenticationInitializer
 */
export class AuthenticationContext 
{
    
    private static _current: AuthenticationContext = null;

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

    private oidcTokenManager: Oidc.OidcTokenManager;
        
    constructor() 
    {
        let authenticationSettingsLoadedFromStorage = this.AuthenticationManagerSettings;
        if(authenticationSettingsLoadedFromStorage != null)
        {
            this.oidcTokenManager = new OidcTokenManager( authenticationSettingsLoadedFromStorage );
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
    
    protected Initialize(authenticationSettings: IAuthenticationSettings): Q.IPromise<void>
    {
        if(authenticationSettings.authority == null || authenticationSettings.client_id == null)
        {
            throw "Should be informed at least 'authority' and 'client_id'!";
        }
        
        //Set default values if not informed
        authenticationSettings.client_url = authenticationSettings.client_url || location.href; //Self uri
        authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access'; //OpenId default scopes
        authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token'; //Hybrid flow at default
        authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false; //Redirect for default

        //Convert to the more complete IAuthenticationManagerSettings
        this.AuthenticationManagerSettings = 
        {
            authority: authenticationSettings.authority,
            client_id: authenticationSettings.client_id,
            client_url: authenticationSettings.client_url,
            open_on_popup: authenticationSettings.open_on_popup,
            response_type: authenticationSettings.response_type,
            scope: authenticationSettings.scope,
            
            redirect_uri : authenticationSettings.client_url + '?callback=true',
            silent_redirect_uri: authenticationSettings.client_url + "?silentrefreshframe=true",
            post_logout_redirect_uri: authenticationSettings.client_url,
            
            authorization_url : authenticationSettings.authority + "/connect/authorize",
            token_url : authenticationSettings.authority + "/connect/token",
            userinfo_url: authenticationSettings.authority + "/connect/userinfo",
            
            load_user_profile: true,
            silent_renew: true,
        };
        
        this.oidcTokenManager = new OidcTokenManager(this.AuthenticationManagerSettings);
        
        return this.ProcessTokenIfNeeded();
    }
    
    protected ProcessTokenIfNeeded() : Q.IPromise<void>
    {
        
        //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
        //if(location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri)
        if(location.href.indexOf('access_token=') > -1)
        {
            console.log('Processing token!');
            return this.ProcessTokenCallback();
        }
        // //if the actual page is the 'silent_redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'
        // else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri)
        // {
        //     this.RenewTokenSilent();
        // }
        //Go Horse
        else
        {
            let defer = Q.defer<void>();
            defer.resolve();
            return defer.promise;
        }
    }
    
    public Init(authenticationSettings: IAuthenticationSettings, force = false) : Q.IPromise<void>
    {
        if(this.IsInitialized === false || force === true)
        {
            return this.Initialize(authenticationSettings);
        }
    }
    
    public ProcessTokenCallback() : Q.IPromise<void>
    {
        
        
        this.ValidateInitialization();
        
        
        
        
        let defer = Q.defer<void>();
        
        this.oidcTokenManager.processTokenCallbackAsync()
        .then(
            () => {
                this.RedirectToInitialPage();
                
                defer.resolve();
            },
            (error) => {
                let message = "Problem Getting Token : " + (error.message || error); 
                
                defer.reject(message);
            }
        );
        
        return defer.promise;
        
        
        
        
        
        
        
        
        
        
        // this.oidcTokenManager.processTokenCallbackAsync()
        // .then(
        //     () => {
        //         this.RedirectToInitialPage();
        //     },
        //     (error) => {
        //         alert("Problem Getting Token : " + (error.message || error));
        //     }
        // );
        
    }
    
    public RenewTokenSilent()
    {
        this.ValidateInitialization();
        
        this.oidcTokenManager.renewTokenSilentAsync().then(
            () => {
                
            },
            (error) => {
                alert("Problem Getting Token : " + (error.message || error));
            }
        );
    }
    
    protected RedirectToInitialPage()
    {
        location.assign(this.AuthenticationManagerSettings.client_url);
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
    
    public Login(openOnPopUp?: boolean)
    {
        if(this.IsAuthenticated === false)
        {
            this.ValidateInitialization();
            
            //TODO: Treat when in mobile browser to not support popup
            let shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
            
            if (shouldOpenOnPopUp)
            {
                this.oidcTokenManager.openPopupForTokenAsync();
            }
            else
            {
                this.oidcTokenManager.redirectForToken();
            }
        }
        else
        {
            console.warn('Already authenticated');
        }
    }

    public get IsAuthenticated() :boolean
    {
        if(this.AccessTokenContent == null)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    public get AccessTokenContent(): any 
    {
        if(this.oidcTokenManager != null)
        {
            if(this.oidcTokenManager.access_token != null)
            {
                let accessTokenContent = this.oidcTokenManager.access_token.split('.')[1];
                if(accessTokenContent != null)
                {
                    let valor =  JSON.parse(atob(accessTokenContent));
                    return valor;
                }
            }
        }
        return null;
    }
    
    public get IdentityTokenContent(): any
    {
        if(this.oidcTokenManager != null)
        {
            if(this.oidcTokenManager.id_token != null)
            {
                let identityTokenContent = this.oidcTokenManager.id_token.split('.')[1];
                if(identityTokenContent != null)
                {
                    let valor = JSON.parse(atob(identityTokenContent));
                    return valor;
                }
            }
        }
    }
    
    public get ProfileContent(): any
    {
        if(this.oidcTokenManager != null)
        {
            if(this.oidcTokenManager.profile != null)
            {
                let valor = this.oidcTokenManager.profile;
                return valor;
            }
        }
        return null;
    }

    // //TODO: Split the parser to another project (package - ts-security-tokens?)
    // //Include refactory at the ts-security-identity also
    // protected GenerateTokens()
    // {

            
    //         if(this.oidcTokenManager.profile != null)
    //         {
    //             this.ProfileContent = this.oidcTokenManager.profile;
    //         }
    //     }
        
    //     // this.AccessTokenContent = JSON.parse(atob(this.oidcTokenManager.access_token.split('.')[1]));
    //     // this.IdentityTokenContent = JSON.parse(atob(this.oidcTokenManager.id_token.split('.')[1]));
    //     // this.ProfileContent = this.oidcTokenManager.profile;
    // }
    

}