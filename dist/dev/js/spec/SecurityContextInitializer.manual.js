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
            AuthenticationInitializer_1.AuthenticationInitializer.Current.Login();
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNwZWMvU2VjdXJpdHlDb250ZXh0SW5pdGlhbGl6ZXIubWFudWFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGdEQUFnRDs7Ozs7UUFPeEMsU0FBUyxFQUNULE1BQU07Ozs7Ozs7WUFETixTQUFTLEdBQUcsTUFBTSxDQUFDO1lBQ25CLE1BQU0sR0FBNEI7Z0JBQzlCLFNBQVMsRUFBRSw4QkFBOEI7Z0JBQ3pDLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixNQUFNLEVBQUUsOENBQThDLEdBQUcsU0FBUztnQkFDbEUsYUFBYSxFQUFFLHFCQUFxQjtnQkFFcEMsYUFBYSxFQUFFLEtBQUs7YUFDdkIsQ0FBQztZQUVGLHFEQUF5QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0MscURBQXlCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDOzs7O0FBQzFDLGdEQUFnRDtBQUNoRCxJQUFJO0FBQ0osaURBQWlEO0FBQ2pELElBQUk7QUFDSixPQUFPO0FBQ1AsSUFBSTtBQUNKLG9EQUFvRDtBQUNwRCxJQUFJIiwiZmlsZSI6InNwZWMvU2VjdXJpdHlDb250ZXh0SW5pdGlhbGl6ZXIubWFudWFsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD0nLi4vLi4vdHlwaW5ncy9tYWluLmQudHMnIC8+XHJcblxyXG5pbXBvcnQge0F1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXJ9IGZyb20gJy4uL3NyYy9BdXRoZW50aWNhdGlvbkluaXRpYWxpemVyJztcclxuaW1wb3J0IHtJQXV0aGVudGljYXRpb25TZXR0aW5nc30gZnJvbSAnLi4vc3JjL0lBdXRoZW50aWNhdGlvblNldHRpbmdzJztcclxuXHJcblxyXG5cclxuICAgIGxldCBjbGllbnRfaWQgPSAnMjM4MCc7XHJcbiAgICBsZXQgY29uZmlnIDpJQXV0aGVudGljYXRpb25TZXR0aW5ncyA9IHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiAnaHR0cDovL2lkcC10ZXN0ZS50am10Lmp1cy5icicsXHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogY2xpZW50X2lkLFxyXG4gICAgICAgICAgICBzY29wZXM6ICdvcGVuaWQgcHJvZmlsZSBwam10X3Byb2ZpbGUgZW1haWwgcGVybWlzc2FvXycgKyBjbGllbnRfaWQsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlX3R5cGU6ICdjb2RlIGlkX3Rva2VuIHRva2VuJyxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG9wZW5fb25fcG9wdXA6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLkN1cnJlbnQuSW5pdChjb25maWcpO1xyXG4gICAgICAgIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuQ3VycmVudC5Mb2dpbigpO1xyXG4gICAgICAgIC8vIGlmKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignY2FsbGJhY2s9JykgPT09IC0xKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5DdXJyZW50LkxvZ2luKCk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vIGVsc2VcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIEF1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuQ3VycmVudC5DYWxsYmFjaygpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICAiXX0=
