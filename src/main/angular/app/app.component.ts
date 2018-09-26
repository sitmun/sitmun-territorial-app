import { Component,OnInit,ChangeDetectorRef,OnDestroy  } from '@angular/core';
import {MediaMatcher} from '@angular/cdk/layout';
import {TranslateService} from '@ngx-translate/core';
import {Principal,LoginService} from 'sitmun-plugin-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  // Define selector attributes to enable angularjs-angular communication
  static ngSelector = 'appRoot';
  static selector = 'app-root';

  title = 'app';
  mobileQuery: MediaQueryList;
  translate;
  isHome = true;
    currentAccount : any;

  private _mobileQueryListener: () => void;

  constructor(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher, public trans: TranslateService,public principal:Principal,public loginService:LoginService ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.translate = trans;
    this.translate.addLangs(['es', 'en','ca']);
    this.translate.setDefaultLang('ca');

    //const browserLang = translate.getBrowserLang();
    //translate.use(browserLang.match(/es|ca/) ? browserLang : 'ca');
  }



  changeLanguage(locale: string ){
    this.translate.use(locale);
  }


  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
  
  logout(){
    this.loginService.logout();
  }
    
  isLoggedIn(){
    return this.principal.isAuthenticated();
  }
  
  ngOnInit() {
      
      this.principal.identity().then((account) => {
                 this.currentAccount = account;
   });
  }   
}
