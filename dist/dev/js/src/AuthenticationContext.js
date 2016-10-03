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
                    if (authenticationSettings.authority == null || authenticationSettings.client_id == null) {
                        throw "Should be informed at least 'authority' and 'client_id'!";
                    }
                    var defaultRedirectUri = null;
                    if (location.protocol.indexOf('file:') > -1) {
                        defaultRedirectUri = 'urn:ietf:wg:oauth:2.0:oob:auto';
                    }
                    else {
                        defaultRedirectUri = location.href;
                    }
                    console.log(defaultRedirectUri);
                    authenticationSettings.client_url = authenticationSettings.client_url || defaultRedirectUri;
                    authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access';
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token';
                    authenticationSettings.max_retry_renew = authenticationSettings.max_retry_renew || 10;
                    this.AuthenticationManagerSettings =
                        {
                            authority: authenticationSettings.authority,
                            client_id: authenticationSettings.client_id,
                            client_url: authenticationSettings.client_url,
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
                            if (count <= _this.AuthenticationManagerSettings.max_retry_renew) {
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
                AuthenticationContext.prototype.Login = function () {
                    if (this.TokensContents.IsAuthenticated === false) {
                        this.ValidateInitialization();
                        this.oidcTokenManager.redirectForToken();
                        throw "Redirect to Login (Break the flow!)";
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7WUFlQTtnQkFpREk7b0JBNUNRLDJCQUFzQixHQUFzQixJQUFJLEtBQUssRUFBYyxDQUFDO29CQUVwRSxzQ0FBaUMsR0FBc0IsSUFBSSxLQUFLLEVBQWMsQ0FBQztvQkE0Q25GLElBQUksdUNBQXVDLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDO29CQUNqRixFQUFFLENBQUEsQ0FBQyx1Q0FBdUMsSUFBSSxJQUFJLENBQUMsQ0FDbkQsQ0FBQzt3QkFDRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBRSx1Q0FBdUMsQ0FBRSxDQUFDO29CQUM1RixDQUFDO2dCQUNMLENBQUM7Z0JBL0NELHNCQUFrQixnQ0FBTzt5QkFBekI7d0JBRUksRUFBRSxDQUFBLENBQUMscUJBQXFCLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUMzQyxDQUFDOzRCQUNHLHFCQUFxQixDQUFDLFFBQVEsR0FBSSxJQUFJLHFCQUFxQixFQUFFLENBQUM7d0JBQ2xFLENBQUM7d0JBQ0QsTUFBTSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQztvQkFDMUMsQ0FBQzs7O21CQUFBO2dCQUVELHNCQUFXLGdEQUFhO3lCQUF4Qjt3QkFFSSxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLElBQUksSUFBSSxDQUFDLENBQzlDLENBQUM7NEJBQ0csTUFBTSxDQUFDLElBQUksQ0FBQzt3QkFDaEIsQ0FBQzt3QkFDRCxJQUFJLENBQ0osQ0FBQzs0QkFDRyxNQUFNLENBQUMsS0FBSyxDQUFDO3dCQUNqQixDQUFDO29CQUNMLENBQUM7OzttQkFBQTtnQkFFYSwyQkFBSyxHQUFuQjtvQkFFSSxxQkFBcUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUMxQyxDQUFDO2dCQUVNLGtEQUFrQixHQUF6QixVQUEwQixRQUFvQjtvQkFFMUMsSUFBSSxDQUFD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b0JBQzdDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUV6QyxFQUFFLENBQUEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUN4QixDQUFDO3dCQUNHLElBQUksa0JBQWtCLEdBQUcsRUFBRSxjQUFjLEVBQUUscUJBQXFCLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDdEcsY0FBYyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3dCQUV4QyxJQUFJLG9CQUFvQixHQUFHLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ3RHLGNBQWMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztvQkFDOUMsQ0FBQztvQkFFRCxNQUFNLENBQUMsY0FBYyxDQUFDO2dCQUMxQixDQUFDO2dCQUVNLDZDQUFvQixHQUEzQjtvQkFFSSxNQUFNLENBQUMsQ0FBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUUsQ0FBQztnQkFDcEQsQ0FBQztnQkFDTCxxQkFBQztZQUFELENBbEdBLEFBa0dDLElBQUE7WUFsR0QsMkNBa0dDLENBQUEiLCJmaWxlIjoic3JjL0F1dGhlbnRpY2F0aW9uQ29udGV4dC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJztcclxuaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuLy9yZXF1aXJlKCdvaWRjLXRva2VuLW1hbmFnZXInKTtcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlci9kaXN0L29pZGMtdG9rZW4tbWFuYWdlci5qcyc7XHJcbmltcG9ydCAqIGFzIFEgZnJvbSAncSc7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXInO1xyXG5cclxuLy9TaG91bGQgYmUgZ2xvYmFsbHkgaW1wb3J0ZWRcclxuZGVjbGFyZSB2YXIgT2lkYyA6IGFueTtcclxuZGVjbGFyZSB2YXIgT2lkY1Rva2VuTWFuYWdlciA6IGFueTtcclxuXHJcblxyXG4vKipcclxuICogQXV0aGVudGljYXRpb25Jbml0aWFsaXplclxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uQ29udGV4dCBcclxue1xyXG4gICAgXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3VycmVudDogQXV0aGVudGljYXRpb25Db250ZXh0ID0gbnVsbDtcclxuXHJcbiAgICBwcml2YXRlIGNhbGxiYWNrc1Rva2VuT2J0YWluZWQgOkFycmF5PCgpID0+IHZvaWQ+ID0gbmV3IEFycmF5PCgpID0+IHZvaWQ+KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBjYWxsYmFja3NUb2tlblJlbmV3RmFpbGVkUmV0cnlNYXggOkFycmF5PCgpID0+IHZvaWQ+ID0gbmV3IEFycmF5PCgpID0+IHZvaWQ+KCk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkNvbnRleHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGdldCBJc0luaXRpYWxpemVkKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBSZXNldCgpXHJcbiAgICB7XHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQWRkT25Ub2tlbk9idGFpbmVkKGNhbGxiYWNrOiAoKSA9PiB2b2lkKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWRkT25Ub2tlbk9idGFpbmVkKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQWRkT25Ub2tlblJlbmV3RmFpbGVkTWF4UmV0cnkoY2FsbGJhY2s6ICgpID0+IHZvaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYWxsYmFja3NUb2tlblJlbmV3RmFpbGVkUmV0cnlNYXgucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgLy90aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWRkT25TaWxlbnRUb2tlblJlbmV3RmFpbGVkKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IGFueTtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSA9IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlciggYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKCk6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJyk7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlID0gSlNPTi5wYXJzZShhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIHNldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyh2YWx1ZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBJbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvblNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ID09IG51bGwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIGluZm9ybWVkIGF0IGxlYXN0ICdhdXRob3JpdHknIGFuZCAnY2xpZW50X2lkJyFcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmF1bHRSZWRpcmVjdFVyaSA6IHN0cmluZyA9IG51bGw7XHJcbiAgICAgICAgaWYobG9jYXRpb24ucHJvdG9jb2wuaW5kZXhPZignZmlsZTonKSA+IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGVmYXVsdFJlZGlyZWN0VXJpID0gJ3VybjppZXRmOndnOm9hdXRoOjIuMDpvb2I6YXV0byc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlZmF1bHRSZWRpcmVjdFVyaSA9IGxvY2F0aW9uLmhyZWY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUubG9nKGRlZmF1bHRSZWRpcmVjdFVyaSk7XHJcbiAgICAgICAgLy9TZXQgZGVmYXVsdCB2YWx1ZXMgaWYgbm90IGluZm9ybWVkXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsIHx8IGRlZmF1bHRSZWRpcmVjdFVyaTsgLy9TZWxmIHVyaVxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGUgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlIHx8ICdvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2Vzcyc7IC8vT3BlbklkIGRlZmF1bHQgc2NvcGVzXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlIHx8ICdjb2RlIGlkX3Rva2VuIHRva2VuJzsgLy9IeWJyaWQgZmxvdyBhdCBkZWZhdWx0XHJcbiAgICAgICAgLy9hdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgfHwgZmFsc2U7IC8vUmVkaXJlY3QgZm9yIGRlZmF1bHRcclxuXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5tYXhfcmV0cnlfcmVuZXcgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyB8fCAxMDtcclxuXHJcbiAgICAgICAgLy9Db252ZXJ0IHRvIHRoZSBtb3JlIGNvbXBsZXRlIElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5nc1xyXG4gICAgICAgIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHksXHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQsXHJcbiAgICAgICAgICAgIGNsaWVudF91cmw6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlc3BvbnNlX3R5cGU6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSxcclxuICAgICAgICAgICAgc2NvcGU6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGUsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZWRpcmVjdF91cmkgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIHNpbGVudF9yZWRpcmVjdF91cmk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgcG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uX3VybCA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXphdGlvbl91cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnRva2VuX3VybCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnVzZXJpbmZvX3VybCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlcih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKTtcclxuXHJcbiAgICAgICAgLy9SZXRyeSBpbmRlZmluaXRseSBmb3IgcmVuZXdcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWRkT25TaWxlbnRUb2tlblJlbmV3RmFpbGVkKCgpID0+IHtcclxuICAgICAgICAgICAgbGV0IGNvdW50ID0gMTtcclxuXHJcbiAgICAgICAgICAgIGxldCBwcm9taXNlOiBPaWRjLkRlZmF1bHRQcm9taXNlID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZW5ld2VkIGFmdGVyICcgKyBjb3VudC50b1N0cmluZygpICsgJyBmYWlscyEnKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IGZhaWwgPSAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdUb2tlbiBub3QgcmVuZXdlZCEgVHJ5aW5nIGFnYWluIGFmdGVyICcgKyBjb3VudC50b1N0cmluZygpICsgJyBmYWlscyEgTWF4IHJldHJ5IHNldCB0byAnICsgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5tYXhfcmV0cnlfcmVuZXcgKyAnIScpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKGNvdW50IDw9IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihzdWNjZXNzLCBmYWlsKTtcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Rva2VuIG5vdCByZW5ld2VkIScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5SZW5ld0ZhaWxlZFJldHJ5TWF4LmZvckVhY2goKGNhbGxiYWNrKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjaGlsZFByb21pc2UgPSBwcm9taXNlLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFByb21pc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgUHJvY2Vzc1Rva2VuSWZOZWVkZWQoKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignYWNjZXNzX3Rva2VuPScpID4gLTEgJiYgKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbCB8fCBsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3Byb21wdD1ub25lJykgPiAtMSkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEgKHNpbGVudGx5KScpO1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tTaWxlbnQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnVG9rZW4gcHJvY2Vzc2VkISAoc2lsZW50bHkpJyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPFRva2Vuc0NvbnRlbnRzPigpO1xyXG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKHRoaXMuVG9rZW5zQ29udGVudHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgICAgICB9IGVsc2UgXHJcblxyXG5cclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAgICAgLy9pZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgICAgICBpZihsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2FjY2Vzc190b2tlbj0nKSA+IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAgICAgLy8gZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvL0dvIEhvcnNlXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzPzogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbklmTmVlZGVkKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUmVkaXJlY3RUb0luaXRpYWxQYWdlKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9IFwiUHJvYmxlbSBHZXR0aW5nIFRva2VuIDogXCIgKyAoZXJyb3IubWVzc2FnZSB8fCBlcnJvcik7IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUmVuZXdUb2tlblNpbGVudCgpIDogUS5JUHJvbWlzZTx2b2lkPlxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8dm9pZD4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcbiAgICBcclxuXHJcbiAgICBwcm90ZWN0ZWQgUmVkaXJlY3RUb0luaXRpYWxQYWdlKHVyaSA6c3RyaW5nKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2F0aW9uLmFzc2lnbih1cmkpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBWYWxpZGF0ZUluaXRpYWxpemF0aW9uKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIkF1dGhlbnRpY2F0aW9uQ29udGV4dCB1bmluaXRpYWxpemVkIVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgdGhlIGxvZ2luIGF0IHRoZSBjdXJyZW50IFVSSSwgYW5kIHByb2Nlc3MgdGhlIHJlY2VpdmVkIHRva2Vucy5cclxuICAgICAqIE9CUzogVGhlIFJlZGlyZWN0IFVSSSBbY2FsbGJhY2tfdXJsXSAodG8gcmVjZWl2ZSB0aGUgdG9rZW4pIGFuZCBTaWxlbnQgUmVmcmVzaCBGcmFtZSBVUkkgW3NpbGVudF9yZWRpcmVjdF91cmldICh0byBhdXRvIHJlbmV3IHdoZW4gZXhwaXJlZCkgaWYgbm90IGluZm9ybWVkIGlzIGF1dG8gZ2VuZXJhdGVkIGJhc2VkIG9uIHRoZSAnY2xpZW50X3VybCcgaW5mb3JtZWQgYXQgJ0luaXQnIG1ldGhvZCB3aXRoIHRoZSBmb2xsb3dpbiBzdHJhdGVneTpcclxuICAgICAqIGByZWRpcmVjdF91cmwgPSBjbGllbnRfdXJsICsgJz9jYWxsYmFjaz10cnVlJ2BcclxuICAgICAqIGBzaWxlbnRfcmVkaXJlY3RfdXJpID0gY2xpZW50X3VybCArICc/c2lsZW50cmVmcmVzaGZyYW1lPXRydWUnYCBcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3Blbk9uUG9wVXBdIChkZXNjcmlwdGlvbilcclxuICAgICAqL1xyXG4gICAgLy8gcHVibGljIExvZ2luQW5kUHJvY2Vzc1Rva2VuKG9wZW5PblBvcFVwPzogYm9vbGVhbilcclxuICAgIC8vIHtcclxuICAgIC8vICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICBcclxuICAgIC8vICAgICBsZXQgc2hvdWxkT3Blbk9uUG9wVXAgPSBvcGVuT25Qb3BVcCB8fCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm9wZW5fb25fcG9wdXA7XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgLy8gICAgIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5Qcm9jZXNzVG9rZW5DYWxsYmFjaygpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3NpbGVudF9yZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaydcclxuICAgIC8vICAgICBlbHNlIGlmIChsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5SZW5ld1Rva2VuU2lsZW50KCk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnY2xpZW50X3VybCcsIHRoZW4gaSBjb25zaWRlciB0byBtYWtlIHRoZSAnbG9naW4nXHJcbiAgICAvLyAgICAgZWxzZSBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgaWYodGhpcy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgLy8gICAgICAgICB7XHJcbiAgICAvLyAgICAgICAgICAgICB0aGlzLkxvZ2luKHNob3VsZE9wZW5PblBvcFVwKTtcclxuICAgIC8vICAgICAgICAgfVxyXG4gICAgLy8gICAgIH1cclxuICAgIC8vIH1cclxuICAgIFxyXG4gICAgcHVibGljIExvZ2luKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLlRva2Vuc0NvbnRlbnRzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcblxyXG4gICAgICAgICAgICAvL1RPRE86IE5lZWQgZml4IChhbm90aGVyIHdheSB0byBub3QgbGV0IHRoZSBqcyBydW50aW1lIHRvIGNvbnRpbnVlKVxyXG4gICAgICAgICAgICAvL1Nob3VsZCByZWZhY3RvciB0byByZXR1cm4gYSBwcm9taXNlIHdpdGggYW4gYXJndW1lbnQ/IFxyXG4gICAgICAgICAgICB0aHJvdyBcIlJlZGlyZWN0IHRvIExvZ2luIChCcmVhayB0aGUgZmxvdyEpXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQWxyZWFkeSBhdXRoZW50aWNhdGVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLlRva2Vuc0NvbnRlbnRzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFRva2Vuc0NvbnRlbnRzKCkgOiBUb2tlbnNDb250ZW50c1xyXG4gICAge1xyXG4gICAgICAgIGxldCB0b2tlbkNvbnRlbnRzID0gbmV3IFRva2Vuc0NvbnRlbnRzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5BY2Nlc3NUb2tlbiA9IHRoaXMuQWNjZXNzVG9rZW47XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuID0gdGhpcy5JZGVudGl0eVRva2VuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuQ29udGVudCA9IHRoaXMuSWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5Qcm9maWxlQ29udGVudCA9IHRoaXMuUHJvZmlsZUNvbnRlbnQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRva2VuQ29udGVudHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55IFxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoYWNjZXNzVG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gIEpTT04ucGFyc2UoYXRvYihhY2Nlc3NUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuO1xyXG4gICAgICAgICAgICByZXR1cm4gaWRfdG9rZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGlkZW50aXR5VG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gSlNPTi5wYXJzZShhdG9iKGlkZW50aXR5VG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IFByb2ZpbGVDb250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGUgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb2tlbnNDb250ZW50c1xyXG57XHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9wcm9maWxlQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvZmlsZUNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IFByb2ZpbGVDb250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcHJvZmlsZUNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IEFjY2Vzc1Rva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW4odmFsdWU6IHN0cmluZylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9hY2Nlc3NUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW5Db250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfaWRlbnRpdHlUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuO1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBJZGVudGl0eVRva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW5Db250ZW50OiBhbnk7XHJcbiAgICBwdWJsaWMgZ2V0IElkZW50aXR5VG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQodmFsdWU6IGFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHVibGljIHRva2Vuc0NvbnRlbnRzVG9BcnJheShpbmNsdWRlRW5jb2RlZFRva2Vuczpib29sZWFuID0gdHJ1ZSkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRva2Vuc0NvbnRlbnRzID0gbmV3IEFycmF5PGFueT4oKTtcclxuXHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLklkZW50aXR5VG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuUHJvZmlsZUNvbnRlbnQpO1xyXG5cclxuICAgICAgICBpZihpbmNsdWRlRW5jb2RlZFRva2VucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY2Nlc3NUb2tlbkVuY29kZWQgPSB7ICdhY2Nlc3NfdG9rZW4nOiBBdXRoZW50aWNhdGlvbkNvbnRleHQuQ3VycmVudC5Ub2tlbnNDb250ZW50cy5BY2Nlc3NUb2tlbiB9O1xyXG4gICAgICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKGFjY2Vzc1Rva2VuRW5jb2RlZCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkVuY29kZWQgPSB7ICdpZF90b2tlbic6IEF1dGhlbnRpY2F0aW9uQ29udGV4dC5DdXJyZW50LlRva2Vuc0NvbnRlbnRzLklkZW50aXR5VG9rZW4gfTtcclxuICAgICAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaChpZGVudGl0eVRva2VuRW5jb2RlZCk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRva2Vuc0NvbnRlbnRzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZW5jb2RlZFRva2Vuc1RvQXJyYXkoKSA6IEFycmF5PGFueT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gWyB0aGlzLklkZW50aXR5VG9rZW4sIHRoaXMuQWNjZXNzVG9rZW4gXTtcclxuICAgIH1cclxufSJdfQ==
