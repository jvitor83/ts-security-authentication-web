import { IAuthenticationSettings } from './IAuthenticationSettings';
import { IAuthenticationManagerSettings } from './IAuthenticationManagerSettings';
//require('oidc-token-manager');
//import 'oidc-token-manager/dist/oidc-token-manager.js';
import 'oidc-token-manager';


/**
 * AuthenticationInitializer
 */
export class AuthenticationInitializer 
{
    
    private static _current: AuthenticationInitializer = null;

    public static get Current(): AuthenticationInitializer 
    {
        if(AuthenticationInitializer._current === null)
        {
            AuthenticationInitializer._current =  new AuthenticationInitializer();
        }
        return AuthenticationInitializer._current;
    }
    
    public static Reset()
    {
        AuthenticationInitializer._current = null;
    }

    private oidcTokenManager: Oidc.OidcTokenManager;
        
    constructor() {
        
    }
    
    protected AuthenticationManagerSettings: IAuthenticationManagerSettings = null;
    
    public Init(authenticationSettings: IAuthenticationSettings) 
    {
        if(authenticationSettings.authority == null || authenticationSettings.client_id == null)
        {
            throw "Should be informed at least 'authority' and 'client_id'!";
        }
        
        //Set default values if not informed
        authenticationSettings.client_url = authenticationSettings.client_url || location.href; //Self uri
        authenticationSettings.scopes = authenticationSettings.scopes || 'openid profile email offline_access'; //OpenId default scopes
        authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token'; //Hybrid flow at default
        authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false; //Redirect for default

        
        let localStorage_redirect_uri = localStorage.getItem('redirect_uri');
        let localStorage_silent_redirect_uri = localStorage.getItem('silent_redirect_uri');
        let localStorage_post_logout_redirect_uri = localStorage.getItem('post_logout_redirect_uri');
        
        
        //Convert to the more complete IAuthenticationManagerSettings
        this.AuthenticationManagerSettings = 
        {
            authority: authenticationSettings.authority,
            client_id: authenticationSettings.client_id,
            client_url: authenticationSettings.client_url,
            open_on_popup: authenticationSettings.open_on_popup,
            response_type: authenticationSettings.response_type,
            scopes: authenticationSettings.scopes,
            
            redirect_uri : localStorage_redirect_uri || authenticationSettings.client_url + '?callback=true',
            silent_redirect_uri: localStorage_silent_redirect_uri || authenticationSettings.client_url + "?silentrefreshframe=true",
            post_logout_redirect_uri: localStorage_post_logout_redirect_uri || authenticationSettings.client_url + "index.html",
            
            authorization_url : authenticationSettings.authority + "/connect/authorize",
            token_url : authenticationSettings.authority + "/connect/token",
            userinfo_url: authenticationSettings.authority + "/connect/userinfo"
        };
        
        
        localStorage.setItem('redirect_uri', this.AuthenticationManagerSettings.redirect_uri);
        localStorage.setItem('silent_redirect_uri', this.AuthenticationManagerSettings.silent_redirect_uri);
        localStorage.setItem('post_logout_redirect_uri', this.AuthenticationManagerSettings.post_logout_redirect_uri);
        
        //TODO: se nao foi informado um redirect_uri, monta-se com base em uma convenção (multi plataform aware)
        // let url = window.location.href.split("#")[0];
        // let indexBarra = url.lastIndexOf('/');
        // let enderecoCallback = url;
        // enderecoCallback = enderecoCallback.substr(0, indexBarra) + '/callback.html';
        
        
        let config = {
            authority: this.AuthenticationManagerSettings.authority,
            client_id: this.AuthenticationManagerSettings.client_id,
            load_user_profile: true,
            scope: this.AuthenticationManagerSettings.scopes,
            response_type: this.AuthenticationManagerSettings.response_type,
            
            client_url: this.AuthenticationManagerSettings.client_url,
            
            redirect_uri: this.AuthenticationManagerSettings.redirect_uri,	
            post_logout_redirect_uri: this.AuthenticationManagerSettings.post_logout_redirect_uri,
            silent_redirect_uri: this.AuthenticationManagerSettings.silent_redirect_uri,
            silent_renew: true,
            
            authorization_endpoint: this.AuthenticationManagerSettings.authority + "/connect/authorize", 
            userinfo_endpoint: this.AuthenticationManagerSettings.authority + "/connect/userinfo",
            
            authorization_url : this.AuthenticationManagerSettings.authority + "/connect/authorize",
            token_url : this.AuthenticationManagerSettings.authority + "/connect/token",
            userinfo_url: this.AuthenticationManagerSettings.authority + "/connect/userinfo"
        };
        
        this.oidcTokenManager = new OidcTokenManager(config);
    }
    
    public ProcessTokenCallback()
    {
        this.oidcTokenManager.processTokenCallbackAsync();
        
        this.GenerateTokens();
    }
    
    public RenewTokenSilent()
    {
        this.oidcTokenManager.renewTokenSilentAsync();
        
        this.GenerateTokens();
    }
    
    public LoginAndProcessToken(openOnPopUp?: boolean)
    {
        let shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
        
        //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
        if(location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri)
        {
            this.ProcessTokenCallback();
        }
        //if the actual page is the 'silent_redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'
        else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri)
        {
            this.RenewTokenSilent();
        }
        //if the actual page is the 'client_url', then i consider to make the 'login'
        else if(location.href.substring(0, this.AuthenticationManagerSettings.client_url.length) === this.AuthenticationManagerSettings.client_url)
        {
            this.Login(shouldOpenOnPopUp);
        }
    }
    
    public Login(openOnPopUp?: boolean)
    {
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

    public IsAuthenticated() :boolean
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

    public AccessTokenContent: any = null;  
    public IdentityTokenContent: any = null;
    public ProfileContent: any = null;

    //TODO: Split the parser to another project (package - ts-security-tokens?)
    //Include refactory at the ts-security-identity also
    protected GenerateTokens()
    {
        this.AccessTokenContent = JSON.parse(atob(this.oidcTokenManager.access_token.split('.')[1]));
        this.IdentityTokenContent = JSON.parse(atob(this.oidcTokenManager.id_token.split('.')[1]));
        this.ProfileContent = this.oidcTokenManager.profile;
    }
    

}