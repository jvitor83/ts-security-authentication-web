(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", 'q'], factory);
    }
})(function (require, exports) {
    "use strict";
    var Q = require('q');
    var AuthenticationContext = (function () {
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
    exports.AuthenticationContext = AuthenticationContext;
    var TokensContents = (function () {
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
    exports.TokensContents = TokensContents;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0lBSUEsSUFBWSxDQUFDLFdBQU0sR0FBRyxDQUFDLENBQUE7SUFXdkI7UUFpREk7WUE1Q1EsMkJBQXNCLEdBQXNCLElBQUksS0FBSyxFQUFjLENBQUM7WUFFcEUsc0NBQWlDLEdBQXNCLElBQUksS0FBSyxFQUFjLENBQUM7WUE0Q25GLElBQUksdUNBQXVDLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDO1lBQ2pGLEVBQUUsQ0FBQSxDQUFDLHVDQUF1QyxJQUFJLElBQUksQ0FBQyxDQUNuRCxDQUFDO2dCQUNHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFFLHVDQUF1QyxDQUFFLENBQUM7WUFDNUYsQ0FBQztRQUNMLENBQUM7UUEvQ0Qsc0JBQWtCLGdDQUFPO2lCQUF6QjtnQkFFSSxFQUFFLENBQUEsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLENBQzNDLENBQUM7b0JBQ0cscUJBQXFCLENBQUMsUUFBUSxHQUFJLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDbEUsQ0FBQztnQkFDRCxNQUFNLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDO1lBQzFDLENBQUM7OztXQUFBO1FBRUQsc0JBQVcsZ0RBQWE7aUJBQXhCO2dCQUVJLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsSUFBSSxJQUFJLENBQUMsQ0FDOUMsQ0FBQztvQkFDRyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNoQixDQUFDO2dCQUNELElBQUksQ0FDSixDQUFDO29CQUNHLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQ2pCLENBQUM7WUFDTCxDQUFDOzs7V0FBQTtRQUVhLDJCQUFLLEdBQW5CO1lBRUkscUJBQXFCLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUMxQyxDQUFDO1FBRU0sa0RBQWtCLEdBQXpCLFVBQTBCLFFBQW9C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QWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRXpDLEVBQUUsQ0FBQSxDQUFDLG9CQUFvQixDQUFDLENBQ3hCLENBQUM7Z0JBQ0csSUFBSSxrQkFBa0IsR0FBRyxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0RyxjQUFjLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBRXhDLElBQUksb0JBQW9CLEdBQUcsRUFBRSxVQUFVLEVBQUUscUJBQXFCLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDdEcsY0FBYyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFFRCxNQUFNLENBQUMsY0FBYyxDQUFDO1FBQzFCLENBQUM7UUFFTSw2Q0FBb0IsR0FBM0I7WUFFSSxNQUFNLENBQUMsQ0FBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUUsQ0FBQztRQUNwRCxDQUFDO1FBQ0wscUJBQUM7SUFBRCxDQWxHQSxBQWtHQyxJQUFBO0lBbEdZLHNCQUFjLGlCQWtHMUIsQ0FBQSIsImZpbGUiOiJzcmMvQXV0aGVudGljYXRpb25Db250ZXh0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIH0gZnJvbSAnLi9JQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBJQXV0aGVudGljYXRpb25TZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG4vL3JlcXVpcmUoJ29pZGMtdG9rZW4tbWFuYWdlcicpO1xyXG4vL2ltcG9ydCAnb2lkYy10b2tlbi1tYW5hZ2VyL2Rpc3Qvb2lkYy10b2tlbi1tYW5hZ2VyLmpzJztcclxuaW1wb3J0ICogYXMgUSBmcm9tICdxJztcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG4vL1Nob3VsZCBiZSBnbG9iYWxseSBpbXBvcnRlZFxyXG5kZWNsYXJlIHZhciBPaWRjIDogYW55O1xyXG5kZWNsYXJlIHZhciBPaWRjVG9rZW5NYW5hZ2VyIDogYW55O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25Db250ZXh0IFxyXG57XHJcbiAgICBcclxuICAgIHByaXZhdGUgc3RhdGljIF9jdXJyZW50OiBBdXRoZW50aWNhdGlvbkNvbnRleHQgPSBudWxsO1xyXG5cclxuICAgIHByaXZhdGUgY2FsbGJhY2tzVG9rZW5PYnRhaW5lZCA6QXJyYXk8KCkgPT4gdm9pZD4gPSBuZXcgQXJyYXk8KCkgPT4gdm9pZD4oKTtcclxuXHJcbiAgICBwcml2YXRlIGNhbGxiYWNrc1Rva2VuUmVuZXdGYWlsZWRSZXRyeU1heCA6QXJyYXk8KCkgPT4gdm9pZD4gPSBuZXcgQXJyYXk8KCkgPT4gdm9pZD4oKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGdldCBDdXJyZW50KCk6IEF1dGhlbnRpY2F0aW9uQ29udGV4dCBcclxuICAgIHtcclxuICAgICAgICBpZihBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQgPT09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQgPSAgbmV3IEF1dGhlbnRpY2F0aW9uQ29udGV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZ2V0IElzSW5pdGlhbGl6ZWQoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIFJlc2V0KClcclxuICAgIHtcclxuICAgICAgICBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBBZGRPblRva2VuT2J0YWluZWQoY2FsbGJhY2s6ICgpID0+IHZvaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYWxsYmFja3NUb2tlbk9idGFpbmVkLnB1c2goY2FsbGJhY2spO1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5hZGRPblRva2VuT2J0YWluZWQoY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBBZGRPblRva2VuUmVuZXdGYWlsZWRNYXhSZXRyeShjYWxsYmFjazogKCkgPT4gdm9pZClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuUmVuZXdGYWlsZWRSZXRyeU1heC5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICAvL3RoaXMub2lkY1Rva2VuTWFuYWdlci5hZGRPblNpbGVudFRva2VuUmVuZXdGYWlsZWQoY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb2lkY1Rva2VuTWFuYWdlcjogYW55O1xyXG4gICAgICAgIFxyXG4gICAgY29uc3RydWN0b3IoKSBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlID0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncztcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlciA9IG5ldyBPaWRjVG9rZW5NYW5hZ2VyKCBhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MoKTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gbnVsbDtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnKTtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2UgPSBKU09OLnBhcnNlKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgc2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKHZhbHVlOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJywgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIEluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5nczogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgPT0gbnVsbCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCA9PSBudWxsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJTaG91bGQgYmUgaW5mb3JtZWQgYXQgbGVhc3QgJ2F1dGhvcml0eScsICdjbGllbnRfaWQnIGFuZCAnY2xpZW50X3VybCchXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlX2lldGZfcGF0dGVybiA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy51c2VfaWV0Zl9wYXR0ZXJuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlX2lldGZfcGF0dGVybiAhPSBudWxsICYmIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlX2lldGZfcGF0dGVybiA9PT0gdHJ1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybC5pbmRleE9mKCdmaWxlOicpID4gLTEgfHwgKChsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2ZpbGU6JykgPiAtMSkgfHwgbG9jYXRpb24ucHJvdG9jb2wuaW5kZXhPZignZmlsZScpID4gLTEpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPSAndXJuOmlldGY6d2c6b2F1dGg6Mi4wOm9vYjphdXRvJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL1NldCBkZWZhdWx0IHZhbHVlcyBpZiBub3QgaW5mb3JtZWRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmw7IC8vU2VsZiB1cmlcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdDbGllbnRVcmw6ICcgKyBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwpO1xyXG5cclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCB8fCBmYWxzZTsgLy9SZWRpcmVjdCBmb3IgZGVmYXVsdFxyXG5cclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3IHx8IDM1O1xyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ01heCByZXRyeSBzZXR0ZWQgdG86ICcgKyBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyk7XHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5zaWxlbnRfcmVuZXdfdGltZW91dCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQgfHwgNDAgKiAxMDAwOyAvLzQwIHNlY29uZHMgdG8gdGltZW91dFxyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1NpbGVudCByZW5ldyB0aW1lb3V0IHNldHRlZCB0bzogJyArIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQgKyAnIG1pbGlzZWNvbmRzJyk7XHJcblxyXG4gICAgICAgIC8vQ29udmVydCB0byB0aGUgbW9yZSBjb21wbGV0ZSBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3NcclxuICAgICAgICB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcblxyXG4gICAgICAgICAgICBtYXhfcmV0cnlfcmVuZXc6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3LCBcclxuICAgICAgICAgICAgc2lsZW50X3JlbmV3X3RpbWVvdXQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIHNjb3BlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIHBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml6YXRpb25fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy50b2tlbl91cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy51c2VyaW5mb191cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsb2FkX3VzZXJfcHJvZmlsZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2lsZW50X3JlbmV3OiB0cnVlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyk7XHJcblxyXG4gICAgICAgIC8vUmV0cnkgaW5kZWZpbml0bHkgZm9yIHJlbmV3XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFkZE9uU2lsZW50VG9rZW5SZW5ld0ZhaWxlZCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjb3VudCA9IDE7XHJcblxyXG4gICAgICAgICAgICBsZXQgcHJvbWlzZTogT2lkYy5EZWZhdWx0UHJvbWlzZSA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdWNjZXNzID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVuZXdlZCBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhJyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxldCBmYWlsID0gKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnVG9rZW4gbm90IHJlbmV3ZWQhIFRyeWluZyBhZ2FpbiBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhIE1heCByZXRyeSBzZXQgdG8gJyArIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3ICsgJyEnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihjb3VudCA8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MubWF4X3JldHJ5X3JlbmV3KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihzdWNjZXNzLCBmYWlsKTtcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Rva2VuIG5vdCByZW5ld2VkIScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5SZW5ld0ZhaWxlZFJldHJ5TWF4LmZvckVhY2goKGNhbGxiYWNrKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjaGlsZFByb21pc2UgPSBwcm9taXNlLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFByb21pc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgUHJvY2Vzc1Rva2VuSWZOZWVkZWQoKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignYWNjZXNzX3Rva2VuPScpID4gLTEgJiYgKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbCB8fCBsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3Byb21wdD1ub25lJykgPiAtMSkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEgKHNpbGVudGx5KScpO1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tTaWxlbnQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnVG9rZW4gcHJvY2Vzc2VkISAoc2lsZW50bHkpJyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPFRva2Vuc0NvbnRlbnRzPigpO1xyXG4gICAgICAgICAgICBkZWZlci5yZXNvbHZlKHRoaXMuVG9rZW5zQ29udGVudHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgICAgICB9IGVsc2UgXHJcblxyXG5cclxuICAgICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAgICAgLy9pZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgICAgICBpZihsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2FjY2Vzc190b2tlbj0nKSA+IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJvY2Vzc2luZyB0b2tlbiEnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAgICAgLy8gZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvL0dvIEhvcnNlXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgSW5pdChhdXRoZW50aWNhdGlvblNldHRpbmdzPzogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkluaXRpYWxpemUoYXV0aGVudGljYXRpb25TZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbklmTmVlZGVkKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBQcm9jZXNzVG9rZW5DYWxsYmFjaygpIDogUS5JUHJvbWlzZTxUb2tlbnNDb250ZW50cz5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUmVkaXJlY3RUb0luaXRpYWxQYWdlKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9IFwiUHJvYmxlbSBHZXR0aW5nIFRva2VuIDogXCIgKyAoZXJyb3IubWVzc2FnZSB8fCBlcnJvcik7IFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBSZW5ld1Rva2VuU2lsZW50KCkgOiBRLklQcm9taXNlPHZvaWQ+XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjx2b2lkPigpO1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKS50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpOyBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG4gICAgcHJvdGVjdGVkIFJlZGlyZWN0VG9Jbml0aWFsUGFnZSh1cmkgOnN0cmluZylcclxuICAgIHtcclxuICAgICAgICBsb2NhdGlvbi5hc3NpZ24odXJpKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgVmFsaWRhdGVJbml0aWFsaXphdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdXRoZW50aWNhdGlvbkNvbnRleHQgdW5pbml0aWFsaXplZCFcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRoZSBsb2dpbiBhdCB0aGUgY3VycmVudCBVUkksIGFuZCBwcm9jZXNzIHRoZSByZWNlaXZlZCB0b2tlbnMuXHJcbiAgICAgKiBPQlM6IFRoZSBSZWRpcmVjdCBVUkkgW2NhbGxiYWNrX3VybF0gKHRvIHJlY2VpdmUgdGhlIHRva2VuKSBhbmQgU2lsZW50IFJlZnJlc2ggRnJhbWUgVVJJIFtzaWxlbnRfcmVkaXJlY3RfdXJpXSAodG8gYXV0byByZW5ldyB3aGVuIGV4cGlyZWQpIGlmIG5vdCBpbmZvcm1lZCBpcyBhdXRvIGdlbmVyYXRlZCBiYXNlZCBvbiB0aGUgJ2NsaWVudF91cmwnIGluZm9ybWVkIGF0ICdJbml0JyBtZXRob2Qgd2l0aCB0aGUgZm9sbG93aW4gc3RyYXRlZ3k6XHJcbiAgICAgKiBgcmVkaXJlY3RfdXJsID0gY2xpZW50X3VybCArICc/Y2FsbGJhY2s9dHJ1ZSdgXHJcbiAgICAgKiBgc2lsZW50X3JlZGlyZWN0X3VyaSA9IGNsaWVudF91cmwgKyAnP3NpbGVudHJlZnJlc2hmcmFtZT10cnVlJ2AgXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wZW5PblBvcFVwXSAoZGVzY3JpcHRpb24pXHJcbiAgICAgKi9cclxuICAgIC8vIHB1YmxpYyBMb2dpbkFuZFByb2Nlc3NUb2tlbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICAvLyB7XHJcbiAgICAvLyAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAncmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snICBcclxuICAgIC8vICAgICBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAvLyAgICAgZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ2NsaWVudF91cmwnLCB0aGVuIGkgY29uc2lkZXIgdG8gbWFrZSB0aGUgJ2xvZ2luJ1xyXG4gICAgLy8gICAgIGVsc2UgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybClcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIGlmKHRoaXMuSXNBdXRoZW50aWNhdGVkID09PSBmYWxzZSlcclxuICAgIC8vICAgICAgICAge1xyXG4gICAgLy8gICAgICAgICAgICAgdGhpcy5Mb2dpbihzaG91bGRPcGVuT25Qb3BVcCk7XHJcbiAgICAvLyAgICAgICAgIH1cclxuICAgIC8vICAgICB9XHJcbiAgICAvLyB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBMb2dpbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5Ub2tlbnNDb250ZW50cy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL1RPRE86IFRyZWF0IHdoZW4gaW4gbW9iaWxlIGJyb3dzZXIgdG8gbm90IHN1cHBvcnQgcG9wdXBcclxuICAgICAgICAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHNob3VsZE9wZW5PblBvcFVwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIub3BlblBvcHVwRm9yVG9rZW5Bc3luYygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlZGlyZWN0Rm9yVG9rZW4oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIC8vVE9ETzogTmVlZCBmaXggKGFub3RoZXIgd2F5IHRvIG5vdCBsZXQgdGhlIGpzIHJ1bnRpbWUgdG8gY29udGludWUpXHJcbiAgICAgICAgICAgIC8vU2hvdWxkIHJlZmFjdG9yIHRvIHJldHVybiBhIHByb21pc2Ugd2l0aCBhbiBhcmd1bWVudD8gXHJcbiAgICAgICAgICAgIHRocm93IFwiUmVkaXJlY3RpbmcgdG8gTG9naW4hXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQWxyZWFkeSBhdXRoZW50aWNhdGVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgSXNBdXRoZW50aWNhdGVkKCkgOmJvb2xlYW5cclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLlRva2Vuc0NvbnRlbnRzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFRva2Vuc0NvbnRlbnRzKCkgOiBUb2tlbnNDb250ZW50c1xyXG4gICAge1xyXG4gICAgICAgIGxldCB0b2tlbkNvbnRlbnRzID0gbmV3IFRva2Vuc0NvbnRlbnRzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5BY2Nlc3NUb2tlbiA9IHRoaXMuQWNjZXNzVG9rZW47XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuID0gdGhpcy5JZGVudGl0eVRva2VuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5JZGVudGl0eVRva2VuQ29udGVudCA9IHRoaXMuSWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICAgICAgdG9rZW5Db250ZW50cy5Qcm9maWxlQ29udGVudCA9IHRoaXMuUHJvZmlsZUNvbnRlbnQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRva2VuQ29udGVudHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJvdGVjdGVkIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55IFxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoYWNjZXNzVG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gIEpTT04ucGFyc2UoYXRvYihhY2Nlc3NUb2tlbkNvbnRlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmcgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IGlkX3Rva2VuID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuO1xyXG4gICAgICAgICAgICByZXR1cm4gaWRfdG9rZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbiAhPSBudWxsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGlkZW50aXR5VG9rZW5Db250ZW50ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gSlNPTi5wYXJzZShhdG9iKGlkZW50aXR5VG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IFByb2ZpbGVDb250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlciAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGUgIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbG9yID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb2tlbnNDb250ZW50c1xyXG57XHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BY2Nlc3NUb2tlbkNvbnRlbnQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9wcm9maWxlQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvZmlsZUNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IFByb2ZpbGVDb250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcHJvZmlsZUNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IEFjY2Vzc1Rva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW4odmFsdWU6IHN0cmluZylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9hY2Nlc3NUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2FjY2Vzc1Rva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgQWNjZXNzVG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW5Db250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfaWRlbnRpdHlUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuKCk6IHN0cmluZ1xyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuO1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBJZGVudGl0eVRva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbiA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW5Db250ZW50OiBhbnk7XHJcbiAgICBwdWJsaWMgZ2V0IElkZW50aXR5VG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudDtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQodmFsdWU6IGFueSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9pZGVudGl0eVRva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgcHVibGljIHRva2Vuc0NvbnRlbnRzVG9BcnJheShpbmNsdWRlRW5jb2RlZFRva2Vuczpib29sZWFuID0gdHJ1ZSkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRva2Vuc0NvbnRlbnRzID0gbmV3IEFycmF5PGFueT4oKTtcclxuXHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLklkZW50aXR5VG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50KTtcclxuICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKHRoaXMuUHJvZmlsZUNvbnRlbnQpO1xyXG5cclxuICAgICAgICBpZihpbmNsdWRlRW5jb2RlZFRva2VucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBhY2Nlc3NUb2tlbkVuY29kZWQgPSB7ICdhY2Nlc3NfdG9rZW4nOiBBdXRoZW50aWNhdGlvbkNvbnRleHQuQ3VycmVudC5Ub2tlbnNDb250ZW50cy5BY2Nlc3NUb2tlbiB9O1xyXG4gICAgICAgICAgICB0b2tlbnNDb250ZW50cy5wdXNoKGFjY2Vzc1Rva2VuRW5jb2RlZCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgaWRlbnRpdHlUb2tlbkVuY29kZWQgPSB7ICdpZF90b2tlbic6IEF1dGhlbnRpY2F0aW9uQ29udGV4dC5DdXJyZW50LlRva2Vuc0NvbnRlbnRzLklkZW50aXR5VG9rZW4gfTtcclxuICAgICAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaChpZGVudGl0eVRva2VuRW5jb2RlZCk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRva2Vuc0NvbnRlbnRzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgZW5jb2RlZFRva2Vuc1RvQXJyYXkoKSA6IEFycmF5PGFueT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gWyB0aGlzLklkZW50aXR5VG9rZW4sIHRoaXMuQWNjZXNzVG9rZW4gXTtcclxuICAgIH1cclxufSJdfQ==
