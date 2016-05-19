/// <reference path='../../typings/main.d.ts' />
System.register(['../src/AuthenticationInitializer'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AuthenticationInitializer_1;
    var client_id, config;
    return {
        setters:[
            function (AuthenticationInitializer_1_1) {
                AuthenticationInitializer_1 = AuthenticationInitializer_1_1;
            }],
        execute: function() {
            client_id = '2380';
            config = {
                authority: 'http://idp-teste.tjmt.jus.br',
                client_id: client_id,
                scopes: 'openid profile pjmt_profile email permissao_' + client_id,
                response_type: 'code id_token token',
                open_on_popup: false
            };
            AuthenticationInitializer_1.AuthenticationInitializer.Current.Init(config);
            AuthenticationInitializer_1.AuthenticationInitializer.Current.LoginAndProcessToken();
        }
    }
});
// if(location.href.indexOf('callback=') === -1)
// {
//     AuthenticationInitializer.Current.Login();
// }
// else
// {
//     AuthenticationInitializer.Current.Callback();
// }

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNwZWMvU2VjdXJpdHlDb250ZXh0SW5pdGlhbGl6ZXIubWFudWFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGdEQUFnRDs7Ozs7UUFPeEMsU0FBUyxFQUNULE1BQU07Ozs7Ozs7WUFETixTQUFTLEdBQUcsTUFBTSxDQUFDO1lBQ25CLE1BQU0sR0FBNEI7Z0JBQzlCLFNBQVMsRUFBRSw4QkFBOEI7Z0JBQ3pDLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixNQUFNLEVBQUUsOENBQThDLEdBQUcsU0FBUztnQkFDbEUsYUFBYSxFQUFFLHFCQUFxQjtnQkFFcEMsYUFBYSxFQUFFLEtBQUs7YUFDdkIsQ0FBQztZQUVGLHFEQUF5QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0MscURBQXlCLENBQUMsT0FBTyxDQUFDLG9CQUFvQixFQUFFLENBQUM7Ozs7QUFDekQsZ0RBQWdEO0FBQ2hELElBQUk7QUFDSixpREFBaUQ7QUFDakQsSUFBSTtBQUNKLE9BQU87QUFDUCxJQUFJO0FBQ0osb0RBQW9EO0FBQ3BELElBQUkiLCJmaWxlIjoic3BlYy9TZWN1cml0eUNvbnRleHRJbml0aWFsaXplci5tYW51YWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPScuLi8uLi90eXBpbmdzL21haW4uZC50cycgLz5cclxuXHJcbmltcG9ydCB7QXV0aGVudGljYXRpb25Jbml0aWFsaXplcn0gZnJvbSAnLi4vc3JjL0F1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXInO1xyXG5pbXBvcnQge0lBdXRoZW50aWNhdGlvblNldHRpbmdzfSBmcm9tICcuLi9zcmMvSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG5cclxuXHJcblxyXG4gICAgbGV0IGNsaWVudF9pZCA9ICcyMzgwJztcclxuICAgIGxldCBjb25maWcgOklBdXRoZW50aWNhdGlvblNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICBhdXRob3JpdHk6ICdodHRwOi8vaWRwLXRlc3RlLnRqbXQuanVzLmJyJyxcclxuICAgICAgICAgICAgY2xpZW50X2lkOiBjbGllbnRfaWQsXHJcbiAgICAgICAgICAgIHNjb3BlczogJ29wZW5pZCBwcm9maWxlIHBqbXRfcHJvZmlsZSBlbWFpbCBwZXJtaXNzYW9fJyArIGNsaWVudF9pZCxcclxuICAgICAgICAgICAgcmVzcG9uc2VfdHlwZTogJ2NvZGUgaWRfdG9rZW4gdG9rZW4nLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgb3Blbl9vbl9wb3B1cDogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuQ3VycmVudC5Jbml0KGNvbmZpZyk7XHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5DdXJyZW50LkxvZ2luQW5kUHJvY2Vzc1Rva2VuKCk7XHJcbiAgICAgICAgLy8gaWYobG9jYXRpb24uaHJlZi5pbmRleE9mKCdjYWxsYmFjaz0nKSA9PT0gLTEpXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLkN1cnJlbnQuTG9naW4oKTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5DdXJyZW50LkNhbGxiYWNrKCk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgICJdfQ==
