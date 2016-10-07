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
                    if (authenticationSettings.use_ietf_pattern == null) {
                        authenticationSettings.use_ietf_pattern = true;
                    }
                    if (authenticationSettings.use_ietf_pattern != null && authenticationSettings.use_ietf_pattern === true) {
                        if (authenticationSettings.client_url.indexOf('file:') > -1 || ((location.href.indexOf('file:') > -1) || location.protocol.indexOf('file') > -1)) {
                            authenticationSettings.client_url = 'urn:ietf:wg:oauth:2.0:oob:auto';
                        }
                    }
                    authenticationSettings.client_url = authenticationSettings.client_url;
                    console.debug('ClientUrl: ' + authenticationSettings.client_url);
                    authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access';
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token';
                    authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7WUFlQTtnQkFpREk7b0JBNUNRLDJCQUFzQixHQUFzQixJQUFJLEtBQUssRUFBYyxDQUFDO29CQUVwRSxzQ0FBaUMsR0FBc0IsSUFBSSxLQUFLLEVBQWMsQ0FBQztvQkE0Q25GLElBQUksdUNBQXVDLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDO29CQUNqRixFQUFFLENBQUEsQ0FBQyx1Q0FBdUMsSUFBSSxJQUFJLENBQUMsQ0FDbkQsQ0FBQzt3QkFDRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBRSx1Q0FBdUMsQ0FBRSxDQUFDO29CQUM1RixDQUFDO2dCQUNMLENBQUM7Z0JBL0NELHNCQUFrQixnQ0FBTzt5QkFBekI7d0JBRUksRUFBRSxDQUFBLENBQUMscUJBQXFCLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUMzQyxDQUFDOzRCQUNHLHFCQUFxQixDQUFDLFFBQVEsR0FBSSxJQUFJLHFCQUFxQixFQUFFLENBQUM7d0JBQ2xFLENBQUM7d0JBQ0QsTUFBTSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQztvQkFDMUMsQ0FBQzs7O21CQUFBO2dCQUVELHNCQUFXLGdEQUFhO3lCQUF4Qjt3QkFFSSxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLElBQUksSUFBSSxDQUFDLENBQzlDLENBQUM7NEJBQ0csTUFBTSxDQUFDLElBQUksQ0FBQzt3QkFDaEIsQ0FBQzt3QkFDRCxJQUFJLENBQ0osQ0FBQzs0QkFDRyxNQUFNLENBQUMsS0FBSyxDQUFDO3dCQUNqQixDQUFDO29CQUNMLENBQUM7OzttQkFBQTtnQkFFYSwyQkFBSyxHQUFuQjtvQkFFSSxxQkFBcUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUMxQyxDQUFDO2dCQUVNLGtEQUFrQixHQUF6QixVQUEwQixRQUFvQjtvQkFFMUMsSUFBSSxDQUFD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QUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztvQkFDL0MsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztvQkFDN0MsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBRXpDLEVBQUUsQ0FBQSxDQUFDLG9CQUFvQixDQUFDLENBQ3hCLENBQUM7d0JBQ0csSUFBSSxrQkFBa0IsR0FBRyxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUN0RyxjQUFjLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7d0JBRXhDLElBQUksb0JBQW9CLEdBQUcsRUFBRSxVQUFVLEVBQUUscUJBQXFCLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDdEcsY0FBYyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUM5QyxDQUFDO29CQUVELE1BQU0sQ0FBQyxjQUFjLENBQUM7Z0JBQzFCLENBQUM7Z0JBRU0sNkNBQW9CLEdBQTNCO29CQUVJLE1BQU0sQ0FBQyxDQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDO2dCQUNwRCxDQUFDO2dCQUNMLHFCQUFDO1lBQUQsQ0FsR0EsQUFrR0MsSUFBQTtZQWxHRCwyQ0FrR0MsQ0FBQSIsImZpbGUiOiJzcmMvQXV0aGVudGljYXRpb25Db250ZXh0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIH0gZnJvbSAnLi9JQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBJQXV0aGVudGljYXRpb25TZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG4vL3JlcXVpcmUoJ29pZGMtdG9rZW4tbWFuYWdlcicpO1xyXG4vL2ltcG9ydCAnb2lkYy10b2tlbi1tYW5hZ2VyL2Rpc3Qvb2lkYy10b2tlbi1tYW5hZ2VyLmpzJztcclxuaW1wb3J0ICogYXMgUSBmcm9tICdxJztcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG4vL1Nob3VsZCBiZSBnbG9iYWxseSBpbXBvcnRlZFxyXG5kZWNsYXJlIHZhciBPaWRjIDogYW55O1xyXG5kZWNsYXJlIHZhciBPaWRjVG9rZW5NYW5hZ2VyIDogYW55O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25Db250ZXh0IFxyXG57XHJcbiAgICBcclxuICAgIHByaXZhdGUgc3RhdGljIF9jdXJyZW50OiBBdXRoZW50aWNhdGlvbkNvbnRleHQgPSBudWxsO1xyXG5cclxuICAgIHByaXZhdGUgY2FsbGJhY2tzVG9rZW5PYnRhaW5lZCA6QXJyYXk8KCkgPT4gdm9pZD4gPSBuZXcgQXJyYXk8KCkgPT4gdm9pZD4oKTtcclxuXHJcbiAgICBwcml2YXRlIGNhbGxiYWNrc1Rva2VuUmVuZXdGYWlsZWRSZXRyeU1heCA6QXJyYXk8KCkgPT4gdm9pZD4gPSBuZXcgQXJyYXk8KCkgPT4gdm9pZD4oKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGdldCBDdXJyZW50KCk6IEF1dGhlbnRpY2F0aW9uQ29udGV4dCBcclxuICAgIHtcclxuICAgICAgICBpZihBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQgPT09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQgPSAgbmV3IEF1dGhlbnRpY2F0aW9uQ29udGV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZ2V0IElzSW5pdGlhbGl6ZWQoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIFJlc2V0KClcclxuICAgIHtcclxuICAgICAgICBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBBZGRPblRva2VuT2J0YWluZWQoY2FsbGJhY2s6ICgpID0+IHZvaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYWxsYmFja3NUb2tlbk9idGFpbmVkLnB1c2goY2FsbGJhY2spO1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5hZGRPblRva2VuT2J0YWluZWQoY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBBZGRPblRva2VuUmVuZXdGYWlsZWRNYXhSZXRyeShjYWxsYmFjazogKCkgPT4gdm9pZClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuUmVuZXdGYWlsZWRSZXRyeU1heC5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICAvL3RoaXMub2lkY1Rva2VuTWFuYWdlci5hZGRPblNpbGVudFRva2VuUmVuZXdGYWlsZWQoY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb2lkY1Rva2VuTWFuYWdlcjogYW55O1xyXG4gICAgICAgIFxyXG4gICAgY29uc3RydWN0b3IoKSBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlID0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncztcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlciA9IG5ldyBPaWRjVG9rZW5NYW5hZ2VyKCBhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MoKTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gbnVsbDtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnKTtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2UgPSBKU09OLnBhcnNlKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgc2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKHZhbHVlOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJywgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIEluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5nczogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgPT0gbnVsbCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCA9PSBudWxsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJTaG91bGQgYmUgaW5mb3JtZWQgYXQgbGVhc3QgJ2F1dGhvcml0eScsICdjbGllbnRfaWQnIGFuZCAnY2xpZW50X3VybCchXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlX2lldGZfcGF0dGVybiA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy51c2VfaWV0Zl9wYXR0ZXJuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlX2lldGZfcGF0dGVybiAhPSBudWxsICYmIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlX2lldGZfcGF0dGVybiA9PT0gdHJ1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybC5pbmRleE9mKCdmaWxlOicpID4gLTEgfHwgKChsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2ZpbGU6JykgPiAtMSkgfHwgbG9jYXRpb24ucHJvdG9jb2wuaW5kZXhPZignZmlsZScpID4gLTEpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPSAndXJuOmlldGY6d2c6b2F1dGg6Mi4wOm9vYjphdXRvJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL1NldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgaW5mb3JtZWRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmw7IC8vU2VsZiB1cmlcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdDbGllbnRVcmw6ICcgKyBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwpO1xyXG5cclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCB8fCBmYWxzZTsgLy9SZWRpcmVjdCBmb3IgZGVmYXVsdFxyXG5cclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3IHx8IDM1O1xyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ01heCByZXRyeSBzZXR0ZWQgdG86ICcgKyBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyk7XHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5zaWxlbnRfcmVuZXdfdGltZW91dCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQgfHwgNDAgKiAxMDAwOyAvLzQwIHNlY29uZHMgdG8gdGltZW91dFxyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1NpbGVudCByZW5ldyB0aW1lb3V0IHNldHRlZCB0bzogJyArIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQgKyAnIG1pbGlzZWNvbmRzJyk7XHJcblxyXG4gICAgICAgIC8vQ29udmVydCB0byB0aGUgbW9yZSBjb21wbGV0ZSBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3NcclxuICAgICAgICB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcblxyXG4gICAgICAgICAgICBtYXhfcmV0cnlfcmVuZXc6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3LCBcclxuICAgICAgICAgICAgc2lsZW50X3JlbmV3X3RpbWVvdXQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIHNjb3BlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIHBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml6YXRpb25fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy50b2tlbl91cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy51c2VyaW5mb191cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsb2FkX3VzZXJfcHJvZmlsZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2lsZW50X3JlbmV3OiB0cnVlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyk7XHJcblxyXG4gICAgICAgIC8vUmV0cnkgaW5kZWZpbml0bHkgZm9yIHJlbmV3XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFkZE9uU2lsZW50VG9rZW5SZW5ld0ZhaWxlZCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjb3VudCA9IDE7XHJcblxyXG4gICAgICAgICAgICBsZXQgcHJvbWlzZTogT2lkYy5EZWZhdWx0UHJvbWlzZSA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdWNjZXNzID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVuZXdlZCBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhJyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxldCBmYWlsID0gKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnVG9rZW4gbm90IHJlbmV3ZWQhIFRyeWluZyBhZ2FpbiBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhIE1heCByZXRyeSBzZXQgdG8gJyArIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3ICsgJyEnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihjb3VudCA8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihzdWNjZXNzLCBmYWlsKTtcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Rva2VuIG5vdCByZW5ld2VkIScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5SZW5ld0ZhaWxlZFJldHJ5TWF4LmZvckVhY2goKGNhbGxiYWNrKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjaGlsZFByb21pc2UgPSBwcm9taXNlLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFByb21pc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgUHJvY2Vzc1Rva2VuSWZOZWVkZWQoKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignYWNjZXNzX3Rva2VuPScpID4gLTEgJiYgKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbCB8fCBsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3Byb21wdD1ub25lJykgPiAtMSkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEgKHNpbGVudGx5KScpO1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tTaWxlbnQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnVG9rZW4gcHJvY2Vzc2VkISAoc2lsZW50bHkpJyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPFRva2Vuc0NvbnRlbnRzPigpO1xyXG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKHRoaXMuVG9rZW5zQ29udGVudHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgICAgICB9IGVsc2UgXHJcblxyXG5cclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAgICAgLy9pZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgICAgICBpZihsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2FjY2Vzc190b2tlbj0nKSA+IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAgICAgLy8gZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvL0dvIEhvcnNlXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzPzogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbklmTmVlZGVkKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUmVkaXJlY3RUb0luaXRpYWxQYWdlKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9IFwiUHJvYmxlbSBHZXR0aW5nIFRva2VuIDogXCIgKyAoZXJyb3IubWVzc2FnZSB8fCBlcnJvcik7IFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBSZW5ld1Rva2VuU2lsZW50KCkgOiBRLklQcm9taXNlPHZvaWQ+XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjx2b2lkPigpO1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKS50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpOyBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG4gICAgcHJvdGVjdGVkIFJlZGlyZWN0VG9Jbml0aWFsUGFnZSh1cmkgOnN0cmluZylcclxuICAgIHtcclxuICAgICAgICBsb2NhdGlvbi5hc3NpZ24odXJpKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgVmFsaWRhdGVJbml0aWFsaXphdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdXRoZW50aWNhdGlvbkNvbnRleHQgdW5pbml0aWFsaXplZCFcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRoZSBsb2dpbiBhdCB0aGUgY3VycmVudCBVUkksIGFuZCBwcm9jZXNzIHRoZSByZWNlaXZlZCB0b2tlbnMuXHJcbiAgICAgKiBPQlM6IFRoZSBSZWRpcmVjdCBVUkkgW2NhbGxiYWNrX3VybF0gKHRvIHJlY2VpdmUgdGhlIHRva2VuKSBhbmQgU2lsZW50IFJlZnJlc2ggRnJhbWUgVVJJIFtzaWxlbnRfcmVkaXJlY3RfdXJpXSAodG8gYXV0byByZW5ldyB3aGVuIGV4cGlyZWQpIGlmIG5vdCBpbmZvcm1lZCBpcyBhdXRvIGdlbmVyYXRlZCBiYXNlZCBvbiB0aGUgJ2NsaWVudF91cmwnIGluZm9ybWVkIGF0ICdJbml0JyBtZXRob2Qgd2l0aCB0aGUgZm9sbG93aW4gc3RyYXRlZ3k6XHJcbiAgICAgKiBgcmVkaXJlY3RfdXJsID0gY2xpZW50X3VybCArICc/Y2FsbGJhY2s9dHJ1ZSdgXHJcbiAgICAgKiBgc2lsZW50X3JlZGlyZWN0X3VyaSA9IGNsaWVudF91cmwgKyAnP3NpbGVudHJlZnJlc2hmcmFtZT10cnVlJ2AgXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wZW5PblBvcFVwXSAoZGVzY3JpcHRpb24pXHJcbiAgICAgKi9cclxuICAgIC8vIHB1YmxpYyBMb2dpbkFuZFByb2Nlc3NUb2tlbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICAvLyB7XHJcbiAgICAvLyAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAncmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snICBcclxuICAgIC8vICAgICBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAvLyAgICAgZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ2NsaWVudF91cmwnLCB0aGVuIGkgY29uc2lkZXIgdG8gbWFrZSB0aGUgJ2xvZ2luJ1xyXG4gICAgLy8gICAgIGVsc2UgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybClcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIGlmKHRoaXMuSXNBdXRoZW50aWNhdGVkID09PSBmYWxzZSlcclxuICAgIC8vICAgICAgICAge1xyXG4gICAgLy8gICAgICAgICAgICAgdGhpcy5Mb2dpbihzaG91bGRPcGVuT25Qb3BVcCk7XHJcbiAgICAvLyAgICAgICAgIH1cclxuICAgIC8vICAgICB9XHJcbiAgICAvLyB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBMb2dpbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5Ub2tlbnNDb250ZW50cy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL1RPRE86IFRyZWF0IHdoZW4gaW4gbW9iaWxlIGJyb3dzZXIgdG8gbm90IHN1cHBvcnQgcG9wdXBcclxuICAgICAgICAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHNob3VsZE9wZW5PblBvcFVwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIub3BlblBvcHVwRm9yVG9rZW5Bc3luYygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlZGlyZWN0Rm9yVG9rZW4oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIC8vVE9ETzogTmVlZCBmaXggKGFub3RoZXIgd2F5IHRvIG5vdCBsZXQgdGhlIGpzIHJ1bnRpbWUgdG8gY29udGludWUpXHJcbiAgICAgICAgICAgIC8vU2hvdWxkIHJlZmFjdG9yIHRvIHJldHVybiBhIHByb21pc2Ugd2l0aCBhbiBhcmd1bWVudD8gXHJcbiAgICAgICAgICAgIHRocm93IFwiUmVkaXJlY3RpbmcgdG8gTG9naW4hXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQWxyZWFkeSBhdXRoZW50aWNhdGVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLlRva2Vuc0NvbnRlbnRzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFRva2Vuc0NvbnRlbnRzKCkgOiBUb2tlbnNDb250ZW50c1xyXG4gICAge1xyXG4gICAgICAgIGxldCB0b2tlbkNvbnRlbnRzID0gbmV3IFRva2Vuc0NvbnRlbnRzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5BY2Nlc3NUb2tlbiA9IHRoaXMuQWNjZXNzVG9rZW47XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuID0gdGhpcy5JZGVudGl0eVRva2VuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuQ29udGVudCA9IHRoaXMuSWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5Qcm9maWxlQ29udGVudCA9IHRoaXMuUHJvZmlsZUNvbnRlbnQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRva2VuQ29udGVudHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55IFxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoYWNjZXNzVG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gIEpTT04ucGFyc2UoYXRvYihhY2Nlc3NUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuO1xyXG4gICAgICAgICAgICByZXR1cm4gaWRfdG9rZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGlkZW50aXR5VG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gSlNPTi5wYXJzZShhdG9iKGlkZW50aXR5VG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IFByb2ZpbGVDb250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGUgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb2tlbnNDb250ZW50c1xyXG57XHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9wcm9maWxlQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvZmlsZUNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IFByb2ZpbGVDb250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcHJvZmlsZUNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IEFjY2Vzc1Rva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW4odmFsdWU6IHN0cmluZylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9hY2Nlc3NUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW5Db250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfaWRlbnRpdHlUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuO1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBJZGVudGl0eVRva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW5Db250ZW50OiBhbnk7XHJcbiAgICBwdWJsaWMgZ2V0IElkZW50aXR5VG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQodmFsdWU6IGFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHVibGljIHRva2Vuc0NvbnRlbnRzVG9BcnJheShpbmNsdWRlRW5jb2RlZFRva2Vuczpib29sZWFuID0gdHJ1ZSkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRva2Vuc0NvbnRlbnRzID0gbmV3IEFycmF5PGFueT4oKTtcclxuXHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLklkZW50aXR5VG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuUHJvZmlsZUNvbnRlbnQpO1xyXG5cclxuICAgICAgICBpZihpbmNsdWRlRW5jb2RlZFRva2VucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY2Nlc3NUb2tlbkVuY29kZWQgPSB7ICdhY2Nlc3NfdG9rZW4nOiBBdXRoZW50aWNhdGlvbkNvbnRleHQuQ3VycmVudC5Ub2tlbnNDb250ZW50cy5BY2Nlc3NUb2tlbiB9O1xyXG4gICAgICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKGFjY2Vzc1Rva2VuRW5jb2RlZCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkVuY29kZWQgPSB7ICdpZF90b2tlbic6IEF1dGhlbnRpY2F0aW9uQ29udGV4dC5DdXJyZW50LlRva2Vuc0NvbnRlbnRzLklkZW50aXR5VG9rZW4gfTtcclxuICAgICAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaChpZGVudGl0eVRva2VuRW5jb2RlZCk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRva2Vuc0NvbnRlbnRzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZW5jb2RlZFRva2Vuc1RvQXJyYXkoKSA6IEFycmF5PGFueT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gWyB0aGlzLklkZW50aXR5VG9rZW4sIHRoaXMuQWNjZXNzVG9rZW4gXTtcclxuICAgIH1cclxufSJdfQ==
