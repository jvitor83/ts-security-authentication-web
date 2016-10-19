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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGhlbnRpY2F0aW9uQ29udGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7SUFJQSxJQUFZLENBQUMsV0FBTSxHQUFHLENBQUMsQ0FBQTtJQVd2QjtRQWlESTtZQTVDUSwyQkFBc0IsR0FBc0IsSUFBSSxLQUFLLEVBQWMsQ0FBQztZQUVwRSxzQ0FBaUMsR0FBc0IsSUFBSSxLQUFLLEVBQWMsQ0FBQztZQTRDbkYsSUFBSSx1Q0FBdUMsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUM7WUFDakYsRUFBRSxDQUFBLENBQUMsdUNBQXVDLElBQUksSUFBSSxDQUFDLENBQ25ELENBQUM7Z0JBQ0csSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUUsdUNBQXVDLENBQUUsQ0FBQztZQUM1RixDQUFDO1FBQ0wsQ0FBQztRQS9DRCxzQkFBa0IsZ0NBQU87aUJBQXpCO2dCQUVJLEVBQUUsQ0FBQSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FDM0MsQ0FBQztvQkFDRyxxQkFBcUIsQ0FBQyxRQUFRLEdBQUksSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUNsRSxDQUFDO2dCQUNELE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUM7WUFDMUMsQ0FBQzs7O1dBQUE7UUFFRCxzQkFBVyxnREFBYTtpQkFBeEI7Z0JBRUksRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLDZCQUE2QixJQUFJLElBQUksQ0FBQyxDQUM5QyxDQUFDO29CQUNHLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7Z0JBQ0QsSUFBSSxDQUNKLENBQUM7b0JBQ0csTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDakIsQ0FBQztZQUNMLENBQUM7OztXQUFBO1FBRWEsMkJBQUssR0FBbkI7WUFFSSxxQkFBcUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQzFDLENBQUM7UUFFTSxrREFBa0IsR0FBekIsVUFBMEIsUUFBb0I7WUFF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QUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFekMsRUFBRSxDQUFBLENBQUMsb0JBQW9CLENBQUMsQ0FDeEIsQ0FBQztnQkFDRyxJQUFJLGtCQUFrQixHQUFHLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RHLGNBQWMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFFeEMsSUFBSSxvQkFBb0IsR0FBRyxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN0RyxjQUFjLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUVELE1BQU0sQ0FBQyxjQUFjLENBQUM7UUFDMUIsQ0FBQztRQUVNLDZDQUFvQixHQUEzQjtZQUVJLE1BQU0sQ0FBQyxDQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDO1FBQ3BELENBQUM7UUFDTCxxQkFBQztJQUFELENBbEdBLEFBa0dDLElBQUE7SUFsR1ksc0JBQWMsaUJBa0cxQixDQUFBIiwiZmlsZSI6IkF1dGhlbnRpY2F0aW9uQ29udGV4dC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJztcclxuaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuLy9yZXF1aXJlKCdvaWRjLXRva2VuLW1hbmFnZXInKTtcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlci9kaXN0L29pZGMtdG9rZW4tbWFuYWdlci5qcyc7XHJcbmltcG9ydCAqIGFzIFEgZnJvbSAncSc7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXInO1xyXG5cclxuLy9TaG91bGQgYmUgZ2xvYmFsbHkgaW1wb3J0ZWRcclxuZGVjbGFyZSB2YXIgT2lkYyA6IGFueTtcclxuZGVjbGFyZSB2YXIgT2lkY1Rva2VuTWFuYWdlciA6IGFueTtcclxuXHJcblxyXG4vKipcclxuICogQXV0aGVudGljYXRpb25Jbml0aWFsaXplclxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uQ29udGV4dCBcclxue1xyXG4gICAgXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3VycmVudDogQXV0aGVudGljYXRpb25Db250ZXh0ID0gbnVsbDtcclxuXHJcbiAgICBwcml2YXRlIGNhbGxiYWNrc1Rva2VuT2J0YWluZWQgOkFycmF5PCgpID0+IHZvaWQ+ID0gbmV3IEFycmF5PCgpID0+IHZvaWQ+KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBjYWxsYmFja3NUb2tlblJlbmV3RmFpbGVkUmV0cnlNYXggOkFycmF5PCgpID0+IHZvaWQ+ID0gbmV3IEFycmF5PCgpID0+IHZvaWQ+KCk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkNvbnRleHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGdldCBJc0luaXRpYWxpemVkKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBSZXNldCgpXHJcbiAgICB7XHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Db250ZXh0Ll9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQWRkT25Ub2tlbk9idGFpbmVkKGNhbGxiYWNrOiAoKSA9PiB2b2lkKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzVG9rZW5PYnRhaW5lZC5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWRkT25Ub2tlbk9idGFpbmVkKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQWRkT25Ub2tlblJlbmV3RmFpbGVkTWF4UmV0cnkoY2FsbGJhY2s6ICgpID0+IHZvaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jYWxsYmFja3NUb2tlblJlbmV3RmFpbGVkUmV0cnlNYXgucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgLy90aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWRkT25TaWxlbnRUb2tlblJlbmV3RmFpbGVkKGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IGFueTtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSA9IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIgPSBuZXcgT2lkY1Rva2VuTWFuYWdlciggYXV0aGVudGljYXRpb25TZXR0aW5nc0xvYWRlZEZyb21TdG9yYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IEF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKCk6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyBcclxuICAgIHtcclxuICAgICAgICBsZXQgYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0F1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJyk7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlID0gSlNPTi5wYXJzZShhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIHNldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyh2YWx1ZTogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBJbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvblNldHRpbmdzKVxyXG4gICAge1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ID09IG51bGwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQgPT0gbnVsbCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIGluZm9ybWVkIGF0IGxlYXN0ICdhdXRob3JpdHknLCAnY2xpZW50X2lkJyBhbmQgJ2NsaWVudF91cmwnIVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLnVzZV9pZXRmX3BhdHRlcm4gPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlX2lldGZfcGF0dGVybiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLnVzZV9pZXRmX3BhdHRlcm4gIT0gbnVsbCAmJiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnVzZV9pZXRmX3BhdHRlcm4gPT09IHRydWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwuaW5kZXhPZignZmlsZTonKSA+IC0xIHx8ICgobG9jYXRpb24uaHJlZi5pbmRleE9mKCdmaWxlOicpID4gLTEpIHx8IGxvY2F0aW9uLnByb3RvY29sLmluZGV4T2YoJ2ZpbGUnKSA+IC0xKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsID0gJ3VybjppZXRmOndnOm9hdXRoOjIuMDpvb2I6YXV0byc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9TZXQgZGVmYXVsdCB2YWx1ZXMgaWYgbm90IGluZm9ybWVkXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsOyAvL1NlbGYgdXJpXHJcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnQ2xpZW50VXJsOiAnICsgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsKTtcclxuXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGUgfHwgJ29wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzJzsgLy9PcGVuSWQgZGVmYXVsdCBzY29wZXNcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUgfHwgJ2NvZGUgaWRfdG9rZW4gdG9rZW4nOyAvL0h5YnJpZCBmbG93IGF0IGRlZmF1bHRcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm9wZW5fb25fcG9wdXAgfHwgZmFsc2U7IC8vUmVkaXJlY3QgZm9yIGRlZmF1bHRcclxuXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5tYXhfcmV0cnlfcmVuZXcgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyB8fCAzNTtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdNYXggcmV0cnkgc2V0dGVkIHRvOiAnICsgYXV0aGVudGljYXRpb25TZXR0aW5ncy5tYXhfcmV0cnlfcmVuZXcpO1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2lsZW50X3JlbmV3X3RpbWVvdXQgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNpbGVudF9yZW5ld190aW1lb3V0IHx8IDQwICogMTAwMDsgLy80MCBzZWNvbmRzIHRvIHRpbWVvdXRcclxuICAgICAgICBjb25zb2xlLmRlYnVnKCdTaWxlbnQgcmVuZXcgdGltZW91dCBzZXR0ZWQgdG86ICcgKyBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNpbGVudF9yZW5ld190aW1lb3V0ICsgJyBtaWxpc2Vjb25kcycpO1xyXG5cclxuICAgICAgICAvL0NvbnZlcnQgdG8gdGhlIG1vcmUgY29tcGxldGUgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzXHJcbiAgICAgICAgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAgICAgY2xpZW50X2lkOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAgICAgY2xpZW50X3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG5cclxuICAgICAgICAgICAgbWF4X3JldHJ5X3JlbmV3OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLm1heF9yZXRyeV9yZW5ldywgXHJcbiAgICAgICAgICAgIHNpbGVudF9yZW5ld190aW1lb3V0OiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNpbGVudF9yZW5ld190aW1lb3V0LFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBzY29wZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlZGlyZWN0X3VyaSA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgc2lsZW50X3JlZGlyZWN0X3VyaTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpemF0aW9uX3VybCB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvYXV0aG9yaXplXCIsXHJcbiAgICAgICAgICAgIHRva2VuX3VybCA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudG9rZW5fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC90b2tlblwiLFxyXG4gICAgICAgICAgICB1c2VyaW5mb191cmw6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MudXNlcmluZm9fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC91c2VyaW5mb1wiLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbG9hZF91c2VyX3Byb2ZpbGU6IHRydWUsXHJcbiAgICAgICAgICAgIHNpbGVudF9yZW5ldzogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlciA9IG5ldyBPaWRjVG9rZW5NYW5hZ2VyKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAvL1JldHJ5IGluZGVmaW5pdGx5IGZvciByZW5ld1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5hZGRPblNpbGVudFRva2VuUmVuZXdGYWlsZWQoKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY291bnQgPSAxO1xyXG5cclxuICAgICAgICAgICAgbGV0IHByb21pc2U6IE9pZGMuRGVmYXVsdFByb21pc2UgPSB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3VjY2VzcyA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlbmV3ZWQgYWZ0ZXIgJyArIGNvdW50LnRvU3RyaW5nKCkgKyAnIGZhaWxzIScpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgZmFpbCA9IChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Rva2VuIG5vdCByZW5ld2VkISBUcnlpbmcgYWdhaW4gYWZ0ZXIgJyArIGNvdW50LnRvU3RyaW5nKCkgKyAnIGZhaWxzISBNYXggcmV0cnkgc2V0IHRvICcgKyB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm1heF9yZXRyeV9yZW5ldyArICchJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoY291bnQgPCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm1heF9yZXRyeV9yZW5ldylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUb2tlbiBub3QgcmVuZXdlZCEnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuUmVuZXdGYWlsZWRSZXRyeU1heC5mb3JFYWNoKChjYWxsYmFjayk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBsZXQgY2hpbGRQcm9taXNlID0gcHJvbWlzZS50aGVuKHN1Y2Nlc3MsIGZhaWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRQcm9taXNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFByb2Nlc3NUb2tlbklmTmVlZGVkKCkgOiBRLklQcm9taXNlPFRva2Vuc0NvbnRlbnRzPlxyXG4gICAge1xyXG4gICAgICAgIGlmIChsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2FjY2Vzc190b2tlbj0nKSA+IC0xICYmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuICE9IG51bGwgfHwgbG9jYXRpb24uaHJlZi5pbmRleE9mKCdwcm9tcHQ9bm9uZScpID4gLTEpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Byb2Nlc3NpbmcgdG9rZW4hIChzaWxlbnRseSknKTtcclxuICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrU2lsZW50KCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Rva2VuIHByb2Nlc3NlZCEgKHNpbGVudGx5KScpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfSBlbHNlIFxyXG5cclxuXHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgICAgIC8vaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5pbmRleE9mKCdhY2Nlc3NfdG9rZW49JykgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Byb2Nlc3NpbmcgdG9rZW4hJyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgICAgIC8vIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy9HbyBIb3JzZVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8VG9rZW5zQ29udGVudHM+KCk7XHJcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIEluaXQoYXV0aGVudGljYXRpb25TZXR0aW5ncz86IElBdXRoZW50aWNhdGlvblNldHRpbmdzKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncyAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5Jbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5Qcm9jZXNzVG9rZW5JZk5lZWRlZCgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8VG9rZW5zQ29udGVudHM+KCk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrQXN5bmMoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlJlZGlyZWN0VG9Jbml0aWFsUGFnZSh0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpOyBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUmVuZXdUb2tlblNpbGVudCgpIDogUS5JUHJvbWlzZTx2b2lkPlxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8dm9pZD4oKTtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVuZXdUb2tlblNpbGVudEFzeW5jKCkudGhlbihcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlID0gXCJQcm9ibGVtIEdldHRpbmcgVG9rZW4gOiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKTsgXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuICAgIFxyXG5cclxuICAgIHByb3RlY3RlZCBSZWRpcmVjdFRvSW5pdGlhbFBhZ2UodXJpIDpzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgbG9jYXRpb24uYXNzaWduKHVyaSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXV0aGVudGljYXRpb25Db250ZXh0IHVuaW5pdGlhbGl6ZWQhXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogTWFrZSB0aGUgbG9naW4gYXQgdGhlIGN1cnJlbnQgVVJJLCBhbmQgcHJvY2VzcyB0aGUgcmVjZWl2ZWQgdG9rZW5zLlxyXG4gICAgICogT0JTOiBUaGUgUmVkaXJlY3QgVVJJIFtjYWxsYmFja191cmxdICh0byByZWNlaXZlIHRoZSB0b2tlbikgYW5kIFNpbGVudCBSZWZyZXNoIEZyYW1lIFVSSSBbc2lsZW50X3JlZGlyZWN0X3VyaV0gKHRvIGF1dG8gcmVuZXcgd2hlbiBleHBpcmVkKSBpZiBub3QgaW5mb3JtZWQgaXMgYXV0byBnZW5lcmF0ZWQgYmFzZWQgb24gdGhlICdjbGllbnRfdXJsJyBpbmZvcm1lZCBhdCAnSW5pdCcgbWV0aG9kIHdpdGggdGhlIGZvbGxvd2luIHN0cmF0ZWd5OlxyXG4gICAgICogYHJlZGlyZWN0X3VybCA9IGNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnYFxyXG4gICAgICogYHNpbGVudF9yZWRpcmVjdF91cmkgPSBjbGllbnRfdXJsICsgJz9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZSdgIFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcGVuT25Qb3BVcF0gKGRlc2NyaXB0aW9uKVxyXG4gICAgICovXHJcbiAgICAvLyBwdWJsaWMgTG9naW5BbmRQcm9jZXNzVG9rZW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAgLy8ge1xyXG4gICAgLy8gICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJyAgXHJcbiAgICAvLyAgICAgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgLy8gICAgIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdjbGllbnRfdXJsJywgdGhlbiBpIGNvbnNpZGVyIHRvIG1ha2UgdGhlICdsb2dpbidcclxuICAgIC8vICAgICBlbHNlIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybC5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwpXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICBpZih0aGlzLklzQXV0aGVudGljYXRlZCA9PT0gZmFsc2UpXHJcbiAgICAvLyAgICAgICAgIHtcclxuICAgIC8vICAgICAgICAgICAgIHRoaXMuTG9naW4oc2hvdWxkT3Blbk9uUG9wVXApO1xyXG4gICAgLy8gICAgICAgICB9XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuVG9rZW5zQ29udGVudHMuSXNBdXRoZW50aWNhdGVkID09PSBmYWxzZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuVmFsaWRhdGVJbml0aWFsaXphdGlvbigpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9UT0RPOiBUcmVhdCB3aGVuIGluIG1vYmlsZSBicm93c2VyIHRvIG5vdCBzdXBwb3J0IHBvcHVwXHJcbiAgICAgICAgICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChzaG91bGRPcGVuT25Qb3BVcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLm9wZW5Qb3B1cEZvclRva2VuQXN5bmMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAvL1RPRE86IE5lZWQgZml4IChhbm90aGVyIHdheSB0byBub3QgbGV0IHRoZSBqcyBydW50aW1lIHRvIGNvbnRpbnVlKVxyXG4gICAgICAgICAgICAvL1Nob3VsZCByZWZhY3RvciB0byByZXR1cm4gYSBwcm9taXNlIHdpdGggYW4gYXJndW1lbnQ/IFxyXG4gICAgICAgICAgICB0aHJvdyBcIlJlZGlyZWN0aW5nIHRvIExvZ2luIVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FscmVhZHkgYXV0aGVudGljYXRlZCcpO1xyXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuT2J0YWluZWQuZm9yRWFjaCgoY2FsbGJhY2spID0+IHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5Ub2tlbnNDb250ZW50cy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBUb2tlbnNDb250ZW50cygpIDogVG9rZW5zQ29udGVudHNcclxuICAgIHtcclxuICAgICAgICBsZXQgdG9rZW5Db250ZW50cyA9IG5ldyBUb2tlbnNDb250ZW50cygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW4gPSB0aGlzLkFjY2Vzc1Rva2VuO1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuSWRlbnRpdHlUb2tlbiA9IHRoaXMuSWRlbnRpdHlUb2tlbjtcclxuICAgICAgICBcclxuICAgICAgICB0b2tlbkNvbnRlbnRzLkFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMuQWNjZXNzVG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuSWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLklkZW50aXR5VG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLlByb2ZpbGVDb250ZW50O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0b2tlbkNvbnRlbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBnZXQgQWNjZXNzVG9rZW4oKTogc3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBpZF90b2tlbiA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW47XHJcbiAgICAgICAgICAgIHJldHVybiBpZF90b2tlbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByb3RlY3RlZCBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueSBcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGFjY2Vzc1Rva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9ICBKU09OLnBhcnNlKGF0b2IoYWNjZXNzVG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IElkZW50aXR5VG9rZW4oKTogc3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBpZF90b2tlbiA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkZW50aXR5VG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICAgICAgICAgICAgICBpZihpZGVudGl0eVRva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IEpTT04ucGFyc2UoYXRvYihpZGVudGl0eVRva2VuQ29udGVudCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWxvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVG9rZW5zQ29udGVudHNcclxue1xyXG4gICAgcHVibGljIGdldCBJc0F1dGhlbnRpY2F0ZWQoKSA6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50ID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfcHJvZmlsZUNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgUHJvZmlsZUNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2ZpbGVDb250ZW50O1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBQcm9maWxlQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Byb2ZpbGVDb250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9hY2Nlc3NUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWNjZXNzVG9rZW47XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IEFjY2Vzc1Rva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW4gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9hY2Nlc3NUb2tlbkNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IEFjY2Vzc1Rva2VuQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW46IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faWRlbnRpdHlUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbih2YWx1ZTogc3RyaW5nKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2lkZW50aXR5VG9rZW4gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9pZGVudGl0eVRva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IElkZW50aXR5VG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHB1YmxpYyB0b2tlbnNDb250ZW50c1RvQXJyYXkoaW5jbHVkZUVuY29kZWRUb2tlbnM6Ym9vbGVhbiA9IHRydWUpIDogQXJyYXk8YW55PlxyXG4gICAge1xyXG4gICAgICAgIGxldCB0b2tlbnNDb250ZW50cyA9IG5ldyBBcnJheTxhbnk+KCk7XHJcblxyXG4gICAgICAgIHRva2Vuc0NvbnRlbnRzLnB1c2godGhpcy5JZGVudGl0eVRva2VuQ29udGVudCk7XHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCk7XHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLlByb2ZpbGVDb250ZW50KTtcclxuXHJcbiAgICAgICAgaWYoaW5jbHVkZUVuY29kZWRUb2tlbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5FbmNvZGVkID0geyAnYWNjZXNzX3Rva2VuJzogQXV0aGVudGljYXRpb25Db250ZXh0LkN1cnJlbnQuVG9rZW5zQ29udGVudHMuQWNjZXNzVG9rZW4gfTtcclxuICAgICAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaChhY2Nlc3NUb2tlbkVuY29kZWQpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGlkZW50aXR5VG9rZW5FbmNvZGVkID0geyAnaWRfdG9rZW4nOiBBdXRoZW50aWNhdGlvbkNvbnRleHQuQ3VycmVudC5Ub2tlbnNDb250ZW50cy5JZGVudGl0eVRva2VuIH07XHJcbiAgICAgICAgICAgIHRva2Vuc0NvbnRlbnRzLnB1c2goaWRlbnRpdHlUb2tlbkVuY29kZWQpOyBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0b2tlbnNDb250ZW50cztcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGVuY29kZWRUb2tlbnNUb0FycmF5KCkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFsgdGhpcy5JZGVudGl0eVRva2VuLCB0aGlzLkFjY2Vzc1Rva2VuIF07XHJcbiAgICB9XHJcbn0iXX0=
