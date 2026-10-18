export function getBackendURL(){
 const configured=import.meta.env.VITE_API_URL as string|undefined;
 const saved=localStorage.getItem('chinnu-backend');
 if(configured&&(!saved||/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(saved)))return configured.replace(/\/$/,'');
 if(saved)return saved.replace(/\/$/,'');
 return location.protocol==='https:'&&location.hostname!=='localhost'?location.origin:'';
}
