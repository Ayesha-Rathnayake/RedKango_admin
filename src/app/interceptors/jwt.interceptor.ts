import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, Subject, from, of, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';

let refreshing = false;
const refreshSubject = new Subject<string | null>();

const AUTH_URL_FRAGMENTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify',
  '/api/auth/logout',
];

function isAuthUrl(url: string): boolean {
  return AUTH_URL_FRAGMENTS.some((fragment) => url.includes(fragment));
}

function clearAdminSession(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refreshToken');
}


export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  if (isAuthUrl(req.url)) {
    return next(req);
  }

  const token = localStorage.getItem('admin_token');
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
      const alreadyRetried = req.headers.has('X-Refresh-Attempt');
      if (err.status === 401 && !alreadyRetried) {
        return handleAdminRefresh(authedReq, next, err);
      }
      return throwError(() => err);
    })
  );
};

function handleAdminRefresh(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  originalErr: HttpErrorResponse
): Observable<HttpEvent<unknown>> {

  const refreshToken = localStorage.getItem('admin_refreshToken');

  if (!refreshToken) {
    clearAdminSession();
    window.location.href = '/login';
    return throwError(() => originalErr);
  }

  if (refreshing) {
    return refreshSubject.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((newToken: string): Observable<HttpEvent<unknown>> => {
        const retried = originalReq.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
            'X-Refresh-Attempt': '1',
          },
        });
        return next(retried);
      })
    );
  }

  refreshing = true;

  return from(
    fetch('http://localhost:8080/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then(resp => resp.ok ? resp.json() : null)
      .catch(() => null)
  ).pipe(
    switchMap((data: any): Observable<HttpEvent<unknown>> => {
      refreshing = false;

      if (!data?.accessToken) {
        clearAdminSession();
        refreshSubject.next(null);
        window.location.href = '/login';
        return throwError(() => originalErr);
      }

      localStorage.setItem('admin_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('admin_refreshToken', data.refreshToken);
      }
      refreshSubject.next(data.accessToken);

      const retried = originalReq.clone({
        setHeaders: {
          Authorization: `Bearer ${data.accessToken}`,
          'X-Refresh-Attempt': '1',
        },
      });
      return next(retried);
    }),
    catchError((): Observable<HttpEvent<unknown>> => {
      refreshing = false;
      clearAdminSession();
      refreshSubject.next(null);
      window.location.href = '/login';
      return throwError(() => originalErr);
    })
  );
}
