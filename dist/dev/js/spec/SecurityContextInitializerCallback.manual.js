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
//AuthenticationInitializer.Current.Callback();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNwZWMvU2VjdXJpdHlDb250ZXh0SW5pdGlhbGl6ZXJDYWxsYmFjay5tYW51YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsZ0RBQWdEOzs7OztRQU14QyxTQUFTLEVBQ1QsTUFBTTs7Ozs7OztZQUROLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDbkIsTUFBTSxHQUE0QjtnQkFDOUIsU0FBUyxFQUFFLDhCQUE4QjtnQkFDekMsU0FBUyxFQUFFLFNBQVM7Z0JBQ3BCLE1BQU0sRUFBRSw4Q0FBOEMsR0FBRyxTQUFTO2dCQUNsRSxhQUFhLEVBQUUscUJBQXFCO2dCQUVwQyxhQUFhLEVBQUUsS0FBSzthQUN2QixDQUFDO1lBRUYscURBQXlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQyxxREFBeUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Ozs7QUFDMUMsK0NBQStDIiwiZmlsZSI6InNwZWMvU2VjdXJpdHlDb250ZXh0SW5pdGlhbGl6ZXJDYWxsYmFjay5tYW51YWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPScuLi8uLi90eXBpbmdzL21haW4uZC50cycgLz5cclxuXHJcbmltcG9ydCB7QXV0aGVudGljYXRpb25Jbml0aWFsaXplcn0gZnJvbSAnLi4vc3JjL0F1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXInO1xyXG5pbXBvcnQge0lBdXRoZW50aWNhdGlvblNldHRpbmdzfSBmcm9tICcuLi9zcmMvSUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MnO1xyXG5cclxuXHJcbiAgICBsZXQgY2xpZW50X2lkID0gJzIzODAnO1xyXG4gICAgbGV0IGNvbmZpZyA6SUF1dGhlbnRpY2F0aW9uU2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogJ2h0dHA6Ly9pZHAtdGVzdGUudGptdC5qdXMuYnInLFxyXG4gICAgICAgICAgICBjbGllbnRfaWQ6IGNsaWVudF9pZCxcclxuICAgICAgICAgICAgc2NvcGVzOiAnb3BlbmlkIHByb2ZpbGUgcGptdF9wcm9maWxlIGVtYWlsIHBlcm1pc3Nhb18nICsgY2xpZW50X2lkLFxyXG4gICAgICAgICAgICByZXNwb25zZV90eXBlOiAnY29kZSBpZF90b2tlbiB0b2tlbicsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBvcGVuX29uX3BvcHVwOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgQXV0aGVudGljYXRpb25Jbml0aWFsaXplci5DdXJyZW50LkluaXQoY29uZmlnKTtcclxuICAgICAgICBBdXRoZW50aWNhdGlvbkluaXRpYWxpemVyLkN1cnJlbnQuTG9naW4oKTtcclxuICAgICAgICAvL0F1dGhlbnRpY2F0aW9uSW5pdGlhbGl6ZXIuQ3VycmVudC5DYWxsYmFjaygpO1xyXG4iXX0=
