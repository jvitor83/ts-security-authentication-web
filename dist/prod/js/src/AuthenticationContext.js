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
                        defer.resolve();
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
                        defer.resolve();
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Q2hCLENBQUM7OzttQkFBQTtnQkE1VGMsOEJBQVEsR0FBMEIsSUFBSSxDQUFDO2dCQWdWMUQsNEJBQUM7WUFBRCxDQW5WQSxBQW1WQyxJQUFBO1lBblZELHlEQW1WQyxDQUFBO1lBRUQ7Z0JBQUE7Z0JBdUNBLENBQUM7Z0JBcENHLHNCQUFXLDBDQUFjO3lCQUF6Qjt3QkFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztvQkFDaEMsQ0FBQzt5QkFDRCxVQUEwQixLQUFVO3dCQUVoQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztvQkFDakMsQ0FBQzs7O21CQUpBO2dCQVFELHNCQUFXLDhDQUFrQjt5QkFBN0I7d0JBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztvQkFDcEMsQ0FBQzt5QkFDRCxVQUE4QixLQUFVO3dCQUVwQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO29CQUNyQyxDQUFDOzs7bUJBSkE7Z0JBUUQsc0JBQVcsZ0RBQW9CO3lCQUEvQjt3QkFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDO29CQUN0QyxDQUFDO3lCQUNELFVBQWdDLEtBQVU7d0JBRXRDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7b0JBQ3ZDLENBQUM7OzttQkFKQTtnQkFPTSxnQ0FBTyxHQUFkO29CQUVJLE1BQU0sQ0FBQyxDQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDO2dCQUN2RixDQUFDO2dCQUNMLHFCQUFDO1lBQUQsQ0F2Q0EsQUF1Q0MsSUFBQTtZQXZDRCwyQ0F1Q0MsQ0FBQSIsImZpbGUiOiJBdXRoZW50aWNhdGlvbkNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQXV0aGVudGljYXRpb25TZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyc7XHJcbi8vcmVxdWlyZSgnb2lkYy10b2tlbi1tYW5hZ2VyJyk7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXIvZGlzdC9vaWRjLXRva2VuLW1hbmFnZXIuanMnO1xyXG5pbXBvcnQgKiBhcyBRIGZyb20gJ3EnO1xyXG5pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbntcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2N1cnJlbnQ6IEF1dGhlbnRpY2F0aW9uQ29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkNvbnRleHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGdldCBJc0luaXRpYWxpemVkKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBSZXNldCgpXHJcbiAgICB7XHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IE9pZGMuT2lkY1Rva2VuTWFuYWdlcjtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSA9IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlciggYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKCk6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJyk7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlID0gSlNPTi5wYXJzZShhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIHNldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyh2YWx1ZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBJbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvblNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ID09IG51bGwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIGluZm9ybWVkIGF0IGxlYXN0ICdhdXRob3JpdHknIGFuZCAnY2xpZW50X2lkJyFcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9TZXQgZGVmYXVsdCB2YWx1ZXMgaWYgbm90IGluZm9ybWVkXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsIHx8IGxvY2F0aW9uLmhyZWY7IC8vU2VsZiB1cmlcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCB8fCBmYWxzZTsgLy9SZWRpcmVjdCBmb3IgZGVmYXVsdFxyXG5cclxuICAgICAgICAvL0NvbnZlcnQgdG8gdGhlIG1vcmUgY29tcGxldGUgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzXHJcbiAgICAgICAgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAgICAgY2xpZW50X2lkOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAgICAgY2xpZW50X3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBvcGVuX29uX3BvcHVwOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlX3R5cGU6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSxcclxuICAgICAgICAgICAgc2NvcGU6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGUsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZWRpcmVjdF91cmkgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyBcIj9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZVwiLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlcih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFByb2Nlc3NUb2tlbklmTmVlZGVkKCkgOiBRLklQcm9taXNlPHZvaWQ+XHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgICAgIC8vaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5pbmRleE9mKCdhY2Nlc3NfdG9rZW49JykgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQcm9jZXNzaW5nIHRva2VuIScpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5Qcm9jZXNzVG9rZW5DYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3NpbGVudF9yZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaydcclxuICAgICAgICAvLyBlbHNlIGlmIChsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5SZW5ld1Rva2VuU2lsZW50KCk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vR28gSG9yc2VcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPHZvaWQ+KCk7XHJcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzPzogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MsIGZvcmNlID0gZmFsc2UpIDogUS5JUHJvbWlzZTx2b2lkPlxyXG4gICAge1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuSXNJbml0aWFsaXplZCA9PT0gZmFsc2UgfHwgZm9yY2UgPT09IHRydWUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuSW5pdGlhbGl6ZShhdXRoZW50aWNhdGlvblNldHRpbmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIHVuaXRpYWxpemF0ZWQgdG8gaW5pdGlhbGl6ZS4gWW91IGFyZSBtaXNzaW5nIHRoZSBmb3JjZSBwYXJhbWV0ZXI/XCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuUHJvY2Vzc1Rva2VuSWZOZWVkZWQoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIFByb2Nlc3NUb2tlbkNhbGxiYWNrKCkgOiBRLklQcm9taXNlPHZvaWQ+XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8dm9pZD4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUmVkaXJlY3RUb0luaXRpYWxQYWdlKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9IFwiUHJvYmxlbSBHZXR0aW5nIFRva2VuIDogXCIgKyAoZXJyb3IubWVzc2FnZSB8fCBlcnJvcik7IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUmVuZXdUb2tlblNpbGVudCgpIDogUS5JUHJvbWlzZTx2b2lkPlxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8dm9pZD4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBSZWRpcmVjdFRvSW5pdGlhbFBhZ2UoKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2F0aW9uLmFzc2lnbih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwpO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXV0aGVudGljYXRpb25Db250ZXh0IHVuaW5pdGlhbGl6ZWQhXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogTWFrZSB0aGUgbG9naW4gYXQgdGhlIGN1cnJlbnQgVVJJLCBhbmQgcHJvY2VzcyB0aGUgcmVjZWl2ZWQgdG9rZW5zLlxyXG4gICAgICogT0JTOiBUaGUgUmVkaXJlY3QgVVJJIFtjYWxsYmFja191cmxdICh0byByZWNlaXZlIHRoZSB0b2tlbikgYW5kIFNpbGVudCBSZWZyZXNoIEZyYW1lIFVSSSBbc2lsZW50X3JlZGlyZWN0X3VyaV0gKHRvIGF1dG8gcmVuZXcgd2hlbiBleHBpcmVkKSBpZiBub3QgaW5mb3JtZWQgaXMgYXV0byBnZW5lcmF0ZWQgYmFzZWQgb24gdGhlICdjbGllbnRfdXJsJyBpbmZvcm1lZCBhdCAnSW5pdCcgbWV0aG9kIHdpdGggdGhlIGZvbGxvd2luIHN0cmF0ZWd5OlxyXG4gICAgICogYHJlZGlyZWN0X3VybCA9IGNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnYFxyXG4gICAgICogYHNpbGVudF9yZWRpcmVjdF91cmkgPSBjbGllbnRfdXJsICsgJz9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZSdgIFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcGVuT25Qb3BVcF0gKGRlc2NyaXB0aW9uKVxyXG4gICAgICovXHJcbiAgICAvLyBwdWJsaWMgTG9naW5BbmRQcm9jZXNzVG9rZW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAgLy8ge1xyXG4gICAgLy8gICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAvLyAgICAgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgLy8gICAgIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdjbGllbnRfdXJsJywgdGhlbiBpIGNvbnNpZGVyIHRvIG1ha2UgdGhlICdsb2dpbidcclxuICAgIC8vICAgICBlbHNlIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybC5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICBpZih0aGlzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAvLyAgICAgICAgIHtcclxuICAgIC8vICAgICAgICAgICAgIHRoaXMuTG9naW4oc2hvdWxkT3Blbk9uUG9wVXApO1xyXG4gICAgLy8gICAgICAgICB9XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuSXNBdXRoZW50aWNhdGVkID09PSBmYWxzZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9UT0RPOiBUcmVhdCB3aGVuIGluIG1vYmlsZSBicm93c2VyIHRvIG5vdCBzdXBwb3J0IHBvcHVwXHJcbiAgICAgICAgICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChzaG91bGRPcGVuT25Qb3BVcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLm9wZW5Qb3B1cEZvclRva2VuQXN5bmMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBbHJlYWR5IGF1dGhlbnRpY2F0ZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBJc0F1dGhlbnRpY2F0ZWQoKSA6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50ID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFRva2Vuc0NvbnRlbnRzKCkgOiBUb2tlbnNDb250ZW50c1xyXG4gICAge1xyXG4gICAgICAgIGlmKCF0aGlzLklzQXV0aGVudGljYXRlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIHByZXZpb3VzbHkgYXV0aGVudGljYXRlZCFcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHRva2VuQ29udGVudHMgPSBuZXcgVG9rZW5zQ29udGVudHMoKTtcclxuICAgICAgICBcclxuICAgICAgICB0b2tlbkNvbnRlbnRzLkFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMuQWNjZXNzVG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuSWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLklkZW50aXR5VG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLlByb2ZpbGVDb250ZW50O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0b2tlbkNvbnRlbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueSBcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGFjY2Vzc1Rva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9ICBKU09OLnBhcnNlKGF0b2IoYWNjZXNzVG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IElkZW50aXR5VG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZGVudGl0eVRva2VuQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoaWRlbnRpdHlUb2tlbkNvbnRlbnQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsb3IgPSBKU09OLnBhcnNlKGF0b2IoaWRlbnRpdHlUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgUHJvZmlsZUNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZSAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsb3IgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvZmlsZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWxvcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyAvL1RPRE86IFNwbGl0IHRoZSBwYXJzZXIgdG8gYW5vdGhlciBwcm9qZWN0IChwYWNrYWdlIC0gdHMtc2VjdXJpdHktdG9rZW5zPylcclxuICAgIC8vIC8vSW5jbHVkZSByZWZhY3RvcnkgYXQgdGhlIHRzLXNlY3VyaXR5LWlkZW50aXR5IGFsc29cclxuICAgIC8vIHByb3RlY3RlZCBHZW5lcmF0ZVRva2VucygpXHJcbiAgICAvLyB7XHJcblxyXG4gICAgICAgICAgICBcclxuICAgIC8vICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGUgIT0gbnVsbClcclxuICAgIC8vICAgICAgICAge1xyXG4gICAgLy8gICAgICAgICAgICAgdGhpcy5Qcm9maWxlQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgLy8gICAgICAgICB9XHJcbiAgICAvLyAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIC8vIHRoaXMuQWNjZXNzVG9rZW5Db250ZW50ID0gSlNPTi5wYXJzZShhdG9iKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4uc3BsaXQoJy4nKVsxXSkpO1xyXG4gICAgLy8gICAgIC8vIHRoaXMuSWRlbnRpdHlUb2tlbkNvbnRlbnQgPSBKU09OLnBhcnNlKGF0b2IodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuLnNwbGl0KCcuJylbMV0pKTtcclxuICAgIC8vICAgICAvLyB0aGlzLlByb2ZpbGVDb250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAvLyB9XHJcbiAgICBcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb2tlbnNDb250ZW50c1xyXG57XHJcbiAgICBwcml2YXRlIF9wcm9maWxlQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvZmlsZUNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IFByb2ZpbGVDb250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcHJvZmlsZUNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9hY2Nlc3NUb2tlbkNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IEFjY2Vzc1Rva2VuQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW5Db250ZW50OiBhbnk7XHJcbiAgICBwdWJsaWMgZ2V0IElkZW50aXR5VG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQodmFsdWU6IGFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHB1YmxpYyBUb0FycmF5KCkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFsgdGhpcy5JZGVudGl0eVRva2VuQ29udGVudCwgdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQsIHRoaXMuUHJvZmlsZUNvbnRlbnQgXTtcclxuICAgIH1cclxufSJdfQ==
