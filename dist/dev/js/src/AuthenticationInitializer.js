System.register(['oidc-token-manager'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationInitializer;
    return {
        setters:[
            function (_1) {}],
        execute: function() {
            /**
             * AuthenticationInitializer
             */
            AuthenticationInitializer = (function () {
                function AuthenticationInitializer() {
                    this.AuthenticationManagerSettings = null;
                    this.AccessToken = null;
                    this.IdentityToken = null;
                    this.Profile = null;
                }
                Object.defineProperty(AuthenticationInitializer, "Current", {
                    get: function () {
                        if (AuthenticationInitializer._current === null) {
                            AuthenticationInitializer._current = new AuthenticationInitializer();
                        }
                        return AuthenticationInitializer._current;
                    },
                    enumerable: true,
                    configurable: true
                });
                AuthenticationInitializer.Reset = function () {
                    AuthenticationInitializer._current = null;
                };
                AuthenticationInitializer.prototype.Init = function (authenticationSettings) {
                    if (authenticationSettings.authority == null || authenticationSettings.client_id == null) {
                        throw "Should be informed at least 'authority' and 'client_id'!";
                    }
                    //Set default values if not informed
                    authenticationSettings.client_url = authenticationSettings.client_url || location.href; //Self uri
                    authenticationSettings.scopes = authenticationSettings.scopes || 'openid profile email offline_access'; //OpenId default scopes
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token'; //Hybrid flow at default
                    authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false; //Redirect for default
                    var localStorage_redirect_uri = localStorage.getItem('redirect_uri');
                    var localStorage_silent_redirect_uri = localStorage.getItem('silent_redirect_uri');
                    var localStorage_post_logout_redirect_uri = localStorage.getItem('post_logout_redirect_uri');
                    //Convert to the more complete IAuthenticationManagerSettings
                    this.AuthenticationManagerSettings =
                        {
                            authority: authenticationSettings.authority,
                            client_id: authenticationSettings.client_id,
                            client_url: authenticationSettings.client_url,
                            open_on_popup: authenticationSettings.open_on_popup,
                            response_type: authenticationSettings.response_type,
                            scopes: authenticationSettings.scopes,
                            redirect_uri: localStorage_redirect_uri || authenticationSettings.client_url + '?callback=true',
                            silent_redirect_uri: localStorage_silent_redirect_uri || authenticationSettings.client_url + "?silentrefreshframe=true",
                            post_logout_redirect_uri: localStorage_post_logout_redirect_uri || authenticationSettings.client_url + "index.html",
                            authorization_url: authenticationSettings.authority + "/connect/authorize",
                            token_url: authenticationSettings.authority + "/connect/token",
                            userinfo_url: authenticationSettings.authority + "/connect/userinfo"
                        };
                    localStorage.setItem('redirect_uri', this.AuthenticationManagerSettings.redirect_uri);
                    localStorage.setItem('silent_redirect_uri', this.AuthenticationManagerSettings.silent_redirect_uri);
                    localStorage.setItem('post_logout_redirect_uri', this.AuthenticationManagerSettings.post_logout_redirect_uri);
                    //TODO: se nao foi informado um redirect_uri, monta-se com base em uma convenção (multi plataform aware)
                    // let url = window.location.href.split("#")[0];
                    // let indexBarra = url.lastIndexOf('/');
                    // let enderecoCallback = url;
                    // enderecoCallback = enderecoCallback.substr(0, indexBarra) + '/callback.html';
                    var config = {
                        authority: this.AuthenticationManagerSettings.authority,
                        client_id: this.AuthenticationManagerSettings.client_id,
                        load_user_profile: true,
                        scope: this.AuthenticationManagerSettings.scopes,
                        response_type: this.AuthenticationManagerSettings.response_type,
                        client_url: this.AuthenticationManagerSettings.client_url,
                        redirect_uri: this.AuthenticationManagerSettings.redirect_uri,
                        post_logout_redirect_uri: this.AuthenticationManagerSettings.post_logout_redirect_uri,
                        silent_redirect_uri: this.AuthenticationManagerSettings.silent_redirect_uri,
                        silent_renew: true,
                        authorization_endpoint: this.AuthenticationManagerSettings.authority + "/connect/authorize",
                        userinfo_endpoint: this.AuthenticationManagerSettings.authority + "/connect/userinfo",
                        authorization_url: this.AuthenticationManagerSettings.authority + "/connect/authorize",
                        token_url: this.AuthenticationManagerSettings.authority + "/connect/token",
                        userinfo_url: this.AuthenticationManagerSettings.authority + "/connect/userinfo"
                    };
                    this.oidcTokenManager = new OidcTokenManager(config);
                };
                AuthenticationInitializer.prototype.Callback = function () {
                    this.oidcTokenManager.processTokenCallbackAsync();
                };
                AuthenticationInitializer.prototype.RenewTokenSilent = function () {
                    this.oidcTokenManager.renewTokenSilentAsync();
                };
                AuthenticationInitializer.prototype.Login = function (openOnPopUp) {
                    //TODO: Treat when in mobile browser to not support popup
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
                    //if(location.href.indexOf('silentrefreshframe=true') === -1)
                    if (location.href.substring(0, this.AuthenticationManagerSettings.redirect_uri.length) === this.AuthenticationManagerSettings.redirect_uri) {
                        this.Callback();
                    }
                    else if (location.href.substring(0, this.AuthenticationManagerSettings.silent_redirect_uri.length) === this.AuthenticationManagerSettings.silent_redirect_uri) {
                        this.RenewTokenSilent();
                    }
                    else if (location.href.substring(0, this.AuthenticationManagerSettings.client_url.length) === this.AuthenticationManagerSettings.client_url) {
                        if (shouldOpenOnPopUp) {
                            this.oidcTokenManager.openPopupForTokenAsync();
                        }
                        else {
                            this.oidcTokenManager.redirectForToken();
                        }
                    }
                    // else
                    // {
                    //     this.oidcTokenManager.processTokenPopup();
                    // }
                    this.GenerateTokens();
                };
                AuthenticationInitializer.prototype.GenerateTokens = function () {
                    this.AccessToken = JSON.parse(atob(this.oidcTokenManager.access_token.split('.')[1]));
                    this.IdentityToken = JSON.parse(atob(this.oidcTokenManager.id_token.split('.')[1]));
                    this.Profile = this.oidcTokenManager.profile;
                };
                AuthenticationInitializer._current = null;
                return AuthenticationInitializer;
            }());
            exports_1("AuthenticationInitializer", AuthenticationInitializer);
        }
    }
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1lBT0E7O2VBRUc7WUFDSDtnQkFxQkk7b0JBSVUsa0NBQTZCLEdBQW1DLElBQUksQ0FBQztvQkEwSHhFLGdCQUFXLEdBQVEsSUFBSSxDQUFDO29CQUN4QixrQkFBYSxHQUFRLElBQUksQ0FBQztvQkFDMUIsWUFBTyxHQUFRLElBQUksQ0FBQztnQkE5SDNCLENBQUM7Z0JBbEJELHNCQUFrQixvQ0FBTzt5QkFBekI7d0JBRUksRUFBRSxDQUFBLENBQUMseUJBQXlCLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUMvQyxDQUFDOzRCQUNHLHlCQUF5QixDQUFDLFFBQVEsR0FBSSxJQUFJLHlCQUF5QixFQUFFLENBQUM7d0JBQzFFLENBQUM7d0JBQ0QsTUFBTSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQztvQkFDOUMsQ0FBQzs7O21CQUFBO2dCQUVhLCtCQUFLLEdBQW5CO29CQUVJLHlCQUF5QixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzlDLENBQUM7Z0JBVU0sd0NBQUksR0FBWCxVQUFZLHNCQUErQztvQkFFdkQsRUFBRSxDQUFBLENBQUMsc0JBQXNCLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxzQkFBc0IsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLENBQ3hGLENBQUM7d0JBQ0csTUFBTSwwREFBMEQsQ0FBQztvQkFDckUsQ0FBQztvQkFFRCxvQ0FBb0M7b0JBQ3BDLHNCQUFzQixDQUFDLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVU7b0JBQ2xHLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLElBQUkscUNBQXFDLENBQUMsQ0FBQyx1QkFBdUI7b0JBQy9ILHNCQUFzQixDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLElBQUks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QUksQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsQ0FBQyxDQUMzSSxDQUFDO3dCQUNHLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQ3RCLENBQUM7NEJBQ0csSUFBSSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFLENBQUM7d0JBQ25ELENBQUM7d0JBQ0QsSUFBSSxDQUNKLENBQUM7NEJBQ0csSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLENBQUM7d0JBQzdDLENBQUM7b0JBQ0wsQ0FBQztvQkFDRCxPQUFPO29CQUNQLElBQUk7b0JBQ0osaURBQWlEO29CQUNqRCxJQUFJO29CQUVKLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztnQkFNUyxrREFBYyxHQUF4QjtvQkFFSSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BGLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztnQkFDakQsQ0FBQztnQkF6SmMsa0NBQVEsR0FBOEIsSUFBSSxDQUFDO2dCQTRKOUQsZ0NBQUM7WUFBRCxDQS9KQSxBQStKQyxJQUFBO1lBL0pELGlFQStKQyxDQUFBIiwiZmlsZSI6InNyYy9BdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuaW1wb3J0IHsgSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzIH0gZnJvbSAnLi9JQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MnO1xyXG4vL3JlcXVpcmUoJ29pZGMtdG9rZW4tbWFuYWdlcicpO1xyXG4vL2ltcG9ydCAnb2lkYy10b2tlbi1tYW5hZ2VyL2Rpc3Qvb2lkYy10b2tlbi1tYW5hZ2VyLmpzJztcclxuaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXInO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQXV0aGVudGljYXRpb25Jbml0aWFsaXplciBcclxue1xyXG4gICAgXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3VycmVudDogQXV0aGVudGljYXRpb25Jbml0aWFsaXplciA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgQ3VycmVudCgpOiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyIFxyXG4gICAge1xyXG4gICAgICAgIGlmKEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuX2N1cnJlbnQgPT09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLl9jdXJyZW50ID0gIG5ldyBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLl9jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgc3RhdGljIFJlc2V0KClcclxuICAgIHtcclxuICAgICAgICBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLl9jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9pZGNUb2tlbk1hbmFnZXI6IE9pZGMuT2lkY1Rva2VuTWFuYWdlcjtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwcm90ZWN0ZWQgQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyA9IG51bGw7XHJcbiAgICBcclxuICAgIHB1YmxpYyBJbml0KGF1dGhlbnRpY2F0aW9uU2V0dGluZ3M6IElBdXRoZW50aWNhdGlvblNldHRpbmdzKSBcclxuICAgIHtcclxuICAgICAgICBpZihhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSA9PSBudWxsIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBcIlNob3VsZCBiZSBpbmZvcm1lZCBhdCBsZWFzdCAnYXV0aG9yaXR5JyBhbmQgJ2NsaWVudF9pZCchXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vU2V0IGRlZmF1bHQgdmFsdWVzIGlmIG5vdCBpbmZvcm1lZFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCB8fCBsb2NhdGlvbi5ocmVmOyAvL1NlbGYgdXJpXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMgPSBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlcyB8fCAnb3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MnOyAvL09wZW5JZCBkZWZhdWx0IHNjb3Blc1xyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MucmVzcG9uc2VfdHlwZSB8fCAnY29kZSBpZF90b2tlbiB0b2tlbic7IC8vSHlicmlkIGZsb3cgYXQgZGVmYXVsdFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCB8fCBmYWxzZTsgLy9SZWRpcmVjdCBmb3IgZGVmYXVsdFxyXG5cclxuICAgICAgICBcclxuICAgICAgICBsZXQgbG9jYWxTdG9yYWdlX3JlZGlyZWN0X3VyaSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdyZWRpcmVjdF91cmknKTtcclxuICAgICAgICBsZXQgbG9jYWxTdG9yYWdlX3NpbGVudF9yZWRpcmVjdF91cmkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnc2lsZW50X3JlZGlyZWN0X3VyaScpO1xyXG4gICAgICAgIGxldCBsb2NhbFN0b3JhZ2VfcG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Bvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vQ29udmVydCB0byB0aGUgbW9yZSBjb21wbGV0ZSBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3NcclxuICAgICAgICB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBjbGllbnRfdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwsXHJcbiAgICAgICAgICAgIG9wZW5fb25fcG9wdXA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Mub3Blbl9vbl9wb3B1cCxcclxuICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBzY29wZXM6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGVzLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpIDogbG9jYWxTdG9yYWdlX3JlZGlyZWN0X3VyaSB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyAnP2NhbGxiYWNrPXRydWUnLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiBsb2NhbFN0b3JhZ2Vfc2lsZW50X3JlZGlyZWN0X3VyaSB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyBcIj9zaWxlbnRyZWZyZXNoZnJhbWU9dHJ1ZVwiLFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IGxvY2FsU3RvcmFnZV9wb3N0X2xvZ291dF9yZWRpcmVjdF91cmkgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsICsgXCJpbmRleC5odG1sXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uX3VybCA6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCJcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdyZWRpcmVjdF91cmknLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3NpbGVudF9yZWRpcmVjdF91cmknLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwb3N0X2xvZ291dF9yZWRpcmVjdF91cmknLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9UT0RPOiBzZSBuYW8gZm9pIGluZm9ybWFkbyB1bSByZWRpcmVjdF91cmksIG1vbnRhLXNlIGNvbSBiYXNlIGVtIHVtYSBjb252ZW7Dp8OjbyAobXVsdGkgcGxhdGFmb3JtIGF3YXJlKVxyXG4gICAgICAgIC8vIGxldCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIiNcIilbMF07XHJcbiAgICAgICAgLy8gbGV0IGluZGV4QmFycmEgPSB1cmwubGFzdEluZGV4T2YoJy8nKTtcclxuICAgICAgICAvLyBsZXQgZW5kZXJlY29DYWxsYmFjayA9IHVybDtcclxuICAgICAgICAvLyBlbmRlcmVjb0NhbGxiYWNrID0gZW5kZXJlY29DYWxsYmFjay5zdWJzdHIoMCwgaW5kZXhCYXJyYSkgKyAnL2NhbGxiYWNrLmh0bWwnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHksXHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfaWQsXHJcbiAgICAgICAgICAgIGxvYWRfdXNlcl9wcm9maWxlOiB0cnVlLFxyXG4gICAgICAgICAgICBzY29wZTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zY29wZXMsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlX3R5cGU6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVzcG9uc2VfdHlwZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNsaWVudF91cmw6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlZGlyZWN0X3VyaTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmksXHRcclxuICAgICAgICAgICAgcG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaSxcclxuICAgICAgICAgICAgc2lsZW50X3JlZGlyZWN0X3VyaTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVuZXc6IHRydWUsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uX2VuZHBvaW50OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvYXV0aG9yaXplXCIsIFxyXG4gICAgICAgICAgICB1c2VyaW5mb19lbmRwb2ludDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCIsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhdXRob3JpemF0aW9uX3VybCA6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIixcclxuICAgICAgICAgICAgdG9rZW5fdXJsIDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3Rva2VuXCIsXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX3VybDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L3VzZXJpbmZvXCJcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlciA9IG5ldyBPaWRjVG9rZW5NYW5hZ2VyKGNvbmZpZyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBDYWxsYmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlbkNhbGxiYWNrQXN5bmMoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIFJlbmV3VG9rZW5TaWxlbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZW5ld1Rva2VuU2lsZW50QXN5bmMoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIExvZ2luKG9wZW5PblBvcFVwPzogYm9vbGVhbilcclxuICAgIHtcclxuICAgICAgICAvL1RPRE86IFRyZWF0IHdoZW4gaW4gbW9iaWxlIGJyb3dzZXIgdG8gbm90IHN1cHBvcnQgcG9wdXBcclxuICAgICAgICBsZXQgc2hvdWxkT3Blbk9uUG9wVXAgPSBvcGVuT25Qb3BVcCB8fCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLm9wZW5fb25fcG9wdXA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9pZihsb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3NpbGVudHJlZnJlc2hmcmFtZT10cnVlJykgPT09IC0xKVxyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5DYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5zaWxlbnRfcmVkaXJlY3RfdXJpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5SZW5ld1Rva2VuU2lsZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLmxlbmd0aCkgPT09IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuY2xpZW50X3VybClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChzaG91bGRPcGVuT25Qb3BVcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLm9wZW5Qb3B1cEZvclRva2VuQXN5bmMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2lkY1Rva2VuTWFuYWdlci5yZWRpcmVjdEZvclRva2VuKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2Nlc3NUb2tlblBvcHVwKCk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuR2VuZXJhdGVUb2tlbnMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQWNjZXNzVG9rZW46IGFueSA9IG51bGw7ICBcclxuICAgIHB1YmxpYyBJZGVudGl0eVRva2VuOiBhbnkgPSBudWxsO1xyXG4gICAgcHVibGljIFByb2ZpbGU6IGFueSA9IG51bGw7XHJcblxyXG4gICAgcHJvdGVjdGVkIEdlbmVyYXRlVG9rZW5zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLkFjY2Vzc1Rva2VuID0gSlNPTi5wYXJzZShhdG9iKHRoaXMub2lkY1Rva2VuTWFuYWdlci5hY2Nlc3NfdG9rZW4uc3BsaXQoJy4nKVsxXSkpO1xyXG4gICAgICAgIHRoaXMuSWRlbnRpdHlUb2tlbiA9IEpTT04ucGFyc2UoYXRvYih0aGlzLm9pZGNUb2tlbk1hbmFnZXIuaWRfdG9rZW4uc3BsaXQoJy4nKVsxXSkpO1xyXG4gICAgICAgIHRoaXMuUHJvZmlsZSA9IHRoaXMub2lkY1Rva2VuTWFuYWdlci5wcm9maWxlO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG59Il19
