/// <reference path="../../typings/index.d.ts" />
System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationContext, TokensContents;
    return {
        setters:[],
        execute: function() {
            //require('oidc-token-manager');
            //import 'oidc-token-manager/dist/oidc-token-manager.js';
            //import * as Q from 'q';
            //import 'oidc-token-manager';
            /**
             * AuthenticationInitializer
             */
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
                    //Set default values if not informed
                    authenticationSettings.client_url = authenticationSettings.client_url || defaultRedirectUri; //Self uri
                    authenticationSettings.scope = authenticationSettings.scope || 'openid profile email offline_access'; //OpenId default scopes
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token'; //Hybrid flow at default
                    //authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false; //Redirect for default
                    //Convert to the more complete IAuthenticationManagerSettings
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
                    //Retry indefinitly for renew
                    this.oidcTokenManager.addOnSilentTokenRenewFailed(function () {
                        var count = 1;
                        var promise = _this.oidcTokenManager.renewTokenSilentAsync();
                        var success = function () {
                            console.debug('Renewed after ' + count.toString() + ' fails!');
                        };
                        var fail = function (error) {
                            count++;
                            console.error('Token not renewed! Trying again after ' + count.toString() + ' fails!');
                            return _this.oidcTokenManager.renewTokenSilentAsync().then(success, fail);
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
                    else 
                    //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
                    //if(location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri)
                    if (location.href.indexOf('access_token=') > -1) {
                        console.debug('Processing token!');
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
                /**
                 * Make the login at the current URI, and process the received tokens.
                 * OBS: The Redirect URI [callback_url] (to receive the token) and Silent Refresh Frame URI [silent_redirect_uri] (to auto renew when expired) if not informed is auto generated based on the 'client_url' informed at 'Init' method with the followin strategy:
                 * `redirect_url = client_url + '?callback=true'`
                 * `silent_redirect_uri = client_url + '?silentrefreshframe=true'`
                 *
                 * @param {boolean} [openOnPopUp] (description)
                 */
                // public LoginAndProcessToken(openOnPopUp?: boolean)
                // {
                //     this.ValidateInitialization();
                //     let shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                //     //if the actual page is the 'redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'  
                //     if(location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri)
                //     {
                //         this.ProcessTokenCallback();
                //     }
                //     //if the actual page is the 'silent_redirect_uri' (loaded from the localStorage), then i consider to 'process the token callback'
                //     else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri)
                //     {
                //         this.RenewTokenSilent();
                //     }
                //     //if the actual page is the 'client_url', then i consider to make the 'login'
                //     else if(location.href.substring(0, this.AuthenticationManagerSettings.client_url.length) === this.AuthenticationManagerSettings.client_url)
                //     {
                //         if(this.IsAuthenticated === false)
                //         {
                //             this.Login(shouldOpenOnPopUp);
                //         }
                //     }
                // }
                AuthenticationContext.prototype.Login = function () {
                    if (this.TokensContents.IsAuthenticated === false) {
                        this.ValidateInitialization();
                        this.oidcTokenManager.redirectForToken();
                        //TODO: Need fix (another way to not let the js runtime to continue)
                        //Should refactor to return a promise with an argument? 
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsaURBQWlEOzs7Ozs7OztZQUlqRCxnQ0FBZ0M7WUFDaEMseURBQXlEO1lBQ3pELHlCQUF5QjtZQUN6Qiw4QkFBOEI7WUFHOUI7O2VBRUc7WUFDSDtnQkF5Q0k7b0JBcENRLDJCQUFzQixHQUFzQixJQUFJLEtBQUssRUFBYyxDQUFDO29CQXNDeEUsSUFBSSx1Q0FBdUMsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUM7b0JBQ2pGLEVBQUUsQ0FBQSxDQUFDLHVDQUF1QyxJQUFJLElBQUksQ0FBQyxDQUNuRCxDQUFDO3dCQUNHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFFLHVDQUF1QyxDQUFFLENBQUM7b0JBQzVGLENBQUM7Z0JBQ0wsQ0FBQztnQkF6Q0Qsc0JBQWtCLGdDQUFPO3lCQUF6Qjt3QkFFSSxFQUFFLENBQUEsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLENBQzNDLENBQUM7NEJBQ0cscUJBQXFCLENBQUMsUUFBUSxHQUFJLElBQUkscUJBQXFCLEVBQUUsQ0FBQzt3QkFDbEUsQ0FBQzt3QkFDRCxNQUFNLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDO29CQUMxQyxDQUFDOzs7bUJBQUE7Z0JBRUQsc0JBQVcsZ0RBQWE7eUJBQXhCO3dCQUVJLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsSUFBSSxJQUFJLENBQUMsQ0FDOUMsQ0FBQzs0QkFDRyxNQUFNLENBQUMsSUFBSSxDQUFDO3dCQUNoQixDQUFDO3dCQUNELElBQUksQ0FDSixDQUFDOzRCQUNHLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQ2pCLENBQUM7b0JBQ0wsQ0FBQzs7O21CQUFBO2dCQUVhLDJCQUFLLEdBQW5CO29CQUVJLHFCQUFxQixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzFDLENBQUM7Z0JBRU0sa0RBQWtCLEdB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QkFRTSw4Q0FBcUIsR0FBNUIsVUFBNkIsb0JBQW1DO29CQUFuQyxvQ0FBbUMsR0FBbkMsMkJBQW1DO29CQUU1RCxJQUFJLGNBQWMsR0FBRyxJQUFJLEtBQUssRUFBTyxDQUFDO29CQUV0QyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUMvQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUM3QyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFFekMsRUFBRSxDQUFBLENBQUMsb0JBQW9CLENBQUMsQ0FDeEIsQ0FBQzt3QkFDRyxJQUFJLGtCQUFrQixHQUFHLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ3RHLGNBQWMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQzt3QkFFeEMsSUFBSSxvQkFBb0IsR0FBRyxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUN0RyxjQUFjLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBQzlDLENBQUM7b0JBRUQsTUFBTSxDQUFDLGNBQWMsQ0FBQztnQkFDMUIsQ0FBQztnQkFFTSw2Q0FBb0IsR0FBM0I7b0JBRUksTUFBTSxDQUFDLENBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFFLENBQUM7Z0JBQ3BELENBQUM7Z0JBQ0wscUJBQUM7WUFBRCxDQWxHQSxBQWtHQyxJQUFBO1lBbEdELDJDQWtHQyxDQUFBIiwiZmlsZSI6InNyYy9BdXRoZW50aWNhdGlvbkNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCB7IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzJztcclxuaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuLy9yZXF1aXJlKCdvaWRjLXRva2VuLW1hbmFnZXInKTtcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlci9kaXN0L29pZGMtdG9rZW4tbWFuYWdlci5qcyc7XHJcbi8vaW1wb3J0ICogYXMgUSBmcm9tICdxJztcclxuLy9pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkNvbnRleHQgXHJcbntcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2N1cnJlbnQ6IEF1dGhlbnRpY2F0aW9uQ29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgcHJpdmF0ZSBjYWxsYmFja3NUb2tlbk9idGFpbmVkIDpBcnJheTwoKSA9PiB2b2lkPiA9IG5ldyBBcnJheTwoKSA9PiB2b2lkPigpO1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IEN1cnJlbnQoKTogQXV0aGVudGljYXRpb25Db250ZXh0IFxyXG4gICAge1xyXG4gICAgICAgIGlmKEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9PT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9ICBuZXcgQXV0aGVudGljYXRpb25Db250ZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBdXRoZW50aWNhdGlvbkNvbnRleHQuX2N1cnJlbnQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBnZXQgSXNJbml0aWFsaXplZCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgUmVzZXQoKVxyXG4gICAge1xyXG4gICAgICAgIEF1dGhlbnRpY2F0aW9uQ29udGV4dC5fY3VycmVudCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIEFkZE9uVG9rZW5PYnRhaW5lZChjYWxsYmFjazogKCkgPT4gdm9pZClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuT2J0YWluZWQucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFkZE9uVG9rZW5PYnRhaW5lZChjYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvaWRjVG9rZW5NYW5hZ2VyOiBPaWRjLk9pZGNUb2tlbk1hbmFnZXI7XHJcbiAgICAgICAgXHJcbiAgICBjb25zdHJ1Y3RvcigpIFxyXG4gICAge1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzTG9hZGVkRnJvbVN0b3JhZ2UgPSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzO1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIoIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NMb2FkZWRGcm9tU3RvcmFnZSApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncygpOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlOiBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZVN0cmluZ2lmeSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncycpO1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3NGcm9tTG9jYWxTdG9yYWdlU3RyaW5naWZ5ICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzRnJvbUxvY2FsU3RvcmFnZSA9IEpTT04ucGFyc2UoYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2VTdHJpbmdpZnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXV0aGVudGljYXRpb25TZXR0aW5nc0Zyb21Mb2NhbFN0b3JhZ2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBzZXQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3ModmFsdWU6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncylcclxuICAgIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnLCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgSW5pdGlhbGl6ZShhdXRoZW50aWNhdGlvblNldHRpbmdzOiBJQXV0aGVudGljYXRpb25TZXR0aW5ncylcclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSA9PSBudWxsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIlNob3VsZCBiZSBpbmZvcm1lZCBhdCBsZWFzdCAnYXV0aG9yaXR5JyBhbmQgJ2NsaWVudF9pZCchXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZhdWx0UmVkaXJlY3RVcmkgOiBzdHJpbmcgPSBudWxsO1xyXG4gICAgICAgIGlmKGxvY2F0aW9uLnByb3RvY29sLmluZGV4T2YoJ2ZpbGU6JykgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlZmF1bHRSZWRpcmVjdFVyaSA9ICd1cm46aWV0Zjp3ZzpvYXV0aDoyLjA6b29iOmF1dG8nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkZWZhdWx0UmVkaXJlY3RVcmkgPSBsb2NhdGlvbi5ocmVmO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zb2xlLmxvZyhkZWZhdWx0UmVkaXJlY3RVcmkpO1xyXG4gICAgICAgIC8vU2V0IGRlZmF1bHQgdmFsdWVzIGlmIG5vdCBpbmZvcm1lZFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCB8fCBkZWZhdWx0UmVkaXJlY3RVcmk7IC8vU2VsZiB1cmlcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZSB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIC8vYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwIHx8IGZhbHNlOyAvL1JlZGlyZWN0IGZvciBkZWZhdWx0XHJcblxyXG4gICAgICAgIC8vQ29udmVydCB0byB0aGUgbW9yZSBjb21wbGV0ZSBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3NcclxuICAgICAgICB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIHNjb3BlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIHBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml6YXRpb25fdXJsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy50b2tlbl91cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy51c2VyaW5mb191cmwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsb2FkX3VzZXJfcHJvZmlsZTogdHJ1ZSxcclxuICAgICAgICAgICAgc2lsZW50X3JlbmV3OiB0cnVlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyk7XHJcblxyXG4gICAgICAgIC8vUmV0cnkgaW5kZWZpbml0bHkgZm9yIHJlbmV3XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFkZE9uU2lsZW50VG9rZW5SZW5ld0ZhaWxlZCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjb3VudCA9IDE7XHJcblxyXG4gICAgICAgICAgICBsZXQgcHJvbWlzZTogT2lkYy5EZWZhdWx0UHJvbWlzZSA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdWNjZXNzID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVuZXdlZCBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhJyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxldCBmYWlsID0gKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVG9rZW4gbm90IHJlbmV3ZWQhIFRyeWluZyBhZ2FpbiBhZnRlciAnICsgY291bnQudG9TdHJpbmcoKSArICcgZmFpbHMhJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpLnRoZW4oc3VjY2VzcywgZmFpbCk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBsZXQgY2hpbGRQcm9taXNlID0gcHJvbWlzZS50aGVuKHN1Y2Nlc3MsIGZhaWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRQcm9taXNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIFByb2Nlc3NUb2tlbklmTmVlZGVkKCkgOiBRLklQcm9taXNlPFRva2Vuc0NvbnRlbnRzPlxyXG4gICAge1xyXG4gICAgICAgIGlmIChsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ2FjY2Vzc190b2tlbj0nKSA+IC0xICYmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIuYWNjZXNzX3Rva2VuICE9IG51bGwgfHwgbG9jYXRpb24uaHJlZi5pbmRleE9mKCdwcm9tcHQ9bm9uZScpID4gLTEpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Byb2Nlc3NpbmcgdG9rZW4hIChzaWxlbnRseSknKTtcclxuICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrU2lsZW50KCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Rva2VuIHByb2Nlc3NlZCEgKHNpbGVudGx5KScpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGRlZmVyID0gUS5kZWZlcjxUb2tlbnNDb250ZW50cz4oKTtcclxuICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSh0aGlzLlRva2Vuc0NvbnRlbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICAgICAgfSBlbHNlIFxyXG5cclxuXHJcbiAgICAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdyZWRpcmVjdF91cmknIChsb2FkZWQgZnJvbSB0aGUgbG9jYWxTdG9yYWdlKSwgdGhlbiBpIGNvbnNpZGVyIHRvICdwcm9jZXNzIHRoZSB0b2tlbiBjYWxsYmFjaycgIFxyXG4gICAgICAgIC8vaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5pbmRleE9mKCdhY2Nlc3NfdG9rZW49JykgPiAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Byb2Nlc3NpbmcgdG9rZW4hJyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLlByb2Nlc3NUb2tlbkNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAnc2lsZW50X3JlZGlyZWN0X3VyaScgKGxvYWRlZCBmcm9tIHRoZSBsb2NhbFN0b3JhZ2UpLCB0aGVuIGkgY29uc2lkZXIgdG8gJ3Byb2Nlc3MgdGhlIHRva2VuIGNhbGxiYWNrJ1xyXG4gICAgICAgIC8vIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy9HbyBIb3JzZVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8VG9rZW5zQ29udGVudHM+KCk7XHJcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIEluaXQoYXV0aGVudGljYXRpb25TZXR0aW5ncz86IElBdXRoZW50aWNhdGlvblNldHRpbmdzLCBmb3JjZSA9IGZhbHNlKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgaWYoYXV0aGVudGljYXRpb25TZXR0aW5ncyAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5Jc0luaXRpYWxpemVkID09PSBmYWxzZSB8fCBmb3JjZSA9PT0gdHJ1ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5Jbml0aWFsaXplKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNob3VsZCBiZSB1bml0aWFsaXphdGVkIHRvIGluaXRpYWxpemUuIFlvdSBhcmUgbWlzc2luZyB0aGUgZm9yY2UgcGFyYW1ldGVyP1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5Qcm9jZXNzVG9rZW5JZk5lZWRlZCgpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKSA6IFEuSVByb21pc2U8VG9rZW5zQ29udGVudHM+XHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIGxldCBkZWZlciA9IFEuZGVmZXI8VG9rZW5zQ29udGVudHM+KCk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrQXN5bmMoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLlJlZGlyZWN0VG9Jbml0aWFsUGFnZSh0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUodGhpcy5Ub2tlbnNDb250ZW50cyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlByb2JsZW0gR2V0dGluZyBUb2tlbiA6IFwiICsgKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpOyBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIFJlbmV3VG9rZW5TaWxlbnQoKSA6IFEuSVByb21pc2U8dm9pZD5cclxuICAgIHtcclxuICAgICAgICB0aGlzLlZhbGlkYXRlSW5pdGlhbGl6YXRpb24oKTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgZGVmZXIgPSBRLmRlZmVyPHZvaWQ+KCk7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QoXCJQcm9ibGVtIEdldHRpbmcgVG9rZW4gOiBcIiArIChlcnJvci5tZXNzYWdlIHx8IGVycm9yKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG4gICAgcHJvdGVjdGVkIFJlZGlyZWN0VG9Jbml0aWFsUGFnZSh1cmkgOnN0cmluZylcclxuICAgIHtcclxuICAgICAgICBsb2NhdGlvbi5hc3NpZ24odXJpKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgVmFsaWRhdGVJbml0aWFsaXphdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdXRoZW50aWNhdGlvbkNvbnRleHQgdW5pbml0aWFsaXplZCFcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIHRoZSBsb2dpbiBhdCB0aGUgY3VycmVudCBVUkksIGFuZCBwcm9jZXNzIHRoZSByZWNlaXZlZCB0b2tlbnMuXHJcbiAgICAgKiBPQlM6IFRoZSBSZWRpcmVjdCBVUkkgW2NhbGxiYWNrX3VybF0gKHRvIHJlY2VpdmUgdGhlIHRva2VuKSBhbmQgU2lsZW50IFJlZnJlc2ggRnJhbWUgVVJJIFtzaWxlbnRfcmVkaXJlY3RfdXJpXSAodG8gYXV0byByZW5ldyB3aGVuIGV4cGlyZWQpIGlmIG5vdCBpbmZvcm1lZCBpcyBhdXRvIGdlbmVyYXRlZCBiYXNlZCBvbiB0aGUgJ2NsaWVudF91cmwnIGluZm9ybWVkIGF0ICdJbml0JyBtZXRob2Qgd2l0aCB0aGUgZm9sbG93aW4gc3RyYXRlZ3k6XHJcbiAgICAgKiBgcmVkaXJlY3RfdXJsID0gY2xpZW50X3VybCArICc/Y2FsbGJhY2s9dHJ1ZSdgXHJcbiAgICAgKiBgc2lsZW50X3JlZGlyZWN0X3VyaSA9IGNsaWVudF91cmwgKyAnP3NpbGVudHJlZnJlc2hmcmFtZT10cnVlJ2AgXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wZW5PblBvcFVwXSAoZGVzY3JpcHRpb24pXHJcbiAgICAgKi9cclxuICAgIC8vIHB1YmxpYyBMb2dpbkFuZFByb2Nlc3NUb2tlbihvcGVuT25Qb3BVcD86IGJvb2xlYW4pXHJcbiAgICAvLyB7XHJcbiAgICAvLyAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgXHJcbiAgICAvLyAgICAgbGV0IHNob3VsZE9wZW5PblBvcFVwID0gb3Blbk9uUG9wVXAgfHwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5vcGVuX29uX3BvcHVwO1xyXG4gICAgICAgIFxyXG4gICAgLy8gICAgIC8vaWYgdGhlIGFjdHVhbCBwYWdlIGlzIHRoZSAncmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snICBcclxuICAgIC8vICAgICBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUHJvY2Vzc1Rva2VuQ2FsbGJhY2soKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgLy9pZiB0aGUgYWN0dWFsIHBhZ2UgaXMgdGhlICdzaWxlbnRfcmVkaXJlY3RfdXJpJyAobG9hZGVkIGZyb20gdGhlIGxvY2FsU3RvcmFnZSksIHRoZW4gaSBjb25zaWRlciB0byAncHJvY2VzcyB0aGUgdG9rZW4gY2FsbGJhY2snXHJcbiAgICAvLyAgICAgZWxzZSBpZiAobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSlcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuUmVuZXdUb2tlblNpbGVudCgpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICAvL2lmIHRoZSBhY3R1YWwgcGFnZSBpcyB0aGUgJ2NsaWVudF91cmwnLCB0aGVuIGkgY29uc2lkZXIgdG8gbWFrZSB0aGUgJ2xvZ2luJ1xyXG4gICAgLy8gICAgIGVsc2UgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybClcclxuICAgIC8vICAgICB7XHJcbiAgICAvLyAgICAgICAgIGlmKHRoaXMuSXNBdXRoZW50aWNhdGVkID09PSBmYWxzZSlcclxuICAgIC8vICAgICAgICAge1xyXG4gICAgLy8gICAgICAgICAgICAgdGhpcy5Mb2dpbihzaG91bGRPcGVuT25Qb3BVcCk7XHJcbiAgICAvLyAgICAgICAgIH1cclxuICAgIC8vICAgICB9XHJcbiAgICAvLyB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBMb2dpbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5Ub2tlbnNDb250ZW50cy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5WYWxpZGF0ZUluaXRpYWxpemF0aW9uKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucmVkaXJlY3RGb3JUb2tlbigpO1xyXG5cclxuICAgICAgICAgICAgLy9UT0RPOiBOZWVkIGZpeCAoYW5vdGhlciB3YXkgdG8gbm90IGxldCB0aGUganMgcnVudGltZSB0byBjb250aW51ZSlcclxuICAgICAgICAgICAgLy9TaG91bGQgcmVmYWN0b3IgdG8gcmV0dXJuIGEgcHJvbWlzZSB3aXRoIGFuIGFyZ3VtZW50PyBcclxuICAgICAgICAgICAgdGhyb3cgXCJSZWRpcmVjdCB0byBMb2dpbiAoQnJlYWsgdGhlIGZsb3chKVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FscmVhZHkgYXV0aGVudGljYXRlZCcpO1xyXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrc1Rva2VuT2J0YWluZWQuZm9yRWFjaCgoY2FsbGJhY2spID0+IHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IElzQXV0aGVudGljYXRlZCgpIDpib29sZWFuXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5Ub2tlbnNDb250ZW50cy5Jc0F1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBUb2tlbnNDb250ZW50cygpIDogVG9rZW5zQ29udGVudHNcclxuICAgIHtcclxuICAgICAgICBsZXQgdG9rZW5Db250ZW50cyA9IG5ldyBUb2tlbnNDb250ZW50cygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRva2VuQ29udGVudHMuQWNjZXNzVG9rZW4gPSB0aGlzLkFjY2Vzc1Rva2VuO1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuSWRlbnRpdHlUb2tlbiA9IHRoaXMuSWRlbnRpdHlUb2tlbjtcclxuICAgICAgICBcclxuICAgICAgICB0b2tlbkNvbnRlbnRzLkFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMuQWNjZXNzVG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuSWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB0aGlzLklkZW50aXR5VG9rZW5Db250ZW50O1xyXG4gICAgICAgIHRva2VuQ29udGVudHMuUHJvZmlsZUNvbnRlbnQgPSB0aGlzLlByb2ZpbGVDb250ZW50O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0b2tlbkNvbnRlbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBnZXQgQWNjZXNzVG9rZW4oKTogc3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBpZF90b2tlbiA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW47XHJcbiAgICAgICAgICAgIHJldHVybiBpZF90b2tlbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByb3RlY3RlZCBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueSBcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFjY2Vzc1Rva2VuQ29udGVudCA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGFjY2Vzc1Rva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9ICBKU09OLnBhcnNlKGF0b2IoYWNjZXNzVG9rZW5Db250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgZ2V0IElkZW50aXR5VG9rZW4oKTogc3RyaW5nIFxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCBpZF90b2tlbiA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbjtcclxuICAgICAgICAgICAgcmV0dXJuIGlkX3Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBnZXQgSWRlbnRpdHlUb2tlbkNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vaWRjVG9rZW5NYW5hZ2VyICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4gIT0gbnVsbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGlkZW50aXR5VG9rZW5Db250ZW50ID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmlkX3Rva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICAgICAgICAgICAgICBpZihpZGVudGl0eVRva2VuQ29udGVudCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IEpTT04ucGFyc2UoYXRvYihpZGVudGl0eVRva2VuQ29udGVudCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWxvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJvdGVjdGVkIGdldCBQcm9maWxlQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLm9pZGNUb2tlbk1hbmFnZXIgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlICE9IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWxvciA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVG9rZW5zQ29udGVudHNcclxue1xyXG4gICAgcHVibGljIGdldCBJc0F1dGhlbnRpY2F0ZWQoKSA6Ym9vbGVhblxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuQWNjZXNzVG9rZW5Db250ZW50ID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfcHJvZmlsZUNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgUHJvZmlsZUNvbnRlbnQoKTogYW55XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2ZpbGVDb250ZW50O1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBQcm9maWxlQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Byb2ZpbGVDb250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9hY2Nlc3NUb2tlbjogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBBY2Nlc3NUb2tlbigpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWNjZXNzVG9rZW47XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IEFjY2Vzc1Rva2VuKHZhbHVlOiBzdHJpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYWNjZXNzVG9rZW4gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9hY2Nlc3NUb2tlbkNvbnRlbnQ6IGFueTtcclxuICAgIHB1YmxpYyBnZXQgQWNjZXNzVG9rZW5Db250ZW50KCk6IGFueVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY2Nlc3NUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IEFjY2Vzc1Rva2VuQ29udGVudCh2YWx1ZTogYW55KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2FjY2Vzc1Rva2VuQ29udGVudCA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHByaXZhdGUgX2lkZW50aXR5VG9rZW46IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgSWRlbnRpdHlUb2tlbigpOiBzdHJpbmdcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faWRlbnRpdHlUb2tlbjtcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgSWRlbnRpdHlUb2tlbih2YWx1ZTogc3RyaW5nKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2lkZW50aXR5VG9rZW4gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBwcml2YXRlIF9pZGVudGl0eVRva2VuQ29udGVudDogYW55O1xyXG4gICAgcHVibGljIGdldCBJZGVudGl0eVRva2VuQ29udGVudCgpOiBhbnlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IElkZW50aXR5VG9rZW5Db250ZW50KHZhbHVlOiBhbnkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faWRlbnRpdHlUb2tlbkNvbnRlbnQgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgIHB1YmxpYyB0b2tlbnNDb250ZW50c1RvQXJyYXkoaW5jbHVkZUVuY29kZWRUb2tlbnM6Ym9vbGVhbiA9IHRydWUpIDogQXJyYXk8YW55PlxyXG4gICAge1xyXG4gICAgICAgIGxldCB0b2tlbnNDb250ZW50cyA9IG5ldyBBcnJheTxhbnk+KCk7XHJcblxyXG4gICAgICAgIHRva2Vuc0NvbnRlbnRzLnB1c2godGhpcy5JZGVudGl0eVRva2VuQ29udGVudCk7XHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLkFjY2Vzc1Rva2VuQ29udGVudCk7XHJcbiAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaCh0aGlzLlByb2ZpbGVDb250ZW50KTtcclxuXHJcbiAgICAgICAgaWYoaW5jbHVkZUVuY29kZWRUb2tlbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgYWNjZXNzVG9rZW5FbmNvZGVkID0geyAnYWNjZXNzX3Rva2VuJzogQXV0aGVudGljYXRpb25Db250ZXh0LkN1cnJlbnQuVG9rZW5zQ29udGVudHMuQWNjZXNzVG9rZW4gfTtcclxuICAgICAgICAgICAgdG9rZW5zQ29udGVudHMucHVzaChhY2Nlc3NUb2tlbkVuY29kZWQpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGlkZW50aXR5VG9rZW5FbmNvZGVkID0geyAnaWRfdG9rZW4nOiBBdXRoZW50aWNhdGlvbkNvbnRleHQuQ3VycmVudC5Ub2tlbnNDb250ZW50cy5JZGVudGl0eVRva2VuIH07XHJcbiAgICAgICAgICAgIHRva2Vuc0NvbnRlbnRzLnB1c2goaWRlbnRpdHlUb2tlbkVuY29kZWQpOyBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0b2tlbnNDb250ZW50cztcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIGVuY29kZWRUb2tlbnNUb0FycmF5KCkgOiBBcnJheTxhbnk+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFsgdGhpcy5JZGVudGl0eVRva2VuLCB0aGlzLkFjY2Vzc1Rva2VuIF07XHJcbiAgICB9XHJcbn0iXX0=
