System.register(['oidc-token-manager'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationInitializer;
    return {
        setters:[
            function (_1) {}],
        execute: function() {
            /**
             * AuthenticationInitializer
             */
            AuthenticationInitializer = (function () {
                function AuthenticationInitializer() {
                    this.AuthenticationManagerSettings = null;
                    this.AccessTokenContent = null;
                    this.IdentityTokenContent = null;
                    this.ProfileContent = null;
                }
                Object.defineProperty(AuthenticationInitializer, "Current", {
                    get: function () {
                        if (AuthenticationInitializer._current === null) {
                            AuthenticationInitializer._current = new AuthenticationInitializer();
                        }
                        return AuthenticationInitializer._current;
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationInitializer.Reset = function () {
                    AuthenticationInitializer._current = null;
                };
                AuthenticationInitializer.prototype.Init = function (authenticationSettings) {
                    if (authenticationSettings.authority == null || authenticationSettings.client_id == null) {
                        throw "Should be informed at least 'authority' and 'client_id'!";
                    }
                    //Set default values if not informed
                    authenticationSettings.client_url = authenticationSettings.client_url || location.href; //Self uri
                    authenticationSettings.scopes = authenticationSettings.scopes || 'openid profile email offline_access'; //OpenId default scopes
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token'; //Hybrid flow at default
                    authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false; //Redirect for default
                    var localStorage_redirect_uri = localStorage.getItem('redirect_uri');
                    var localStorage_silent_redirect_uri = localStorage.getItem('silent_redirect_uri');
                    var localStorage_post_logout_redirect_uri = localStorage.getItem('post_logout_redirect_uri');
                    //Convert to the more complete IAuthenticationManagerSettings
                    this.AuthenticationManagerSettings =
                        {
                            authority: authenticationSettings.authority,
                            client_id: authenticationSettings.client_id,
                            client_url: authenticationSettings.client_url,
                            open_on_popup: authenticationSettings.open_on_popup,
                            response_type: authenticationSettings.response_type,
                            scopes: authenticationSettings.scopes,
                            redirect_uri: localStorage_redirect_uri || authenticationSettings.client_url + '?callback=true',
                            silent_redirect_uri: localStorage_silent_redirect_uri || authenticationSettings.client_url + "?silentrefreshframe=true",
                            post_logout_redirect_uri: localStorage_post_logout_redirect_uri || authenticationSettings.client_url + "index.html",
                            authorization_url: authenticationSettings.authority + "/connect/authorize",
                            token_url: authenticationSettings.authority + "/connect/token",
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
                    var config = {
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
                        authorization_url: this.AuthenticationManagerSettings.authority + "/connect/authorize",
                        token_url: this.AuthenticationManagerSettings.authority + "/connect/token",
                        userinfo_url: this.AuthenticationManagerSettings.authority + "/connect/userinfo"
                    };
                    this.oidcTokenManager = new OidcTokenManager(config);
                };
                AuthenticationInitializer.prototype.ProcessTokenCallback = function () {
                    this.oidcTokenManager.processTokenCallbackAsync();
                    this.GenerateTokens();
                };
                AuthenticationInitializer.prototype.RenewTokenSilent = function () {
                    this.oidcTokenManager.renewTokenSilentAsync();
                    this.GenerateTokens();
                };
                AuthenticationInitializer.prototype.LoginAndProcessToken = function (openOnPopUp) {
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                    //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
                    if (location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri) {
                        this.ProcessTokenCallback();
                    }
                    else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri) {
                        this.RenewTokenSilent();
                    }
                    else if (location.href.substring(0, this.AuthenticationManagerSettings.client_url.length) === this.AuthenticationManagerSettings.client_url) {
                        this.Login(shouldOpenOnPopUp);
                    }
                };
                AuthenticationInitializer.prototype.Login = function (openOnPopUp) {
                    //TODO: Treat when in mobile browser to not support popup
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                    if (shouldOpenOnPopUp) {
                        this.oidcTokenManager.openPopupForTokenAsync();
                    }
                    else {
                        this.oidcTokenManager.redirectForToken();
                    }
                };
                //TODO: Split the parser to another project (package - ts-security-tokens?)
                //Include refactory at the ts-security-identity also
                AuthenticationInitializer.prototype.GenerateTokens = function () {
                    this.AccessTokenContent = JSON.parse(atob(this.oidcTokenManager.access_token.split('.')[1]));
                    this.IdentityTokenContent = JSON.parse(atob(this.oidcTokenManager.id_token.split('.')[1]));
                    this.ProfileContent = this.oidcTokenManager.profile;
                };
                AuthenticationInitializer._current = null;
                return AuthenticationInitializer;
            }());
            exports_1("AuthenticationInitializer", AuthenticationInitializer);
        }
    }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1lBT0E7O2VBRUc7WUFDSDtnQkFxQkk7b0JBSVUsa0NBQTZCLEdBQW1DLElBQUksQ0FBQztvQkErSHhFLHVCQUFrQixHQUFRLElBQUksQ0FBQztvQkFDL0IseUJBQW9CLEdBQVEsSUFBSSxDQUFDO29CQUNqQyxtQkFBYyxHQUFRLElBQUksQ0FBQztnQkFuSWxDLENBQUM7Z0JBbEJELHNCQUFrQixvQ0FBTzt5QkFBekI7d0JBRUksRUFBRSxDQUFBLENBQUMseUJBQXlCLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUMvQyxDQUFDOzRCQUNHLHlCQUF5QixDQUFDLFFBQVEsR0FBSSxJQUFJLHlCQUF5QixFQUFFLENBQUM7d0JBQzFFLENBQUM7d0JBQ0QsTUFBTSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQztvQkFDOUMsQ0FBQzs7O21CQUFBO2dCQUVhLCtCQUFLLEdBQW5CO29CQUVJLHlCQUF5QixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzlDLENBQUM7Z0JBVU0sd0NBQUksR0FBWCxVQUFZLHNCQUErQztvQkFFdkQsRUFBRSxDQUFBLENBQUMsc0JBQXNCLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxzQkFBc0IsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLENBQ3hGLENBQUM7d0JBQ0csTUFBTSwwREFBMEQsQ0FBQztvQkFDckUsQ0FBQztvQkFFRCxvQ0FBb0M7b0JBQ3BDLHNCQUFzQixDQUFDLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVU7b0JBQ2xHLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLElBQUkscUNBQXFDLENBQUMsQ0FBQyx1QkFBdUI7b0JBQy9ILHNCQUFzQixDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLElB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QkFDeEQsQ0FBQztnQkFoS2Msa0NBQVEsR0FBOEIsSUFBSSxDQUFDO2dCQW1LOUQsZ0NBQUM7WUFBRCxDQXRLQSxBQXNLQyxJQUFBO1lBdEtELGlFQXNLQyxDQUFBIiwiZmlsZSI6InNyYy9BdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIH0gZnJvbSAnLi9JQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnO1xyXG4vL3JlcXVpcmUoJ29pZGMtdG9rZW4tbWFuYWdlcicpO1xyXG4vL2ltcG9ydCAnb2lkYy10b2tlbi1tYW5hZ2VyL2Rpc3Qvb2lkYy10b2tlbi1tYW5hZ2VyLmpzJztcclxuaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXInO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25Jbml0aWFsaXplciBcclxue1xyXG4gICAgXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3VycmVudDogQXV0aGVudGljYXRpb25Jbml0aWFsaXplciA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyIFxyXG4gICAge1xyXG4gICAgICAgIGlmKEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuX2N1cnJlbnQgPT09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLl9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLl9jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIFJlc2V0KClcclxuICAgIHtcclxuICAgICAgICBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLl9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IE9pZGMuT2lkY1Rva2VuTWFuYWdlcjtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICBcclxuICAgIHB1YmxpYyBJbml0KGF1dGhlbnRpY2F0aW9uU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvblNldHRpbmdzKSBcclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSA9PSBudWxsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIlNob3VsZCBiZSBpbmZvcm1lZCBhdCBsZWFzdCAnYXV0aG9yaXR5JyBhbmQgJ2NsaWVudF9pZCchXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vU2V0IGRlZmF1bHQgdmFsdWVzIGlmIG5vdCBpbmZvcm1lZFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCB8fCBsb2NhdGlvbi5ocmVmOyAvL1NlbGYgdXJpXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlcyB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCB8fCBmYWxzZTsgLy9SZWRpcmVjdCBmb3IgZGVmYXVsdFxyXG5cclxuICAgICAgICBcclxuICAgICAgICBsZXQgbG9jYWxTdG9yYWdlX3JlZGlyZWN0X3VyaSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdyZWRpcmVjdF91cmknKTtcclxuICAgICAgICBsZXQgbG9jYWxTdG9yYWdlX3NpbGVudF9yZWRpcmVjdF91cmkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2lsZW50X3JlZGlyZWN0X3VyaScpO1xyXG4gICAgICAgIGxldCBsb2NhbFN0b3JhZ2VfcG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Bvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vQ29udmVydCB0byB0aGUgbW9yZSBjb21wbGV0ZSBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3NcclxuICAgICAgICB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIG9wZW5fb25fcG9wdXA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCxcclxuICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBzY29wZXM6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGVzLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpIDogbG9jYWxTdG9yYWdlX3JlZGlyZWN0X3VyaSB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBsb2NhbFN0b3JhZ2Vfc2lsZW50X3JlZGlyZWN0X3VyaSB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyBcIj9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZVwiLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGxvY2FsU3RvcmFnZV9wb3N0X2xvZ291dF9yZWRpcmVjdF91cmkgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsICsgXCJpbmRleC5odG1sXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uX3VybCA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCJcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdyZWRpcmVjdF91cmknLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3NpbGVudF9yZWRpcmVjdF91cmknLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwb3N0X2xvZ291dF9yZWRpcmVjdF91cmknLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UT0RPOiBzZSBuYW8gZm9pIGluZm9ybWFkbyB1bSByZWRpcmVjdF91cmksIG1vbnRhLXNlIGNvbSBiYXNlIGVtIHVtYSBjb252ZW7Dp8OjbyAobXVsdGkgcGxhdGFmb3JtIGF3YXJlKVxyXG4gICAgICAgIC8vIGxldCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIiNcIilbMF07XHJcbiAgICAgICAgLy8gbGV0IGluZGV4QmFycmEgPSB1cmwubGFzdEluZGV4T2YoJy8nKTtcclxuICAgICAgICAvLyBsZXQgZW5kZXJlY29DYWxsYmFjayA9IHVybDtcclxuICAgICAgICAvLyBlbmRlcmVjb0NhbGxiYWNrID0gZW5kZXJlY29DYWxsYmFjay5zdWJzdHIoMCwgaW5kZXhCYXJyYSkgKyAnL2NhbGxiYWNrLmh0bWwnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHksXHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfaWQsXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzY29wZTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zY29wZXMsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlX3R5cGU6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVzcG9uc2VfdHlwZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNsaWVudF91cmw6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlZGlyZWN0X3VyaTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmksXHRcclxuICAgICAgICAgICAgcG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaSxcclxuICAgICAgICAgICAgc2lsZW50X3JlZGlyZWN0X3VyaTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uX2VuZHBvaW50OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvYXV0aG9yaXplXCIsIFxyXG4gICAgICAgICAgICB1c2VyaW5mb19lbmRwb2ludDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uX3VybCA6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCJcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlciA9IG5ldyBPaWRjVG9rZW5NYW5hZ2VyKGNvbmZpZyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrQXN5bmMoKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLkdlbmVyYXRlVG9rZW5zKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBSZW5ld1Rva2VuU2lsZW50KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5HZW5lcmF0ZVRva2VucygpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW5BbmRQcm9jZXNzVG9rZW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgICAgIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdjbGllbnRfdXJsJywgdGhlbiBpIGNvbnNpZGVyIHRvIG1ha2UgdGhlICdsb2dpbidcclxuICAgICAgICBlbHNlIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybC5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkxvZ2luKHNob3VsZE9wZW5PblBvcFVwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBMb2dpbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgLy9UT0RPOiBUcmVhdCB3aGVuIGluIG1vYmlsZSBicm93c2VyIHRvIG5vdCBzdXBwb3J0IHBvcHVwXHJcbiAgICAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChzaG91bGRPcGVuT25Qb3BVcClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5vcGVuUG9wdXBGb3JUb2tlbkFzeW5jKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBBY2Nlc3NUb2tlbkNvbnRlbnQ6IGFueSA9IG51bGw7ICBcclxuICAgIHB1YmxpYyBJZGVudGl0eVRva2VuQ29udGVudDogYW55ID0gbnVsbDtcclxuICAgIHB1YmxpYyBQcm9maWxlQ29udGVudDogYW55ID0gbnVsbDtcclxuXHJcbiAgICAvL1RPRE86IFNwbGl0IHRoZSBwYXJzZXIgdG8gYW5vdGhlciBwcm9qZWN0IChwYWNrYWdlIC0gdHMtc2VjdXJpdHktdG9rZW5zPylcclxuICAgIC8vSW5jbHVkZSByZWZhY3RvcnkgYXQgdGhlIHRzLXNlY3VyaXR5LWlkZW50aXR5IGFsc29cclxuICAgIHByb3RlY3RlZCBHZW5lcmF0ZVRva2VucygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPSBKU09OLnBhcnNlKGF0b2IodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdKSk7XHJcbiAgICAgICAgdGhpcy5JZGVudGl0eVRva2VuQ29udGVudCA9IEpTT04ucGFyc2UoYXRvYih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXSkpO1xyXG4gICAgICAgIHRoaXMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZTtcclxuICAgIH1cclxuICAgIFxyXG5cclxufSJdfQ==
