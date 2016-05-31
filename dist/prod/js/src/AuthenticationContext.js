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
                    authenticationSettings.client_url = authenticationSettings.client_url || location.href;
                    authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access';
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token';
                    authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false;
                    this.AuthenticationManagerSettings =
                        {
                            authority: authenticationSettings.authority,
                            client_id: authenticationSettings.client_id,
                            client_url: authenticationSettings.client_url,
                            open_on_popup: authenticationSettings.open_on_popup,
                            response_type: authenticationSettings.response_type,
                            scope: authenticationSettings.scope,
                            redirect_uri: authenticationSettings.client_url + '?callback=true',
                            silent_redirect_uri: authenticationSettings.client_url + "?silentrefreshframe=true",
                            post_logout_redirect_uri: authenticationSettings.client_url,
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
                            throw "Should be unitializated to initialize. You are missing the force parameter?";
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
                        _this.RedirectToInitialPage();
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
                AuthenticationContext.prototype.RedirectToInitialPage = function () {
                    location.assign(this.AuthenticationManagerSettings.client_url);
                };
                AuthenticationContext.prototype.ValidateInitialization = function () {
                    if (this.AuthenticationManagerSettings == null) {
                        throw "AuthenticationContext uninitialized!";
                    }
                };
                AuthenticationContext.prototype.Login = function (openOnPopUp) {
                    if (this.IsAuthenticated === false) {
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
                Object.defineProperty(AuthenticationContext.prototype, "TokensContents", {
                    get: function () {
                        if (!this.IsAuthenticated) {
                            throw "Should be previously authenticated!";
                        }
                        var tokenContents = new TokensContents();
                        tokenContents.AccessTokenContent = this.AccessTokenContent;
                        tokenContents.IdentityTokenContent = this.IdentityTokenContent;
                        tokenContents.ProfileContent = this.ProfileContent;
                        return tokenContents;
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
            TokensContents = (function () {
                function TokensContents() {
                }
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
                TokensContents.prototype.ToArray = function () {
                    return [this.IdentityTokenContent, this.AccessTokenContent, this.ProfileContent];
                };
                return TokensContents;
            }());
            exports_1("TokensContents", TokensContents);
        }
    }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Qzt3QkFDTCxDQUFDO3dCQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7b0JBQ2hCLENBQUM7OzttQkFBQTtnQkE1VGMsOEJBQVEsR0FBMEIsSUFBSSxDQUFDO2dCQWdWMUQsNEJBQUM7WUFBRCxDQW5WQSxBQW1WQyxJQUFBO1lBblZELHlEQW1WQyxDQUFBO1lBRUQ7Z0JBQUE7Z0JBdUNBLENBQUM7Z0JBcENHLHNCQUFXLDBDQUFjO3lCQUF6Qjt3QkFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztvQkFDaEMsQ0FBQzt5QkFDRCxVQUEwQixLQUFVO3dCQUVoQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztvQkFDakMsQ0FBQzs7O21CQUpBO2dCQVFELHNCQUFXLDhDQUFrQjt5QkFBN0I7d0JBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztvQkFDcEMsQ0FBQzt5QkFDRCxVQUE4QixLQUFVO3dCQUVwQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO29CQUNyQyxDQUFDOzs7bUJBSkE7Z0JBUUQsc0JBQVcsZ0RBQW9CO3lCQUEvQjt3QkFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO29CQUN0QyxDQUFDO3lCQUNELFVBQWdDLEtBQVU7d0JBRXRDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7b0JBQ3ZDLENBQUM7OzttQkFKQTtnQkFPTSxnQ0FBTyxHQUFkO29CQUVJLE1BQU0sQ0FBQyxDQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDO2dCQUN2RixDQUFDO2dCQUNMLHFCQUFDO1lBQUQsQ0F2Q0EsQUF1Q0MsSUFBQTtZQXZDRCwyQ0F1Q0MsQ0FBQSIsImZpbGUiOiJBdXRoZW50aWNhdGlvbkNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQXV0aGVudGljYXRpb25TZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyc7XHJcbi8vcmVxdWlyZSgnb2lkYy10b2tlbi1tYW5hZ2VyJyk7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXIvZGlzdC9vaWRjLXRva2VuLW1hbmFnZXIuanMnO1xyXG5pbXBvcnQgKiBhcyBRIGZyb20gJ3EnO1xyXG5pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbntcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2N1cnJlbnQ6IEF1dGhlbnRpY2F0aW9uQ29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkNvbnRleHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGdldCBJc0luaXRpYWxpemVkKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBSZXNldCgpXHJcbiAgICB7XHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IE9pZGMuT2lkY1Rva2VuTWFuYWdlcjtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSA9IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlciggYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKCk6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJyk7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlID0gSlNPTi5wYXJzZShhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIHNldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyh2YWx1ZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBJbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvblNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ID09IG51bGwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIGluZm9ybWVkIGF0IGxlYXN0ICdhdXRob3JpdHknIGFuZCAnY2xpZW50X2lkJyFcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9TZXQgZGVmYXVsdCB2YWx1ZXMgaWYgbm90IGluZm9ybWVkXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsIHx8IGxvY2F0aW9uLmhyZWY7IC8vU2VsZiB1cmlcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCB8fCBmYWxzZTsgLy9SZWRpcmVjdCBmb3IgZGVmYXVsdFxyXG5cclxuICAgICAgICAvL0NvbnZlcnQgdG8gdGhlIG1vcmUgY29tcGxldGUgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzXHJcbiAgICAgICAgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAgICAgY2xpZW50X2lkOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAgICAgY2xpZW50X3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBvcGVuX29uX3BvcHVwOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlX3R5cGU6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSxcclxuICAgICAgICAgICAgc2NvcGU6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGUsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZWRpcmVjdF91cmkgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyBcIj9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZVwiLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlcih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFByb2Nlc3NUb2tlbklmTmVlZGVkKCkgOiBRLklQcm9taXNlPFRva2Vuc0NvbnRlbnRzPlxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAncmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snICBcclxuICAgICAgICAvL2lmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKVxyXG4gICAgICAgIGlmKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignYWNjZXNzX3Rva2VuPScpID4gLTEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyB0b2tlbiEnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAgICAgLy8gZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvL0dvIEhvcnNlXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzPzogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MsIGZvcmNlID0gZmFsc2UpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLklzSW5pdGlhbGl6ZWQgPT09IGZhbHNlIHx8IGZvcmNlID09PSB0cnVlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLkluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5ncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcIlNob3VsZCBiZSB1bml0aWFsaXphdGVkIHRvIGluaXRpYWxpemUuIFlvdSBhcmUgbWlzc2luZyB0aGUgZm9yY2UgcGFyYW1ldGVyP1wiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbklmTmVlZGVkKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUmVkaXJlY3RUb0luaXRpYWxQYWdlKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpOyBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIFJlbmV3VG9rZW5TaWxlbnQoKSA6IFEuSVByb21pc2U8dm9pZD5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPHZvaWQ+KCk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QoXCJQcm9ibGVtIEdldHRpbmcgVG9rZW4gOiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgUmVkaXJlY3RUb0luaXRpYWxQYWdlKClcclxuICAgIHtcclxuICAgICAgICBsb2NhdGlvbi5hc3NpZ24odGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsKTtcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBWYWxpZGF0ZUluaXRpYWxpemF0aW9uKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIkF1dGhlbnRpY2F0aW9uQ29udGV4dCB1bmluaXRpYWxpemVkIVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgdGhlIGxvZ2luIGF0IHRoZSBjdXJyZW50IFVSSSwgYW5kIHByb2Nlc3MgdGhlIHJlY2VpdmVkIHRva2Vucy5cclxuICAgICAqIE9CUzogVGhlIFJlZGlyZWN0IFVSSSBbY2FsbGJhY2tfdXJsXSAodG8gcmVjZWl2ZSB0aGUgdG9rZW4pIGFuZCBTaWxlbnQgUmVmcmVzaCBGcmFtZSBVUkkgW3NpbGVudF9yZWRpcmVjdF91cmldICh0byBhdXRvIHJlbmV3IHdoZW4gZXhwaXJlZCkgaWYgbm90IGluZm9ybWVkIGlzIGF1dG8gZ2VuZXJhdGVkIGJhc2VkIG9uIHRoZSAnY2xpZW50X3VybCcgaW5mb3JtZWQgYXQgJ0luaXQnIG1ldGhvZCB3aXRoIHRoZSBmb2xsb3dpbiBzdHJhdGVneTpcclxuICAgICAqIGByZWRpcmVjdF91cmwgPSBjbGllbnRfdXJsICsgJz9jYWxsYmFjaz10cnVlJ2BcclxuICAgICAqIGBzaWxlbnRfcmVkaXJlY3RfdXJpID0gY2xpZW50X3VybCArICc/c2lsZW50cmVmcmVzaGZyYW1lPXRydWUnYCBcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3Blbk9uUG9wVXBdIChkZXNjcmlwdGlvbilcclxuICAgICAqL1xyXG4gICAgLy8gcHVibGljIExvZ2luQW5kUHJvY2Vzc1Rva2VuKG9wZW5PblBvcFVwPzogYm9vbGVhbilcclxuICAgIC8vIHtcclxuICAgIC8vICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICBcclxuICAgIC8vICAgICBsZXQgc2hvdWxkT3Blbk9uUG9wVXAgPSBvcGVuT25Qb3BVcCB8fCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm9wZW5fb25fcG9wdXA7XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgLy8gICAgIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5Qcm9jZXNzVG9rZW5DYWxsYmFjaygpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3NpbGVudF9yZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaydcclxuICAgIC8vICAgICBlbHNlIGlmIChsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5SZW5ld1Rva2VuU2lsZW50KCk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnY2xpZW50X3VybCcsIHRoZW4gaSBjb25zaWRlciB0byBtYWtlIHRoZSAnbG9naW4nXHJcbiAgICAvLyAgICAgZWxzZSBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgaWYodGhpcy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgLy8gICAgICAgICB7XHJcbiAgICAvLyAgICAgICAgICAgICB0aGlzLkxvZ2luKHNob3VsZE9wZW5PblBvcFVwKTtcclxuICAgIC8vICAgICAgICAgfVxyXG4gICAgLy8gICAgIH1cclxuICAgIC8vIH1cclxuICAgIFxyXG4gICAgcHVibGljIExvZ2luKG9wZW5PblBvcFVwPzogYm9vbGVhbilcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vVE9ETzogVHJlYXQgd2hlbiBpbiBtb2JpbGUgYnJvd3NlciB0byBub3Qgc3VwcG9ydCBwb3B1cFxyXG4gICAgICAgICAgICBsZXQgc2hvdWxkT3Blbk9uUG9wVXAgPSBvcGVuT25Qb3BVcCB8fCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm9wZW5fb25fcG9wdXA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoc2hvdWxkT3Blbk9uUG9wVXApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5vcGVuUG9wdXBGb3JUb2tlbkFzeW5jKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVkaXJlY3RGb3JUb2tlbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQWxyZWFkeSBhdXRoZW50aWNhdGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBUb2tlbnNDb250ZW50cygpIDogVG9rZW5zQ29udGVudHNcclxuICAgIHtcclxuICAgICAgICBpZighdGhpcy5Jc0F1dGhlbnRpY2F0ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIlNob3VsZCBiZSBwcmV2aW91c2x5IGF1dGhlbnRpY2F0ZWQhXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCB0b2tlbkNvbnRlbnRzID0gbmV3IFRva2Vuc0NvbnRlbnRzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5BY2Nlc3NUb2tlbkNvbnRlbnQgPSB0aGlzLkFjY2Vzc1Rva2VuQ29udGVudDtcclxuICAgICAgICB0b2tlbkNvbnRlbnRzLklkZW50aXR5VG9rZW5Db250ZW50ID0gdGhpcy5JZGVudGl0eVRva2VuQ29udGVudDtcclxuICAgICAgICB0b2tlbkNvbnRlbnRzLlByb2ZpbGVDb250ZW50ID0gdGhpcy5Qcm9maWxlQ29udGVudDtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdG9rZW5Db250ZW50cztcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IEFjY2Vzc1Rva2VuQ29udGVudCgpOiBhbnkgXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBhY2Nlc3NUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICAgICAgICAgICAgICBpZihhY2Nlc3NUb2tlbkNvbnRlbnQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsb3IgPSAgSlNPTi5wYXJzZShhdG9iKGFjY2Vzc1Rva2VuQ29udGVudCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWxvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGlkZW50aXR5VG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gSlNPTi5wYXJzZShhdG9iKGlkZW50aXR5VG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IFByb2ZpbGVDb250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGUgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLy9UT0RPOiBTcGxpdCB0aGUgcGFyc2VyIHRvIGFub3RoZXIgcHJvamVjdCAocGFja2FnZSAtIHRzLXNlY3VyaXR5LXRva2Vucz8pXHJcbiAgICAvLyAvL0luY2x1ZGUgcmVmYWN0b3J5IGF0IHRoZSB0cy1zZWN1cml0eS1pZGVudGl0eSBhbHNvXHJcbiAgICAvLyBwcm90ZWN0ZWQgR2VuZXJhdGVUb2tlbnMoKVxyXG4gICAgLy8ge1xyXG5cclxuICAgICAgICAgICAgXHJcbiAgICAvLyAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlICE9IG51bGwpXHJcbiAgICAvLyAgICAgICAgIHtcclxuICAgIC8vICAgICAgICAgICAgIHRoaXMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZTtcclxuICAgIC8vICAgICAgICAgfVxyXG4gICAgLy8gICAgIH1cclxuICAgICAgICBcclxuICAgIC8vICAgICAvLyB0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCA9IEpTT04ucGFyc2UoYXRvYih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuLnNwbGl0KCcuJylbMV0pKTtcclxuICAgIC8vICAgICAvLyB0aGlzLklkZW50aXR5VG9rZW5Db250ZW50ID0gSlNPTi5wYXJzZShhdG9iKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbi5zcGxpdCgnLicpWzFdKSk7XHJcbiAgICAvLyAgICAgLy8gdGhpcy5Qcm9maWxlQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgLy8gfVxyXG4gICAgXHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVG9rZW5zQ29udGVudHNcclxue1xyXG4gICAgcHJpdmF0ZSBfcHJvZmlsZUNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgUHJvZmlsZUNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2ZpbGVDb250ZW50O1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBQcm9maWxlQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Byb2ZpbGVDb250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfYWNjZXNzVG9rZW5Db250ZW50OiBhbnk7XHJcbiAgICBwdWJsaWMgZ2V0IEFjY2Vzc1Rva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWNjZXNzVG9rZW5Db250ZW50O1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBBY2Nlc3NUb2tlbkNvbnRlbnQodmFsdWU6IGFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9hY2Nlc3NUb2tlbkNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9pZGVudGl0eVRva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IElkZW50aXR5VG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwdWJsaWMgVG9BcnJheSgpIDogQXJyYXk8YW55PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbIHRoaXMuSWRlbnRpdHlUb2tlbkNvbnRlbnQsIHRoaXMuQWNjZXNzVG9rZW5Db250ZW50LCB0aGlzLlByb2ZpbGVDb250ZW50IF07XHJcbiAgICB9XHJcbn0iXX0=
