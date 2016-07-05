System.register(['q', 'oidc-token-manager'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Q;
    var AuthenticationContext, TokensContents;
    return {
        setters:[
            function (Q_1) {
                Q = Q_1;
            },
            function (_1) {}],
        execute: function() {
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
                Object.defineProperty(AuthenticationContext.prototype, "IsInitialized", {
                    get: function () {
                        if (this.AuthenticationManagerSettings != null) {
                            return true;
                        }
                        else {
                            return false;
                        }
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
                AuthenticationContext.prototype.Initialize = function (authenticationSettings) {
                    if (authenticationSettings.authority == null || authenticationSettings.client_id == null) {
                        throw "Should be informed at least 'authority' and 'client_id'!";
                    }
                    var defaultRedirectUri = authenticationSettings.client_url || location.href;
                    if (location.protocol.indexOf('file:') > -1) {
                        defaultRedirectUri = 'urn:ietf:wg:oauth:2.0:oob:auto';
                    }
                    console.log(defaultRedirectUri);
                    authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access';
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token';
                    this.AuthenticationManagerSettings =
                        {
                            authority: authenticationSettings.authority,
                            client_id: authenticationSettings.client_id,
                            client_url: authenticationSettings.client_url,
                            open_on_popup: authenticationSettings.open_on_popup,
                            response_type: authenticationSettings.response_type,
                            scope: authenticationSettings.scope,
                            redirect_uri: defaultRedirectUri,
                            silent_redirect_uri: defaultRedirectUri,
                            post_logout_redirect_uri: defaultRedirectUri,
                            authorization_url: authenticationSettings.authority + "/connect/authorize",
                            token_url: authenticationSettings.authority + "/connect/token",
                            userinfo_url: authenticationSettings.authority + "/connect/userinfo",
                            load_user_profile: true,
                            silent_renew: true,
                        };
                    this.oidcTokenManager = new OidcTokenManager(this.AuthenticationManagerSettings);
                };
                AuthenticationContext.prototype.ProcessTokenIfNeeded = function () {
                    if (location.href.indexOf('access_token=') > -1) {
                        console.log('Processing token!');
                        return this.ProcessTokenCallback();
                    }
                    else {
                        var defer = Q.defer();
                        defer.resolve(this.TokensContents);
                        return defer.promise;
                    }
                };
                AuthenticationContext.prototype.Init = function (authenticationSettings, force) {
                    if (force === void 0) { force = false; }
                    if (authenticationSettings != null) {
                        if (this.IsInitialized === false || force === true) {
                            this.Initialize(authenticationSettings);
                        }
                        else {
                            console.debug("Should be unitializated to initialize. You are missing the force parameter?");
                        }
                    }
                    return this.ProcessTokenIfNeeded();
                };
                AuthenticationContext.prototype.ProcessTokenCallback = function () {
                    var _this = this;
                    this.ValidateInitialization();
                    var defer = Q.defer();
                    this.oidcTokenManager.processTokenCallbackAsync()
                        .then(function () {
                        _this.RedirectToInitialPage(_this.AuthenticationManagerSettings.client_url);
                        defer.resolve(_this.TokensContents);
                    }, function (error) {
                        var message = "Problem Getting Token : " + (error.message || error);
                        defer.reject(message);
                    });
                    return defer.promise;
                };
                AuthenticationContext.prototype.RenewTokenSilent = function () {
                    this.ValidateInitialization();
                    var defer = Q.defer();
                    this.oidcTokenManager.renewTokenSilentAsync().then(function () {
                        defer.resolve();
                    }, function (error) {
                        defer.reject("Problem Getting Token : " + (error.message || error));
                    });
                    return defer.promise;
                };
                AuthenticationContext.prototype.RedirectToInitialPage = function (uri) {
                    location.assign(uri);
                };
                AuthenticationContext.prototype.ValidateInitialization = function () {
                    if (this.AuthenticationManagerSettings == null) {
                        throw "AuthenticationContext uninitialized!";
                    }
                };
                AuthenticationContext.prototype.Login = function (openOnPopUp) {
                    if (this.TokensContents.IsAuthenticated === false) {
                        this.ValidateInitialization();
                        var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                        if (shouldOpenOnPopUp) {
                            this.oidcTokenManager.openPopupForTokenAsync();
                        }
                        else {
                            this.oidcTokenManager.redirectForToken();
                        }
                    }
                    else {
                        console.warn('Already authenticated');
                    }
                };
                Object.defineProperty(AuthenticationContext.prototype, "IsAuthenticated", {
                    get: function () {
                        if (this.TokensContents.IsAuthenticated === false) {
                            return false;
                        }
                        else {
                            return true;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(AuthenticationContext.prototype, "TokensContents", {
                    get: function () {
                        var tokenContents = new TokensContents();
                        tokenContents.AccessToken = this.AccessToken;
                        tokenContents.IdentityToken = this.IdentityToken;
                        tokenContents.AccessTokenContent = this.AccessTokenContent;
                        tokenContents.IdentityTokenContent = this.IdentityTokenContent;
                        tokenContents.ProfileContent = this.ProfileContent;
                        return tokenContents;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(AuthenticationContext.prototype, "AccessToken", {
                    get: function () {
                        if (this.oidcTokenManager != null) {
                            var id_token = this.oidcTokenManager.access_token;
                            return id_token;
                        }
                        return null;
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
                Object.defineProperty(AuthenticationContext.prototype, "IdentityToken", {
                    get: function () {
                        if (this.oidcTokenManager != null) {
                            var id_token = this.oidcTokenManager.id_token;
                            return id_token;
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
            TokensContents = (function () {
                function TokensContents() {
                }
                Object.defineProperty(TokensContents.prototype, "IsAuthenticated", {
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
                Object.defineProperty(TokensContents.prototype, "ProfileContent", {
                    get: function () {
                        return this._profileContent;
                    },
                    set: function (value) {
                        this._profileContent = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TokensContents.prototype, "AccessToken", {
                    get: function () {
                        return this._accessToken;
                    },
                    set: function (value) {
                        this._accessToken = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TokensContents.prototype, "AccessTokenContent", {
                    get: function () {
                        return this._accessTokenContent;
                    },
                    set: function (value) {
                        this._accessTokenContent = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TokensContents.prototype, "IdentityToken", {
                    get: function () {
                        return this._identityToken;
                    },
                    set: function (value) {
                        this._identityToken = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TokensContents.prototype, "IdentityTokenContent", {
                    get: function () {
                        return this._identityTokenContent;
                    },
                    set: function (value) {
                        this._identityTokenContent = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                TokensContents.prototype.jsonsToArray = function () {
                    return [this.IdentityTokenContent, this.AccessTokenContent, this.ProfileContent];
                };
                TokensContents.prototype.encodedTokensToArray = function () {
                    return [this.IdentityToken, this.AccessToken];
                };
                return TokensContents;
            }());
            exports_1("TokensContents", TokensContents);
        }
    }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUN2RixDQUFDO2dCQUVNLDZDQUFvQixHQUEzQjtvQkFFSSxNQUFNLENBQUMsQ0FBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUUsQ0FBQztnQkFDcEQsQ0FBQztnQkFDTCxxQkFBQztZQUFELENBbkZBLEFBbUZDLElBQUE7WUFuRkQsMkNBbUZDLENBQUEiLCJmaWxlIjoiQXV0aGVudGljYXRpb25Db250ZXh0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIH0gZnJvbSAnLi9JQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnO1xyXG4vL3JlcXVpcmUoJ29pZGMtdG9rZW4tbWFuYWdlcicpO1xyXG4vL2ltcG9ydCAnb2lkYy10b2tlbi1tYW5hZ2VyL2Rpc3Qvb2lkYy10b2tlbi1tYW5hZ2VyLmpzJztcclxuaW1wb3J0ICogYXMgUSBmcm9tICdxJztcclxuaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXInO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25Db250ZXh0IFxyXG57XHJcbiAgICBcclxuICAgIHByaXZhdGUgc3RhdGljIF9jdXJyZW50OiBBdXRoZW50aWNhdGlvbkNvbnRleHQgPSBudWxsO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IEN1cnJlbnQoKTogQXV0aGVudGljYXRpb25Db250ZXh0IFxyXG4gICAge1xyXG4gICAgICAgIGlmKEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9PT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9ICBuZXcgQXV0aGVudGljYXRpb25Db250ZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBnZXQgSXNJbml0aWFsaXplZCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgUmVzZXQoKVxyXG4gICAge1xyXG4gICAgICAgIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvaWRjVG9rZW5NYW5hZ2VyOiBPaWRjLk9pZGNUb2tlbk1hbmFnZXI7XHJcbiAgICAgICAgXHJcbiAgICBjb25zdHJ1Y3RvcigpIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgPSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzO1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIoIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncygpOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycpO1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZSA9IEpTT04ucGFyc2UoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBzZXQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3ModmFsdWU6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncylcclxuICAgIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnLCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgSW5pdGlhbGl6ZShhdXRoZW50aWNhdGlvblNldHRpbmdzOiBJQXV0aGVudGljYXRpb25TZXR0aW5ncylcclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSA9PSBudWxsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIlNob3VsZCBiZSBpbmZvcm1lZCBhdCBsZWFzdCAnYXV0aG9yaXR5JyBhbmQgJ2NsaWVudF9pZCchXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZhdWx0UmVkaXJlY3RVcmkgOiBzdHJpbmcgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgfHwgbG9jYXRpb24uaHJlZjtcclxuICAgICAgICBpZihsb2NhdGlvbi5wcm90b2NvbC5pbmRleE9mKCdmaWxlOicpID4gLTEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZWZhdWx0UmVkaXJlY3RVcmkgPSAndXJuOmlldGY6d2c6b2F1dGg6Mi4wOm9vYjphdXRvJztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc29sZS5sb2coZGVmYXVsdFJlZGlyZWN0VXJpKTtcclxuICAgICAgICAvL1NldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgaW5mb3JtZWRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIC8vYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwIHx8IGZhbHNlOyAvL1JlZGlyZWN0IGZvciBkZWZhdWx0XHJcblxyXG4gICAgICAgIC8vQ29udmVydCB0byB0aGUgbW9yZSBjb21wbGV0ZSBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3NcclxuICAgICAgICB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIG9wZW5fb25fcG9wdXA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCxcclxuICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBzY29wZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlZGlyZWN0X3VyaSA6IGRlZmF1bHRSZWRpcmVjdFVyaSxcclxuICAgICAgICAgICAgc2lsZW50X3JlZGlyZWN0X3VyaTogZGVmYXVsdFJlZGlyZWN0VXJpLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGRlZmF1bHRSZWRpcmVjdFVyaSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlcih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFByb2Nlc3NUb2tlbklmTmVlZGVkKCkgOiBRLklQcm9taXNlPFRva2Vuc0NvbnRlbnRzPlxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAncmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snICBcclxuICAgICAgICAvL2lmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKVxyXG4gICAgICAgIGlmKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignYWNjZXNzX3Rva2VuPScpID4gLTEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyB0b2tlbiEnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAgICAgLy8gZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvL0dvIEhvcnNlXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzPzogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MsIGZvcmNlID0gZmFsc2UpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLklzSW5pdGlhbGl6ZWQgPT09IGZhbHNlIHx8IGZvcmNlID09PSB0cnVlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLkluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5ncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2hvdWxkIGJlIHVuaXRpYWxpemF0ZWQgdG8gaW5pdGlhbGl6ZS4gWW91IGFyZSBtaXNzaW5nIHRoZSBmb3JjZSBwYXJhbWV0ZXI/XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbklmTmVlZGVkKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUmVkaXJlY3RUb0luaXRpYWxQYWdlKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpOyBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIFJlbmV3VG9rZW5TaWxlbnQoKSA6IFEuSVByb21pc2U8dm9pZD5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPHZvaWQ+KCk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QoXCJQcm9ibGVtIEdldHRpbmcgVG9rZW4gOiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG4gICAgcHJvdGVjdGVkIFJlZGlyZWN0VG9Jbml0aWFsUGFnZSh1cmkgOnN0cmluZylcclxuICAgIHtcclxuICAgICAgICBsb2NhdGlvbi5hc3NpZ24odXJpKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgVmFsaWRhdGVJbml0aWFsaXphdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdXRoZW50aWNhdGlvbkNvbnRleHQgdW5pbml0aWFsaXplZCFcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRoZSBsb2dpbiBhdCB0aGUgY3VycmVudCBVUkksIGFuZCBwcm9jZXNzIHRoZSByZWNlaXZlZCB0b2tlbnMuXHJcbiAgICAgKiBPQlM6IFRoZSBSZWRpcmVjdCBVUkkgW2NhbGxiYWNrX3VybF0gKHRvIHJlY2VpdmUgdGhlIHRva2VuKSBhbmQgU2lsZW50IFJlZnJlc2ggRnJhbWUgVVJJIFtzaWxlbnRfcmVkaXJlY3RfdXJpXSAodG8gYXV0byByZW5ldyB3aGVuIGV4cGlyZWQpIGlmIG5vdCBpbmZvcm1lZCBpcyBhdXRvIGdlbmVyYXRlZCBiYXNlZCBvbiB0aGUgJ2NsaWVudF91cmwnIGluZm9ybWVkIGF0ICdJbml0JyBtZXRob2Qgd2l0aCB0aGUgZm9sbG93aW4gc3RyYXRlZ3k6XHJcbiAgICAgKiBgcmVkaXJlY3RfdXJsID0gY2xpZW50X3VybCArICc/Y2FsbGJhY2s9dHJ1ZSdgXHJcbiAgICAgKiBgc2lsZW50X3JlZGlyZWN0X3VyaSA9IGNsaWVudF91cmwgKyAnP3NpbGVudHJlZnJlc2hmcmFtZT10cnVlJ2AgXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wZW5PblBvcFVwXSAoZGVzY3JpcHRpb24pXHJcbiAgICAgKi9cclxuICAgIC8vIHB1YmxpYyBMb2dpbkFuZFByb2Nlc3NUb2tlbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICAvLyB7XHJcbiAgICAvLyAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAncmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snICBcclxuICAgIC8vICAgICBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAvLyAgICAgZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ2NsaWVudF91cmwnLCB0aGVuIGkgY29uc2lkZXIgdG8gbWFrZSB0aGUgJ2xvZ2luJ1xyXG4gICAgLy8gICAgIGVsc2UgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybClcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIGlmKHRoaXMuSXNBdXRoZW50aWNhdGVkID09PSBmYWxzZSlcclxuICAgIC8vICAgICAgICAge1xyXG4gICAgLy8gICAgICAgICAgICAgdGhpcy5Mb2dpbihzaG91bGRPcGVuT25Qb3BVcCk7XHJcbiAgICAvLyAgICAgICAgIH1cclxuICAgIC8vICAgICB9XHJcbiAgICAvLyB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBMb2dpbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5Ub2tlbnNDb250ZW50cy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL1RPRE86IFRyZWF0IHdoZW4gaW4gbW9iaWxlIGJyb3dzZXIgdG8gbm90IHN1cHBvcnQgcG9wdXBcclxuICAgICAgICAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHNob3VsZE9wZW5PblBvcFVwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIub3BlblBvcHVwRm9yVG9rZW5Bc3luYygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlZGlyZWN0Rm9yVG9rZW4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FscmVhZHkgYXV0aGVudGljYXRlZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5Ub2tlbnNDb250ZW50cy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBUb2tlbnNDb250ZW50cygpIDogVG9rZW5zQ29udGVudHNcclxuICAgIHtcclxuICAgICAgICBsZXQgdG9rZW5Db250ZW50cyA9IG5ldyBUb2tlbnNDb250ZW50cygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW4gPSB0aGlzLkFjY2Vzc1Rva2VuO1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuSWRlbnRpdHlUb2tlbiA9IHRoaXMuSWRlbnRpdHlUb2tlbjtcclxuICAgICAgICBcclxuICAgICAgICB0b2tlbkNvbnRlbnRzLkFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMuQWNjZXNzVG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuSWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLklkZW50aXR5VG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLlByb2ZpbGVDb250ZW50O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0b2tlbkNvbnRlbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBnZXQgQWNjZXNzVG9rZW4oKTogc3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBpZF90b2tlbiA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW47XHJcbiAgICAgICAgICAgIHJldHVybiBpZF90b2tlbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByb3RlY3RlZCBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueSBcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGFjY2Vzc1Rva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9ICBKU09OLnBhcnNlKGF0b2IoYWNjZXNzVG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IElkZW50aXR5VG9rZW4oKTogc3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBpZF90b2tlbiA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkZW50aXR5VG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICAgICAgICAgICAgICBpZihpZGVudGl0eVRva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IEpTT04ucGFyc2UoYXRvYihpZGVudGl0eVRva2VuQ29udGVudCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWxvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVG9rZW5zQ29udGVudHNcclxue1xyXG4gICAgcHVibGljIGdldCBJc0F1dGhlbnRpY2F0ZWQoKSA6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50ID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfcHJvZmlsZUNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgUHJvZmlsZUNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2ZpbGVDb250ZW50O1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBQcm9maWxlQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Byb2ZpbGVDb250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9hY2Nlc3NUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWNjZXNzVG9rZW47XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IEFjY2Vzc1Rva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW4gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9hY2Nlc3NUb2tlbkNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IEFjY2Vzc1Rva2VuQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW46IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faWRlbnRpdHlUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbih2YWx1ZTogc3RyaW5nKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2lkZW50aXR5VG9rZW4gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9pZGVudGl0eVRva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IElkZW50aXR5VG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHB1YmxpYyBqc29uc1RvQXJyYXkoKSA6IEFycmF5PGFueT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gWyB0aGlzLklkZW50aXR5VG9rZW5Db250ZW50LCB0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCwgdGhpcy5Qcm9maWxlQ29udGVudCBdO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZW5jb2RlZFRva2Vuc1RvQXJyYXkoKSA6IEFycmF5PGFueT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gWyB0aGlzLklkZW50aXR5VG9rZW4sIHRoaXMuQWNjZXNzVG9rZW4gXTtcclxuICAgIH1cclxufSJdfQ==
