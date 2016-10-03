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
                            console.error('Token not renewed! Trying again after ' + count.toString() + ' fails! Max retry set to ' + _this.AuthenticationManagerSettings.max_retry_renew + '!');
                            if (count <= _this.AuthenticationManagerSettings.max_retry_renew) {
                                return _this.oidcTokenManager.renewTokenSilentAsync().then(success, fail);
                            }
                            else {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7WUFlQTtnQkF5Q0k7b0JBcENRLDJCQUFzQixHQUFzQixJQUFJLEtBQUssRUFBYyxDQUFDO29CQXNDeEUsSUFBSSx1Q0FBdUMsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUM7b0JBQ2pGLEVBQUUsQ0FBQSxDQUFDLHVDQUF1QyxJQUFJLElBQUksQ0FBQyxDQUNuRCxDQUFDO3dCQUNHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFFLHVDQUF1QyxDQUFFLENBQUM7b0JBQzVGLENBQUM7Z0JBQ0wsQ0FBQztnQkF6Q0Qsc0JBQWtCLGdDQUFPO3lCQUF6Qjt3QkFFSSxFQUFFLENBQUEsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLENBQzNDLENBQUM7NEJBQ0cscUJBQXFCLENBQUMsUUFBUSxHQUFJLElBQUkscUJBQXFCLEVBQUUsQ0FBQzt3QkFDbEUsQ0FBQzt3QkFDRCxNQUFNLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDO29CQUMxQyxDQUFDOzs7bUJBQUE7Z0JBRUQsc0JBQVcsZ0RBQWE7eUJBQXhCO3dCQUVJLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsSUFBSSxJQUFJLENBQUMsQ0FDOUMsQ0FBQzs0QkFDRyxNQUFNLENBQUMsSUFBSSxDQUFDO3dCQUNoQixDQUFDO3dCQUNELElBQUksQ0FDSixDQUFDOzRCQUNHLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQ2pCLENBQUM7b0JBQ0wsQ0FBQzs7O21CQUFBO2dCQUVhLDJCQUFLLEdBQW5CO29CQUVJLHFCQUFxQixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzFDLENBQUM7Z0JBRU0sa0RBQWtCLEdBQXpCLFVBQTBCLFFBQW9CO29CQUUxQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29C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Q0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUN0RyxjQUFjLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBQzlDLENBQUM7b0JBRUQsTUFBTSxDQUFDLGNBQWMsQ0FBQztnQkFDMUIsQ0FBQztnQkFFTSw2Q0FBb0IsR0FBM0I7b0JBRUksTUFBTSxDQUFDLENBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUM7Z0JBQ3BELENBQUM7Z0JBQ0wscUJBQUM7WUFBRCxDQWxHQSxBQWtHQyxJQUFBO1lBbEdELDJDQWtHQyxDQUFBIiwiZmlsZSI6InNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyc7XHJcbmltcG9ydCB7IElBdXRoZW50aWNhdGlvblNldHRpbmdzIH0gZnJvbSAnLi9JQXV0aGVudGljYXRpb25TZXR0aW5ncyc7XHJcbi8vcmVxdWlyZSgnb2lkYy10b2tlbi1tYW5hZ2VyJyk7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXIvZGlzdC9vaWRjLXRva2VuLW1hbmFnZXIuanMnO1xyXG5pbXBvcnQgKiBhcyBRIGZyb20gJ3EnO1xyXG4vL2ltcG9ydCAnb2lkYy10b2tlbi1tYW5hZ2VyJztcclxuXHJcbi8vU2hvdWxkIGJlIGdsb2JhbGx5IGltcG9ydGVkXHJcbmRlY2xhcmUgdmFyIE9pZGMgOiBhbnk7XHJcbmRlY2xhcmUgdmFyIE9pZGNUb2tlbk1hbmFnZXIgOiBhbnk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbntcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2N1cnJlbnQ6IEF1dGhlbnRpY2F0aW9uQ29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgcHJpdmF0ZSBjYWxsYmFja3NUb2tlbk9idGFpbmVkIDpBcnJheTwoKSA9PiB2b2lkPiA9IG5ldyBBcnJheTwoKSA9PiB2b2lkPigpO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IEN1cnJlbnQoKTogQXV0aGVudGljYXRpb25Db250ZXh0IFxyXG4gICAge1xyXG4gICAgICAgIGlmKEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9PT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9ICBuZXcgQXV0aGVudGljYXRpb25Db250ZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBnZXQgSXNJbml0aWFsaXplZCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgUmVzZXQoKVxyXG4gICAge1xyXG4gICAgICAgIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIEFkZE9uVG9rZW5PYnRhaW5lZChjYWxsYmFjazogKCkgPT4gdm9pZClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuT2J0YWluZWQucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFkZE9uVG9rZW5PYnRhaW5lZChjYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvaWRjVG9rZW5NYW5hZ2VyOiBhbnk7XHJcbiAgICAgICAgXHJcbiAgICBjb25zdHJ1Y3RvcigpIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgPSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzO1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIoIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncygpOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycpO1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZSA9IEpTT04ucGFyc2UoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBzZXQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3ModmFsdWU6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncylcclxuICAgIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnLCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgSW5pdGlhbGl6ZShhdXRoZW50aWNhdGlvblNldHRpbmdzOiBJQXV0aGVudGljYXRpb25TZXR0aW5ncylcclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSA9PSBudWxsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIlNob3VsZCBiZSBpbmZvcm1lZCBhdCBsZWFzdCAnYXV0aG9yaXR5JyBhbmQgJ2NsaWVudF9pZCchXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZhdWx0UmVkaXJlY3RVcmkgOiBzdHJpbmcgPSBudWxsO1xyXG4gICAgICAgIGlmKGxvY2F0aW9uLnByb3RvY29sLmluZGV4T2YoJ2ZpbGU6JykgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlZmF1bHRSZWRpcmVjdFVyaSA9ICd1cm46aWV0Zjp3ZzpvYXV0aDoyLjA6b29iOmF1dG8nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZWZhdWx0UmVkaXJlY3RVcmkgPSBsb2NhdGlvbi5ocmVmO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zb2xlLmxvZyhkZWZhdWx0UmVkaXJlY3RVcmkpO1xyXG4gICAgICAgIC8vU2V0IGRlZmF1bHQgdmFsdWVzIGlmIG5vdCBpbmZvcm1lZFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCB8fCBkZWZhdWx0UmVkaXJlY3RVcmk7IC8vU2VsZiB1cmlcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIC8vYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwIHx8IGZhbHNlOyAvL1JlZGlyZWN0IGZvciBkZWZhdWx0XHJcblxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3ID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5tYXhfcmV0cnlfcmVuZXcgfHwgMTA7XHJcblxyXG4gICAgICAgIC8vQ29udmVydCB0byB0aGUgbW9yZSBjb21wbGV0ZSBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3NcclxuICAgICAgICB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIHNjb3BlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIHBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml6YXRpb25fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy50b2tlbl91cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy51c2VyaW5mb191cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsb2FkX3VzZXJfcHJvZmlsZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2lsZW50X3JlbmV3OiB0cnVlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyk7XHJcblxyXG4gICAgICAgIC8vUmV0cnkgaW5kZWZpbml0bHkgZm9yIHJlbmV3XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFkZE9uU2lsZW50VG9rZW5SZW5ld0ZhaWxlZCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjb3VudCA9IDE7XHJcblxyXG4gICAgICAgICAgICBsZXQgcHJvbWlzZTogT2lkYy5EZWZhdWx0UHJvbWlzZSA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdWNjZXNzID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVuZXdlZCBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhJyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxldCBmYWlsID0gKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVG9rZW4gbm90IHJlbmV3ZWQhIFRyeWluZyBhZ2FpbiBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhIE1heCByZXRyeSBzZXQgdG8gJyArIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3ICsgJyEnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihjb3VudCA8PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm1heF9yZXRyeV9yZW5ldylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjaGlsZFByb21pc2UgPSBwcm9taXNlLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFByb21pc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgUHJvY2Vzc1Rva2VuSWZOZWVkZWQoKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignYWNjZXNzX3Rva2VuPScpID4gLTEgJiYgKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbCB8fCBsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3Byb21wdD1ub25lJykgPiAtMSkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEgKHNpbGVudGx5KScpO1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tTaWxlbnQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnVG9rZW4gcHJvY2Vzc2VkISAoc2lsZW50bHkpJyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPFRva2Vuc0NvbnRlbnRzPigpO1xyXG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKHRoaXMuVG9rZW5zQ29udGVudHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgICAgICB9IGVsc2UgXHJcblxyXG5cclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAgICAgLy9pZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgICAgICBpZihsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2FjY2Vzc190b2tlbj0nKSA+IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAgICAgLy8gZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvL0dvIEhvcnNlXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzPzogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbklmTmVlZGVkKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUmVkaXJlY3RUb0luaXRpYWxQYWdlKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9IFwiUHJvYmxlbSBHZXR0aW5nIFRva2VuIDogXCIgKyAoZXJyb3IubWVzc2FnZSB8fCBlcnJvcik7IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUmVuZXdUb2tlblNpbGVudCgpIDogUS5JUHJvbWlzZTx2b2lkPlxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8dm9pZD4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcbiAgICBcclxuXHJcbiAgICBwcm90ZWN0ZWQgUmVkaXJlY3RUb0luaXRpYWxQYWdlKHVyaSA6c3RyaW5nKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2F0aW9uLmFzc2lnbih1cmkpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBWYWxpZGF0ZUluaXRpYWxpemF0aW9uKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIkF1dGhlbnRpY2F0aW9uQ29udGV4dCB1bmluaXRpYWxpemVkIVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgdGhlIGxvZ2luIGF0IHRoZSBjdXJyZW50IFVSSSwgYW5kIHByb2Nlc3MgdGhlIHJlY2VpdmVkIHRva2Vucy5cclxuICAgICAqIE9CUzogVGhlIFJlZGlyZWN0IFVSSSBbY2FsbGJhY2tfdXJsXSAodG8gcmVjZWl2ZSB0aGUgdG9rZW4pIGFuZCBTaWxlbnQgUmVmcmVzaCBGcmFtZSBVUkkgW3NpbGVudF9yZWRpcmVjdF91cmldICh0byBhdXRvIHJlbmV3IHdoZW4gZXhwaXJlZCkgaWYgbm90IGluZm9ybWVkIGlzIGF1dG8gZ2VuZXJhdGVkIGJhc2VkIG9uIHRoZSAnY2xpZW50X3VybCcgaW5mb3JtZWQgYXQgJ0luaXQnIG1ldGhvZCB3aXRoIHRoZSBmb2xsb3dpbiBzdHJhdGVneTpcclxuICAgICAqIGByZWRpcmVjdF91cmwgPSBjbGllbnRfdXJsICsgJz9jYWxsYmFjaz10cnVlJ2BcclxuICAgICAqIGBzaWxlbnRfcmVkaXJlY3RfdXJpID0gY2xpZW50X3VybCArICc/c2lsZW50cmVmcmVzaGZyYW1lPXRydWUnYCBcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3Blbk9uUG9wVXBdIChkZXNjcmlwdGlvbilcclxuICAgICAqL1xyXG4gICAgLy8gcHVibGljIExvZ2luQW5kUHJvY2Vzc1Rva2VuKG9wZW5PblBvcFVwPzogYm9vbGVhbilcclxuICAgIC8vIHtcclxuICAgIC8vICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICBcclxuICAgIC8vICAgICBsZXQgc2hvdWxkT3Blbk9uUG9wVXAgPSBvcGVuT25Qb3BVcCB8fCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm9wZW5fb25fcG9wdXA7XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgLy8gICAgIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5Qcm9jZXNzVG9rZW5DYWxsYmFjaygpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3NpbGVudF9yZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaydcclxuICAgIC8vICAgICBlbHNlIGlmIChsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5SZW5ld1Rva2VuU2lsZW50KCk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnY2xpZW50X3VybCcsIHRoZW4gaSBjb25zaWRlciB0byBtYWtlIHRoZSAnbG9naW4nXHJcbiAgICAvLyAgICAgZWxzZSBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsKVxyXG4gICAgLy8gICAgIHtcclxuICAgIC8vICAgICAgICAgaWYodGhpcy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgLy8gICAgICAgICB7XHJcbiAgICAvLyAgICAgICAgICAgICB0aGlzLkxvZ2luKHNob3VsZE9wZW5PblBvcFVwKTtcclxuICAgIC8vICAgICAgICAgfVxyXG4gICAgLy8gICAgIH1cclxuICAgIC8vIH1cclxuICAgIFxyXG4gICAgcHVibGljIExvZ2luKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLlRva2Vuc0NvbnRlbnRzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcblxyXG4gICAgICAgICAgICAvL1RPRE86IE5lZWQgZml4IChhbm90aGVyIHdheSB0byBub3QgbGV0IHRoZSBqcyBydW50aW1lIHRvIGNvbnRpbnVlKVxyXG4gICAgICAgICAgICAvL1Nob3VsZCByZWZhY3RvciB0byByZXR1cm4gYSBwcm9taXNlIHdpdGggYW4gYXJndW1lbnQ/IFxyXG4gICAgICAgICAgICB0aHJvdyBcIlJlZGlyZWN0IHRvIExvZ2luIChCcmVhayB0aGUgZmxvdyEpXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQWxyZWFkeSBhdXRoZW50aWNhdGVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLlRva2Vuc0NvbnRlbnRzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFRva2Vuc0NvbnRlbnRzKCkgOiBUb2tlbnNDb250ZW50c1xyXG4gICAge1xyXG4gICAgICAgIGxldCB0b2tlbkNvbnRlbnRzID0gbmV3IFRva2Vuc0NvbnRlbnRzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5BY2Nlc3NUb2tlbiA9IHRoaXMuQWNjZXNzVG9rZW47XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuID0gdGhpcy5JZGVudGl0eVRva2VuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuQ29udGVudCA9IHRoaXMuSWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5Qcm9maWxlQ29udGVudCA9IHRoaXMuUHJvZmlsZUNvbnRlbnQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRva2VuQ29udGVudHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55IFxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoYWNjZXNzVG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gIEpTT04ucGFyc2UoYXRvYihhY2Nlc3NUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuO1xyXG4gICAgICAgICAgICByZXR1cm4gaWRfdG9rZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGlkZW50aXR5VG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gSlNPTi5wYXJzZShhdG9iKGlkZW50aXR5VG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IFByb2ZpbGVDb250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGUgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb2tlbnNDb250ZW50c1xyXG57XHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9wcm9maWxlQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvZmlsZUNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IFByb2ZpbGVDb250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcHJvZmlsZUNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IEFjY2Vzc1Rva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW4odmFsdWU6IHN0cmluZylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9hY2Nlc3NUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW5Db250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfaWRlbnRpdHlUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuO1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBJZGVudGl0eVRva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW5Db250ZW50OiBhbnk7XHJcbiAgICBwdWJsaWMgZ2V0IElkZW50aXR5VG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQodmFsdWU6IGFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHVibGljIHRva2Vuc0NvbnRlbnRzVG9BcnJheShpbmNsdWRlRW5jb2RlZFRva2Vuczpib29sZWFuID0gdHJ1ZSkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRva2Vuc0NvbnRlbnRzID0gbmV3IEFycmF5PGFueT4oKTtcclxuXHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLklkZW50aXR5VG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuUHJvZmlsZUNvbnRlbnQpO1xyXG5cclxuICAgICAgICBpZihpbmNsdWRlRW5jb2RlZFRva2VucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY2Nlc3NUb2tlbkVuY29kZWQgPSB7ICdhY2Nlc3NfdG9rZW4nOiBBdXRoZW50aWNhdGlvbkNvbnRleHQuQ3VycmVudC5Ub2tlbnNDb250ZW50cy5BY2Nlc3NUb2tlbiB9O1xyXG4gICAgICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKGFjY2Vzc1Rva2VuRW5jb2RlZCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkVuY29kZWQgPSB7ICdpZF90b2tlbic6IEF1dGhlbnRpY2F0aW9uQ29udGV4dC5DdXJyZW50LlRva2Vuc0NvbnRlbnRzLklkZW50aXR5VG9rZW4gfTtcclxuICAgICAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaChpZGVudGl0eVRva2VuRW5jb2RlZCk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRva2Vuc0NvbnRlbnRzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZW5jb2RlZFRva2Vuc1RvQXJyYXkoKSA6IEFycmF5PGFueT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gWyB0aGlzLklkZW50aXR5VG9rZW4sIHRoaXMuQWNjZXNzVG9rZW4gXTtcclxuICAgIH1cclxufSJdfQ==
