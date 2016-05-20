System.register(['oidc-token-manager'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationContextInitializer;
    return {
        setters:[
            function (_1) {}],
        execute: function() {
            /**
             * AuthenticationInitializer
             */
            AuthenticationContextInitializer = (function () {
                function AuthenticationContextInitializer() {
                    this.AccessTokenContent = null;
                    this.IdentityTokenContent = null;
                    this.ProfileContent = null;
                    var authenticationSettingsLoadedFromStorage = this.AuthenticationManagerSettings;
                    if (authenticationSettingsLoadedFromStorage != null) {
                        this.oidcTokenManager = new OidcTokenManager(authenticationSettingsLoadedFromStorage);
                    }
                }
                Object.defineProperty(AuthenticationContextInitializer, "Current", {
                    get: function () {
                        if (AuthenticationContextInitializer._current === null) {
                            AuthenticationContextInitializer._current = new AuthenticationContextInitializer();
                        }
                        return AuthenticationContextInitializer._current;
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationContextInitializer.Reset = function () {
                    AuthenticationContextInitializer._current = null;
                };
                Object.defineProperty(AuthenticationContextInitializer.prototype, "AuthenticationManagerSettings", {
                    get: function () {
                        var authenticationSettingsFromLocalStorage = null;
                        var authenticationSettingsFromLocalStorageStringify = localStorage.getItem('AuthenticationManagerSettings');
                        if (authenticationSettingsFromLocalStorageStringify != null) {
                            authenticationSettingsFromLocalStorage = JSON.parse(authenticationSettingsFromLocalStorageStringify);
                        }
                        return authenticationSettingsFromLocalStorage;
                    },
                    set: function (value) {
                        localStorage.setItem('AuthenticationManagerSettings', JSON.stringify(this.AuthenticationManagerSettings));
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationContextInitializer.prototype.Init = function (authenticationSettings) {
                    if (authenticationSettings.authority == null || authenticationSettings.client_id == null) {
                        throw "Should be informed at least 'authority' and 'client_id'!";
                    }
                    //Set default values if not informed
                    authenticationSettings.client_url = authenticationSettings.client_url || location.href; //Self uri
                    authenticationSettings.scopes = authenticationSettings.scopes || 'openid profile email offline_access'; //OpenId default scopes
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
                            scopes: authenticationSettings.scopes,
                            redirect_uri: authenticationSettings.client_url + '?callback=true',
                            silent_redirect_uri: authenticationSettings.client_url + "?silentrefreshframe=true",
                            post_logout_redirect_uri: authenticationSettings.client_url,
                            authorization_url: authenticationSettings.authority + "/connect/authorize",
                            token_url: authenticationSettings.authority + "/connect/token",
                            userinfo_url: authenticationSettings.authority + "/connect/userinfo",
                            load_user_profile: true,
                            silent_renew: true,
                        };
                    // //TODO: Class to write and read
                    // localStorage.setItem('AuthenticationManagerSettings', JSON.stringify(this.AuthenticationManagerSettings));
                    //TODO: se nao foi informado um redirect_uri, monta-se com base em uma convenção (multi plataform aware)
                    // let url = window.location.href.split("#")[0];
                    // let indexBarra = url.lastIndexOf('/');
                    // let enderecoCallback = url;
                    // enderecoCallback = enderecoCallback.substr(0, indexBarra) + '/callback.html';
                    // let config = {
                    //     authority: this.AuthenticationManagerSettings.authority,
                    //     client_id: this.AuthenticationManagerSettings.client_id,
                    //     load_user_profile: true,
                    //     scope: this.AuthenticationManagerSettings.scopes,
                    //     response_type: this.AuthenticationManagerSettings.response_type,
                    //     client_url: this.AuthenticationManagerSettings.client_url,
                    //     redirect_uri: this.AuthenticationManagerSettings.redirect_uri,	
                    //     post_logout_redirect_uri: this.AuthenticationManagerSettings.post_logout_redirect_uri,
                    //     silent_redirect_uri: this.AuthenticationManagerSettings.silent_redirect_uri,
                    //     silent_renew: true,
                    //     authorization_endpoint: this.AuthenticationManagerSettings.authority + "/connect/authorize", 
                    //     userinfo_endpoint: this.AuthenticationManagerSettings.authority + "/connect/userinfo",
                    //     authorization_url : this.AuthenticationManagerSettings.authority + "/connect/authorize",
                    //     token_url : this.AuthenticationManagerSettings.authority + "/connect/token",
                    //     userinfo_url: this.AuthenticationManagerSettings.authority + "/connect/userinfo"
                    // };
                    this.oidcTokenManager = new OidcTokenManager(this.AuthenticationManagerSettings);
                };
                AuthenticationContextInitializer.prototype.ProcessTokenCallback = function () {
                    this.oidcTokenManager.processTokenCallbackAsync();
                    this.GenerateTokens();
                };
                AuthenticationContextInitializer.prototype.RenewTokenSilent = function () {
                    this.oidcTokenManager.renewTokenSilentAsync();
                    this.GenerateTokens();
                };
                AuthenticationContextInitializer.prototype.LoginAndProcessToken = function (openOnPopUp) {
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
                AuthenticationContextInitializer.prototype.Login = function (openOnPopUp) {
                    //TODO: Treat when in mobile browser to not support popup
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                    if (shouldOpenOnPopUp) {
                        this.oidcTokenManager.openPopupForTokenAsync();
                    }
                    else {
                        this.oidcTokenManager.redirectForToken();
                    }
                };
                Object.defineProperty(AuthenticationContextInitializer.prototype, "IsAuthenticated", {
                    get: function () {
                        this.GenerateTokens();
                        if (this.AccessTokenContent == null) {
                            return false;
                        }
                        else {
                            return true;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                //TODO: Split the parser to another project (package - ts-security-tokens?)
                //Include refactory at the ts-security-identity also
                AuthenticationContextInitializer.prototype.GenerateTokens = function () {
                    if (this.oidcTokenManager != null) {
                        if (this.oidcTokenManager.access_token != null) {
                            var accessTokenContent = this.oidcTokenManager.access_token.split('.')[1];
                            if (accessTokenContent != null) {
                                this.AccessTokenContent = JSON.parse(atob(accessTokenContent));
                            }
                        }
                        if (this.oidcTokenManager.id_token != null) {
                            var identityTokenContent = this.oidcTokenManager.id_token.split('.')[1];
                            if (identityTokenContent != null) {
                                this.AccessTokenContent = JSON.parse(atob(identityTokenContent));
                            }
                        }
                        if (this.oidcTokenManager.profile != null) {
                            this.ProfileContent = this.oidcTokenManager.profile;
                        }
                    }
                    // this.AccessTokenContent = JSON.parse(atob(this.oidcTokenManager.access_token.split('.')[1]));
                    // this.IdentityTokenContent = JSON.parse(atob(this.oidcTokenManager.id_token.split('.')[1]));
                    // this.ProfileContent = this.oidcTokenManager.profile;
                };
                AuthenticationContextInitializer._current = null;
                return AuthenticationContextInitializer;
            }());
            exports_1("AuthenticationContextInitializer", AuthenticationContextInitializer);
        }
    }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHRJbml0aWFsaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztZQU9BOztlQUVHO1lBQ0g7Z0JBc0JJO29CQXFLTyx1QkFBa0IsR0FBUSxJQUFJLENBQUM7b0JBQy9CLHlCQUFvQixHQUFRLElBQUksQ0FBQztvQkFDakMsbUJBQWMsR0FBUSxJQUFJLENBQUM7b0JBcks5QixJQUFJLHVDQUF1QyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQztvQkFDakYsRUFBRSxDQUFBLENBQUMsdUNBQXVDLElBQUksSUFBSSxDQUFDLENBQ25ELENBQUM7d0JBQ0csSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUUsdUNBQXVDLENBQUUsQ0FBQztvQkFDNUYsQ0FBQztnQkFDTCxDQUFDO2dCQXhCRCxzQkFBa0IsMkNBQU87eUJBQXpCO3dCQUVJLEVBQUUsQ0FBQSxDQUFDLGdDQUFnQyxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FDdEQsQ0FBQzs0QkFDRyxnQ0FBZ0MsQ0FBQyxRQUFRLEdBQUksSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO3dCQUN4RixDQUFDO3dCQUNELE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUM7b0JBQ3JELENBQUM7OzttQkFBQTtnQkFHYSxzQ0FBSyxHQUFuQjtvQkFFSSxnQ0FBZ0MsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUNyRCxDQUFDO2dCQWFELHNCQUFjLDJFQUE2Qjt5QkFBM0M7d0JBRUksSUFBSSxzQ0FBc0MsR0FBbUMsSUFBSSxDQUFDO3dCQUNsRixJQUFJLCtDQUErQyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQzt3QkFDNUcsRUFBRSxDQUFBLENBQUMsK0NBQStDLElBQUksSUFBSSxDQUFDLENBQzNELENBQUM7NEJBQ0csc0NBQXNDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxD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LENBQUEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxDQUMxQyxDQUFDOzRCQUNHLElBQUksb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3hFLEVBQUUsQ0FBQSxDQUFDLG9CQUFvQixJQUFJLElBQUksQ0FBQyxDQUNoQyxDQUFDO2dDQUNHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7NEJBQ3JFLENBQUM7d0JBQ0wsQ0FBQzt3QkFFRCxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUN6QyxDQUFDOzRCQUNHLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQzt3QkFDeEQsQ0FBQztvQkFDTCxDQUFDO29CQUVELGdHQUFnRztvQkFDaEcsOEZBQThGO29CQUM5Rix1REFBdUQ7Z0JBQzNELENBQUM7Z0JBN05jLHlDQUFRLEdBQXFDLElBQUksQ0FBQztnQkFnT3JFLHVDQUFDO1lBQUQsQ0FuT0EsQUFtT0MsSUFBQTtZQW5PRCwrRUFtT0MsQ0FBQSIsImZpbGUiOiJzcmMvQXV0aGVudGljYXRpb25Db250ZXh0SW5pdGlhbGl6ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQXV0aGVudGljYXRpb25TZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyc7XHJcbi8vcmVxdWlyZSgnb2lkYy10b2tlbi1tYW5hZ2VyJyk7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXIvZGlzdC9vaWRjLXRva2VuLW1hbmFnZXIuanMnO1xyXG5pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkNvbnRleHRJbml0aWFsaXplciBcclxue1xyXG4gICAgXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3VycmVudDogQXV0aGVudGljYXRpb25Db250ZXh0SW5pdGlhbGl6ZXIgPSBudWxsO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IEN1cnJlbnQoKTogQXV0aGVudGljYXRpb25Db250ZXh0SW5pdGlhbGl6ZXIgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Db250ZXh0SW5pdGlhbGl6ZXIuX2N1cnJlbnQgPT09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBBdXRoZW50aWNhdGlvbkNvbnRleHRJbml0aWFsaXplci5fY3VycmVudCA9ICBuZXcgQXV0aGVudGljYXRpb25Db250ZXh0SW5pdGlhbGl6ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uQ29udGV4dEluaXRpYWxpemVyLl9jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgUmVzZXQoKVxyXG4gICAge1xyXG4gICAgICAgIEF1dGhlbnRpY2F0aW9uQ29udGV4dEluaXRpYWxpemVyLl9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IE9pZGMuT2lkY1Rva2VuTWFuYWdlcjtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSA9IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlciggYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKCk6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJyk7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlID0gSlNPTi5wYXJzZShhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIHNldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyh2YWx1ZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzOiBJQXV0aGVudGljYXRpb25TZXR0aW5ncykgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgPT0gbnVsbCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJTaG91bGQgYmUgaW5mb3JtZWQgYXQgbGVhc3QgJ2F1dGhvcml0eScgYW5kICdjbGllbnRfaWQnIVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL1NldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgaW5mb3JtZWRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgfHwgbG9jYXRpb24uaHJlZjsgLy9TZWxmIHVyaVxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGVzID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMgfHwgJ29wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzJzsgLy9PcGVuSWQgZGVmYXVsdCBzY29wZXNcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgfHwgJ2NvZGUgaWRfdG9rZW4gdG9rZW4nOyAvL0h5YnJpZCBmbG93IGF0IGRlZmF1bHRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgfHwgZmFsc2U7IC8vUmVkaXJlY3QgZm9yIGRlZmF1bHRcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9Db252ZXJ0IHRvIHRoZSBtb3JlIGNvbXBsZXRlIElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5nc1xyXG4gICAgICAgIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHksXHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQsXHJcbiAgICAgICAgICAgIGNsaWVudF91cmw6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgb3Blbl9vbl9wb3B1cDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwLFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIHNjb3BlczogYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZWRpcmVjdF91cmkgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyBcIj9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZVwiLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICAgXHJcbiAgICAgICAgLy8gLy9UT0RPOiBDbGFzcyB0byB3cml0ZSBhbmQgcmVhZFxyXG4gICAgICAgIC8vIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpKTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICAvL1RPRE86IHNlIG5hbyBmb2kgaW5mb3JtYWRvIHVtIHJlZGlyZWN0X3VyaSwgbW9udGEtc2UgY29tIGJhc2UgZW0gdW1hIGNvbnZlbsOnw6NvIChtdWx0aSBwbGF0YWZvcm0gYXdhcmUpXHJcbiAgICAgICAgLy8gbGV0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiI1wiKVswXTtcclxuICAgICAgICAvLyBsZXQgaW5kZXhCYXJyYSA9IHVybC5sYXN0SW5kZXhPZignLycpO1xyXG4gICAgICAgIC8vIGxldCBlbmRlcmVjb0NhbGxiYWNrID0gdXJsO1xyXG4gICAgICAgIC8vIGVuZGVyZWNvQ2FsbGJhY2sgPSBlbmRlcmVjb0NhbGxiYWNrLnN1YnN0cigwLCBpbmRleEJhcnJhKSArICcvY2FsbGJhY2suaHRtbCc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gbGV0IGNvbmZpZyA9IHtcclxuICAgICAgICAvLyAgICAgYXV0aG9yaXR5OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAvLyAgICAgY2xpZW50X2lkOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAvLyAgICAgbG9hZF91c2VyX3Byb2ZpbGU6IHRydWUsXHJcbiAgICAgICAgLy8gICAgIHNjb3BlOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNjb3BlcyxcclxuICAgICAgICAvLyAgICAgcmVzcG9uc2VfdHlwZTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyAgICAgY2xpZW50X3VybDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyAgICAgcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSxcdFxyXG4gICAgICAgIC8vICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpLFxyXG4gICAgICAgIC8vICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmksXHJcbiAgICAgICAgLy8gICAgIHNpbGVudF9yZW5ldzogdHJ1ZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy8gICAgIGF1dGhvcml6YXRpb25fZW5kcG9pbnQ6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIiwgXHJcbiAgICAgICAgLy8gICAgIHVzZXJpbmZvX2VuZHBvaW50OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy8gICAgIGF1dGhvcml6YXRpb25fdXJsIDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgIC8vICAgICB0b2tlbl91cmwgOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAvLyAgICAgdXNlcmluZm9fdXJsOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIlxyXG4gICAgICAgIC8vIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrQXN5bmMoKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLkdlbmVyYXRlVG9rZW5zKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBSZW5ld1Rva2VuU2lsZW50KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5HZW5lcmF0ZVRva2VucygpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW5BbmRQcm9jZXNzVG9rZW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgICAgIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdjbGllbnRfdXJsJywgdGhlbiBpIGNvbnNpZGVyIHRvIG1ha2UgdGhlICdsb2dpbidcclxuICAgICAgICBlbHNlIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybC5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkxvZ2luKHNob3VsZE9wZW5PblBvcFVwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBMb2dpbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgLy9UT0RPOiBUcmVhdCB3aGVuIGluIG1vYmlsZSBicm93c2VyIHRvIG5vdCBzdXBwb3J0IHBvcHVwXHJcbiAgICAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChzaG91bGRPcGVuT25Qb3BVcClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5vcGVuUG9wdXBGb3JUb2tlbkFzeW5jKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICB0aGlzLkdlbmVyYXRlVG9rZW5zKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBBY2Nlc3NUb2tlbkNvbnRlbnQ6IGFueSA9IG51bGw7ICBcclxuICAgIHB1YmxpYyBJZGVudGl0eVRva2VuQ29udGVudDogYW55ID0gbnVsbDtcclxuICAgIHB1YmxpYyBQcm9maWxlQ29udGVudDogYW55ID0gbnVsbDtcclxuXHJcbiAgICAvL1RPRE86IFNwbGl0IHRoZSBwYXJzZXIgdG8gYW5vdGhlciBwcm9qZWN0IChwYWNrYWdlIC0gdHMtc2VjdXJpdHktdG9rZW5zPylcclxuICAgIC8vSW5jbHVkZSByZWZhY3RvcnkgYXQgdGhlIHRzLXNlY3VyaXR5LWlkZW50aXR5IGFsc29cclxuICAgIHByb3RlY3RlZCBHZW5lcmF0ZVRva2VucygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBhY2Nlc3NUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICAgICAgICAgICAgICBpZihhY2Nlc3NUb2tlbkNvbnRlbnQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCA9IEpTT04ucGFyc2UoYXRvYihhY2Nlc3NUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZGVudGl0eVRva2VuQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoaWRlbnRpdHlUb2tlbkNvbnRlbnQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCA9IEpTT04ucGFyc2UoYXRvYihpZGVudGl0eVRva2VuQ29udGVudCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZSAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlByb2ZpbGVDb250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPSBKU09OLnBhcnNlKGF0b2IodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdKSk7XHJcbiAgICAgICAgLy8gdGhpcy5JZGVudGl0eVRva2VuQ29udGVudCA9IEpTT04ucGFyc2UoYXRvYih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXSkpO1xyXG4gICAgICAgIC8vIHRoaXMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZTtcclxuICAgIH1cclxuICAgIFxyXG5cclxufSJdfQ==
