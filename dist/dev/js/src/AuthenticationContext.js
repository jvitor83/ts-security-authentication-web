System.register(['oidc-token-manager'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationContext;
    return {
        setters:[
            function (_1) {}],
        execute: function() {
            /**
             * AuthenticationInitializer
             */
            AuthenticationContext = (function () {
                function AuthenticationContext() {
                    var authenticationSettingsLoadedFromStorage = this.AuthenticationManagerSettings;
                    if (authenticationSettingsLoadedFromStorage != null) {
                        this.oidcTokenManager = new OidcTokenManager(authenticationSettingsLoadedFromStorage);
                    }
                }
                Object.defineProperty(AuthenticationContext, "Current", {
                    get: function () {
                        if (AuthenticationContext._current === null) {
                            AuthenticationContext._current = new AuthenticationContext();
                        }
                        return AuthenticationContext._current;
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationContext.Reset = function () {
                    AuthenticationContext._current = null;
                };
                Object.defineProperty(AuthenticationContext.prototype, "AuthenticationManagerSettings", {
                    get: function () {
                        var authenticationSettingsFromLocalStorage = null;
                        var authenticationSettingsFromLocalStorageStringify = localStorage.getItem('AuthenticationManagerSettings');
                        if (authenticationSettingsFromLocalStorageStringify != null) {
                            authenticationSettingsFromLocalStorage = JSON.parse(authenticationSettingsFromLocalStorageStringify);
                        }
                        return authenticationSettingsFromLocalStorage;
                    },
                    set: function (value) {
                        localStorage.setItem('AuthenticationManagerSettings', JSON.stringify(value));
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationContext.prototype.Init = function (authenticationSettings) {
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
                AuthenticationContext.prototype.ProcessTokenCallback = function () {
                    this.ValidateInitialization();
                    this.oidcTokenManager.processTokenCallbackAsync();
                };
                AuthenticationContext.prototype.RenewTokenSilent = function () {
                    this.ValidateInitialization();
                    this.oidcTokenManager.renewTokenSilentAsync();
                };
                AuthenticationContext.prototype.ValidateInitialization = function () {
                    if (this.AuthenticationManagerSettings == null) {
                        throw "AuthenticationContext uninitialized!";
                    }
                };
                AuthenticationContext.prototype.LoginAndProcessToken = function (openOnPopUp) {
                    this.ValidateInitialization();
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
                AuthenticationContext.prototype.Login = function (openOnPopUp) {
                    this.ValidateInitialization();
                    //TODO: Treat when in mobile browser to not support popup
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                    if (shouldOpenOnPopUp) {
                        this.oidcTokenManager.openPopupForTokenAsync();
                    }
                    else {
                        this.oidcTokenManager.redirectForToken();
                    }
                };
                Object.defineProperty(AuthenticationContext.prototype, "IsAuthenticated", {
                    get: function () {
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
                Object.defineProperty(AuthenticationContext.prototype, "AccessTokenContent", {
                    get: function () {
                        if (this.oidcTokenManager != null) {
                            if (this.oidcTokenManager.access_token != null) {
                                var accessTokenContent = this.oidcTokenManager.access_token.split('.')[1];
                                if (accessTokenContent != null) {
                                    var valor = JSON.parse(atob(accessTokenContent));
                                    return valor;
                                }
                            }
                        }
                        return null;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(AuthenticationContext.prototype, "IdentityTokenContent", {
                    get: function () {
                        if (this.oidcTokenManager != null) {
                            if (this.oidcTokenManager.id_token != null) {
                                var identityTokenContent = this.oidcTokenManager.id_token.split('.')[1];
                                if (identityTokenContent != null) {
                                    var valor = JSON.parse(atob(identityTokenContent));
                                    return valor;
                                }
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(AuthenticationContext.prototype, "ProfileContent", {
                    get: function () {
                        if (this.oidcTokenManager != null) {
                            if (this.oidcTokenManager.profile != null) {
                                var valor = this.oidcTokenManager.profile;
                                return valor;
                            }
                        }
                        return null;
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationContext._current = null;
                return AuthenticationContext;
            }());
            exports_1("AuthenticationContext", AuthenticationContext);
        }
    }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7WUFPQTs7ZUFFRztZQUNIO2dCQXNCSTtvQkFFSSxJQUFJLHVDQUF1QyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQztvQkFDakYsRUFBRSxDQUFBLENBQUMsdUNBQXVDLElBQUksSUFBSSxDQUFDLENBQ25ELENBQUM7d0JBQ0csSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUUsdUNBQXVDLENBQUUsQ0FBQztvQkFDNUYsQ0FBQztnQkFDTCxDQUFDO2dCQXhCRCxzQkFBa0IsZ0NBQU87eUJBQXpCO3dCQUVJLEVBQUUsQ0FBQSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FDM0MsQ0FBQzs0QkFDRyxxQkFBcUIsQ0FBQyxRQUFRLEdBQUksSUFBSSxxQkFBcUIsRUFBRSxDQUFDO3dCQUNsRSxDQUFDO3dCQUNELE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUM7b0JBQzFDLENBQUM7OzttQkFBQTtnQkFHYSwyQkFBSyxHQUFuQjtvQkFFSSxxQkFBcUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUMxQyxDQUFDO2dCQWFELHNCQUFjLGdFQUE2Qjt5QkFBM0M7d0JBRUksSUFBSSxzQ0FBc0MsR0FBbUMsSUFBSSxDQUFDO3dCQUNsRixJQUFJLCtDQUErQyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQzt3QkFDNUcsRUFBRSxDQUFBLENBQUMsK0NBQStDLElBQUksSUFBSSxDQUFDLENBQzNELENBQUM7NEJBQ0csc0NBQXNDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO3dCQUN6RyxDQUFDO3dCQUNELE1BQU0sQ0FBQyxzQ0FBc0MsQ0FBQztvQkFDbEQsQ0FBQzt5QkFFRCxVQUE0QyxLQUFxQzt3QkFFN0UsWUFBWSxDQUFDLE9BQU8sQ0FB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MEIsSUFBSSxDQUFDO2dCQW9RMUQsNEJBQUM7WUFBRCxDQXZRQSxBQXVRQyxJQUFBO1lBdlFELHlEQXVRQyxDQUFBIiwiZmlsZSI6InNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQXV0aGVudGljYXRpb25TZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyc7XHJcbi8vcmVxdWlyZSgnb2lkYy10b2tlbi1tYW5hZ2VyJyk7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXIvZGlzdC9vaWRjLXRva2VuLW1hbmFnZXIuanMnO1xyXG5pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbntcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2N1cnJlbnQ6IEF1dGhlbnRpY2F0aW9uQ29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkNvbnRleHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIFJlc2V0KClcclxuICAgIHtcclxuICAgICAgICBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb2lkY1Rva2VuTWFuYWdlcjogT2lkYy5PaWRjVG9rZW5NYW5hZ2VyO1xyXG4gICAgICAgIFxyXG4gICAgY29uc3RydWN0b3IoKSBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlID0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncztcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlciA9IG5ldyBPaWRjVG9rZW5NYW5hZ2VyKCBhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MoKTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gbnVsbDtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnKTtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2UgPSBKU09OLnBhcnNlKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgc2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKHZhbHVlOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJywgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzOiBJQXV0aGVudGljYXRpb25TZXR0aW5ncykgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgPT0gbnVsbCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJTaG91bGQgYmUgaW5mb3JtZWQgYXQgbGVhc3QgJ2F1dGhvcml0eScgYW5kICdjbGllbnRfaWQnIVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL1NldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgaW5mb3JtZWRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgfHwgbG9jYXRpb24uaHJlZjsgLy9TZWxmIHVyaVxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGVzID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMgfHwgJ29wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzJzsgLy9PcGVuSWQgZGVmYXVsdCBzY29wZXNcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgfHwgJ2NvZGUgaWRfdG9rZW4gdG9rZW4nOyAvL0h5YnJpZCBmbG93IGF0IGRlZmF1bHRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgfHwgZmFsc2U7IC8vUmVkaXJlY3QgZm9yIGRlZmF1bHRcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9Db252ZXJ0IHRvIHRoZSBtb3JlIGNvbXBsZXRlIElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5nc1xyXG4gICAgICAgIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHksXHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQsXHJcbiAgICAgICAgICAgIGNsaWVudF91cmw6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgb3Blbl9vbl9wb3B1cDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwLFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIHNjb3BlczogYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZWRpcmVjdF91cmkgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyBcIj9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZVwiLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICAgXHJcbiAgICAgICAgLy8gLy9UT0RPOiBDbGFzcyB0byB3cml0ZSBhbmQgcmVhZFxyXG4gICAgICAgIC8vIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpKTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICAvL1RPRE86IHNlIG5hbyBmb2kgaW5mb3JtYWRvIHVtIHJlZGlyZWN0X3VyaSwgbW9udGEtc2UgY29tIGJhc2UgZW0gdW1hIGNvbnZlbsOnw6NvIChtdWx0aSBwbGF0YWZvcm0gYXdhcmUpXHJcbiAgICAgICAgLy8gbGV0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiI1wiKVswXTtcclxuICAgICAgICAvLyBsZXQgaW5kZXhCYXJyYSA9IHVybC5sYXN0SW5kZXhPZignLycpO1xyXG4gICAgICAgIC8vIGxldCBlbmRlcmVjb0NhbGxiYWNrID0gdXJsO1xyXG4gICAgICAgIC8vIGVuZGVyZWNvQ2FsbGJhY2sgPSBlbmRlcmVjb0NhbGxiYWNrLnN1YnN0cigwLCBpbmRleEJhcnJhKSArICcvY2FsbGJhY2suaHRtbCc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gbGV0IGNvbmZpZyA9IHtcclxuICAgICAgICAvLyAgICAgYXV0aG9yaXR5OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAvLyAgICAgY2xpZW50X2lkOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAvLyAgICAgbG9hZF91c2VyX3Byb2ZpbGU6IHRydWUsXHJcbiAgICAgICAgLy8gICAgIHNjb3BlOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNjb3BlcyxcclxuICAgICAgICAvLyAgICAgcmVzcG9uc2VfdHlwZTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyAgICAgY2xpZW50X3VybDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyAgICAgcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSxcdFxyXG4gICAgICAgIC8vICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpLFxyXG4gICAgICAgIC8vICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmksXHJcbiAgICAgICAgLy8gICAgIHNpbGVudF9yZW5ldzogdHJ1ZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy8gICAgIGF1dGhvcml6YXRpb25fZW5kcG9pbnQ6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIiwgXHJcbiAgICAgICAgLy8gICAgIHVzZXJpbmZvX2VuZHBvaW50OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy8gICAgIGF1dGhvcml6YXRpb25fdXJsIDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgIC8vICAgICB0b2tlbl91cmwgOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAvLyAgICAgdXNlcmluZm9fdXJsOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIlxyXG4gICAgICAgIC8vIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrQXN5bmMoKTtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIFJlbmV3VG9rZW5TaWxlbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKTtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXV0aGVudGljYXRpb25Db250ZXh0IHVuaW5pdGlhbGl6ZWQhXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW5BbmRQcm9jZXNzVG9rZW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgICAgIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdjbGllbnRfdXJsJywgdGhlbiBpIGNvbnNpZGVyIHRvIG1ha2UgdGhlICdsb2dpbidcclxuICAgICAgICBlbHNlIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybC5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkxvZ2luKHNob3VsZE9wZW5PblBvcFVwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBMb2dpbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UT0RPOiBUcmVhdCB3aGVuIGluIG1vYmlsZSBicm93c2VyIHRvIG5vdCBzdXBwb3J0IHBvcHVwXHJcbiAgICAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChzaG91bGRPcGVuT25Qb3BVcClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5vcGVuUG9wdXBGb3JUb2tlbkFzeW5jKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55IFxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoYWNjZXNzVG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gIEpTT04ucGFyc2UoYXRvYihhY2Nlc3NUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBnZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkZW50aXR5VG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICAgICAgICAgICAgICBpZihpZGVudGl0eVRva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IEpTT04ucGFyc2UoYXRvYihpZGVudGl0eVRva2VuQ29udGVudCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWxvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC8vVE9ETzogU3BsaXQgdGhlIHBhcnNlciB0byBhbm90aGVyIHByb2plY3QgKHBhY2thZ2UgLSB0cy1zZWN1cml0eS10b2tlbnM/KVxyXG4gICAgLy8gLy9JbmNsdWRlIHJlZmFjdG9yeSBhdCB0aGUgdHMtc2VjdXJpdHktaWRlbnRpdHkgYWxzb1xyXG4gICAgLy8gcHJvdGVjdGVkIEdlbmVyYXRlVG9rZW5zKClcclxuICAgIC8vIHtcclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgLy8gICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZSAhPSBudWxsKVxyXG4gICAgLy8gICAgICAgICB7XHJcbiAgICAvLyAgICAgICAgICAgICB0aGlzLlByb2ZpbGVDb250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAvLyAgICAgICAgIH1cclxuICAgIC8vICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgLy8gdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPSBKU09OLnBhcnNlKGF0b2IodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdKSk7XHJcbiAgICAvLyAgICAgLy8gdGhpcy5JZGVudGl0eVRva2VuQ29udGVudCA9IEpTT04ucGFyc2UoYXRvYih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXSkpO1xyXG4gICAgLy8gICAgIC8vIHRoaXMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZTtcclxuICAgIC8vIH1cclxuICAgIFxyXG5cclxufSJdfQ==
