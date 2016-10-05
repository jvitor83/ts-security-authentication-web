System.register(['q'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Q;
    var AuthenticationContext, TokensContents;
    return {
        setters:[
            function (Q_1) {
                Q = Q_1;
            }],
        execute: function() {
            AuthenticationContext = (function () {
                function AuthenticationContext() {
                    this.callbacksTokenObtained = new Array();
                    this.callbacksTokenRenewFailedRetryMax = new Array();
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
                AuthenticationContext.prototype.AddOnTokenObtained = function (callback) {
                    this.callbacksTokenObtained.push(callback);
                    this.oidcTokenManager.addOnTokenObtained(callback);
                };
                AuthenticationContext.prototype.AddOnTokenRenewFailedMaxRetry = function (callback) {
                    this.callbacksTokenRenewFailedRetryMax.push(callback);
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
                    var _this = this;
                    if (authenticationSettings.authority == null || authenticationSettings.client_id == null || authenticationSettings.client_url == null) {
                        throw "Should be informed at least 'authority', 'client_id' and 'client_url'!";
                    }
                    if (authenticationSettings.client_url.indexOf('file:') > -1) {
                        authenticationSettings.client_url = 'urn:ietf:wg:oauth:2.0:oob:auto';
                    }
                    authenticationSettings.client_url = authenticationSettings.client_url;
                    console.debug('ClientUrl: ' + authenticationSettings.client_url);
                    authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access';
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token';
                    authenticationSettings.max_retry_renew = authenticationSettings.max_retry_renew || 35;
                    console.debug('Max retry setted to: ' + authenticationSettings.max_retry_renew);
                    authenticationSettings.silent_renew_timeout = authenticationSettings.silent_renew_timeout || 40 * 1000;
                    console.debug('Silent renew timeout setted to: ' + authenticationSettings.silent_renew_timeout + ' miliseconds');
                    this.AuthenticationManagerSettings =
                        {
                            authority: authenticationSettings.authority,
                            client_id: authenticationSettings.client_id,
                            client_url: authenticationSettings.client_url,
                            max_retry_renew: authenticationSettings.max_retry_renew,
                            silent_renew_timeout: authenticationSettings.silent_renew_timeout,
                            response_type: authenticationSettings.response_type,
                            scope: authenticationSettings.scope,
                            redirect_uri: authenticationSettings.client_url,
                            silent_redirect_uri: authenticationSettings.client_url,
                            post_logout_redirect_uri: authenticationSettings.client_url,
                            authorization_url: authenticationSettings.authorization_url || authenticationSettings.authority + "/connect/authorize",
                            token_url: authenticationSettings.token_url || authenticationSettings.authority + "/connect/token",
                            userinfo_url: authenticationSettings.userinfo_url || authenticationSettings.authority + "/connect/userinfo",
                            load_user_profile: true,
                            silent_renew: true,
                        };
                    this.oidcTokenManager = new OidcTokenManager(this.AuthenticationManagerSettings);
                    this.oidcTokenManager.addOnSilentTokenRenewFailed(function () {
                        var count = 1;
                        var promise = _this.oidcTokenManager.renewTokenSilentAsync();
                        var success = function () {
                            console.debug('Renewed after ' + count.toString() + ' fails!');
                        };
                        var fail = function (error) {
                            count++;
                            console.debug('Token not renewed! Trying again after ' + count.toString() + ' fails! Max retry set to ' + _this.AuthenticationManagerSettings.max_retry_renew + '!');
                            if (count < _this.AuthenticationManagerSettings.max_retry_renew) {
                                return _this.oidcTokenManager.renewTokenSilentAsync().then(success, fail);
                            }
                            else {
                                console.error('Token not renewed!');
                                _this.callbacksTokenRenewFailedRetryMax.forEach(function (callback) {
                                    callback();
                                });
                                return promise;
                            }
                        };
                        var childPromise = promise.then(success, fail);
                        return childPromise;
                    });
                };
                AuthenticationContext.prototype.ProcessTokenIfNeeded = function () {
                    if (location.href.indexOf('access_token=') > -1 && (this.oidcTokenManager.access_token != null || location.href.indexOf('prompt=none') > -1)) {
                        console.debug('Processing token! (silently)');
                        this.oidcTokenManager.processTokenCallbackSilent();
                        console.debug('Token processed! (silently)');
                        var defer = Q.defer();
                        defer.resolve(this.TokensContents);
                        return defer.promise;
                    }
                    else if (location.href.indexOf('access_token=') > -1) {
                        console.debug('Processing token!');
                        return this.ProcessTokenCallback();
                    }
                    else {
                        var defer = Q.defer();
                        defer.resolve(this.TokensContents);
                        return defer.promise;
                    }
                };
                AuthenticationContext.prototype.Init = function (authenticationSettings) {
                    if (authenticationSettings != null) {
                        this.Initialize(authenticationSettings);
                    }
                    return this.ProcessTokenIfNeeded();
                };
                AuthenticationContext.prototype.ProcessTokenCallback = function () {
                    var _this = this;
                    this.ValidateInitialization();
                    var defer = Q.defer();
                    this.oidcTokenManager.processTokenCallbackAsync()
                        .then(function () {
                        _this.RedirectToInitialPage(_this.AuthenticationManagerSettings.redirect_uri);
                        defer.resolve(_this.TokensContents);
                    }, function (error) {
                        var message = "Problem Getting Token : " + (error.message || error);
                        console.error(message);
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
                        var message = "Problem Getting Token : " + (error.message || error);
                        console.error(message);
                        defer.reject(message);
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
                AuthenticationContext.prototype.Login = function () {
                    if (this.TokensContents.IsAuthenticated === false) {
                        this.ValidateInitialization();
                        this.oidcTokenManager.redirectForToken();
                        throw "Redirecting to Login!";
                    }
                    else {
                        console.warn('Already authenticated');
                        this.callbacksTokenObtained.forEach(function (callback) {
                            callback();
                        });
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
                TokensContents.prototype.tokensContentsToArray = function (includeEncodedTokens) {
                    if (includeEncodedTokens === void 0) { includeEncodedTokens = true; }
                    var tokensContents = new Array();
                    tokensContents.push(this.IdentityTokenContent);
                    tokensContents.push(this.AccessTokenContent);
                    tokensContents.push(this.ProfileContent);
                    if (includeEncodedTokens) {
                        var accessTokenEncoded = { 'access_token': AuthenticationContext.Current.TokensContents.AccessToken };
                        tokensContents.push(accessTokenEncoded);
                        var identityTokenEncoded = { 'id_token': AuthenticationContext.Current.TokensContents.IdentityToken };
                        tokensContents.push(identityTokenEncoded);
                    }
                    return tokensContents;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7WUFlQTtnQkFpREk7b0JBNUNRLDJCQUFzQixHQUFzQixJQUFJLEtBQUssRUFBYyxDQUFDO29CQUVwRSxzQ0FBaUMsR0FBc0IsSUFBSSxLQUFLLEVBQWMsQ0FBQztvQkE0Q25GLElBQUksdUNBQXVDLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDO29CQUNqRixFQUFFLENBQUEsQ0FBQyx1Q0FBdUMsSUFBSSxJQUFJLENBQUMsQ0FDbkQsQ0FBQzt3QkFDRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBRSx1Q0FBdUMsQ0FBRSxDQUFDO29CQUM1RixDQUFDO2dCQUNMLENBQUM7Z0JBL0NELHNCQUFrQixnQ0FBTzt5QkFBekI7d0JBRUksRUFBRSxDQUFBLENBQUMscUJBQXFCLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUMzQyxDQUFDOzRCQUNHLHFCQUFxQixDQUFDLFFBQVEsR0FBSSxJQUFJLHFCQUFxQixFQUFFLENBQUM7d0JBQ2xFLENBQUM7d0JBQ0QsTUFBTSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQztvQkFDMUMsQ0FBQzs7O21CQUFBO2dCQUVELHNCQUFXLGdEQUFhO3lCQUF4Qjt3QkFFSSxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLElBQUksSUFBSSxDQUFDLENBQzlDLENBQUM7NEJBQ0csTUFBTSxDQUFDLElBQUksQ0FBQzt3QkFDaEIsQ0FBQzt3QkFDRCxJQUFJLENBQ0osQ0FBQzs0QkFDRyxNQUFNLENBQUMsS0FBSyxDQUFDO3dCQUNqQixDQUFDO29CQUNMLENBQUM7OzttQkFBQTtnQkFFYSwyQkFBSyxHQUFuQjtvQkFFSSxxQkFBcUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUMxQyxDQUFDO2dCQUVNLGtEQUFrQixHQUF6QixVQUEwQixRQUFvQjtvQkFFMUMsSUFBSSxDQUFD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a0dDLENBQUEiLCJmaWxlIjoic3JjL0F1dGhlbnRpY2F0aW9uQ29udGV4dC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJztcclxuaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuLy9yZXF1aXJlKCdvaWRjLXRva2VuLW1hbmFnZXInKTtcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlci9kaXN0L29pZGMtdG9rZW4tbWFuYWdlci5qcyc7XHJcbmltcG9ydCAqIGFzIFEgZnJvbSAncSc7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXInO1xyXG5cclxuLy9TaG91bGQgYmUgZ2xvYmFsbHkgaW1wb3J0ZWRcclxuZGVjbGFyZSB2YXIgT2lkYyA6IGFueTtcclxuZGVjbGFyZSB2YXIgT2lkY1Rva2VuTWFuYWdlciA6IGFueTtcclxuXHJcblxyXG4vKipcclxuICogQXV0aGVudGljYXRpb25Jbml0aWFsaXplclxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uQ29udGV4dCBcclxue1xyXG4gICAgXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3VycmVudDogQXV0aGVudGljYXRpb25Db250ZXh0ID0gbnVsbDtcclxuXHJcbiAgICBwcml2YXRlIGNhbGxiYWNrc1Rva2VuT2J0YWluZWQgOkFycmF5PCgpID0+IHZvaWQ+ID0gbmV3IEFycmF5PCgpID0+IHZvaWQ+KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBjYWxsYmFja3NUb2tlblJlbmV3RmFpbGVkUmV0cnlNYXggOkFycmF5PCgpID0+IHZvaWQ+ID0gbmV3IEFycmF5PCgpID0+IHZvaWQ+KCk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkNvbnRleHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGdldCBJc0luaXRpYWxpemVkKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBSZXNldCgpXHJcbiAgICB7XHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQWRkT25Ub2tlbk9idGFpbmVkKGNhbGxiYWNrOiAoKSA9PiB2b2lkKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWRkT25Ub2tlbk9idGFpbmVkKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQWRkT25Ub2tlblJlbmV3RmFpbGVkTWF4UmV0cnkoY2FsbGJhY2s6ICgpID0+IHZvaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYWxsYmFja3NUb2tlblJlbmV3RmFpbGVkUmV0cnlNYXgucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgLy90aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWRkT25TaWxlbnRUb2tlblJlbmV3RmFpbGVkKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IGFueTtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSA9IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlciggYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKCk6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJyk7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlID0gSlNPTi5wYXJzZShhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIHNldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyh2YWx1ZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBJbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvblNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ID09IG51bGwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQgPT0gbnVsbCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIGluZm9ybWVkIGF0IGxlYXN0ICdhdXRob3JpdHknLCAnY2xpZW50X2lkJyBhbmQgJ2NsaWVudF91cmwnIVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwuaW5kZXhPZignZmlsZTonKSA+IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsID0gJ3VybjppZXRmOndnOm9hdXRoOjIuMDpvb2I6YXV0byc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vU2V0IGRlZmF1bHQgdmFsdWVzIGlmIG5vdCBpbmZvcm1lZFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybDsgLy9TZWxmIHVyaVxyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ0NsaWVudFVybDogJyArIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCk7XHJcblxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGUgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlIHx8ICdvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2Vzcyc7IC8vT3BlbklkIGRlZmF1bHQgc2NvcGVzXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlIHx8ICdjb2RlIGlkX3Rva2VuIHRva2VuJzsgLy9IeWJyaWQgZmxvdyBhdCBkZWZhdWx0XHJcbiAgICAgICAgLy9hdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgfHwgZmFsc2U7IC8vUmVkaXJlY3QgZm9yIGRlZmF1bHRcclxuXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5tYXhfcmV0cnlfcmVuZXcgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyB8fCAzNTtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdNYXggcmV0cnkgc2V0dGVkIHRvOiAnICsgYXV0aGVudGljYXRpb25TZXR0aW5ncy5tYXhfcmV0cnlfcmVuZXcpO1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNpbGVudF9yZW5ld190aW1lb3V0IHx8IDQwICogMTAwMDsgLy80MCBzZWNvbmRzIHRvIHRpbWVvdXRcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdTaWxlbnQgcmVuZXcgdGltZW91dCBzZXR0ZWQgdG86ICcgKyBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNpbGVudF9yZW5ld190aW1lb3V0ICsgJyBtaWxpc2Vjb25kcycpO1xyXG5cclxuICAgICAgICAvL0NvbnZlcnQgdG8gdGhlIG1vcmUgY29tcGxldGUgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzXHJcbiAgICAgICAgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAgICAgY2xpZW50X2lkOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAgICAgY2xpZW50X3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG5cclxuICAgICAgICAgICAgbWF4X3JldHJ5X3JlbmV3OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldywgXHJcbiAgICAgICAgICAgIHNpbGVudF9yZW5ld190aW1lb3V0OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNpbGVudF9yZW5ld190aW1lb3V0LFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBzY29wZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlZGlyZWN0X3VyaSA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgc2lsZW50X3JlZGlyZWN0X3VyaTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpemF0aW9uX3VybCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvYXV0aG9yaXplXCIsXHJcbiAgICAgICAgICAgIHRva2VuX3VybCA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudG9rZW5fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC90b2tlblwiLFxyXG4gICAgICAgICAgICB1c2VyaW5mb191cmw6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlcmluZm9fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC91c2VyaW5mb1wiLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbG9hZF91c2VyX3Byb2ZpbGU6IHRydWUsXHJcbiAgICAgICAgICAgIHNpbGVudF9yZW5ldzogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlciA9IG5ldyBPaWRjVG9rZW5NYW5hZ2VyKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAvL1JldHJ5IGluZGVmaW5pdGx5IGZvciByZW5ld1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5hZGRPblNpbGVudFRva2VuUmVuZXdGYWlsZWQoKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY291bnQgPSAxO1xyXG5cclxuICAgICAgICAgICAgbGV0IHByb21pc2U6IE9pZGMuRGVmYXVsdFByb21pc2UgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3VjY2VzcyA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlbmV3ZWQgYWZ0ZXIgJyArIGNvdW50LnRvU3RyaW5nKCkgKyAnIGZhaWxzIScpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgZmFpbCA9IChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Rva2VuIG5vdCByZW5ld2VkISBUcnlpbmcgYWdhaW4gYWZ0ZXIgJyArIGNvdW50LnRvU3RyaW5nKCkgKyAnIGZhaWxzISBNYXggcmV0cnkgc2V0IHRvICcgKyB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyArICchJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoY291bnQgPCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm1heF9yZXRyeV9yZW5ldylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUb2tlbiBub3QgcmVuZXdlZCEnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuUmVuZXdGYWlsZWRSZXRyeU1heC5mb3JFYWNoKChjYWxsYmFjayk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBsZXQgY2hpbGRQcm9taXNlID0gcHJvbWlzZS50aGVuKHN1Y2Nlc3MsIGZhaWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRQcm9taXNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFByb2Nlc3NUb2tlbklmTmVlZGVkKCkgOiBRLklQcm9taXNlPFRva2Vuc0NvbnRlbnRzPlxyXG4gICAge1xyXG4gICAgICAgIGlmIChsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2FjY2Vzc190b2tlbj0nKSA+IC0xICYmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuICE9IG51bGwgfHwgbG9jYXRpb24uaHJlZi5pbmRleE9mKCdwcm9tcHQ9bm9uZScpID4gLTEpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Byb2Nlc3NpbmcgdG9rZW4hIChzaWxlbnRseSknKTtcclxuICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrU2lsZW50KCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Rva2VuIHByb2Nlc3NlZCEgKHNpbGVudGx5KScpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfSBlbHNlIFxyXG5cclxuXHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgICAgIC8vaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5pbmRleE9mKCdhY2Nlc3NfdG9rZW49JykgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Byb2Nlc3NpbmcgdG9rZW4hJyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgICAgIC8vIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy9HbyBIb3JzZVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8VG9rZW5zQ29udGVudHM+KCk7XHJcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIEluaXQoYXV0aGVudGljYXRpb25TZXR0aW5ncz86IElBdXRoZW50aWNhdGlvblNldHRpbmdzKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncyAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5Jbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5Qcm9jZXNzVG9rZW5JZk5lZWRlZCgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8VG9rZW5zQ29udGVudHM+KCk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrQXN5bmMoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlJlZGlyZWN0VG9Jbml0aWFsUGFnZSh0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpOyBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUmVuZXdUb2tlblNpbGVudCgpIDogUS5JUHJvbWlzZTx2b2lkPlxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8dm9pZD4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlID0gXCJQcm9ibGVtIEdldHRpbmcgVG9rZW4gOiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKTsgXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuICAgIFxyXG5cclxuICAgIHByb3RlY3RlZCBSZWRpcmVjdFRvSW5pdGlhbFBhZ2UodXJpIDpzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgbG9jYXRpb24uYXNzaWduKHVyaSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXV0aGVudGljYXRpb25Db250ZXh0IHVuaW5pdGlhbGl6ZWQhXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogTWFrZSB0aGUgbG9naW4gYXQgdGhlIGN1cnJlbnQgVVJJLCBhbmQgcHJvY2VzcyB0aGUgcmVjZWl2ZWQgdG9rZW5zLlxyXG4gICAgICogT0JTOiBUaGUgUmVkaXJlY3QgVVJJIFtjYWxsYmFja191cmxdICh0byByZWNlaXZlIHRoZSB0b2tlbikgYW5kIFNpbGVudCBSZWZyZXNoIEZyYW1lIFVSSSBbc2lsZW50X3JlZGlyZWN0X3VyaV0gKHRvIGF1dG8gcmVuZXcgd2hlbiBleHBpcmVkKSBpZiBub3QgaW5mb3JtZWQgaXMgYXV0byBnZW5lcmF0ZWQgYmFzZWQgb24gdGhlICdjbGllbnRfdXJsJyBpbmZvcm1lZCBhdCAnSW5pdCcgbWV0aG9kIHdpdGggdGhlIGZvbGxvd2luIHN0cmF0ZWd5OlxyXG4gICAgICogYHJlZGlyZWN0X3VybCA9IGNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnYFxyXG4gICAgICogYHNpbGVudF9yZWRpcmVjdF91cmkgPSBjbGllbnRfdXJsICsgJz9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZSdgIFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcGVuT25Qb3BVcF0gKGRlc2NyaXB0aW9uKVxyXG4gICAgICovXHJcbiAgICAvLyBwdWJsaWMgTG9naW5BbmRQcm9jZXNzVG9rZW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAgLy8ge1xyXG4gICAgLy8gICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAvLyAgICAgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgLy8gICAgIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdjbGllbnRfdXJsJywgdGhlbiBpIGNvbnNpZGVyIHRvIG1ha2UgdGhlICdsb2dpbidcclxuICAgIC8vICAgICBlbHNlIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybC5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICBpZih0aGlzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAvLyAgICAgICAgIHtcclxuICAgIC8vICAgICAgICAgICAgIHRoaXMuTG9naW4oc2hvdWxkT3Blbk9uUG9wVXApO1xyXG4gICAgLy8gICAgICAgICB9XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW4oKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuVG9rZW5zQ29udGVudHMuSXNBdXRoZW50aWNhdGVkID09PSBmYWxzZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlZGlyZWN0Rm9yVG9rZW4oKTtcclxuXHJcbiAgICAgICAgICAgIC8vVE9ETzogTmVlZCBmaXggKGFub3RoZXIgd2F5IHRvIG5vdCBsZXQgdGhlIGpzIHJ1bnRpbWUgdG8gY29udGludWUpXHJcbiAgICAgICAgICAgIC8vU2hvdWxkIHJlZmFjdG9yIHRvIHJldHVybiBhIHByb21pc2Ugd2l0aCBhbiBhcmd1bWVudD8gXHJcbiAgICAgICAgICAgIHRocm93IFwiUmVkaXJlY3RpbmcgdG8gTG9naW4hXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQWxyZWFkeSBhdXRoZW50aWNhdGVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLlRva2Vuc0NvbnRlbnRzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFRva2Vuc0NvbnRlbnRzKCkgOiBUb2tlbnNDb250ZW50c1xyXG4gICAge1xyXG4gICAgICAgIGxldCB0b2tlbkNvbnRlbnRzID0gbmV3IFRva2Vuc0NvbnRlbnRzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5BY2Nlc3NUb2tlbiA9IHRoaXMuQWNjZXNzVG9rZW47XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuID0gdGhpcy5JZGVudGl0eVRva2VuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuQ29udGVudCA9IHRoaXMuSWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5Qcm9maWxlQ29udGVudCA9IHRoaXMuUHJvZmlsZUNvbnRlbnQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRva2VuQ29udGVudHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55IFxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoYWNjZXNzVG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gIEpTT04ucGFyc2UoYXRvYihhY2Nlc3NUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuO1xyXG4gICAgICAgICAgICByZXR1cm4gaWRfdG9rZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGlkZW50aXR5VG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gSlNPTi5wYXJzZShhdG9iKGlkZW50aXR5VG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IFByb2ZpbGVDb250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGUgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb2tlbnNDb250ZW50c1xyXG57XHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9wcm9maWxlQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvZmlsZUNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IFByb2ZpbGVDb250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcHJvZmlsZUNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IEFjY2Vzc1Rva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW4odmFsdWU6IHN0cmluZylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9hY2Nlc3NUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW5Db250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfaWRlbnRpdHlUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuO1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBJZGVudGl0eVRva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW5Db250ZW50OiBhbnk7XHJcbiAgICBwdWJsaWMgZ2V0IElkZW50aXR5VG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQodmFsdWU6IGFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHVibGljIHRva2Vuc0NvbnRlbnRzVG9BcnJheShpbmNsdWRlRW5jb2RlZFRva2Vuczpib29sZWFuID0gdHJ1ZSkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRva2Vuc0NvbnRlbnRzID0gbmV3IEFycmF5PGFueT4oKTtcclxuXHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLklkZW50aXR5VG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuUHJvZmlsZUNvbnRlbnQpO1xyXG5cclxuICAgICAgICBpZihpbmNsdWRlRW5jb2RlZFRva2VucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY2Nlc3NUb2tlbkVuY29kZWQgPSB7ICdhY2Nlc3NfdG9rZW4nOiBBdXRoZW50aWNhdGlvbkNvbnRleHQuQ3VycmVudC5Ub2tlbnNDb250ZW50cy5BY2Nlc3NUb2tlbiB9O1xyXG4gICAgICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKGFjY2Vzc1Rva2VuRW5jb2RlZCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkVuY29kZWQgPSB7ICdpZF90b2tlbic6IEF1dGhlbnRpY2F0aW9uQ29udGV4dC5DdXJyZW50LlRva2Vuc0NvbnRlbnRzLklkZW50aXR5VG9rZW4gfTtcclxuICAgICAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaChpZGVudGl0eVRva2VuRW5jb2RlZCk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRva2Vuc0NvbnRlbnRzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZW5jb2RlZFRva2Vuc1RvQXJyYXkoKSA6IEFycmF5PGFueT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gWyB0aGlzLklkZW50aXR5VG9rZW4sIHRoaXMuQWNjZXNzVG9rZW4gXTtcclxuICAgIH1cclxufSJdfQ==
