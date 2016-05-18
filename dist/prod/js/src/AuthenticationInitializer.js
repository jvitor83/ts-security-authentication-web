System.register(['oidc-token-manager'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationInitializer;
    return {
        setters:[
            function (_1) {}],
        execute: function() {
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
                    authenticationSettings.client_url = authenticationSettings.client_url || location.href;
                    authenticationSettings.scopes = authenticationSettings.scopes || 'openid profile email offline_access';
                    authenticationSettings.response_type = authenticationSettings.response_type || 'code id_token token';
                    authenticationSettings.open_on_popup = authenticationSettings.open_on_popup || false;
                    var localStorage_redirect_uri = localStorage.getItem('redirect_uri');
                    var localStorage_silent_redirect_uri = localStorage.getItem('silent_redirect_uri');
                    var localStorage_post_logout_redirect_uri = localStorage.getItem('post_logout_redirect_uri');
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
                    var shouldOpenOnPopUp = openOnPopUp || this.AuthenticationManagerSettings.open_on_popup;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7WUFVQTtnQkFxQkk7b0JBSVUsa0NBQTZCLEdBQW1DLElBQUksQ0FBQztvQkEwSHhFLGdCQUFXLEdBQVEsSUFBSSxDQUFDO29CQUN4QixrQkFBYSxHQUFRLElBQUksQ0FBQztvQkFDMUIsWUFBTyxHQUFRLElBQUksQ0FBQztnQkE5SDNCLENBQUM7Z0JBbEJELHNCQUFrQixvQ0FBTzt5QkFBekI7d0JBRUksRUFBRSxDQUFBLENBQUMseUJBQXlCLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUMvQyxDQUFDOzRCQUNHLHlCQUF5QixDQUFDLFFBQVEsR0FBSSxJQUFJLHlCQUF5QixFQUFFLENBQUM7d0JBQzFFLENBQUM7d0JBQ0QsTUFBTSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQztvQkFDOUMsQ0FBQzs7O21CQUFBO2dCQUVhLCtCQUFLLEdBQW5CO29CQUVJLHlCQUF5QixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzlDLENBQUM7Z0JBVU0sd0NBQUksR0FBWCxVQUFZLHNCQUErQztvQkFFdkQsRUFBRSxDQUFBLENBQUMsc0JBQXNCLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxzQkFBc0IsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLENBQ3hGLENBQUM7d0JBQ0csTUFBTSwwREFBMEQsQ0FBQztvQkFDckUsQ0FBQztvQkFHRCxzQkFBc0IsQ0FBQyxVQUFVLEdBQUcsc0JBQXNCLENBQUMsVUFBVSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUM7b0JBQ3ZGLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLElBQUkscUNBQXFDLENBQUM7b0JBQ3ZHLHNCQUFzQixDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLElBQUkscUJBQXFCLENBQUM7b0JBQ3JHLHNCQUFzQixDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FB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Qzt3QkFDRCxJQUFJLENBQ0osQ0FBQzs0QkFDRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDN0MsQ0FBQztvQkFDTCxDQUFDO29CQU1ELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztnQkFNUyxrREFBYyxHQUF4QjtvQkFFSSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BGLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztnQkFDakQsQ0FBQztnQkF6SmMsa0NBQVEsR0FBOEIsSUFBSSxDQUFDO2dCQTRKOUQsZ0NBQUM7WUFBRCxDQS9KQSxBQStKQyxJQUFBO1lBL0pELGlFQStKQyxDQUFBIiwiZmlsZSI6IkF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQXV0aGVudGljYXRpb25TZXR0aW5ncyB9IGZyb20gJy4vSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBJQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgfSBmcm9tICcuL0lBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncyc7XHJcbi8vcmVxdWlyZSgnb2lkYy10b2tlbi1tYW5hZ2VyJyk7XHJcbi8vaW1wb3J0ICdvaWRjLXRva2VuLW1hbmFnZXIvZGlzdC9vaWRjLXRva2VuLW1hbmFnZXIuanMnO1xyXG5pbXBvcnQgJ29pZGMtdG9rZW4tbWFuYWdlcic7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyIFxyXG57XHJcbiAgICBcclxuICAgIHByaXZhdGUgc3RhdGljIF9jdXJyZW50OiBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyID0gbnVsbDtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGdldCBDdXJyZW50KCk6IEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIgXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5fY3VycmVudCA9PT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuX2N1cnJlbnQgPSAgbmV3IEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuX2N1cnJlbnQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgUmVzZXQoKVxyXG4gICAge1xyXG4gICAgICAgIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb2lkY1Rva2VuTWFuYWdlcjogT2lkYy5PaWRjVG9rZW5NYW5hZ2VyO1xyXG4gICAgICAgIFxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByb3RlY3RlZCBBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5nczogSUF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzID0gbnVsbDtcclxuICAgIFxyXG4gICAgcHVibGljIEluaXQoYXV0aGVudGljYXRpb25TZXR0aW5nczogSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MpIFxyXG4gICAge1xyXG4gICAgICAgIGlmKGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuYXV0aG9yaXR5ID09IG51bGwgfHwgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IFwiU2hvdWxkIGJlIGluZm9ybWVkIGF0IGxlYXN0ICdhdXRob3JpdHknIGFuZCAnY2xpZW50X2lkJyFcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9TZXQgZGVmYXVsdCB2YWx1ZXMgaWYgbm90IGluZm9ybWVkXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfdXJsIHx8IGxvY2F0aW9uLmhyZWY7IC8vU2VsZiB1cmlcclxuICAgICAgICBhdXRoZW50aWNhdGlvblNldHRpbmdzLnNjb3BlcyA9IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3Muc2NvcGVzIHx8ICdvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2Vzcyc7IC8vT3BlbklkIGRlZmF1bHQgc2NvcGVzXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5yZXNwb25zZV90eXBlIHx8ICdjb2RlIGlkX3Rva2VuIHRva2VuJzsgLy9IeWJyaWQgZmxvdyBhdCBkZWZhdWx0XHJcbiAgICAgICAgYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwID0gYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwIHx8IGZhbHNlOyAvL1JlZGlyZWN0IGZvciBkZWZhdWx0XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBsb2NhbFN0b3JhZ2VfcmVkaXJlY3RfdXJpID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3JlZGlyZWN0X3VyaScpO1xyXG4gICAgICAgIGxldCBsb2NhbFN0b3JhZ2Vfc2lsZW50X3JlZGlyZWN0X3VyaSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzaWxlbnRfcmVkaXJlY3RfdXJpJyk7XHJcbiAgICAgICAgbGV0IGxvY2FsU3RvcmFnZV9wb3N0X2xvZ291dF9yZWRpcmVjdF91cmkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9Db252ZXJ0IHRvIHRoZSBtb3JlIGNvbXBsZXRlIElBdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5nc1xyXG4gICAgICAgIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MgPSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHksXHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5jbGllbnRfaWQsXHJcbiAgICAgICAgICAgIGNsaWVudF91cmw6IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCxcclxuICAgICAgICAgICAgb3Blbl9vbl9wb3B1cDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5vcGVuX29uX3BvcHVwLFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLnJlc3BvbnNlX3R5cGUsXHJcbiAgICAgICAgICAgIHNjb3BlczogYXV0aGVudGljYXRpb25TZXR0aW5ncy5zY29wZXMsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZWRpcmVjdF91cmkgOiBsb2NhbFN0b3JhZ2VfcmVkaXJlY3RfdXJpIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCArICc/Y2FsbGJhY2s9dHJ1ZScsXHJcbiAgICAgICAgICAgIHNpbGVudF9yZWRpcmVjdF91cmk6IGxvY2FsU3RvcmFnZV9zaWxlbnRfcmVkaXJlY3RfdXJpIHx8IGF1dGhlbnRpY2F0aW9uU2V0dGluZ3MuY2xpZW50X3VybCArIFwiP3NpbGVudHJlZnJlc2hmcmFtZT10cnVlXCIsXHJcbiAgICAgICAgICAgIHBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaTogbG9jYWxTdG9yYWdlX3Bvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaSB8fCBhdXRoZW50aWNhdGlvblNldHRpbmdzLmNsaWVudF91cmwgKyBcImluZGV4Lmh0bWxcIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogYXV0aGVudGljYXRpb25TZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiBhdXRoZW50aWNhdGlvblNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3JlZGlyZWN0X3VyaScsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucmVkaXJlY3RfdXJpKTtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2lsZW50X3JlZGlyZWN0X3VyaScsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaSk7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Bvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaScsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpKTtcclxuICAgICAgICBcclxuICAgICAgICAvL1RPRE86IHNlIG5hbyBmb2kgaW5mb3JtYWRvIHVtIHJlZGlyZWN0X3VyaSwgbW9udGEtc2UgY29tIGJhc2UgZW0gdW1hIGNvbnZlbsOnw6NvIChtdWx0aSBwbGF0YWZvcm0gYXdhcmUpXHJcbiAgICAgICAgLy8gbGV0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiI1wiKVswXTtcclxuICAgICAgICAvLyBsZXQgaW5kZXhCYXJyYSA9IHVybC5sYXN0SW5kZXhPZignLycpO1xyXG4gICAgICAgIC8vIGxldCBlbmRlcmVjb0NhbGxiYWNrID0gdXJsO1xyXG4gICAgICAgIC8vIGVuZGVyZWNvQ2FsbGJhY2sgPSBlbmRlcmVjb0NhbGxiYWNrLnN1YnN0cigwLCBpbmRleEJhcnJhKSArICcvY2FsbGJhY2suaHRtbCc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSxcclxuICAgICAgICAgICAgY2xpZW50X2lkOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF9pZCxcclxuICAgICAgICAgICAgbG9hZF91c2VyX3Byb2ZpbGU6IHRydWUsXHJcbiAgICAgICAgICAgIHNjb3BlOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNjb3BlcyxcclxuICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZXNwb25zZV90eXBlLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY2xpZW50X3VybDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnJlZGlyZWN0X3VyaSxcdFxyXG4gICAgICAgICAgICBwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MucG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpLFxyXG4gICAgICAgICAgICBzaWxlbnRfcmVkaXJlY3RfdXJpOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmksXHJcbiAgICAgICAgICAgIHNpbGVudF9yZW5ldzogdHJ1ZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fZW5kcG9pbnQ6IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3MuYXV0aG9yaXR5ICsgXCIvY29ubmVjdC9hdXRob3JpemVcIiwgXHJcbiAgICAgICAgICAgIHVzZXJpbmZvX2VuZHBvaW50OiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIixcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGF1dGhvcml6YXRpb25fdXJsIDogdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5hdXRob3JpdHkgKyBcIi9jb25uZWN0L2F1dGhvcml6ZVwiLFxyXG4gICAgICAgICAgICB0b2tlbl91cmwgOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdG9rZW5cIixcclxuICAgICAgICAgICAgdXNlcmluZm9fdXJsOiB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmF1dGhvcml0eSArIFwiL2Nvbm5lY3QvdXNlcmluZm9cIlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyID0gbmV3IE9pZGNUb2tlbk1hbmFnZXIoY29uZmlnKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIENhbGxiYWNrKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuQ2FsbGJhY2tBc3luYygpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgUmVuZXdUb2tlblNpbGVudCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlbmV3VG9rZW5TaWxlbnRBc3luYygpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgTG9naW4ob3Blbk9uUG9wVXA/OiBib29sZWFuKVxyXG4gICAge1xyXG4gICAgICAgIC8vVE9ETzogVHJlYXQgd2hlbiBpbiBtb2JpbGUgYnJvd3NlciB0byBub3Qgc3VwcG9ydCBwb3B1cFxyXG4gICAgICAgIGxldCBzaG91bGRPcGVuT25Qb3BVcCA9IG9wZW5PblBvcFVwIHx8IHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Mub3Blbl9vbl9wb3B1cDtcclxuICAgICAgICBcclxuICAgICAgICAvL2lmKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignc2lsZW50cmVmcmVzaGZyYW1lPXRydWUnKSA9PT0gLTEpXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYobG9jYXRpb24uaHJlZi5zdWJzdHJpbmcoMCwgdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLkNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGxvY2F0aW9uLmhyZWYuc3Vic3RyaW5nKDAsIHRoaXMuQXV0aGVudGljYXRpb25NYW5hZ2VyU2V0dGluZ3Muc2lsZW50X3JlZGlyZWN0X3VyaS5sZW5ndGgpID09PSB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLnNpbGVudF9yZWRpcmVjdF91cmkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLlJlbmV3VG9rZW5TaWxlbnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihsb2NhdGlvbi5ocmVmLnN1YnN0cmluZygwLCB0aGlzLkF1dGhlbnRpY2F0aW9uTWFuYWdlclNldHRpbmdzLmNsaWVudF91cmwubGVuZ3RoKSA9PT0gdGhpcy5BdXRoZW50aWNhdGlvbk1hbmFnZXJTZXR0aW5ncy5jbGllbnRfdXJsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHNob3VsZE9wZW5PblBvcFVwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIub3BlblBvcHVwRm9yVG9rZW5Bc3luYygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnJlZGlyZWN0Rm9yVG9rZW4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICB0aGlzLm9pZGNUb2tlbk1hbmFnZXIucHJvY2Vzc1Rva2VuUG9wdXAoKTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5HZW5lcmF0ZVRva2VucygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBBY2Nlc3NUb2tlbjogYW55ID0gbnVsbDsgIFxyXG4gICAgcHVibGljIElkZW50aXR5VG9rZW46IGFueSA9IG51bGw7XHJcbiAgICBwdWJsaWMgUHJvZmlsZTogYW55ID0gbnVsbDtcclxuXHJcbiAgICBwcm90ZWN0ZWQgR2VuZXJhdGVUb2tlbnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuQWNjZXNzVG9rZW4gPSBKU09OLnBhcnNlKGF0b2IodGhpcy5vaWRjVG9rZW5NYW5hZ2VyLmFjY2Vzc190b2tlbi5zcGxpdCgnLicpWzFdKSk7XHJcbiAgICAgICAgdGhpcy5JZGVudGl0eVRva2VuID0gSlNPTi5wYXJzZShhdG9iKHRoaXMub2lkY1Rva2VuTWFuYWdlci5pZF90b2tlbi5zcGxpdCgnLicpWzFdKSk7XHJcbiAgICAgICAgdGhpcy5Qcm9maWxlID0gdGhpcy5vaWRjVG9rZW5NYW5hZ2VyLnByb2ZpbGU7XHJcbiAgICB9XHJcbiAgICBcclxuXHJcbn0iXX0=
