import { Observable} from 'rxjs';

//Upgraded topic selector service definition
export function topicServiceFactory(i: any){
    return i.get('gaTopic');
}
  
export const topicServiceProvider = {
    provide: 'gaTopic',
    useFactory: topicServiceFactory,
    deps: ['$injector']
};