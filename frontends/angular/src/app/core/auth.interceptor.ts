import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Token ${token}` },
    });
  }
  return next(req);
};
